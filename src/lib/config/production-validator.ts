/**
 * DHEERA — Production Configuration & Secret Validation Engine
 * 
 * Verifies that production environments are safely configured before deployment.
 * Never outputs raw secret values or sensitive tokens in logs or reports.
 */

export interface ValidationIssue {
  code: string;
  variable: string;
  severity: "error" | "warning";
  message: string;
  remediation: string;
}

export interface ValidationSummary {
  isValid: boolean;
  isProductionReady: boolean;
  errorsCount: number;
  warningsCount: number;
  issues: ValidationIssue[];
}

function isEmpty(val: string | undefined): boolean {
  return !val || typeof val !== "string" || val.trim().length === 0;
}

function isPlaceholder(val: string | undefined): boolean {
  if (isEmpty(val)) return false;
  const lower = val!.toLowerCase().trim();
  return (
    lower.includes("placeholder") ||
    lower.includes("your_") ||
    lower.includes("changeme") ||
    lower.includes("todo") ||
    lower.includes("example") ||
    lower === "xxx"
  );
}

export function validateProductionConfig(
  env: Record<string, string | undefined> = process.env
): ValidationSummary {
  const issues: ValidationIssue[] = [];
  const isProd = env.NODE_ENV === "production";

  // 1. Production Application URL Check
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  if (isEmpty(appUrl)) {
    issues.push({
      code: "MISSING_APP_URL",
      variable: "NEXT_PUBLIC_APP_URL",
      severity: "error",
      message: "Application URL is not configured.",
      remediation: "Set NEXT_PUBLIC_APP_URL to your canonical production URL (e.g., https://dheera.in).",
    });
  } else if (isProd && (!appUrl!.startsWith("https://") || appUrl!.includes("localhost") || appUrl!.includes("127.0.0.1"))) {
    issues.push({
      code: "INSECURE_APP_URL_IN_PROD",
      variable: "NEXT_PUBLIC_APP_URL",
      severity: "error",
      message: "Production application URL must use HTTPS and cannot point to localhost.",
      remediation: "Update NEXT_PUBLIC_APP_URL to https://dheera.in (or https://www.dheera.in) in production.",
    });
  }

  // 2. Supabase Configuration Checks
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceRole = env.SUPABASE_SERVICE_ROLE_KEY;

  if (isEmpty(supabaseUrl) || isPlaceholder(supabaseUrl)) {
    issues.push({
      code: isEmpty(supabaseUrl) ? "MISSING_SUPABASE_URL" : "PLACEHOLDER_SUPABASE_URL",
      variable: "NEXT_PUBLIC_SUPABASE_URL",
      severity: isProd ? "error" : "warning",
      message: isEmpty(supabaseUrl) ? "Supabase project URL is missing." : "Placeholder Supabase URL cannot be used in production.",
      remediation: "Set NEXT_PUBLIC_SUPABASE_URL to your production project URL (https://<project-ref>.supabase.co).",
    });
  }

  if (isEmpty(supabaseAnon) || isPlaceholder(supabaseAnon)) {
    issues.push({
      code: isEmpty(supabaseAnon) ? "MISSING_SUPABASE_ANON_KEY" : "PLACEHOLDER_SUPABASE_ANON_KEY",
      variable: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      severity: isProd ? "error" : "warning",
      message: isEmpty(supabaseAnon) ? "Supabase public anonymous key is missing." : "Placeholder Supabase anon key cannot be used in production.",
      remediation: "Set the genuine production Supabase anon key.",
    });
  }

  if (isEmpty(supabaseServiceRole) || isPlaceholder(supabaseServiceRole)) {
    issues.push({
      code: isEmpty(supabaseServiceRole) ? "MISSING_SERVICE_ROLE_KEY" : "PLACEHOLDER_SERVICE_ROLE_KEY",
      variable: "SUPABASE_SERVICE_ROLE_KEY",
      severity: isProd ? "error" : "warning",
      message: isEmpty(supabaseServiceRole)
        ? "Supabase service-role secret key is missing (required for admin operations)."
        : "Placeholder Supabase service-role key cannot be used in production.",
      remediation: "Configure SUPABASE_SERVICE_ROLE_KEY as a server-only environment variable.",
    });
  }

  // 3. Admin Authentication Secret Checks
  const adminSecret = env.ADMIN_AUTH_SECRET || env.ADMIN_SESSION_SECRET;
  if (isEmpty(adminSecret)) {
    issues.push({
      code: "MISSING_ADMIN_AUTH_SECRET",
      variable: "ADMIN_AUTH_SECRET",
      severity: isProd ? "error" : "warning",
      message: "ADMIN_AUTH_SECRET is not configured for signing admin HMAC session tokens.",
      remediation: "Generate a cryptographically random 64-character hex secret and set ADMIN_AUTH_SECRET.",
    });
  } else {
    if (adminSecret!.trim().length < 32) {
      issues.push({
        code: "WEAK_ADMIN_SECRET",
        variable: "ADMIN_AUTH_SECRET",
        severity: "error",
        message: "ADMIN_AUTH_SECRET is too short (must be at least 32 characters for HMAC-SHA256).",
        remediation: "Provide a high-entropy secret of at least 32 characters.",
      });
    }
    if (
      isPlaceholder(adminSecret) ||
      adminSecret!.trim() === "dheera-luxury-atelier-admin-hmac-secret-salt-2026"
    ) {
      issues.push({
        code: "UNSAFE_ADMIN_SECRET",
        variable: "ADMIN_AUTH_SECRET",
        severity: isProd ? "error" : "warning",
        message: "Default development or placeholder secret cannot be used in production.",
        remediation: "Generate a fresh high-entropy random secret key using: openssl rand -hex 32.",
      });
    }
  }

  // 4. Payment Gateway (Razorpay) Checks
  const rzpKeyId = env.RAZORPAY_KEY_ID || env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const publicRzpKey = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const rzpSecret = env.RAZORPAY_KEY_SECRET;
  const rzpWebhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

  if (isEmpty(rzpKeyId)) {
    issues.push({
      code: "MISSING_RAZORPAY_KEY_ID",
      variable: "RAZORPAY_KEY_ID",
      severity: "error",
      message: "Razorpay Key ID is not configured.",
      remediation: "Set RAZORPAY_KEY_ID and NEXT_PUBLIC_RAZORPAY_KEY_ID from your Razorpay Dashboard.",
    });
  } else if (rzpKeyId!.startsWith("rzp_test_")) {
    issues.push({
      code: "TEST_PAYMENT_CREDS_IN_PROD",
      variable: "RAZORPAY_KEY_ID",
      severity: "warning",
      message: "Razorpay is currently running in TEST MODE with rzp_test_* credentials.",
      remediation: "This is expected during pre-launch staging. Switch to rzp_live_* only after KYC is finalized and business owner authorizes live mode.",
    });
  }

  if (!isEmpty(env.RAZORPAY_KEY_ID) && !isEmpty(publicRzpKey) && env.RAZORPAY_KEY_ID !== publicRzpKey) {
    issues.push({
      code: "RAZORPAY_KEY_MISMATCH",
      severity: "error",
      variable: "RAZORPAY_KEY_ID",
      message: "Server RAZORPAY_KEY_ID does not match client NEXT_PUBLIC_RAZORPAY_KEY_ID.",
      remediation: "Ensure both server and client Razorpay key IDs match exactly.",
    });
  }

  if (isEmpty(rzpSecret) || isPlaceholder(rzpSecret)) {
    issues.push({
      code: isEmpty(rzpSecret) ? "MISSING_RAZORPAY_KEY_SECRET" : "PLACEHOLDER_RAZORPAY_KEY_SECRET",
      variable: "RAZORPAY_KEY_SECRET",
      severity: isProd ? "error" : "warning",
      message: isEmpty(rzpSecret) ? "Razorpay Key Secret is not configured." : "Placeholder Razorpay Key Secret cannot be used in production.",
      remediation: "Set RAZORPAY_KEY_SECRET as a server-only environment variable.",
    });
  } else if (!isEmpty(rzpKeyId) && rzpKeyId!.startsWith("rzp_live_") && (rzpSecret!.toLowerCase().includes("test") || rzpSecret!.startsWith("test_"))) {
    issues.push({
      code: "RAZORPAY_KEY_SECRET_MISMATCH",
      severity: "error",
      variable: "RAZORPAY_KEY_SECRET",
      message: "Live Razorpay Key ID cannot be paired with a test Key Secret.",
      remediation: "Provide the corresponding live Key Secret from Razorpay Dashboard.",
    });
  }

  if (isEmpty(rzpWebhookSecret) || isPlaceholder(rzpWebhookSecret)) {
    issues.push({
      code: isEmpty(rzpWebhookSecret) ? "MISSING_WEBHOOK_SECRET" : "PLACEHOLDER_WEBHOOK_SECRET",
      variable: "RAZORPAY_WEBHOOK_SECRET",
      severity: isProd ? "error" : "warning",
      message: isEmpty(rzpWebhookSecret) ? "Razorpay Webhook Secret is not configured." : "Placeholder Webhook Secret cannot be used in production.",
      remediation: "Set RAZORPAY_WEBHOOK_SECRET to match the secret defined in the Razorpay Webhook settings.",
    });
  }

  // 5. Client-Side Secret Exposure Checks
  const publicKeys = Object.keys(env).filter((k) => k.startsWith("NEXT_PUBLIC_"));
  for (const pubKey of publicKeys) {
    const lower = pubKey.toLowerCase();
    if (
      lower.includes("secret") ||
      lower.includes("private") ||
      lower.includes("service_role") ||
      lower.includes("password")
    ) {
      issues.push({
        code: "CLIENT_SECRET_LEAKAGE",
        variable: pubKey,
        severity: "error",
        message: `Potential secret key exposed client-side via NEXT_PUBLIC_ prefix: ${pubKey}`,
        remediation: `Remove NEXT_PUBLIC_ prefix from ${pubKey}. Secrets must only be accessed in server-side routes.`,
      });
    }
  }

  // 6. Transactional Email Provider Check
  const resendKey = env.RESEND_API_KEY;
  const smtpHost = env.SMTP_HOST;
  if ((isEmpty(resendKey) || isPlaceholder(resendKey)) && (isEmpty(smtpHost) || isPlaceholder(smtpHost))) {
    issues.push({
      code: "MISSING_EMAIL_PROVIDER",
      variable: "RESEND_API_KEY",
      severity: "warning",
      message: "Transactional email provider (Resend or SMTP) is not configured.",
      remediation: "Configure RESEND_API_KEY (or SMTP host/credentials) to enable outgoing customer order and concierge email dispatch.",
    });
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  return {
    isValid: errors.length === 0,
    isProductionReady: issues.length === 0,
    errorsCount: errors.length,
    warningsCount: warnings.length,
    issues,
  };
}
