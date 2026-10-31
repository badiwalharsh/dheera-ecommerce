import "server-only";
import { createClient } from "@supabase/supabase-js";
import { isServiceRoleConfigured, isSupabaseConfigured } from "./config";

/**
 * Creates a privileged Supabase client using the Service Role Key.
 * STRICTLY SERVER-ONLY.
 * 
 * Guards:
 * 1. Build-time block via `server-only` import (fails Next.js build if bundled to browser).
 * 2. Runtime window check.
 * 3. Environment validation: refuses execution with placeholder or missing keys.
 */
export function createAdminClient() {
  if (typeof window !== "undefined") {
    throw new Error(
      "CRITICAL SECURITY VIOLATION: createAdminClient() was called in a client/browser environment. Supabase service-role client is strictly server-only."
    );
  }

  if (!isSupabaseConfigured() || !isServiceRoleConfigured()) {
    throw new Error(
      "Supabase service-role client is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY with valid production/staging credentials."
    );
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
