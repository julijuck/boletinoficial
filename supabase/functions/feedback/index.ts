import { createClient } from "npm:@supabase/supabase-js@2";

const UUID = /^[0-9a-f-]{36}$/i;
const SITE = "https://boletinoficial.lovable.app/gracias";

function go(r: string) {
  return new Response(null, { status: 302, headers: { Location: `${SITE}?r=${encodeURIComponent(r)}` } });
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
    return go("invalid");
  }

  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
  const { data: sub } = await sb.from("subscribers").select("id").eq("unsubscribe_token", token).maybeSingle();
  if (!sub) return go("notfound");

  const { error } = await sb.from("norm_feedback").upsert(
    { subscriber_token: token, url, vote, edition_date: date, category, title, organism: (title.split(" - ")[0] || "").trim() },
    { onConflict: "subscriber_token,url" }
  );
  if (error) return go("error");

  return go(String(vote));
});
