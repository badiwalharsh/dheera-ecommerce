import "server-only";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSafeSupabaseCredentials } from "./config";

/**
 * Creates a server-side Supabase client for Server Components, Route Handlers, and Server Actions.
 * STRICTLY SERVER-ONLY.
 */
export function createClientServer() {
  const cookieStore = cookies();
  const { url, anonKey } = getSafeSupabaseCredentials();

  return createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // Handled if invoked inside Server Component
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          // Handled if invoked inside Server Component
        }
      },
    },
  });
}
