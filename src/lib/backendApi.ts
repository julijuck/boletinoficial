import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Fallback values — these are PUBLISHABLE (anon) credentials, safe to embed.
const FALLBACK_URL = "https://lehgtxqjmummqzzuseqc.supabase.co";
const FALLBACK_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxlaGd0eHFqbXVtbXF6enVzZXFjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNTgxNDcsImV4cCI6MjA4NzczNDE0N30.VGzT6CitEUUEVV8ARsFuP_6kT4m2Ig57P0_2Jadyuz4";

let _client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (_client) return _client;

  const url =
    (typeof import.meta !== "undefined" && import.meta.env?.VITE_SUPABASE_URL) ||
    FALLBACK_URL;
  const key =
    (typeof import.meta !== "undefined" &&
      (import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
        import.meta.env?.VITE_SUPABASE_ANON_KEY)) ||
    FALLBACK_KEY;

  _client = createClient(url, key, {
    auth: { storage: localStorage, persistSession: true, autoRefreshToken: true },
  });
  return _client;
}

// ── Public API ──────────────────────────────────────────────

export async function subscribeEmail(
  email: string
): Promise<{ ok: boolean; duplicate?: boolean; error?: string }> {
  try {
    const sb = getClient();
    const { error } = await sb
      .from("subscribers")
      .insert({ email: email.trim().toLowerCase() });

    if (error) {
      if (error.code === "23505") return { ok: false, duplicate: true };
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Error desconocido" };
  }
}

export async function unsubscribeByToken(
  token: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const sb = getClient();
    const { error } = await sb
      .from("subscribers")
      .update({ is_active: false })
      .eq("unsubscribe_token", token);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "Error desconocido" };
  }
}

export interface EditionData {
  edition_date: string;
  summary_content: any;
}

export async function getLatestEdition(): Promise<EditionData | null> {
  try {
    const sb = getClient();
    const { data } = await sb
      .from("editions")
      .select("edition_date, summary_content")
      .order("edition_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}
