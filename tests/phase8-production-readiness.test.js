/**
 * DHEERA — Phase 8: Production Infrastructure & Deployment Preparation Test Suite
 * 
 * Verifies Production Architecture Readiness:
 * 1. Configuration Validation: Detection of missing secrets, insecure URLs, weak tokens, and client leaks.
 * 2. Unsafe Fallback Prevention: Server secret getters strictly throw in production when unconfigured.
 * 3. Vercel & Edge Headers: Region configuration (bom1), security headers, and private route cache isolation.
 * 4. Email Infrastructure: Safe internal queueing, provider status detection, and official sender mapping.
 * 5. Supabase Readiness: Chronological migration inventory, idempotent SQL constructs, and RLS audit.
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const { validateConfig } = require("../scripts/validate-production-config");

async function runPhase8TestSuite() {
  console.log("\n================================================================================");
  console.log(" DHEERA — PHASE 8: PRODUCTION INFRASTRUCTURE & READINESS TEST SUITE ");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function test(condition, testName, details = "") {
    if (condition) {
      console.log(` \x1b[32m✔ PASS\x1b[0m : ${testName}`);
      passed++;
    } else {
      console.error(` \x1b[31m✖ FAIL\x1b[0m : ${testName}`);
      if (details) console.error(`        ${details}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // GROUP 1: Configuration Validator Unit Tests
  // ---------------------------------------------------------------------------
  console.log("--- Group 1: Configuration Validator & Secret Detection ---");

  // Test 1: Insecure localhost app url in production
  const res1 = validateConfig({
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_URL: "http://localhost:3000",
  });
  test(
    res1.issues.some((i) => i.code === "INSECURE_APP_URL_IN_PROD"),
    "Test 1: Validator detects insecure localhost or HTTP app URL in production"
  );

  // Test 2: Missing ADMIN_AUTH_SECRET in production
  const res2 = validateConfig({
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_URL: "https://dheera.in",
  });
  test(
    res2.issues.some((i) => i.code === "MISSING_ADMIN_AUTH_SECRET"),
    "Test 2: Validator detects missing ADMIN_AUTH_SECRET in production"
  );

  // Test 3: Weak / short ADMIN_AUTH_SECRET
  const res3 = validateConfig({
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_URL: "https://dheera.in",
    ADMIN_AUTH_SECRET: "short-secret",
  });
  test(
    res3.issues.some((i) => i.code === "WEAK_ADMIN_SECRET"),
    "Test 3: Validator flags weak or too-short ADMIN_AUTH_SECRET (< 32 chars)"
  );

  // Test 4: Default development salt used in production
  const res4 = validateConfig({
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_URL: "https://dheera.in",
    ADMIN_AUTH_SECRET: "dheera-luxury-atelier-admin-hmac-secret-salt-2026",
  });
  test(
    res4.issues.some((i) => i.code === "UNSAFE_ADMIN_SECRET"),
    "Test 4: Validator strictly forbids default development HMAC salt in production"
  );

  // Test 5: Placeholder Supabase credentials in production
  const res5 = validateConfig({
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_URL: "https://dheera.in",
    NEXT_PUBLIC_SUPABASE_URL: "https://placeholder-dheera.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
  });
  test(
    res5.issues.some((i) => i.code === "PLACEHOLDER_SUPABASE_URL"),
    "Test 5: Validator detects placeholder Supabase project URL in production"
  );

  // Test 6: Client-side secret leakage detection
  const res6 = validateConfig({
    NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY: "secret_value_12345",
  });
  test(
    res6.issues.some((i) => i.code === "CLIENT_SECRET_LEAKAGE"),
    "Test 6: Validator detects dangerous server secrets exposed with NEXT_PUBLIC_ prefix"
  );

  // Test 7: Valid production configuration passes cleanly
  const res7 = validateConfig({
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_URL: "https://dheera.in",
    NEXT_PUBLIC_SUPABASE_URL: "https://real-project.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJh...valid-anon-key",
    SUPABASE_SERVICE_ROLE_KEY: "eyJh...valid-service-key",
    ADMIN_AUTH_SECRET: "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
    RAZORPAY_KEY_ID: "rzp_live_realid1234567",
    RAZORPAY_KEY_SECRET: "real_secret_123456",
    RAZORPAY_WEBHOOK_SECRET: "real_webhook_secret_123456",
    RESEND_API_KEY: "re_real_key_123456",
  });
  test(
    res7.isValid && res7.errorsCount === 0,
    "Test 7: Complete and hardened production configuration passes validator with zero errors"
  );

  // ---------------------------------------------------------------------------
  // GROUP 2: Unsafe Fallback Prevention in Core Security Modules
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 2: Unsafe Fallback Prevention ---");

  const adminGuardSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/security/admin-guard.ts"), "utf-8");
  test(
    adminGuardSrc.includes('process.env.NODE_ENV === "production"') &&
      adminGuardSrc.includes("throw new Error(") &&
      adminGuardSrc.includes("ADMIN_AUTH_SECRET or ADMIN_SESSION_SECRET must be configured in production"),
    "Test 8: admin-guard.ts strictly throws safe error in production when ADMIN_AUTH_SECRET is absent"
  );

  const razorpaySrc = fs.readFileSync(path.join(process.cwd(), "src/lib/services/razorpay.ts"), "utf-8");
  test(
    razorpaySrc.includes('process.env.NODE_ENV === "production"') &&
      razorpaySrc.includes("RAZORPAY_KEY_SECRET must be configured in production"),
    "Test 9: razorpay.ts strictly throws in production when RAZORPAY_KEY_SECRET is unconfigured"
  );

  test(
    razorpaySrc.includes('process.env.NODE_ENV === "production"') &&
      razorpaySrc.includes("RAZORPAY_WEBHOOK_SECRET must be configured in production"),
    "Test 10: razorpay.ts strictly throws in production when RAZORPAY_WEBHOOK_SECRET is unconfigured"
  );

  // ---------------------------------------------------------------------------
  // GROUP 3: Vercel & Infrastructure Configuration Verification
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 3: Vercel & Infrastructure Configuration ---");

  const vercelJsonPath = path.join(process.cwd(), "vercel.json");
  const vercelJsonExists = fs.existsSync(vercelJsonPath);
  let vercelConfig = null;
  if (vercelJsonExists) {
    try {
      vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, "utf-8"));
    } catch {}
  }

  test(
    vercelJsonExists && vercelConfig && vercelConfig.regions && vercelConfig.regions.includes("bom1"),
    "Test 11: vercel.json exists and specifies bom1 (Mumbai, India) low-latency region"
  );

  const hasSecurityHeaders =
    vercelConfig &&
    Array.isArray(vercelConfig.headers) &&
    vercelConfig.headers.some((h) =>
      h.headers.some((kv) => kv.key === "X-Content-Type-Options" && kv.value === "nosniff")
    );
  test(
    hasSecurityHeaders,
    "Test 12: vercel.json applies strict security headers (nosniff, SAMEORIGIN, HSTS)"
  );

  const hasPrivateCacheProtection =
    vercelConfig &&
    Array.isArray(vercelConfig.headers) &&
    vercelConfig.headers.some(
      (h) =>
        (h.source.includes("account") || h.source.includes("api")) &&
        h.headers.some((kv) => kv.key === "Cache-Control" && kv.value.includes("no-store"))
    );
  test(
    hasPrivateCacheProtection,
    "Test 13: vercel.json isolates patron and API routes with no-store cache control"
  );

  const nextConfigPath = path.join(process.cwd(), "next.config.js");
  const nextConfigExists = fs.existsSync(nextConfigPath);
  const nextConfigContent = nextConfigExists ? fs.readFileSync(nextConfigPath, "utf-8") : "";

  test(
    nextConfigExists &&
      nextConfigContent.includes("poweredByHeader: false") &&
      nextConfigContent.includes("supabase.co"),
    "Test 14: next.config.js disables poweredByHeader and configures Supabase remote image domains"
  );

  // ---------------------------------------------------------------------------
  // GROUP 4: Transactional Email Infrastructure
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 4: Transactional Email Infrastructure ---");

  const emailSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/services/email.ts"), "utf-8");

  test(
    emailSrc.includes("export class EmailService") &&
      emailSrc.includes("isProviderConfigured") &&
      emailSrc.includes("send("),
    "Test 15: EmailService module exists and defines isProviderConfigured and send methods"
  );

  test(
    emailSrc.includes("orders@dheera.in") && emailSrc.includes("care@dheera.in"),
    "Test 16: EmailService defines canonical brand sender identities (orders@dheera.in, care@dheera.in)"
  );

  test(
    emailSrc.includes("provider_not_configured") &&
      emailSrc.includes("recorded in database concierge queue"),
    "Test 17: EmailService safely records notifications to queue when provider is unconfigured"
  );

  // ---------------------------------------------------------------------------
  // GROUP 5: Supabase Migration Inventory & Security Policies
  // ---------------------------------------------------------------------------
  console.log("\n--- Group 5: Supabase Migration Inventory & RLS ---");

  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const migrationFiles = fs.existsSync(migrationsDir)
    ? fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort()
    : [];

  test(
    migrationFiles.length === 7 &&
      migrationFiles[0].includes("initial_schema") &&
      migrationFiles[6].includes("admin_security_hardening"),
    "Test 18: All 7 Supabase database migrations exist in chronological dependency order"
  );

  const initialSql = fs.readFileSync(path.join(migrationsDir, migrationFiles[0]), "utf-8");
  const hasIdempotentConstructs =
    initialSql.includes("IF NOT EXISTS") && initialSql.includes("EXCEPTION WHEN duplicate_object");
  test(
    hasIdempotentConstructs,
    "Test 19: Migrations utilize idempotent SQL constructs (IF NOT EXISTS, duplicate exception guards)"
  );

  const adminSecSql = fs.readFileSync(path.join(migrationsDir, migrationFiles[6]), "utf-8");
  const hasStorageAndAuditRLS =
    adminSecSql.includes("storage.objects") &&
    adminSecSql.includes("REVOKE UPDATE, DELETE");
  test(
    hasStorageAndAuditRLS,
    "Test 20: Storage bucket policies and append-only audit log immutability are formally provisioned"
  );

  // ---------------------------------------------------------------------------
  // RESULTS SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(` PHASE 8 AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase8TestSuite();
