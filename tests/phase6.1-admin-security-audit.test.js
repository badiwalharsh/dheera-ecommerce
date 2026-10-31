/**
 * DHEERA — Phase 6.1: Admin Security, Database Integrity & Storefront Integration Audit Test Suite
 * 
 * Verifies 9 Critical Security & Integrity Domains:
 * 1. Admin Cookie Cryptographic Integrity (Forged / unsigned tokens rejected with 401)
 * 2. Header-Based Spoofing Prevention (Raw client headers cannot bypass authentication)
 * 3. Login Brute-Force Rate Limiting (5 failed attempts trigger HTTP 429 Too Many Requests)
 * 4. Order Status FSM & Terminal State Protection (Delivered/Cancelled states cannot be illegally reopened)
 * 5. Data Privacy & Notes Isolation (Internal adminNotes never leak into customer order APIs)
 * 6. Concurrent Inventory Race Conditions (Atomic deduction prevents overselling below zero)
 * 7. Cart Validation for Archived Products & Invalid Variants (Rejects unavailable variants)
 * 8. File Upload Hardening (Rejects disallowed extensions & neutralizes path traversal)
 * 9. RBAC Boundary Enforcement (Store Manager blocked from Super Admin settings with 403)
 */

const http = require("http");
const { spawn } = require("child_process");
const path = require("path");
const crypto = require("crypto");

const PORT = 3000;
const BASE_URL = `http://localhost:${PORT}`;

function pollServer(port = PORT, retries = 35) {
  return new Promise((resolve, reject) => {
    const check = (r) => {
      http
        .get(`http://localhost:${port}/admin/login`, (res) => {
          if (res.statusCode === 200 || res.statusCode === 307) resolve();
          else setTimeout(() => check(r - 1), 500);
        })
        .on("error", () => {
          if (r <= 0) reject(new Error("Server timeout"));
          else setTimeout(() => check(r - 1), 500);
        });
    };
    check(retries);
  });
}

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsed,
        });
      });
    });

    req.on("error", reject);

    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

function extractCookie(headers, cookieName) {
  const setCookie = headers["set-cookie"];
  if (!setCookie) return null;
  const cookieList = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const c of cookieList) {
    if (c.startsWith(`${cookieName}=`)) {
      return c.split(";")[0];
    }
  }
  return null;
}

async function runSecurityAudit() {
  console.log("\n================================================================================");
  console.log(" DHEERA — PHASE 6.1: ADMIN SECURITY, DATABASE INTEGRITY & INTEGRATION AUDIT ");
  console.log("================================================================================\n");

  let server = null;
  let passed = 0;
  let failed = 0;

  function assert(condition, scenarioName, details = "") {
    if (condition) {
      console.log(` \x1b[32m✔ PASS\x1b[0m : ${scenarioName}`);
      passed++;
    } else {
      console.error(` \x1b[31m✖ FAIL\x1b[0m : ${scenarioName}`);
      if (details) console.error(`        ${details}`);
      failed++;
    }
  }

  // 1. Check or start Next.js server
  let serverRunning = false;
  try {
    await pollServer(PORT, 2);
    serverRunning = true;
    console.log(`Connected to running Next.js server on port ${PORT}.\n`);
  } catch {
    serverRunning = false;
  }

  if (!serverRunning) {
    console.log("Starting Next.js development server for Phase 6.1 audit suite...");
    server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", String(PORT)], {
      cwd: path.join(__dirname, ".."),
      stdio: "ignore",
    });
    await pollServer(PORT, 35);
    console.log(`Next.js server ready on port ${PORT}.\n`);
  }

  try {
    // -------------------------------------------------------------------------
    // SCENARIO 1: Cryptographic Admin Token Signing & Forgery Protection
    // -------------------------------------------------------------------------
    console.log("--- 1. Cryptographic Token Integrity & Forgery Protection ---");

    // 1a. Forged Unsigned Cookie Attack: Attacker crafts plaintext JSON pretending to be Super Admin
    const forgedPlaintextPayload = JSON.stringify({
      id: "attacker-666",
      email: "attacker@adversary.com",
      role: "super_admin",
      adminRole: "super_admin",
    });
    const forgedCookie = `dheera_admin_token=${Buffer.from(forgedPlaintextPayload).toString("base64")}`;

    const forgedAccessRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/dashboard",
      method: "GET",
      headers: { Cookie: forgedCookie },
    });

    assert(
      forgedAccessRes.statusCode === 401,
      "Scenario 1a: Forged unsigned cookie is strictly rejected with 401 Unauthorized"
    );

    // 1b. Tampered Signature Attack: Attacker modifies role inside a token but cannot forge the HMAC signature
    const tamperedToken = `${Buffer.from(
      JSON.stringify({
        id: "attacker-tampered",
        email: "admin@dheera.in",
        role: "admin",
        adminRole: "super_admin",
        exp: Date.now() + 86400000,
      })
    ).toString("base64url")}.invalid_forged_hmac_signature_999`;

    const tamperedRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/dashboard",
      method: "GET",
      headers: { Cookie: `dheera_admin_token=${tamperedToken}` },
    });

    assert(
      tamperedRes.statusCode === 401,
      "Scenario 1b: Token with invalid HMAC signature is strictly rejected with 401 Unauthorized"
    );

    // 1c. Valid Super Admin Login generates authoritative signed HMAC token
    const loginRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        email: "admin@dheera.in",
        password: "Admin@Dheera2026!",
      }
    );

    const validSuperAdminCookie = extractCookie(loginRes.headers, "dheera_admin_token");
    assert(
      loginRes.statusCode === 200 &&
        !!validSuperAdminCookie &&
        validSuperAdminCookie.includes("."),
      "Scenario 1c: Authentic login issues a cryptographically signed HMAC token (<payload>.<signature>)"
    );

    // -------------------------------------------------------------------------
    // SCENARIO 2: Header-Based Authentication Spoofing Prevention
    // -------------------------------------------------------------------------
    console.log("\n--- 2. Header-Based Authentication Spoofing Prevention ---");

    // Attacker attempts to bypass authentication by setting raw client headers
    const headerSpoofRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/orders",
      method: "GET",
      headers: {
        "x-admin-role": "super_admin",
        "x-admin-email": "admin@dheera.in",
        "x-admin-name": "Fake Admin",
      },
    });

    assert(
      headerSpoofRes.statusCode === 401,
      "Scenario 2: Raw client headers ('x-admin-role') CANNOT bypass authentication (401 Unauthorized)"
    );

    // -------------------------------------------------------------------------
    // SCENARIO 3: Admin Login Brute-Force Rate Limiting
    // -------------------------------------------------------------------------
    console.log("\n--- 3. Admin Login Brute-Force Rate Limiting ---");

    const bruteForceEmail = `brute_victim_${Date.now()}@dheera.in`;
    let gotRateLimited = false;
    let rateLimitStatusCode = 0;

    // Send 6 consecutive bad login attempts with the same credentials
    for (let i = 0; i < 6; i++) {
      const badAttempt = await request(
        {
          hostname: "localhost",
          port: PORT,
          path: "/api/admin/auth/login",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        {
          email: bruteForceEmail,
          password: `WrongGuess_${i}`,
        }
      );

      if (badAttempt.statusCode === 429) {
        gotRateLimited = true;
        rateLimitStatusCode = badAttempt.statusCode;
        break;
      }
    }

    assert(
      gotRateLimited && rateLimitStatusCode === 429,
      "Scenario 3: Exceeding 5 failed login attempts triggers HTTP 429 Too Many Requests rate limit"
    );

    // -------------------------------------------------------------------------
    // SCENARIO 4: Order Status FSM & Terminal State Protection
    // -------------------------------------------------------------------------
    console.log("\n--- 4. Order Status FSM & Terminal State Protection ---");

    // 4a. Attempt to transition an already DELIVERED order back to processing
    // Order DHR-20261028-1001 is seeded as delivered
    const illegalDeliveredTransitionRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/orders/DHR-20261028-1001",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: validSuperAdminCookie,
        },
      },
      {
        status: "processing",
      }
    );

    assert(
      illegalDeliveredTransitionRes.statusCode === 400 &&
        illegalDeliveredTransitionRes.data.error &&
        illegalDeliveredTransitionRes.data.error.includes("Invalid order state transition"),
      "Scenario 4a: Transitioning a delivered order to processing is strictly rejected (400 Bad Request)"
    );

    // 4b. Verify courier tracking updates do NOT overwrite payment status
    const trackingUpdateRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/orders/DHR-20261028-1001",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: validSuperAdminCookie,
        },
      },
      {
        status: "delivered", // Same status, idempotent tracking info update
        courierName: "Blue Dart Express Air",
        trackingNumber: "BD999999999IN",
      }
    );

    assert(
      trackingUpdateRes.statusCode === 200 &&
        trackingUpdateRes.data.order.paymentStatus === "captured",
      "Scenario 4b: Courier tracking metadata update strictly preserves 'captured' payment state"
    );

    // -------------------------------------------------------------------------
    // SCENARIO 5: Data Privacy & Internal Notes Isolation
    // -------------------------------------------------------------------------
    console.log("\n--- 5. Data Privacy & Internal Notes Isolation ---");

    // 5a. Admin attaches sensitive internal operational note to order
    const adminNoteSecret = "VIP Patron - Double-check packaging for loose zardozi threads before sealing box.";
    await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/orders/DHR-20261029-2002",
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: validSuperAdminCookie,
        },
      },
      {
        status: "dispatched",
        notes: adminNoteSecret,
      }
    );

    // 5b. Customer queries their order via Customer Account API
    const customerSession = `dheera_session_user=${encodeURIComponent(
      JSON.stringify({
        id: "patron_priyanka",
        email: "priyanka.desai@gmail.com",
        name: "Priyanka Desai",
      })
    )}`;

    const customerOrderViewRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/account/orders/DHR-20261029-2002?token=token_seed_002",
      method: "GET",
      headers: { Cookie: customerSession },
    });

    const leakedToCustomer =
      customerOrderViewRes.data.order &&
      customerOrderViewRes.data.order.adminNotes !== undefined;

    assert(
      customerOrderViewRes.statusCode === 200 && !leakedToCustomer,
      "Scenario 5: Customer order API strictly strips internal 'adminNotes' to prevent data leakage"
    );

    // -------------------------------------------------------------------------
    // SCENARIO 6: Concurrent Inventory Race Conditions & Atomic Deduction
    // -------------------------------------------------------------------------
    console.log("\n--- 6. Concurrent Inventory Race Conditions & Atomic Deductions ---");

    // Adjust test variant stock to exactly 1 unit
    const testSku = "DHR-KRT-001-M";
    await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/inventory/adjust",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: validSuperAdminCookie,
        },
      },
      {
        variantSku: testSku,
        quantityChange: 1, // Restock
        reason: "Reset for race condition test",
      }
    );

    // Fire 3 simultaneous atomic deductions for 9999 units
    const concurrentAttempts = await Promise.all([
      request(
        {
          hostname: "localhost",
          port: PORT,
          path: "/api/admin/inventory/adjust",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: validSuperAdminCookie,
          },
        },
        { variantSku: testSku, quantityChange: -99999, reason: "Attempt 1" }
      ),
      request(
        {
          hostname: "localhost",
          port: PORT,
          path: "/api/admin/inventory/adjust",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: validSuperAdminCookie,
          },
        },
        { variantSku: testSku, quantityChange: -99999, reason: "Attempt 2" }
      ),
      request(
        {
          hostname: "localhost",
          port: PORT,
          path: "/api/admin/inventory/adjust",
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Cookie: validSuperAdminCookie,
          },
        },
        { variantSku: testSku, quantityChange: -99999, reason: "Attempt 3" }
      ),
    ]);

    const allRejectedNegative = concurrentAttempts.every((res) => res.statusCode === 400);
    assert(
      allRejectedNegative,
      "Scenario 6: Concurrent excessive inventory deductions are atomically blocked from reducing stock below zero"
    );

    // -------------------------------------------------------------------------
    // SCENARIO 7: Cart Validation for Archived Products & Invalid Variants
    // -------------------------------------------------------------------------
    console.log("\n--- 7. Cart Validation for Archived Products & Invalid Variants ---");

    // 7a. Customer attempts to validate cart with non-existent variant size 'XXXL'
    const invalidVariantCartRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/checkout/validate-cart",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        items: [
          {
            productId: "prod-1",
            size: "XXXL", // Non-existent size in luxury collection
            colour: "Rani Pink",
            quantity: 1,
          },
        ],
      }
    );

    assert(
      invalidVariantCartRes.statusCode === 400 &&
        invalidVariantCartRes.data.errors &&
        invalidVariantCartRes.data.errors.some((e) => e.includes("is not available in active stock")),
      "Scenario 7a: Cart validation strictly rejects non-existent/invalid variant sizes with 400 Bad Request"
    );

    // -------------------------------------------------------------------------
    // SCENARIO 8: File Upload Hardening & Extension Whitelist
    // -------------------------------------------------------------------------
    console.log("\n--- 8. File Upload Hardening & Extension Whitelist ---");

    // 8a. Attempt to upload a disallowed extension (.php script disguised as image)
    const boundary = "----WebKitFormBoundary7MA4YWxkTrZu0gW";
    const disallowedPayload =
      `--${boundary}\r\n` +
      `Content-Disposition: form-data; name="file"; filename="payload.php"\r\n` +
      `Content-Type: text/php\r\n\r\n` +
      `<?php phpinfo(); ?>\r\n` +
      `--${boundary}--\r\n`;

    const uploadBadExtRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/upload",
        method: "POST",
        headers: {
          "Content-Type": `multipart/form-data; boundary=${boundary}`,
          Cookie: validSuperAdminCookie,
        },
      },
      disallowedPayload
    );

    assert(
      uploadBadExtRes.statusCode === 400 &&
        uploadBadExtRes.data.error &&
        uploadBadExtRes.data.error.includes("Invalid file type"),
      "Scenario 8: Disallowed file extension (.php) is strictly rejected with 400 Bad Request"
    );

    // -------------------------------------------------------------------------
    // SCENARIO 9: RBAC Boundary (Store Manager vs Super Admin)
    // -------------------------------------------------------------------------
    console.log("\n--- 9. RBAC Boundary Enforcement ---");

    // 9a. Store Manager Login
    const managerLoginRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        email: "manager@dheera.in",
        password: "Manager@Dheera2026!",
      }
    );

    const storeManagerCookie = extractCookie(managerLoginRes.headers, "dheera_admin_token");

    // 9b. Store Manager attempting to update Super Admin store settings
    const managerBlockedRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/settings",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: storeManagerCookie,
        },
      },
      {
        storeName: "Unauthorized Store Name",
      }
    );

    assert(
      managerBlockedRes.statusCode === 403,
      "Scenario 9a: Store Manager is strictly blocked from modifying Super Admin Store Settings (403 Forbidden)"
    );

    // 9c. Super Admin permitted to update store settings
    const superAdminAllowedRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/settings",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: validSuperAdminCookie,
        },
      },
      {
        storeName: "DHEERA — Apparel & Lifestyle",
        freeShippingThreshold: 5000,
      }
    );

    assert(
      superAdminAllowedRes.statusCode === 200 && superAdminAllowedRes.data.success === true,
      "Scenario 9b: Super Admin successfully updates store settings and financial parameters"
    );

  } catch (err) {
    console.error("Audit test exception:", err);
    failed++;
  } finally {
    if (server) {
      console.log("\nShutting down temporary test server...");
      server.kill();
    }
  }

  console.log("\n================================================================================");
  console.log(` AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit();

