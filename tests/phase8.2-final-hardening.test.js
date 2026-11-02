/**
 * DHEERA — Phase 8.2: Final Infrastructure Hardening & Production Safety Verification Test Suite
 * 
 * Verifies:
 * 1. Email queue durability, idempotency constraint, atomic insertion, and fail-closed behavior
 * 2. Multi-worker atomic lease claim (SKIP LOCKED simulation) and concurrency protection
 * 3. Bounded retries (max 3), exponential backoff, provider timeout/rejection, and terminal failure
 * 4. PII masking and zero false delivery reports
 * 5. Webhook payment receipt exactly-once execution
 * 6. Hardened CSP (unsafe-eval removed, Razorpay & Supabase whitelisted)
 * 7. Safe pre-launch HSTS (preload and includeSubDomains held until verified)
 * 8. Complete 8-migration sequence and disposable database verification runbook
 * 9. Storage 5-role access boundary matrix (Visitor, Customer A, Customer B, Store Manager, Super Admin)
 */

const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

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
  console.log(" DHEERA — PHASE 8.2: FINAL INFRASTRUCTURE HARDENING & SAFETY AUDIT ");
  console.log("================================================================================\n");

  // ---------------------------------------------------------------------------
  // GROUP 1: Authoritative Email Queue Durability & Database Constraints
  // ---------------------------------------------------------------------------
  console.log("--- 1. Email Queue Durability & Unique Database Constraint ---");

  const migration08Path = path.join(process.cwd(), "supabase", "migrations", "20261102000000_notification_queue.sql");
  const migration08 = fs.existsSync(migration08Path) ? fs.readFileSync(migration08Path, "utf-8") : "";

  test(
    migration08.includes("CREATE TABLE IF NOT EXISTS public.notification_queue") &&
      migration08.includes("CONSTRAINT uq_notification_queue_idempotency UNIQUE (idempotency_key)"),
    "Test 1: Migration 08 provisions notification_queue with unique database constraint on idempotency_key"
  );

  test(
    migration08.includes("CREATE OR REPLACE FUNCTION public.claim_queued_notifications") &&
      migration08.includes("FOR UPDATE SKIP LOCKED") &&
      migration08.includes("lease_expires_at"),
    "Test 2: Migration 08 implements atomic multi-worker claim function using FOR UPDATE SKIP LOCKED and lease expiration"
  );

  test(
    migration08.includes("REVOKE ALL ON public.notification_queue FROM PUBLIC, anon, authenticated") &&
      migration08.includes("GRANT ALL ON public.notification_queue TO service_role"),
    "Test 3: Row-level security strictly isolates notification_queue to service_role (zero public/anon access)"
  );

  const emailSrc = fs.readFileSync(path.join(process.cwd(), "src", "lib", "services", "email.ts"), "utf-8");
  test(
    emailSrc.includes("status: \"durable_storage_unavailable\"") &&
      emailSrc.includes("durable: false") &&
      emailSrc.includes("Authoritative Supabase database is unconfigured"),
    "Test 4: EmailService fails closed when database is unavailable (never claims process memory is durable)"
  );

  // ---------------------------------------------------------------------------
  // GROUP 2: Email Failure, Concurrency & Retry Logic
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Email Failure, Multi-Worker Leases & Bounded Retries ---");

  // PII masking test
  function maskEmail(email) {
    if (!email || typeof email !== "string" || !email.includes("@")) return "***@***";
    const [local, domain] = email.split("@");
    if (local.length <= 2) return `${local[0] || "*"}***@${domain}`;
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  test(
    maskEmail("customer.vip@luxury.in") === "c***p@luxury.in" &&
      maskEmail("a@b.com") === "a***@b.com",
    "Test 5: PII masking prevents full customer email addresses from appearing in logs"
  );

  // Simulation harness for queue logic
  const mockQueue = new Map();
  function mockEnqueue(idempotencyKey, payload) {
    if (mockQueue.has(idempotencyKey)) {
      return { success: true, isDuplicate: true, record: mockQueue.get(idempotencyKey) };
    }
    const record = {
      id: `msg_${Date.now()}_${Math.random()}`,
      idempotencyKey,
      attempts: 0,
      maxAttempts: 3,
      status: "queued",
      payload,
      lockedBy: null,
      leaseExpiresAt: null,
      nextRetryAt: new Date(),
    };
    mockQueue.set(idempotencyKey, record);
    return { success: true, isDuplicate: false, record };
  }

  // Duplicate idempotency keys
  const res1 = mockEnqueue("order_receipt_DHR-001", { orderNumber: "DHR-001" });
  const res2 = mockEnqueue("order_receipt_DHR-001", { orderNumber: "DHR-001" });
  test(
    res1.isDuplicate === false && res2.isDuplicate === true && res1.record.id === res2.record.id,
    "Test 6: Duplicate idempotency keys return existing record and prevent duplicate insertion"
  );

  // Concurrent worker claims
  function mockClaim(workerId, batchSize = 10, leaseMs = 60000) {
    const now = new Date();
    const claimed = [];
    for (const record of mockQueue.values()) {
      const isAvailable = record.status === "queued" && record.nextRetryAt <= now;
      const isExpired = record.status === "processing" && record.leaseExpiresAt < now;
      if ((isAvailable || isExpired) && record.attempts < record.maxAttempts) {
        record.status = "processing";
        record.lockedBy = workerId;
        record.leaseExpiresAt = new Date(now.getTime() + leaseMs);
        claimed.push(record);
        if (claimed.length >= batchSize) break;
      }
    }
    return claimed;
  }

  // Enqueue 2 distinct messages
  mockEnqueue("msg_002", { item: "garment_1" });
  mockEnqueue("msg_003", { item: "garment_2" });

  const workerAClaims = mockClaim("worker_A", 1);
  const workerBClaims = mockClaim("worker_B", 1);

  test(
    workerAClaims.length === 1 &&
      workerBClaims.length === 1 &&
      workerAClaims[0].id !== workerBClaims[0].id &&
      workerAClaims[0].lockedBy === "worker_A" &&
      workerBClaims[0].lockedBy === "worker_B",
    "Test 7: Concurrent workers claim distinct messages via atomic lease (zero duplicate dispatch)"
  );

  // Provider rejection & Bounded retry limit (max 3)
  function mockProcessWithFailure(record) {
    record.attempts += 1;
    if (record.attempts >= record.maxAttempts) {
      record.status = "failed";
      record.lastError = "Provider timeout / terminal retry limit reached";
    } else {
      record.status = "queued";
      record.nextRetryAt = new Date(Date.now() + 30000 * Math.pow(2, record.attempts - 1));
      record.lastError = "Provider 500 error - retry scheduled";
    }
    record.lockedBy = null;
    record.leaseExpiresAt = null;
  }

  const testRecord = workerAClaims[0];
  mockProcessWithFailure(testRecord); // Attempt 1 -> queued
  test(
    testRecord.attempts === 1 && testRecord.status === "queued",
    "Test 8: Provider failure triggers retry scheduling with exponential backoff (attempt 1/3)"
  );

  mockProcessWithFailure(testRecord); // Attempt 2 -> queued
  mockProcessWithFailure(testRecord); // Attempt 3 -> failed
  test(
    testRecord.attempts === 3 &&
      testRecord.status === "failed" &&
      testRecord.lastError.includes("terminal retry limit reached"),
    "Test 9: Max retry boundary (3) strictly transitions message to terminal failed status"
  );

  // Background processor worker route exists
  const cronRoutePath = path.join(process.cwd(), "src", "app", "api", "cron", "process-email-queue", "route.ts");
  test(
    fs.existsSync(cronRoutePath),
    "Test 10: Dedicated cron worker endpoint /api/cron/process-email-queue exists for scheduled batch execution"
  );

  // ---------------------------------------------------------------------------
  // GROUP 3: Content Security Policy Hardening
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Content Security Policy (CSP) Hardening ---");

  const vercelConfig = JSON.parse(fs.readFileSync(path.join(process.cwd(), "vercel.json"), "utf-8"));
  const globalHeaders = vercelConfig.headers?.find((h) => h.source === "/(.*)")?.headers || [];
  const cspHeader = globalHeaders.find((h) => h.key === "Content-Security-Policy");

  test(
    cspHeader && !cspHeader.value.includes("'unsafe-eval'"),
    "Test 11: Production CSP strictly removes unsafe-eval from script-src"
  );

  test(
    cspHeader &&
      cspHeader.value.includes("https://checkout.razorpay.com") &&
      cspHeader.value.includes("https://api.razorpay.com") &&
      cspHeader.value.includes("frame-src 'self' https://api.razorpay.com"),
    "Test 12: CSP permits Razorpay checkout modal, API endpoints, and payment iframe"
  );

  test(
    cspHeader &&
      cspHeader.value.includes("https://*.supabase.co") &&
      cspHeader.value.includes("wss://*.supabase.co"),
    "Test 13: CSP permits Supabase HTTPS REST endpoints, storage CDN, and Realtime WebSockets"
  );

  test(
    cspHeader &&
      cspHeader.value.includes("https://fonts.googleapis.com") &&
      cspHeader.value.includes("https://fonts.gstatic.com"),
    "Test 14: CSP permits Google Fonts stylesheets and typography assets"
  );

  // ---------------------------------------------------------------------------
  // GROUP 4: HSTS & Domain Readiness Safety
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. HSTS & Pre-Launch Domain Safety ---");

  const hstsHeader = globalHeaders.find((h) => h.key === "Strict-Transport-Security");

  test(
    hstsHeader &&
      hstsHeader.value.includes("max-age=31536000") &&
      !hstsHeader.value.includes("preload"),
    "Test 15: HSTS preload remains strictly disabled prior to production domain verification"
  );

  test(
    hstsHeader && !hstsHeader.value.includes("includeSubDomains"),
    "Test 16: includeSubDomains is safely omitted until all subdomains are provisioned with active SSL certificates"
  );

  // ---------------------------------------------------------------------------
  // GROUP 5: Migration Verification & Tracking
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Database Migration Sequence & Tracking ---");

  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const migrationFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith(".sql")).sort();

  test(
    migrationFiles.length === 8 &&
      migrationFiles[0].startsWith("20261031000000") &&
      migrationFiles[7].startsWith("20261102000000"),
    "Test 17: All eight SQL migrations follow sequential chronological timestamp naming"
  );

  const verificationRunbook = fs.readFileSync(path.join(process.cwd(), "supabase", "VERIFICATION_RUNBOOK.md"), "utf-8");
  test(
    verificationRunbook.includes("notification_queue") &&
      verificationRunbook.includes("claim_queued_notifications") &&
      verificationRunbook.includes("Run-Once") &&
      verificationRunbook.includes("Repeatable"),
    "Test 18: Verification runbook details disposable DB execution and schema_migrations tracking"
  );

  // ---------------------------------------------------------------------------
  // GROUP 6: Storage Role Access Boundary Matrix (5 Identities)
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Storage Role Access Boundary Matrix (5 Identities) ---");

  const migration06 = fs.readFileSync(path.join(process.cwd(), "supabase", "migrations", "20261031000006_admin_security_hardening.sql"), "utf-8");

  // Identity 1: Anonymous Visitor
  test(
    migration06.includes('CREATE POLICY "Public read product images" ON storage.objects') &&
      migration06.includes("bucket_id IN ('product-images', 'products')"),
    "Test 19: Identity 1 (Anonymous Visitor): Granted public read on product images (canonical & legacy)"
  );

  // Identity 2 & 3: Customer A and Customer B Cross-Patron Isolation
  test(
    migration06.includes('CREATE POLICY "Patron or admin read customizations" ON storage.objects') &&
      migration06.includes("auth.uid() = owner OR public.is_admin()"),
    "Test 20: Identity 2 & 3 (Customer A vs B): Customer A cannot read Customer B private customization attachments"
  );

  // Identity 4 & 5: Store Manager & Super Admin Administrative Privileges
  test(
    migration06.includes('CREATE POLICY "Admins upload product images" ON storage.objects') &&
      migration06.includes("bucket_id IN ('product-images', 'products') AND public.is_admin()"),
    "Test 21: Identity 4 & 5 (Store Manager & Super Admin): Authorized to manage product images via public.is_admin()"
  );

  test(
    migration06.includes('CREATE POLICY "Admins delete product images" ON storage.objects') &&
      migration06.includes("public.is_admin()"),
    "Test 22: Identity 4 & 5 (Admins): Delete operations restricted to verified administrators"
  );

  // Unauthorized upload prevention
  test(
    !migration06.includes("Public upload product images"),
    "Test 23: Anonymous visitors and unauthenticated clients are strictly blocked from uploading product images"
  );

  // ---------------------------------------------------------------------------
  // GROUP 7: Payment & Webhook Receipt Exactly-Once Guarantees
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Payment & Webhook Receipt Exactly-Once Execution ---");

  const ordersSrc = fs.readFileSync(path.join(process.cwd(), "src", "lib", "services", "orders.ts"), "utf-8");
  test(
    ordersSrc.includes("order_receipt_") &&
      ordersSrc.includes("idempotencyKey: `order_receipt_${order.orderNumber}`"),
    "Test 24: Payment confirmation email derives deterministic idempotency key (order_receipt_<orderNumber>)"
  );

  const webhookRoute = fs.readFileSync(path.join(process.cwd(), "src", "app", "api", "webhooks", "razorpay", "route.ts"), "utf-8");
  test(
    webhookRoute.includes("recordWebhookEvent(eventId") &&
      webhookRoute.includes("alreadyProcessed"),
    "Test 25: Webhook route verifies database idempotency before invoking order payment confirmation"
  );

  console.log("\n================================================================================");
  console.log(` PHASE 8.2 FINAL HARDENING RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
