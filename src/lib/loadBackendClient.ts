let cachedClient: Awaited<typeof import("@/integrations/supabase/client")> | null = null;

export async function getSupabaseClient() {
  if (cachedClient) return cachedClient.supabase;
  cachedClient = await import("@/integrations/supabase/client");
  return cachedClient.supabase;
}
