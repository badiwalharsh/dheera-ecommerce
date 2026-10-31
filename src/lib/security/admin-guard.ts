import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";
import { AdminRole, AdminUser, AuditLogEntry } from "@/types/admin";
import crypto from "crypto";

// Fallback in-memory audit logs repository
const MEMORY_AUDIT_LOGS: AuditLogEntry[] = [];

// Pre-seeded authorized administrators for test & development environments
const AUTHORIZED_ADMINS: AdminUser[] = [
  {
    id: "admin-super-001",
    email: "admin@dheera.in",
    name: "Dheera Leadership",
    role: "admin",
    adminRole: "super_admin",
  },
  {
    id: "admin-manager-002",
    email: "manager@dheera.in",
    name: "Atelier Operations Manager",
    role: "admin",
    adminRole: "store_manager",
  },
];

export { AUTHORIZED_ADMINS };

const ADMIN_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "dheera-luxury-atelier-admin-hmac-secret-salt-2026";

/**
 * Cryptographically signs an administrative session payload using HMAC-SHA256
 */
export function signAdminToken(user: AdminUser): string {
  const payload = JSON.stringify({
    id: user.id,
    email: user.email,
    name: user.name,
    role: "admin",
    adminRole: user.adminRole,
    iat: Date.now(),
    exp: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days expiration
  });

  const b64Payload = Buffer.from(payload).toString("base64url");
  const signature = crypto
    .createHmac("sha256", ADMIN_SECRET)
    .update(b64Payload)
    .digest("base64url");

  return `${b64Payload}.${signature}`;
}

/**
 * Cryptographically verifies and validates an administrative session token
 */
export function verifyAdminToken(token: string): AdminUser | null {
  if (!token || typeof token !== "string") return null;

  // 1. Signed HMAC-SHA256 format (<b64Payload>.<signature>)
  const parts = token.split(".");
  if (parts.length === 2) {
    const [b64Payload, sig] = parts;
    const expectedSig = crypto
      .createHmac("sha256", ADMIN_SECRET)
      .update(b64Payload)
      .digest("base64url");

    if (
      sig.length === expectedSig.length &&
      crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expectedSig))
    ) {
      try {
        const payload = JSON.parse(Buffer.from(b64Payload, "base64url").toString("utf-8"));
        if (payload.exp && Date.now() > payload.exp) {
          return null; // Expired token
        }
        if (
          payload.email &&
          (payload.adminRole === "super_admin" || payload.adminRole === "store_manager")
        ) {
          return {
            id: payload.id || "admin-session",
            email: String(payload.email),
            name: String(payload.name || "Administrator"),
            role: "admin",
            adminRole: payload.adminRole as AdminRole,
          };
        }
      } catch {
        return null;
      }
    }
    return null; // Signature mismatch / forged token
  }

  // 2. Strict Dev/Preview fallback for fixture admin tokens
  if (process.env.NODE_ENV !== "production") {
    try {
      let raw = token;
      try {
        raw = decodeURIComponent(token);
      } catch {}

      let parsed: Record<string, unknown> | null = null;
      try {
        parsed = JSON.parse(raw);
      } catch {
        try {
          parsed = JSON.parse(Buffer.from(token, "base64").toString("utf-8"));
        } catch {}
      }

      if (parsed && typeof parsed === "object" && parsed.email) {
        const email = String(parsed.email).toLowerCase();
        const matched = AUTHORIZED_ADMINS.find((a) => a.email.toLowerCase() === email);
        if (matched) {
          const role = parsed.adminRole || parsed.role;
          if (role === matched.adminRole) {
            return { ...matched };
          }
        }
      }
    } catch {}
  }

  return null;
}

/**
 * Extracts and verifies the authenticated admin user from server context
 */
export async function getAuthenticatedAdmin(
  req?: NextRequest
): Promise<AdminUser | null> {
  // 1. Supabase Auth Verification (Live)
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (!error && user) {
        // Query profile for admin role
        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name, role, admin_role")
          .eq("id", user.id)
          .single();

        if (profile && (profile.role === "admin" || profile.admin_role)) {
          return {
            id: profile.id,
            email: profile.email,
            name: profile.full_name || "DHEERA Admin",
            role: "admin",
            adminRole: (profile.admin_role as AdminRole) || "super_admin",
          };
        }
      }
    } catch {
      // Fallback to cookie/token verification
    }
  }

  // 2. Cryptographically verified cookie session
  try {
    const cookieStore = cookies();
    const rawCookie =
      cookieStore.get("dheera_admin_token")?.value ||
      cookieStore.get("dheera_admin_session")?.value;

    if (rawCookie) {
      const verified = verifyAdminToken(rawCookie);
      if (verified) {
        return verified;
      }
    }
  } catch {
    // Cookie parse fail
  }

  // 3. Internal test bypass ONLY with matching secret key (Never raw unauthenticated headers)
  if (req && process.env.NODE_ENV !== "production") {
    const internalSecret = req.headers.get("x-dheera-internal-admin-key");
    if (internalSecret && internalSecret === ADMIN_SECRET) {
      const adminRole = req.headers.get("x-admin-role");
      const adminEmail = req.headers.get("x-admin-email");
      if (adminRole === "super_admin" || adminRole === "store_manager") {
        return {
          id: req.headers.get("x-admin-id") || "admin-internal",
          email: adminEmail || "admin@dheera.in",
          name: req.headers.get("x-admin-name") || "Internal Admin",
          role: "admin",
          adminRole: adminRole as AdminRole,
        };
      }
    }
  }

  return null;
}

/**
 * Guard that enforces administrator authentication and optional role requirements.
 * Returns either the authorized AdminUser or an immediate NextResponse error.
 */
export async function requireAdmin(
  req?: NextRequest,
  requiredRole?: AdminRole
): Promise<{ admin: AdminUser } | { errorResponse: NextResponse }> {
  const admin = await getAuthenticatedAdmin(req);

  if (!admin) {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Unauthorized: Administrative authentication required.",
        },
        { status: 401 }
      ),
    };
  }

  if (requiredRole === "super_admin" && admin.adminRole !== "super_admin") {
    return {
      errorResponse: NextResponse.json(
        {
          success: false,
          error: "Forbidden: Super Administrator privileges required for this operation.",
        },
        { status: 403 }
      ),
    };
  }

  return { admin };
}

/**
 * Creates an audit log entry for sensitive administrative operations
 */
export async function logAdminAction(params: {
  admin: AdminUser;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, unknown>;
  ipAddress?: string;
}): Promise<AuditLogEntry> {
  const { admin, action, targetType, targetId, details, ipAddress } = params;
  const entry: AuditLogEntry = {
    id: crypto.randomUUID(),
    adminId: admin.id,
    adminEmail: admin.email,
    adminRole: admin.adminRole,
    action,
    targetType,
    targetId,
    details,
    ipAddress,
    createdAt: new Date().toISOString(),
  };

  MEMORY_AUDIT_LOGS.unshift(entry);
  if (MEMORY_AUDIT_LOGS.length > 500) {
    MEMORY_AUDIT_LOGS.pop();
  }

  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      await supabase.from("audit_logs").insert({
        id: entry.id,
        admin_id: admin.id.startsWith("admin-") ? null : admin.id,
        admin_email: admin.email,
        admin_role: admin.adminRole,
        action,
        target_type: targetType,
        target_id: targetId,
        details: details || {},
        ip_address: ipAddress,
      });
    } catch {
      // Ignore database insert failure in fallback mode
    }
  }

  return entry;
}

/**
 * Retrieves audit log records with pagination
 */
export async function getAuditLogs(limit: number = 50): Promise<AuditLogEntry[]> {
  if (isSupabaseConfigured()) {
    try {
      const supabase = createClientServer();
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

      if (!error && data && data.length > 0) {
        return (data as Array<{
          id: string;
          admin_id: string;
          admin_email: string;
          admin_role: string;
          action: string;
          target_type: string;
          target_id?: string;
          details?: Record<string, unknown>;
          ip_address?: string;
          created_at: string;
        }>).map((row) => ({
          id: row.id,
          adminId: row.admin_id,
          adminEmail: row.admin_email,
          adminRole: row.admin_role,
          action: row.action,
          targetType: row.target_type,
          targetId: row.target_id,
          details: row.details,
          ipAddress: row.ip_address,
          createdAt: row.created_at,
        }));
      }
    } catch {
      // Fallback
    }
  }

  return MEMORY_AUDIT_LOGS.slice(0, limit);
}

