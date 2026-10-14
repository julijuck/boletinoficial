import { createClient } from "npm:@supabase/supabase-js@2";

const UUID = /^[0-9a-f-]{36}$/i;

function page(msg: string, status = 200) {
  return new Response(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Boletín Oficial</title></head><body style="font-family:Arial,sans-serif;background:#f4f5f7;display:flex;align-items:center;justify-content:center;height:100vh;margin:0"><div style="background:#fff;padding:32px;border-radius:8px;text-align:center;max-width:400px"><h2 style="color:#1e3a5f;margin:0 0 8px">📰 Boletín Oficial</h2><p style="color:#555">${msg}</p></div></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

Deno.serve(async (req) => {
  const p = new URL(req.url).searchParams;
  const token = p.get("token") || "";
  const vote = Number(p.get("vote"));
  const url = p.get("url") || "";
  const date = p.get("date") || "";
  const category = (p.get("category") || "").slice(0, 200);
  const title = (p.get("title") || "").slice(0, 500);

  if (!UUID.test(token) || (vote !== 1 && vote !== -1) ||
      !url.startsWith("https://www.boletinoficial.gob.ar/detalleAviso/") ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return page("Link inválido.", 400);
  }

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: sub } = await sb.from("subscribers").select("id").eq("unsubscribe_token", token).maybeSingle();
  if (!sub) return page("Suscriptor no encontrado.", 404);

  const { error } = await sb.from("norm_feedback").upsert(
    { subscriber_token: token, url, vote, edition_date: date, category, title, organism: (title.split(" - ")[0] || "").trim() },
    { onConflict: "subscriber_token,url" }
  );
  if (error) return page("No pudimos guardar tu voto. Probá de nuevo.", 500);

  return page(vote === 1 ? "¡Gracias! Vamos a priorizar normas similares. 👍" : "¡Gracias! Vamos a mostrar menos normas como esta. 👎");
});
