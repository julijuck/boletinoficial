import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface NormEntry {
  category: string;
  title: string;
  description: string;
  url: string;
}

function buildEmailHtml(entries: NormEntry[], date: string, unsubscribeUrl: string): string {
  const formattedDate = new Date(date + "T12:00:00").toLocaleDateString("es-AR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const categorizedEntries = new Map<string, NormEntry[]>();
  for (const entry of entries) {
    const cat = entry.category || "OTROS";
    if (!categorizedEntries.has(cat)) categorizedEntries.set(cat, []);
    categorizedEntries.get(cat)!.push(entry);
  }

  let entriesHtml = "";
  for (const [category, items] of categorizedEntries) {
    entriesHtml += `
      <tr>
        <td style="padding: 16px 24px 8px; background-color: #1e3a5f; color: #ffffff; font-size: 13px; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase;">
          ${category}
        </td>
      </tr>`;
    for (const item of items) {
      entriesHtml += `
      <tr>
        <td style="padding: 12px 24px; border-bottom: 1px solid #eee;">
          <a href="${item.url}" style="color: #1e3a5f; font-weight: 600; font-size: 14px; text-decoration: none;">${item.title}</a>
          <p style="margin: 4px 0 0; color: #555; font-size: 13px; line-height: 1.5;">${item.description}</p>
        </td>
      </tr>`;
    }
  }

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#f4f5f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f5f7;padding:24px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr>
          <td style="background-color:#1e3a5f;padding:24px 24px;text-align:center;">
            <h1 style="margin:0;color:#ffffff;font-size:22px;">📰 Boletín Oficial</h1>
            <p style="margin:6px 0 0;color:#ccd6e0;font-size:14px;">Primera Sección · ${formattedDate}</p>
          </td>
        </tr>
        ${entriesHtml}
        <tr>
          <td style="padding:20px 24px;text-align:center;border-top:2px solid #eee;">
            <p style="margin:0;color:#999;font-size:12px;">
              Resumen generado con IA · <a href="${unsubscribeUrl}" style="color:#999;text-decoration:underline;">Desuscribirme</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase config");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { edition_date } = await req.json();
    if (!edition_date) throw new Error("Missing 'edition_date' in request body");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get the edition
    const { data: edition, error: edError } = await supabaseAdmin
      .from("editions")
      .select("summary_content, edition_date")
      .eq("edition_date", edition_date)
      .maybeSingle();

    if (edError) throw new Error(`DB error: ${edError.message}`);
    if (!edition) throw new Error(`No edition found for ${edition_date}`);
    if (!edition.summary_content) throw new Error(`No summary content for ${edition_date}`);

    const entries = edition.summary_content as unknown as NormEntry[];

    // Get active subscribers
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from("subscribers")
      .select("email, unsubscribe_token")
      .eq("is_active", true);

    if (subError) throw new Error(`Failed to fetch subscribers: ${subError.message}`);
    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No active subscribers" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SITE_URL = Deno.env.get("SITE_URL") || "https://id-preview--b4e424c5-b131-4723-a39b-ecab890cc8be.lovable.app";
    const formattedDate = new Date(edition_date + "T12:00:00").toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let emailsSent = 0;
    const emailResults: Array<{ email: string; success: boolean; status?: number; response?: string; error?: string; attempts?: number }> = [];

    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 2000;

    for (const subscriber of subscribers) {
      const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${subscriber.unsubscribe_token}`;
      const html = buildEmailHtml(entries, edition_date, unsubscribeUrl);

      for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
        try {
          const res = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: "Boletín Oficial Resumen <boletin@resend.dev>",
              to: [subscriber.email],
              subject: `📰 Boletín Oficial - ${formattedDate} (reenvío)`,
              html,
            }),
          });
          const resBody = await res.text();
          console.log(`Resend [${subscriber.email}] attempt=${attempt} status=${res.status} body=${resBody}`);

          if (res.ok) {
            emailsSent++;
            emailResults.push({ email: subscriber.email, success: true, status: res.status, response: resBody, attempts: attempt });
            break;
          } else if (attempt === MAX_RETRIES) {
            emailResults.push({ email: subscriber.email, success: false, status: res.status, response: resBody, attempts: attempt });
          } else {
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          }
        } catch (emailErr) {
          const errMsg = emailErr instanceof Error ? emailErr.message : String(emailErr);
          if (attempt === MAX_RETRIES) {
            emailResults.push({ email: subscriber.email, success: false, error: errMsg, attempts: attempt });
          } else {
            await new Promise(r => setTimeout(r, RETRY_DELAY_MS));
          }
        }
      }
    }

    // Update edition with resend results
    await supabaseAdmin
      .from("editions")
      .update({ email_results: emailResults as any })
      .eq("edition_date", edition_date);

    return new Response(
      JSON.stringify({
        success: true,
        edition_date,
        emails_sent: emailsSent,
        total_subscribers: subscribers.length,
        email_results: emailResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error resending edition:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
