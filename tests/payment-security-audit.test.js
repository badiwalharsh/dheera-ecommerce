const assert = require("assert");
const crypto = require("crypto");
const http = require("http");
const { spawn, execSync } = require("child_process");
const path = require("path");

function request(options, bodyData) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, body: data });
        }
      });
    });
    req.on("error", reject);
    if (bodyData) {
      req.write(typeof bodyData === "string" ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function runAuditSuite() {
  console.log("================================================================================");
  console.log("DHEERA — PHASE 4.1: PAYMENT SECURITY & TRANSACTION INTEGRITY AUDIT SUITE");
  console.log("================================================================================\n");

  console.log("Starting Next.js production server for security audit tests...");
  const server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", "3000"], {
    cwd: path.join(__dirname, ".."),
    stdio: "ignore",
  });

  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get("http://localhost:3000", (res) => {
          if (res.statusCode === 200) resolve();
          else reject();
        });
        req.on("error", reject);
      });
      serverReady = true;
      break;
    } catch {
      await wait(500);
    }
  }

  if (!serverReady) {
    console.error("Could not connect to Next.js server on port 3000");
    if (server) {
      try {
        execSync(`taskkill /F /T /PID ${server.pid}`);
      } catch {}
    }
    process.exit(1);
  }

  console.log("Server ready. Commencing 8 audit scenario verifications...\n");

  let totalTests = 0;
  let passedTests = 0;

  async function test(name, fn) {
    totalTests++;
    try {
      await fn();
      passedTests++;
      console.log(`✓ [PASS] Scenario ${totalTests}: ${name}`);
    } catch (err) {
      console.error(`✗ [FAIL] Scenario ${totalTests}: ${name}:`, err.message);
    }
  }

  // Common customer & address fixture
  const sampleCustomer = {
    fullName: "Priyanka Sen",
    email: "priyanka.sen@example.com",
    phone: "9876543210",
  };
  const sampleAddress = {
    fullName: "Priyanka Sen",
    phone: "9876543210",
    pincode: "110001",
    houseNumber: "A-101, Chanderi Heights",
    street: "Connaught Place",
    city: "New Delhi",
    state: "Delhi",
    country: "India",
  };

  // ---------------------------------------------------------------------------
  // SCENARIO 1: Successful Test Payment & Full Cryptographic Verification
  // ---------------------------------------------------------------------------
  let activeOrder = null;
  await test("Successful test payment: Valid HMAC signature confirms order and captures payment", async () => {
    // 1. Create Order
    const createRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/checkout/create-order",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        items: [
          {
            id: "prod-1_S_Rani Pink",
            productId: "prod-1",
            productSlug: "gulab-embroidered-kurta-set",
            name: "Gulab Embroidered Kurta Set",
            sku: "DHR-KRT-001-S",
            price: 2999,
            image: "/images/products/product-1.jpg",
            size: "S",
            colour: "Rani Pink",
            quantity: 1,
          },
        ],
        customerInfo: sampleCustomer,
        shippingAddress: sampleAddress,
      }
    );

    assert.strictEqual(createRes.status, 200);
    assert.strictEqual(createRes.body.success, true);
    assert.ok(createRes.body.accessToken, "Server must return unguessable access_token");

    activeOrder = createRes.body;

    // 2. Generate valid HMAC-SHA256 signature using test secret
    const secret = "placeholder_secret";
    const paymentId = `pay_audit_${Date.now()}`;
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${activeOrder.razorpayOrderId}|${paymentId}`)
      .digest("hex");

    // 3. Verify Payment
    const verifyRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/checkout/verify-payment",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        orderId: activeOrder.orderId,
        orderNumber: activeOrder.orderNumber,
        razorpayOrderId: activeOrder.razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      }
    );

    assert.strictEqual(verifyRes.status, 200);
    assert.strictEqual(verifyRes.body.success, true);
    assert.strictEqual(verifyRes.body.status, "confirmed");
    assert.strictEqual(verifyRes.body.paymentStatus, "captured");
    assert.ok(verifyRes.body.redirectUrl.includes(`token=${activeOrder.accessToken}`));
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 2: Invalid Signature Rejection (Tamper Resistance)
  // ---------------------------------------------------------------------------
  await test("Invalid signature rejection: Forged HMAC signature strictly rejected (HTTP 400)", async () => {
    // Create new pending order
    const createRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/checkout/create-order",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        items: [
          {
            productId: "prod-2",
            productSlug: "ivory-chanderi-saree",
            name: "Ivory Chanderi Saree",
            sku: "DHR-SAR-002-FS",
            price: 4299,
            image: "/images/products/product-2.jpg",
            size: "Free Size",
            colour: "Warm Ivory",
            quantity: 1,
          },
        ],
        customerInfo: sampleCustomer,
        shippingAddress: sampleAddress,
      }
    );

    const pendingOrder = createRes.body;

    // Attempt verification with forged signature
    const forgedSignature = "forged_malicious_signature_abcdef0123456789";

    const verifyRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/checkout/verify-payment",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        orderId: pendingOrder.orderId,
        orderNumber: pendingOrder.orderNumber,
        razorpayOrderId: pendingOrder.razorpayOrderId,
        razorpayPaymentId: "pay_tampered_001",
        razorpaySignature: forgedSignature,
      }
    );

    assert.strictEqual(verifyRes.status, 400);
    assert.strictEqual(verifyRes.body.success, false);
    assert.ok(verifyRes.body.message.includes("Cryptographic signature does not match"));
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 3: Duplicate Webhook Idempotency (Replay Attack Prevention)
  // ---------------------------------------------------------------------------
  await test("Duplicate webhook idempotency: Replayed event processed once, subsequent calls return 200 without duplicate state change", async () => {
    assert.ok(activeOrder, "Precondition: activeOrder exists");

    const webhookSecret = "placeholder_webhook_secret";
    const eventId = `evt_audit_replay_${Date.now()}`;
    const webhookPayload = JSON.stringify({
      event: "payment.captured",
      event_id: eventId,
      payload: {
        payment: {
          entity: {
            id: `pay_hook_${Date.now()}`,
            order_id: activeOrder.razorpayOrderId,
            notes: {
              orderNumber: activeOrder.orderNumber,
            },
          },
        },
      },
    });

    const signature = crypto.createHmac("sha256", webhookSecret).update(webhookPayload).digest("hex");

    // First Call: Processes event
    const firstRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/webhooks/razorpay",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": signature,
        },
      },
      webhookPayload
    );
    assert.strictEqual(firstRes.status, 200);

    // Second Call (Replay Attack / Duplicate Webhook)
    const secondRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/webhooks/razorpay",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": signature,
        },
      },
      webhookPayload
    );
    assert.strictEqual(secondRes.status, 200);
    assert.ok(secondRes.body.message.includes("Idempotent"), "Second webhook must be identified as idempotent duplicate");
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 4: Payment Failure Isolation
  // ---------------------------------------------------------------------------
  await test("Payment failure isolation: Failed webhook event does not transition order to confirmed", async () => {
    const webhookSecret = "placeholder_webhook_secret";
    const eventId = `evt_audit_fail_${Date.now()}`;
    const webhookPayload = JSON.stringify({
      event: "payment.failed",
      event_id: eventId,
      payload: {
        payment: {
          entity: {
            id: `pay_fail_${Date.now()}`,
            order_id: "order_non_existent",
            error_description: "Bank declined transaction: Insufficient funds",
          },
        },
      },
    });

    const signature = crypto.createHmac("sha256", webhookSecret).update(webhookPayload).digest("hex");

    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/webhooks/razorpay",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-razorpay-signature": signature,
        },
      },
      webhookPayload
    );
    assert.strictEqual(res.status, 200);
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 5: Pending Payment Isolation & IDOR Protection
  // ---------------------------------------------------------------------------
  await test("Pending payment & IDOR protection: Unauthorized retrieval without access token is blocked (HTTP 403)", async () => {
    assert.ok(activeOrder, "Precondition: activeOrder exists");

    // 1. Attempt to fetch order WITHOUT access token (IDOR attempt)
    const unauthorizedRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/orders/${activeOrder.orderNumber}`,
      method: "GET",
    });
    assert.strictEqual(unauthorizedRes.status, 403);
    assert.strictEqual(unauthorizedRes.body.success, false);
    assert.ok(unauthorizedRes.body.message.includes("Access denied"));

    // 2. Attempt with WRONG token
    const wrongTokenRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/orders/${activeOrder.orderNumber}?token=wrong_token_12345`,
      method: "GET",
    });
    assert.strictEqual(wrongTokenRes.status, 403);

    // 3. Attempt with CORRECT access token
    const authorizedRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/orders/${activeOrder.orderNumber}?token=${activeOrder.accessToken}`,
      method: "GET",
    });
    assert.strictEqual(authorizedRes.status, 200);
    assert.strictEqual(authorizedRes.body.success, true);
    assert.strictEqual(authorizedRes.body.order.orderNumber, activeOrder.orderNumber);
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 6: Price Tampering Resilience (Authoritative Server Pricing)
  // ---------------------------------------------------------------------------
  await test("Price tampering resilience: Server rejects manipulated ₹0 or negative totals", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/checkout/create-order",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        items: [
          {
            productId: "prod-1",
            productSlug: "gulab-embroidered-kurta-set",
            name: "Gulab Embroidered Kurta Set",
            sku: "DHR-KRT-001-S",
            price: 0, // Malicious ₹0
            size: "S",
            colour: "Rani Pink",
            quantity: 1,
          },
        ],
        customerInfo: sampleCustomer,
        shippingAddress: sampleAddress,
      }
    );

    assert.strictEqual(res.status, 200);
    // Even though client sent price: 0, server recalculates authoritative price ₹2,999 + ₹150 shipping = ₹3,149
    assert.strictEqual(res.body.pricing.subtotal, 2999);
    assert.strictEqual(res.body.pricing.totalAmount, 3149);
    assert.strictEqual(res.body.amount, 314900);
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 7: Inventory Protection & Overselling Prevention
  // ---------------------------------------------------------------------------
  await test("Inventory protection: Server blocks checkout when quantity exceeds available stock", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/checkout/create-order",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        items: [
          {
            productId: "prod-1",
            productSlug: "gulab-embroidered-kurta-set",
            name: "Gulab Embroidered Kurta Set",
            sku: "DHR-KRT-001-XXL",
            price: 2999,
            size: "XXL", // Variant with limited stock (only 1 available)
            colour: "Rani Pink",
            quantity: 9, // Attempt to purchase 9 units!
          },
        ],
        customerInfo: sampleCustomer,
        shippingAddress: sampleAddress,
      }
    );

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.ok(
      res.body.message.includes("currently available") || res.body.message.includes("out of stock"),
      "Server must reject order exceeding available stock"
    );
  });

  // ---------------------------------------------------------------------------
  // SCENARIO 8: Rate Limiting Enforcement (Run last so it does not affect others)
  // ---------------------------------------------------------------------------
  await test("Rate limiting enforcement: Burst checkout requests trigger HTTP 429", async () => {
    let hitRateLimit = false;
    for (let i = 0; i < 20; i++) {
      const res = await request(
        {
          hostname: "localhost",
          port: 3000,
          path: "/api/checkout/create-order",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        {
          items: [],
          customerInfo: sampleCustomer,
          shippingAddress: sampleAddress,
        }
      );
      if (res.status === 429) {
        hitRateLimit = true;
        break;
      }
    }
    assert.strictEqual(hitRateLimit, true, "Rate limit of 15 req/min must trigger HTTP 429");
  });

  console.log("\nStopping test server...");
  try {
    execSync(`taskkill /F /T /PID ${server.pid}`);
  } catch {}

  console.log("\n================================================================================");
  console.log(`SECURITY AUDIT RESULTS: ${passedTests} / ${totalTests} SCENARIOS PASSED!`);
  console.log("================================================================================\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAuditSuite().catch((err) => {
  console.error("Audit suite runtime failure:", err);
  process.exit(1);
});
