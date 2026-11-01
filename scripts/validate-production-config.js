#!/usr/bin/env node
/**
 * DHEERA — Production Configuration CLI Pre-Flight Check & Validator
 * 
 * Usage:
 *   node scripts/validate-production-config.js [--strict] [--env-file <path>]
 * 
 * Verifies environment variables and security constraints without leaking secrets.
 */

const fs = require("fs");
const path = require("path");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const result = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx > 0) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.substring(1, val.length - 1);
      }
      result[key] = val;
    }
  }
  return result;
}

function isEmpty(val) {
  return !val || typeof val !== "string" || val.trim().length === 0;
}

function isPlaceholder(val) {
  if (isEmpty(val)) return false;
  const lower = val.toLowerCase().trim();
  return (
    lower.includes("placeholder") ||
    lower.includes("your_") ||
    lower.includes("changeme") ||
    lower.includes("todo") ||
    lower.includes("example") ||
    lower === "xxx"
  );
}

function validateConfig(env = process.env) {
  const issues = [];
  const isProd = env.NODE_ENV === "production";

  // 1. App URL
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  if (isEmpty(appUrl)) {
    issues.push({
      code: "MISSING_APP_URL",
      severity: "error",
      variable: "NEXT_PUBLIC_APP_URL",
      message: "Missing application URL.",
      remediation: "Set NEXT_PUBLIC_APP_URL=https://dheera.in",
    });
  } else if (isProd && (!appUrl.startsWith("https://") || appUrl.includes("localhost") || appUrl.includes("127.0.0.1"))) {
    issues.push({
      code: "INSECURE_APP_URL_IN_PROD",
      severity: "error",
      variable: "NEXT_PUBLIC_APP_URL",
      message: "Application URL must use HTTPS and not point to localhost in production.",
      remediation: "Set NEXT_PUBLIC_APP_URL to https://dheera.in (or https://www.dheera.in)",
    });
  }

  // 2. Supabase
  const sbUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const sbAnon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const sbService = env.SUPABASE_SERVICE_ROLE_KEY;

  if (isEmpty(sbUrl) || isPlaceholder(sbUrl)) {
    issues.push({
      code: isEmpty(sbUrl) ? "MISSING_SUPABASE_URL" : "PLACEHOLDER_SUPABASE_URL",
      severity: isProd ? "error" : "warning",
      variable: "NEXT_PUBLIC_SUPABASE_URL",
      message: isEmpty(sbUrl) ? "Missing Supabase URL." : "Contains placeholder URL.",
      remediation: "Configure genuine production Supabase project URL (https://<project>.supabase.co)",
    });
  }

  if (isEmpty(sbAnon) || isPlaceholder(sbAnon)) {
    issues.push({
      code: isEmpty(sbAnon) ? "MISSING_SUPABASE_ANON_KEY" : "PLACEHOLDER_SUPABASE_ANON_KEY",
      severity: isProd ? "error" : "warning",
      variable: "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      message: isEmpty(sbAnon) ? "Missing Supabase anon key." : "Contains placeholder anon key.",
      remediation: "Set production Supabase anon key.",
    });
  }

  if (isEmpty(sbService) || isPlaceholder(sbService)) {
    issues.push({
      code: isEmpty(sbService) ? "MISSING_SERVICE_ROLE_KEY" : "PLACEHOLDER_SERVICE_ROLE_KEY",
      severity: isProd ? "error" : "warning",
      variable: "SUPABASE_SERVICE_ROLE_KEY",
      message: isEmpty(sbService) ? "Missing Supabase service-role key." : "Contains placeholder service key.",
      remediation: "Set server-only production SUPABASE_SERVICE_ROLE_KEY.",
    });
  }

  // 3. Admin Secret
  const adminSecret = env.ADMIN_AUTH_SECRET || env.ADMIN_SESSION_SECRET;
  if (isEmpty(adminSecret)) {
    issues.push({
      code: "MISSING_ADMIN_AUTH_SECRET",
      severity: isProd ? "error" : "warning",
      variable: "ADMIN_AUTH_SECRET",
      message: "Missing ADMIN_AUTH_SECRET for HMAC token signing.",
      remediation: "Generate a 64-char hex secret (e.g., openssl rand -hex 32) and set ADMIN_AUTH_SECRET.",
    });
  } else {
    if (adminSecret.trim().length < 32) {
      issues.push({
        code: "WEAK_ADMIN_SECRET",
        severity: "error",
        variable: "ADMIN_AUTH_SECRET",
        message: "ADMIN_AUTH_SECRET is too short (< 32 chars).",
        remediation: "Provide a 64-character high-entropy secret.",
      });
    }
    if (
      isPlaceholder(adminSecret) ||
      adminSecret.trim() === "dheera-luxury-atelier-admin-hmac-secret-salt-2026"
    ) {
      issues.push({
        code: "UNSAFE_ADMIN_SECRET",
        severity: isProd ? "error" : "warning",
        variable: "ADMIN_AUTH_SECRET",
        message: "Using default development or placeholder HMAC salt.",
        remediation: "Generate a unique production secret key before deploying.",
      });
    }
  }

  // 4. Payment Gateway (Razorpay)
  const rzpKey = env.RAZORPAY_KEY_ID || env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const publicRzpKey = env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
  const rzpSecret = env.RAZORPAY_KEY_SECRET;
  const rzpWebhook = env.RAZORPAY_WEBHOOK_SECRET;

  if (isEmpty(rzpKey)) {
    issues.push({
      code: "MISSING_RAZORPAY_KEY_ID",
      severity: "error",
      variable: "RAZORPAY_KEY_ID",
      message: "Missing Razorpay Key ID.",
      remediation: "Set RAZORPAY_KEY_ID from Razorpay Dashboard.",
    });
  } else if (rzpKey.startsWith("rzp_test_")) {
    issues.push({
      code: "TEST_PAYMENT_CREDS_IN_PROD",
      severity: "warning",
      variable: "RAZORPAY_KEY_ID",
      message: "Razorpay is running in TEST MODE.",
      remediation: "Keep in test mode until KYC and live activation authorization is granted.",
    });
  }

  // Key pairing consistency
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
      severity: isProd ? "error" : "warning",
      variable: "RAZORPAY_KEY_SECRET",
      message: isEmpty(rzpSecret) ? "Missing Razorpay Key Secret." : "Contains placeholder secret.",
      remediation: "Set production RAZORPAY_KEY_SECRET as server-only variable.",
    });
  } else if (!isEmpty(rzpKey) && rzpKey.startsWith("rzp_live_") && (rzpSecret.toLowerCase().includes("test") || rzpSecret.startsWith("test_"))) {
    issues.push({
      code: "RAZORPAY_KEY_SECRET_MISMATCH",
      severity: "error",
      variable: "RAZORPAY_KEY_SECRET",
      message: "Live Razorpay Key ID is paired with a test Key Secret.",
      remediation: "Provide the corresponding live Key Secret from Razorpay Dashboard.",
    });
  }

  if (isEmpty(rzpWebhook) || isPlaceholder(rzpWebhook)) {
    issues.push({
      code: isEmpty(rzpWebhook) ? "MISSING_WEBHOOK_SECRET" : "PLACEHOLDER_WEBHOOK_SECRET",
      severity: isProd ? "error" : "warning",
      variable: "RAZORPAY_WEBHOOK_SECRET",
      message: isEmpty(rzpWebhook) ? "Missing Razorpay Webhook Secret." : "Contains placeholder webhook secret.",
      remediation: "Configure RAZORPAY_WEBHOOK_SECRET to match webhook configuration.",
    });
  }

  // 5. Client secret leakage
  for (const k of Object.keys(env)) {
    if (k.startsWith("NEXT_PUBLIC_")) {
      const lower = k.toLowerCase();
      if (lower.includes("secret") || lower.includes("service_role") || lower.includes("password")) {
        issues.push({
          code: "CLIENT_SECRET_LEAKAGE",
          severity: "error",
          variable: k,
          message: "Secret variable accidentally exposed client-side.",
          remediation: `Remove NEXT_PUBLIC_ prefix from ${k}.`,
        });
      }
    }
  }

  // 6. Email Provider
  const resendKey = env.RESEND_API_KEY;
  const smtpHost = env.SMTP_HOST;
  if ((isEmpty(resendKey) || isPlaceholder(resendKey)) && (isEmpty(smtpHost) || isPlaceholder(smtpHost))) {
    issues.push({
      code: "MISSING_EMAIL_PROVIDER",
      severity: "warning",
      variable: "RESEND_API_KEY",
      message: "Transactional email provider is not configured.",
      remediation: "Configure RESEND_API_KEY to enable outgoing email delivery.",
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

function runCli() {
  const args = process.argv.slice(2);
  const strictMode = args.includes("--strict");

  const envPath = path.join(process.cwd(), ".env.local");
  const localEnv = loadEnvFile(envPath);
  const mergedEnv = { ...localEnv, ...process.env };

  console.log("\n================================================================================");
  console.log(" DHEERA — PRODUCTION INFRASTRUCTURE & CONFIGURATION PRE-FLIGHT CHECK ");
  console.log("================================================================================\n");

  const result = validateConfig(mergedEnv);
  const errors = result.issues.filter((i) => i.severity === "error");
  const warnings = result.issues.filter((i) => i.severity === "warning");

  console.log(`Environment Scope : ${mergedEnv.NODE_ENV || "development"}`);
  console.log(`Audited Variables : ${Object.keys(mergedEnv).length} variables checked\n`);

  if (errors.length === 0 && warnings.length === 0) {
    console.log(" \x1b[32m✔ SUCCESS\x1b[0m : All production configuration requirements satisfied.\n");
  } else {
    if (errors.length > 0) {
      console.log(` \x1b[31m✖ ERRORS (${errors.length})\x1b[0m :`);
      errors.forEach((e) => {
        console.log(`   - [${e.variable}] ${e.message}`);
        console.log(`     Fix: ${e.remediation}`);
      });
      console.log("");
    }
    if (warnings.length > 0) {
      console.log(` \x1b[33m⚠ WARNINGS (${warnings.length})\x1b[0m :`);
      warnings.forEach((w) => {
        console.log(`   - [${w.variable}] ${w.message}`);
        console.log(`     Action: ${w.remediation}`);
      });
      console.log("");
    }
  }

  console.log("================================================================================");
  console.log(` AUDIT SUMMARY: ${errors.length} ERRORS, ${warnings.length} WARNINGS`);
  console.log("================================================================================\n");

  if (errors.length > 0 && (strictMode || mergedEnv.NODE_ENV === "production")) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

if (require.main === module) {
  runCli();
}

module.exports = {
  validateConfig,
  loadEnvFile,
};
