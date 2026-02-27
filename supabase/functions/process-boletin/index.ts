import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const BOLETIN_URL = "https://www.boletinoficial.gob.ar/seccion/primera";
const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const FIRECRAWL_URL = "https://api.firecrawl.dev/v1/scrape";

interface NormEntry {
  category: string;
  title: string;
  description: string;
  url: string;
}

function parseBoletinMarkdown(markdown: string): NormEntry[] {
  const entries: NormEntry[] = [];
  let currentCategory = "";

  // First, find category headers
  const categoryRegex = /^#{1,6}\s+((?:LEYES|DECRETOS|RESOLUCIONES|DISPOSICIONES|AVISOS|DECISIONES|RESOLUCIONES GENERALES|RESOLUCIONES CONJUNTAS|RESOLUCIONES SINTETIZADAS|LEYES \(SUPLEMENTO\)|DECRETOS \(SUPLEMENTO\)).*?)$/gm;

  // Find all links to detalleAviso - they may span multiple lines
  // Collapse the markdown into a single line for matching links
  const collapsed = markdown.replace(/\n/g, " ");

  // Extract category positions from original markdown
  const lines = markdown.split("\n");
  const categoryPositions: Array<{ name: string; charIndex: number }> = [];
  let charIndex = 0;
  for (const line of lines) {
    const catMatch = line.trim().match(/^#{1,6}\s+((?:LEYES|DECRETOS|RESOLUCIONES|DISPOSICIONES|AVISOS|DECISIONES).*?)$/i);
    if (catMatch && !line.includes("Secciones") && !line.includes("Cantidad")) {
      categoryPositions.push({ name: catMatch[1].trim(), charIndex });
    }
    charIndex += line.length + 1;
  }

  // Find all detalleAviso links in the collapsed content
  const linkRegex = /\[([^\]]+?)\]\((https:\/\/www\.boletinoficial\.gob\.ar\/detalleAviso\/[^\)]+)\)/g;
  let match;
  
  while ((match = linkRegex.exec(collapsed)) !== null) {
    const content = match[1];
    const url = match[2];
    const matchPos = match.index;
    
    // Find the category for this entry based on position in original markdown
    let cat = currentCategory;
    for (const cp of categoryPositions) {
      if (cp.charIndex < matchPos) cat = cp.name;
    }
    currentCategory = cat;

    // Split by \\ or multiple spaces to get parts
    const parts = content.split(/\\+/).map((p: string) => p.trim()).filter((p: string) => p.length > 0);
    
    if (parts.length >= 2) {
      const org = parts[0] || "";
      const number = parts[1] || "";
      const desc = parts.slice(2).join(" - ").trim();
      
      entries.push({
        category: currentCategory,
        title: `${org} - ${number}`.trim(),
        description: desc || number,
        url,
      });
    } else if (parts.length === 1) {
      entries.push({
        category: currentCategory,
        title: parts[0],
        description: "",
        url,
      });
    }
  }

  return entries;
}

function parseSpanishDate(dateStr: string): string | null {
  const months: Record<string, string> = {
    enero: "01", febrero: "02", marzo: "03", abril: "04",
    mayo: "05", junio: "06", julio: "07", agosto: "08",
    septiembre: "09", octubre: "10", noviembre: "11", diciembre: "12",
  };
  const match = dateStr.match(/(\d{1,2})\s+de\s+(\w+)\s+de\s+(\d{4})/i);
  if (!match) return null;
  const day = match[1].padStart(2, "0");
  const month = months[match[2].toLowerCase()];
  const year = match[3];
  if (!month) return null;
  return `${year}-${month}-${day}`;
}

async function scrapeBoletinOficial(firecrawlApiKey: string): Promise<{ markdown: string; scrapedDate: string | null }> {
  console.log("Scraping Boletín Oficial...");
  
  const response = await fetch(FIRECRAWL_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${firecrawlApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: BOLETIN_URL,
      formats: ["markdown"],
      onlyMainContent: true,
      waitFor: 3000,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Firecrawl scrape failed [${response.status}]: ${errText}`);
  }

  const data = await response.json();
  const markdown = data.data?.markdown || data.markdown || "";
  
  // Extract date from the page
  const dateMatch = markdown.match(/Edici[oó]n del\s*(\d{1,2}\s+de\s+\w+\s+de\s+\d{4})/i);
  const scrapedDate = dateMatch ? parseSpanishDate(dateMatch[1]) : null;
  
  console.log(`Scraped date from page: ${scrapedDate || "NOT FOUND"}`);
  
  return { markdown, scrapedDate };
}

async function generateSummaries(
  entries: NormEntry[],
  lovableApiKey: string
): Promise<NormEntry[]> {
  if (entries.length === 0) return [];

  console.log(`Generating AI summaries for ${entries.length} entries...`);

  const entriesText = entries
    .map((e, i) => `${i + 1}. [${e.category}] ${e.title}: ${e.description}`)
    .join("\n");

  const response = await fetch(AI_GATEWAY_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `Sos un asistente legal argentino. Para cada normativa del Boletín Oficial, generá un extracto claro y conciso de máximo 2 renglones que explique de qué se trata en lenguaje simple. Respondé en formato JSON como un array de objetos con "index" (número de la normativa) y "summary" (el extracto). No agregues ningún otro texto, solo el JSON.`,
        },
        {
          role: "user",
          content: `Generá un extracto de 2 renglones para cada una de estas normativas del Boletín Oficial:\n\n${entriesText}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "provide_summaries",
            description: "Return summaries for each norm entry",
            parameters: {
              type: "object",
              properties: {
                summaries: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      index: { type: "number" },
                      summary: { type: "string" },
                    },
                    required: ["index", "summary"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["summaries"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "provide_summaries" } },
    }),
  });

  if (!response.ok) {
    console.error("AI gateway error:", response.status);
    // Return entries without summaries
    return entries.map((e) => ({ ...e, description: e.description || "Sin resumen disponible." }));
  }

  const data = await response.json();
  
  try {
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = JSON.parse(toolCall.function.arguments);
    const summaries = args.summaries as Array<{ index: number; summary: string }>;

    return entries.map((entry, i) => {
      const match = summaries.find((s) => s.index === i + 1);
      return {
        ...entry,
        description: match?.summary || entry.description || "Sin resumen disponible.",
      };
    });
  } catch {
    console.error("Failed to parse AI response, using original descriptions");
    return entries;
  }
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
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase config");
    if (!FIRECRAWL_API_KEY) throw new Error("FIRECRAWL_API_KEY not configured");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get today's date
    const today = new Date().toISOString().split("T")[0];

    // Check if already processed today
    const { data: existingEdition } = await supabaseAdmin
      .from("editions")
      .select("id")
      .eq("edition_date", today)
      .maybeSingle();

    if (existingEdition) {
      return new Response(
        JSON.stringify({ success: true, message: "Already processed today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 1. Scrape
    const { markdown, scrapedDate } = await scrapeBoletinOficial(FIRECRAWL_API_KEY);

    // Validate scraped date matches today
    if (!scrapedDate) {
      console.log("Could not extract date from scraped content");
      return new Response(
        JSON.stringify({ success: true, message: "Could not extract edition date from page" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (scrapedDate !== today) {
      console.log(`Scraped date (${scrapedDate}) does not match today (${today}). Skipping.`);
      return new Response(
        JSON.stringify({ success: true, message: `Today's edition not yet available. Page shows: ${scrapedDate}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const editionDate = scrapedDate;
    const entries = parseBoletinMarkdown(markdown);

    if (entries.length === 0) {
      console.log("No entries found, possibly no edition today");
      return new Response(
        JSON.stringify({ success: true, message: "No entries found - possibly no edition today" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${entries.length} entries`);

    // 2. Generate AI summaries
    const summarizedEntries = await generateSummaries(entries, LOVABLE_API_KEY);

    // 3. Get active subscribers
    const { data: subscribers, error: subError } = await supabaseAdmin
      .from("subscribers")
      .select("email, unsubscribe_token")
      .eq("is_active", true);

    if (subError) throw new Error(`Failed to fetch subscribers: ${subError.message}`);

    // 4. Save edition
    await supabaseAdmin.from("editions").insert({
      edition_date: editionDate,
      raw_content: entries as any,
      summary_content: summarizedEntries as any,
      email_sent: (subscribers?.length || 0) > 0,
      subscribers_count: subscribers?.length || 0,
    });

    // 5. Send emails via Resend
    const formattedDate = new Date(editionDate + "T12:00:00").toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    let emailsSent = 0;
    if (subscribers && subscribers.length > 0) {
      const SITE_URL = Deno.env.get("SITE_URL") || "https://id-preview--b4e424c5-b131-4723-a39b-ecab890cc8be.lovable.app";
      
      const batchSize = 50;
      for (let i = 0; i < subscribers.length; i += batchSize) {
        const batch = subscribers.slice(i, i + batchSize);
        
        const emailPromises = batch.map(async (subscriber) => {
          const unsubscribeUrl = `${SITE_URL}/unsubscribe?token=${subscriber.unsubscribe_token}`;
          const html = buildEmailHtml(summarizedEntries, today, unsubscribeUrl);

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
                subject: `📰 Boletín Oficial - ${formattedDate}`,
                html,
              }),
            });
            if (res.ok) {
              emailsSent++;
            } else {
              const errText = await res.text();
              console.error(`Failed to send to ${subscriber.email}: ${errText}`);
            }
          } catch (emailErr) {
            console.error(`Error sending to ${subscriber.email}:`, emailErr);
          }
        });

        await Promise.all(emailPromises);
      }
      
      console.log(`Sent ${emailsSent}/${subscribers.length} emails`);
    }


    return new Response(
      JSON.stringify({
        success: true,
        date: today,
        entries_count: summarizedEntries.length,
        subscribers_notified: subscribers?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing boletín:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
