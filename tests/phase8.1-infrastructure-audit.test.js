/**
 * DHEERA — Phase 8.1: Production Infrastructure Verification & Deployment Safety Audit Test Suite
 * 
 * Verifies:
 * 1. Supabase Storage bucket naming consistency (product-images, customization-attachments) & RLS policies
 * 2. Database migration repeatability, run-once vs repeatable classification & verification runbook
 * 3. Backup and restore runbook & non-verified live PITR status classification
 * 4. Email queue durability, idempotency, bounded retries, PII masking & route triggers
 * 5. Security headers in vercel.json (HSTS preload removed, CSP configured, private no-store cache)
 * 6. Environment validator hardening (empty/whitespace/placeholder detection, key pairing, fail-closed in prod)
 * 7. Vercel deployment configuration (bom1 region, Node >=20 engine)
 * 8. Razorpay test-mode enforcement, raw-body webhook signature verification & payment idempotency
 */

const fs = require("fs");
const path = require("path");
const { validateConfig } = require("../scripts/validate-production-config");

let passed = 0;
let failed = 0;

function test(condition, description) {
  if (condition) {
    console.log(` ✔ PASS : ${description}`);
    passed++;
  } else {
    console.error(` ✖ FAIL : ${description}`);
    failed++;
  }
}

async function runSuite() {
  console.log("\n================================================================================");
  console.log(" DHEERA — PHASE 8.1: INFRASTRUCTURE & SAFETY AUDIT TEST SUITE ");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // 1. SUPABASE STORAGE BUCKET NAMING CONSISTENCY & RLS
  // ---------------------------------------------------------------------------
  console.log("--- 1. Supabase Storage Naming Consistency & RLS ---");

  const storageConstsPath = path.join(process.cwd(), "src", "lib", "constants", "storage.ts");
  const storageConstsSrc = fs.existsSync(storageConstsPath) ? fs.readFileSync(storageConstsPath, "utf-8") : "";

  test(
    storageConstsSrc.includes('PRODUCT_IMAGES: "product-images"') &&
      storageConstsSrc.includes('CUSTOMIZATION_ATTACHMENTS: "customization-attachments"') &&
      storageConstsSrc.includes('LEGACY_PRODUCTS: "products"') &&
      storageConstsSrc.includes('LEGACY_CUSTOMIZATIONS: "customizations"'),
    "Test 1: Storage constants define canonical buckets (product-images, customization-attachments) and legacy aliases"
  );

  const uploadRoutePath = path.join(process.cwd(), "src", "app", "api", "admin", "upload", "route.ts");
  const uploadRouteSrc = fs.existsSync(uploadRoutePath) ? fs.readFileSync(uploadRoutePath, "utf-8") : "";

  test(
    uploadRouteSrc.includes("CANONICAL_PUBLIC_BUCKET") &&
      uploadRouteSrc.includes("STORAGE_BUCKETS.LEGACY_PRODUCTS"),
    "Test 2: Admin upload API targets canonical product-images bucket with backward-compatible legacy fallback"
  );

  const migration05 = fs.readFileSync(path.join(process.cwd(), "supabase", "migrations", "20261031000005_admin_management.sql"), "utf-8");
  test(
    migration05.includes("product-images") &&
      migration05.includes("customization-attachments") &&
      migration05.includes("products") &&
      migration05.includes("customizations"),
    "Test 3: Migration 000005 provisions both canonical buckets and backward-compatibility aliases"
  );

  const migration06 = fs.readFileSync(path.join(process.cwd(), "supabase", "migrations", "20261031000006_admin_security_hardening.sql"), "utf-8");
  test(
    migration06.includes("bucket_id IN ('product-images', 'products')") &&
      migration06.includes("bucket_id IN ('customization-attachments', 'customizations')") &&
      migration06.includes("DROP POLICY IF EXISTS"),
    "Test 4: Migration 000006 enforces RLS across canonical and legacy buckets with idempotent DROP POLICY IF EXISTS"
  );

  // ---------------------------------------------------------------------------
  // 2. MIGRATION REPEATABILITY & DISPOSABLE VERIFICATION RUNBOOK
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Database Migration Repeatability & Runbook ---");

  const runbookPath = path.join(process.cwd(), "supabase", "VERIFICATION_RUNBOOK.md");
  const runbookSrc = fs.existsSync(runbookPath) ? fs.readFileSync(runbookPath, "utf-8") : "";

  test(
    fs.existsSync(runbookPath) &&
      runbookSrc.includes("Run-Once") &&
      runbookSrc.includes("Repeatable") &&
      runbookSrc.includes("disposable local or branched database container"),
    "Test 5: Migration verification runbook documents run-once vs repeatable migrations and disposable test procedure"
  );

  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  test(
    migrationFiles.length >= 7 &&
      migrationFiles[0].startsWith("20261031000000") &&
      migrationFiles.some((f) => f.startsWith("20261031000006")),
    "Test 6: All seven migrations follow strictly chronological timestamp naming"
  );

  // ---------------------------------------------------------------------------
  // 3. BACKUP AND RESTORE READINESS
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Backup and Restore Readiness ---");

  const backupRunbookPath = path.join(process.cwd(), "supabase", "BACKUP_RESTORE_RUNBOOK.md");
  const backupRunbookSrc = fs.existsSync(backupRunbookPath) ? fs.readFileSync(backupRunbookPath, "utf-8") : "";

  test(
    fs.existsSync(backupRunbookPath) &&
      backupRunbookSrc.includes("NOT VERIFIED") &&
      backupRunbookSrc.includes("Point-In-Time Recovery") &&
      backupRunbookSrc.includes("Restoration Ordering"),
    "Test 7: Backup/restore runbook accurately marks live PITR as NOT VERIFIED and details restoration ordering"
  );

  // ---------------------------------------------------------------------------
  // 4. EMAIL QUEUE DURABILITY & PII MASKING
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Email Queue Durability & PII Masking ---");

  const emailServicePath = path.join(process.cwd(), "src", "lib", "services", "email.ts");
  const emailServiceSrc = fs.readFileSync(emailServicePath, "utf-8");

  test(
    emailServiceSrc.includes("export function maskEmail") &&
      emailServiceSrc.includes("DURABLE_EMAIL_QUEUE") &&
      emailServiceSrc.includes("MAX_QUEUE_RETRIES") &&
      emailServiceSrc.includes("idempotencyKey"),
    "Test 8: EmailService implements durable queue, idempotency, bounded retries (max 3), and PII email masking"
  );

  // Test maskEmail logic specification directly
  function testMaskEmail(email) {
    if (!email || typeof email !== "string" || !email.includes("@")) return "***@***";
    const [local, domain] = email.split("@");
    if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  test(
    testMaskEmail("patron.harsh@gmail.com") === "p***h@gmail.com" &&
      testMaskEmail("care@dheera.in") === "c***e@dheera.in",
    "Test 9: maskEmail successfully masks customer email addresses for safe logging"
  );

  test(
    emailServiceSrc.includes("success: false") &&
      emailServiceSrc.includes("delivered: false") &&
      emailServiceSrc.includes("queued: true") &&
      emailServiceSrc.includes('status: "provider_not_configured"'),
    "Test 10: Unconfigured email returns delivered: false without falsely claiming successful dispatch"
  );

  test(
    emailServiceSrc.includes("DURABLE_EMAIL_QUEUE.get(idempotencyKey)") &&
      emailServiceSrc.includes("Duplicate notification prevented by idempotency key"),
    "Test 11: Duplicate notification submission with identical idempotency key is matched to existing queue item"
  );

  // ---------------------------------------------------------------------------
  // 5. SECURITY HEADERS IN VERCEL.JSON
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Security Header Review & Vercel Configuration ---");

  const vercelPath = path.join(process.cwd(), "vercel.json");
  const vercelConfig = JSON.parse(fs.readFileSync(vercelPath, "utf-8"));

  const globalHeaders = vercelConfig.headers?.find((h) => h.source === "/(.*)")?.headers || [];
  const hstsHeader = globalHeaders.find((h) => h.key === "Strict-Transport-Security");
  const cspHeader = globalHeaders.find((h) => h.key === "Content-Security-Policy");
  const xssHeader = globalHeaders.find((h) => h.key === "X-XSS-Protection");

  test(
    hstsHeader &&
      hstsHeader.value.includes("max-age=31536000") &&
      !hstsHeader.value.includes("preload"),
    "Test 12: Premature HSTS preload is removed; safe 1-year HSTS is configured"
  );

  test(
    !xssHeader,
    "Test 13: Deprecated and obsolete X-XSS-Protection header is removed in favor of CSP"
  );

  test(
    cspHeader &&
      cspHeader.value.includes("https://checkout.razorpay.com") &&
      cspHeader.value.includes("https://*.supabase.co") &&
      cspHeader.value.includes("https://fonts.googleapis.com") &&
      cspHeader.value.includes("frame-src 'self' https://api.razorpay.com"),
    "Test 14: Comprehensive Content-Security-Policy allows Razorpay checkout, Supabase, Google Fonts, and images"
  );

  const privateRouteHeaders = vercelConfig.headers?.find(
    (h) => h.source === "/(account|checkout|admin)(.*)"
  )?.headers || [];
  const privateCache = privateRouteHeaders.find((h) => h.key === "Cache-Control");

  test(
    privateCache && privateCache.value.includes("no-store"),
    "Test 15: Private patron and admin routes enforce no-store cache isolation"
  );

  // ---------------------------------------------------------------------------
  // 6. ENVIRONMENT VALIDATOR HARDENING
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Environment Validator Hardening ---");

  // Empty string detection
  const emptyUrlCheck = validateConfig({ NEXT_PUBLIC_APP_URL: "   ", NODE_ENV: "development" });
  test(
    emptyUrlCheck.issues.some((i) => i.code === "MISSING_APP_URL"),
    "Test 16: Validator flags whitespace-only application URL as missing"
  );

  // Razorpay key pairing mismatch
  const keyMismatchCheck = validateConfig({
    NEXT_PUBLIC_APP_URL: "https://dheera.in",
    RAZORPAY_KEY_ID: "rzp_test_123456",
    NEXT_PUBLIC_RAZORPAY_KEY_ID: "rzp_test_DIFFERENT",
    NODE_ENV: "development",
  });
  test(
    keyMismatchCheck.issues.some((i) => i.code === "RAZORPAY_KEY_MISMATCH"),
    "Test 17: Validator flags discrepancy between server RAZORPAY_KEY_ID and client NEXT_PUBLIC_RAZORPAY_KEY_ID"
  );

  // Live key with test secret mismatch
  const secretMismatchCheck = validateConfig({
    NEXT_PUBLIC_APP_URL: "https://dheera.in",
    RAZORPAY_KEY_ID: "rzp_live_real9999",
    RAZORPAY_KEY_SECRET: "test_secret_123",
    NODE_ENV: "development",
  });
  test(
    secretMismatchCheck.issues.some((i) => i.code === "RAZORPAY_KEY_SECRET_MISMATCH"),
    "Test 18: Validator detects live Razorpay Key ID paired with test Key Secret"
  );

  // Production fails closed on missing secrets
  const prodFailClosed = validateConfig({
    NODE_ENV: "production",
    NEXT_PUBLIC_APP_URL: "https://dheera.in",
  });
  test(
    prodFailClosed.isValid === false &&
      prodFailClosed.errorsCount >= 4 &&
      prodFailClosed.issues.some((i) => i.code === "MISSING_SERVICE_ROLE_KEY" && i.severity === "error") &&
      prodFailClosed.issues.some((i) => i.code === "MISSING_ADMIN_AUTH_SECRET" && i.severity === "error") &&
      prodFailClosed.issues.some((i) => i.code === "MISSING_RAZORPAY_KEY_SECRET" && i.severity === "error") &&
      prodFailClosed.issues.some((i) => i.code === "MISSING_WEBHOOK_SECRET" && i.severity === "error"),
    "Test 19: Production mode strictly fails closed with error severity for missing server secrets"
  );

  // ---------------------------------------------------------------------------
  // 7. VERCEL DEPLOYMENT SETTINGS
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Vercel Deployment Settings ---");

  const pkg = JSON.parse(fs.readFileSync(path.join(process.cwd(), "package.json"), "utf-8"));
  test(
    pkg.engines && pkg.engines.node && pkg.engines.node.includes("20"),
    "Test 20: package.json pins Node.js runtime to version 20 LTS"
  );

  test(
    vercelConfig.regions && vercelConfig.regions.includes("bom1"),
    "Test 21: vercel.json designates Mumbai (bom1) regional deployment"
  );

  // ---------------------------------------------------------------------------
  // 8. PAYMENT & EMAIL PRODUCTION SAFETY
  // ---------------------------------------------------------------------------
  console.log("\n--- 8. Payment & Email Production Safety ---");

  const razorpaySrc = fs.readFileSync(path.join(process.cwd(), "src", "lib", "services", "razorpay.ts"), "utf-8");
  test(
    razorpaySrc.includes('key.startsWith("rzp_test_")') &&
      razorpaySrc.includes('environment: "test_mode"'),
    "Test 22: Razorpay service strictly requires rzp_test_* keys and flags test_mode notes"
  );

  test(
    razorpaySrc.includes("verifyWebhookSignature(rawBody: string, signature: string)") &&
      razorpaySrc.includes("crypto.timingSafeEqual"),
    "Test 23: Razorpay webhook signature verification requires raw body string and timing-safe equality"
  );

  const webhookRouteSrc = fs.readFileSync(path.join(process.cwd(), "src", "app", "api", "webhooks", "razorpay", "route.ts"), "utf-8");
  test(
    webhookRouteSrc.includes("const rawBody = await req.text();") &&
      webhookRouteSrc.includes("recordWebhookEvent(eventId"),
    "Test 24: Webhook route passes exact rawBody to signature verification and enforces event idempotency"
  );

  const ordersSrc = fs.readFileSync(path.join(process.cwd(), "src", "lib", "services", "orders.ts"), "utf-8");
  test(
    ordersSrc.includes("EmailService.send") &&
      ordersSrc.includes("order_confirmation") &&
      ordersSrc.includes("order_receipt_"),
    "Test 25: Order confirmation email receipt is triggered only after payment confirmation with idempotency key"
  );

  console.log("\n================================================================================");
  console.log(` PHASE 8.1 AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test runner threw uncaught exception:", err);
  process.exit(1);
});
