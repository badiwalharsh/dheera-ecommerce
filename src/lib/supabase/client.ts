import { createBrowserClient } from "@supabase/ssr";
import { getSafeSupabaseCredentials } from "./config";

/**
 * Creates a browser-side Supabase client for Client Components.
 * Handles missing or placeholder environment variables safely without leaking or failing unpredictably.
 */
export function createClient() {
  const { url, anonKey, isConfigured } = getSafeSupabaseCredentials();

  if (!isConfigured && typeof window !== "undefined" && process.env.NODE_ENV === "development") {
    // Graceful diagnostic for developers before connecting real Supabase project
    console.info(
      "[DHEERA Security] Running with placeholder Supabase credentials. Live queries will remain mocked until .env.local is configured."
    );
  }

  return createBrowserClient(url, anonKey);
}
