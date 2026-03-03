import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const { email } = await req.json();
    if (!email) throw new Error("Missing 'email' in request body");

    console.log(`Sending test email to ${email}...`);

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Boletín Oficial Resumen <boletin@resend.dev>",
        to: [email],
        subject: "🧪 Test - Boletín Oficial Resumen",
        html: `
          <div style="font-family: Arial, sans-serif; padding: 24px; max-width: 500px; margin: 0 auto;">
            <h2 style="color: #1e3a5f;">✅ Email de prueba</h2>
            <p>Si estás leyendo esto, el envío de emails con Resend funciona correctamente.</p>
            <p style="color: #888; font-size: 12px;">Enviado el ${new Date().toISOString()}</p>
          </div>
        `,
      }),
    });

    const resendStatus = resendResponse.status;
    const resendBody = await resendResponse.text();

    console.log(`Resend response status: ${resendStatus}`);
    console.log(`Resend response body: ${resendBody}`);

    return new Response(
      JSON.stringify({
        success: resendResponse.ok,
        resend_status: resendStatus,
        resend_response: JSON.parse(resendBody),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
