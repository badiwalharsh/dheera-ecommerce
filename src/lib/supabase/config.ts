/**
 * DHEERA — Supabase Configuration & Environment Guards
 * 
 * Ensures that missing or placeholder environment variables do not trigger
 * accidental network requests or undefined security behavior.
 */

export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return false;
  if (url.includes("placeholder") || anonKey.includes("placeholder")) return false;
  return true;
}

export function isServiceRoleConfigured(): boolean {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) return false;
  if (serviceKey.includes("placeholder")) return false;
  return true;
}

export function getSafeSupabaseCredentials() {
  const isConfigured = isSupabaseConfigured();
  const url = isConfigured
    ? (process.env.NEXT_PUBLIC_SUPABASE_URL as string)
    : "https://placeholder-dheera.supabase.co";
  const anonKey = isConfigured
    ? (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string)
    : "placeholder-anon-key";

  return { isConfigured, url, anonKey };
}

