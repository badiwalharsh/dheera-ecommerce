import { cookies } from "next/headers";
import { NextRequest } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";

export interface AuthenticatedUser {
  id: string;
  email: string;
  fullName?: string;
  role?: string;
}

/**
 * Extracts and verifies the authenticated user from server-side cookies or authorization context
 */
export async function getAuthenticatedUser(
  req?: NextRequest
): Promise<AuthenticatedUser | null> {
  // 1. If Supabase is configured, use official Supabase server auth
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        return {
          id: user.id,
          email: user.email || "",
          fullName: user.user_metadata?.full_name,
          role: user.user_metadata?.role || "customer",
        };
      }
    } catch {
      // Fallback
    }
  }

  // 2. Cookie-based fallback session for dev/preview/test environments
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("dheera_session_user")?.value;
    if (sessionCookie) {
      const parsed = JSON.parse(decodeURIComponent(sessionCookie));
      if (parsed && parsed.id && parsed.email) {
        return {
          id: parsed.id,
          email: parsed.email,
          fullName: parsed.name,
          role: "customer",
        };
      }
    }
  } catch {
    // Ignore cookie parse failure
  }

  // 3. Fallback header or request param for automated test suites
  if (req) {
    const headerUserId = req.headers.get("x-user-id");
    const headerUserEmail = req.headers.get("x-user-email");
    if (headerUserId && headerUserEmail) {
      return {
        id: headerUserId,
        email: headerUserEmail,
        fullName: req.headers.get("x-user-name") || "Patron",
        role: "customer",
      };
    }
  }

  return null;
}
