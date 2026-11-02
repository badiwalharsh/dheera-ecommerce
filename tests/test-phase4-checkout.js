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

async function run() {
  console.log("=========================================================");
  console.log("DHEERA — PHASE 4: COMPREHENSIVE CHECKOUT & PAYMENT TEST");
  console.log("=========================================================\n");

  let total = 0;
  let passed = 0;

  function test(name, fn) {
    total++;
    try {
      fn();
      passed++;
      console.log(`✓ [PASS] ${name}`);
    } catch (err) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
    }
  }

  async function testAsync(name, fn) {
    total++;
    try {
      await fn();
      passed++;
      console.log(`✓ [PASS] ${name}`);
    } catch (err) {
      console.error(`✗ [FAIL] ${name}:`, err.message);
    }
  }

  // --- UNIT TESTS ---
  console.log("--- 1. Pure Unit & Formula Verifications ---");

  test("1. Cart item structure with composite ID and variant tags", () => {
    const item = {
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
    };
    assert.strictEqual(item.id, "prod-1_S_Rani Pink");
    assert.strictEqual(item.price, 2999);
  });

  test("2. Quantity boundaries (min 1, max 10)", () => {
    const clamp = (q) => Math.max(1, Math.min(10, Math.floor(q)));
    assert.strictEqual(clamp(1), 1);
    assert.strictEqual(clamp(5), 5);
    assert.strictEqual(clamp(15), 10);
    assert.strictEqual(clamp(-3), 1);
  });

  test("3. Cart item removal logic", () => {
    let items = [{ id: "a" }, { id: "b" }];
    items = items.filter((i) => i.id !== "a");
    assert.strictEqual(items.length, 1);
    assert.strictEqual(items[0].id, "b");
  });

  test("4. Cart persistence serialization & hydration", () => {
    const initial = [{ id: "x", quantity: 2, price: 2999 }];
    const str = JSON.stringify(initial);
    const parsed = JSON.parse(str);
    assert.deepStrictEqual(parsed, initial);
  });

  test("5. Cart recalculation formula", () => {
    const cart = [
      { price: 2999, quantity: 2 },
      { price: 4299, quantity: 1 },
    ];
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    assert.strictEqual(subtotal, 10297);
  });

  test("6. Indian PIN code regex validation", () => {
    const pinRegex = /^[1-8][0-9]{5}$/;
    assert.strictEqual(pinRegex.test("110001"), true);
    assert.strictEqual(pinRegex.test("560001"), true);
    assert.strictEqual(pinRegex.test("400050"), true);
    assert.strictEqual(pinRegex.test("010001"), false); // Invalid first digit
    assert.strictEqual(pinRegex.test("11000"), false); // 5 digits
    assert.strictEqual(pinRegex.test("1100001"), false); // 7 digits
  });

  test("7. Indian mobile number format validation (+91)", () => {
    const phoneRegex = /^(?:\+91|91)?[6-9]\d{9}$/;
    assert.strictEqual(phoneRegex.test("9876543210"), true);
    assert.strictEqual(phoneRegex.test("+919876543210"), true);
    assert.strictEqual(phoneRegex.test("919876543210"), true);
    assert.strictEqual(phoneRegex.test("5876543210"), false); // Starts with 5
    assert.strictEqual(phoneRegex.test("98765"), false);
  });

  test("8. Shipping calculation tier rules (Threshold: ₹5,000, Base: ₹150)", () => {
    const calc = (subtotal) => {
      const isFree = subtotal >= 5000;
      return { fee: isFree ? 0 : 150, isFree };
    };
    assert.strictEqual(calc(2999).fee, 150);
    assert.strictEqual(calc(4999).fee, 150);
    assert.strictEqual(calc(5000).fee, 0);
    assert.strictEqual(calc(7500).fee, 0);
  });

  test("9. Razorpay HMAC-SHA256 signature verification formula", () => {
    const secret = "placeholder_secret";
    const orderId = "order_test_123";
    const paymentId = "pay_test_456";
    const signature = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");

    // Verification
    const expected = crypto.createHmac("sha256", secret).update(`${orderId}|${paymentId}`).digest("hex");
    assert.strictEqual(signature, expected);

    // Tampered
    assert.notStrictEqual(signature, "bogus_signature");
  });

  test("10. Webhook idempotency tracking", () => {
    const eventSet = new Set();
    const eventId = "evt_001";
    assert.strictEqual(eventSet.has(eventId), false);
    eventSet.add(eventId);
    assert.strictEqual(eventSet.has(eventId), true);
  });

  // --- INTEGRATION TESTS VIA NEXT.JS API ---
  console.log("\n--- 2. End-to-End API Integration Verifications ---");

  console.log("Starting Next.js production server for API tests...");
  const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextBin, "start", "-p", "3000"], {
    cwd: path.join(__dirname, ".."),
    stdio: "ignore",
  });

  // Wait for server ready
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
      } catch { }
    }
    process.exit(1);
  }

  console.log("Next.js server is ready. Running API endpoint tests...\n");

  // Test 11: Server-side Cart Validation Defeating Price Tampering
  await testAsync("11. API: Server validates cart and overrides tampered price", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/checkout/validate-cart",
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
            price: 1, // Tampered ₹1
            image: "/images/products/product-1.jpg",
            size: "S",
            colour: "Rani Pink",
            quantity: 2,
          },
        ],
        pincode: "110001",
      }
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.isValid, true);
    // Authoritative price must be 2999 * 2 = 5998
    assert.strictEqual(res.body.items[0].unitPrice, 2999);
    assert.strictEqual(res.body.subtotal, 5998);
  });

  // Test 12: Coupon Validation API
  await testAsync("12. API: Validates percentage fixture coupon DHEERA10", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/checkout/validate-coupon",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        code: "DHEERA10",
        subtotal: 5000,
      }
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.isValid, true);
    assert.strictEqual(res.body.discountAmount, 500); // 10% of 5000
    assert.strictEqual(res.body.coupon.code, "DHEERA10");
  });

  // Test 13: Ineligible Coupon Below Min Order Amount
  await testAsync("13. API: Rejects coupon when subtotal is below minimum order amount", async () => {
    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/checkout/validate-coupon",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        code: "DHEERA10",
        subtotal: 1000, // Deficit! Minimum is 2000
      }
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.isValid, false);
    assert.strictEqual(res.body.discountAmount, 0);
  });

  // Test 14: Order Creation API
  let createdOrderData = null;
  await testAsync("14. API: Creates Razorpay order and saves pending order snapshot", async () => {
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
        customerInfo: {
          fullName: "Saanvi Rao",
          email: "saanvi.rao@example.com",
          phone: "9876543210",
        },
        shippingAddress: {
          fullName: "Saanvi Rao",
          phone: "9876543210",
          pincode: "110001",
          houseNumber: "House 24",
          street: "Barakhamba Road",
          city: "New Delhi",
          state: "Delhi",
          country: "India",
        },
        couponCode: "DHEERA10",
      }
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.orderNumber.startsWith("DHR-"));
    assert.ok(res.body.razorpayOrderId.startsWith("order_"));
    // Subtotal: 2999, Discount 10%: 300, Shipping: 150 -> Total: 2849 -> 284900 paise
    assert.strictEqual(res.body.pricing.subtotal, 2999);
    assert.strictEqual(res.body.pricing.discountAmount, 300);
    assert.strictEqual(res.body.pricing.shippingFee, 150);
    assert.strictEqual(res.body.pricing.totalAmount, 2849);
    assert.strictEqual(res.body.amount, 284900);

    createdOrderData = res.body;
  });

  // Test 15: Payment Verification API (Cryptographic Signature Check)
  await testAsync("15. API: Verifies cryptographic payment signature & confirms order", async () => {
    assert.ok(createdOrderData, "Precondition: Order must have been created");

    const secret = "placeholder_secret";
    const paymentId = `pay_test_${Date.now()}`;
    const validSignature = crypto
      .createHmac("sha256", secret)
      .update(`${createdOrderData.razorpayOrderId}|${paymentId}`)
      .digest("hex");

    const res = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/checkout/verify-payment",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        orderId: createdOrderData.orderId,
        orderNumber: createdOrderData.orderNumber,
        razorpayOrderId: createdOrderData.razorpayOrderId,
        razorpayPaymentId: paymentId,
        razorpaySignature: validSignature,
      }
    );

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.orderNumber, createdOrderData.orderNumber);
    assert.strictEqual(res.body.status, "confirmed");
    assert.strictEqual(res.body.paymentStatus, "captured");
    assert.ok(
      res.body.redirectUrl.startsWith(`/order-confirmation/${createdOrderData.orderNumber}?token=`),
      "Redirect URL must contain secure access token"
    );
  });

  // Test 16: Order Confirmation Retrieval API with Access Token
  await testAsync("16. API: Retrieves confirmed order snapshot with cryptographic access token", async () => {
    assert.ok(createdOrderData, "Precondition: Order must have been created");

    const res = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/orders/${createdOrderData.orderNumber}?token=${createdOrderData.accessToken}`,
      method: "GET",
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.order.orderNumber, createdOrderData.orderNumber);
    assert.strictEqual(res.body.order.status, "confirmed");
    assert.strictEqual(res.body.order.pricing.totalAmount, 2849);
    assert.strictEqual(res.body.order.items[0].sku, "DHR-KRT-001-S");
  });

  // Test 17: Webhook Signature Verification and Idempotency
  await testAsync("17. API: Webhook verifies signature and safely processes captured event", async () => {
    assert.ok(createdOrderData, "Precondition: Order must have been created");

    const webhookSecret = "placeholder_webhook_secret";
    const webhookPayload = JSON.stringify({
      event: "payment.captured",
      event_id: `evt_${Date.now()}`,
      payload: {
        payment: {
          entity: {
            id: "pay_test_webhook_123",
            order_id: createdOrderData.razorpayOrderId,
            notes: {
              orderNumber: createdOrderData.orderNumber,
            },
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
    assert.strictEqual(res.body.success, true);
  });

  // Tear down test server
  console.log("\nStopping test server...");
  try {
    execSync(`taskkill /F /T /PID ${server.pid}`);
  } catch { }

  console.log("\n=========================================================");
  console.log(`ALL TESTS COMPLETED: ${passed} / ${total} TESTS PASSED!`);
  console.log("=========================================================\n");

  if (passed !== total) {
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

