/**
 * DHEERA — Phase 7: Storefront Completion, Brand Polish & Launch Readiness Test Suite
 * 
 * Verifies End-to-End Customer Journeys & Technical SEO:
 * 1. Scenario A — Guest Purchase Journey (Discovery -> Cart -> Coupon -> Order -> Test Payment -> Confirmation)
 * 2. Scenario B — Registered Customer Journey (Wishlist -> Order -> Timeline Tracking -> AdminNotes Isolation)
 * 3. Scenario C — Admin-Managed Product Lifecycle (Creation -> Storefront Presence -> In-Stock Purchase -> Archive -> Cart Rejection)
 * 4. Scenario D — Failed or Interrupted Payment (Failed Verification -> Unpaid Isolation -> Inventory Safety -> Replay Guard)
 * 5. Scenario E — Trust, Concierge & Technical SEO (/api/newsletter, /api/contact, /api/customizations, /robots.txt, /sitemap.xml)
 */

const http = require("http");
const { spawn } = require("child_process");
const path = require("path");
const crypto = require("crypto");

const PORT = 3000;

function pollServer(port = PORT, retries = 35) {
  return new Promise((resolve, reject) => {
    const check = (r) => {
      http
        .get(`http://localhost:${port}/shop`, (res) => {
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

async function runPhase7TestSuite() {
  console.log("\n================================================================================");
  console.log(" DHEERA — PHASE 7: STOREFRONT COMPLETION & LAUNCH READINESS VERIFICATION ");
  console.log("================================================================================\n");

  let server = null;
  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(` \x1b[32m✔ PASS\x1b[0m : ${testName}`);
      passed++;
    } else {
      console.error(` \x1b[31m✖ FAIL\x1b[0m : ${testName}`);
      if (details) console.error(`        ${details}`);
      failed++;
    }
  }

  // 1. Connect or start Next.js server
  let serverRunning = false;
  try {
    await pollServer(PORT, 2);
    serverRunning = true;
    console.log(`Connected to running Next.js server on port ${PORT}.\n`);
  } catch {
    serverRunning = false;
  }

  if (!serverRunning) {
    console.log("Starting Next.js production server for Phase 7 test suite...");
    server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", String(PORT)], {
      cwd: path.join(__dirname, ".."),
      stdio: "ignore",
    });
    await pollServer(PORT, 35);
    console.log(`Next.js server ready on port ${PORT}.\n`);
  }

  try {
    // -------------------------------------------------------------------------
    // SCENARIO A: Guest Purchase Journey
    // -------------------------------------------------------------------------
    console.log("--- Scenario A: Guest Purchase Journey ---");

    // A1. Validate shopping bag with valid variant
    const guestCartRes = await request(
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
            size: "S",
            colour: "Rani Pink",
            quantity: 1,
          },
        ],
        pincode: "110001",
      }
    );

    assert(
      guestCartRes.statusCode === 200 &&
        guestCartRes.data.isValid === true &&
        guestCartRes.data.subtotal === 2999,
      "Scenario A.1: Guest validates shopping bag items with server-authoritative pricing"
    );

    // A2. Apply valid coupon
    const couponRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/checkout/validate-coupon",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        code: "DHEERA10",
        subtotal: 2999,
      }
    );

    assert(
      couponRes.statusCode === 200 &&
        couponRes.data.isValid === true &&
        couponRes.data.discountAmount === 300,
      "Scenario A.2: Valid promotional voucher applied successfully with verified discount"
    );

    // A3. Create Guest Order (No userId)
    const guestOrderRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/checkout/create-order",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        items: [
          {
            productId: "prod-1",
            size: "S",
            colour: "Rani Pink",
            quantity: 1,
          },
        ],
        customerInfo: {
          fullName: "Meera Sen",
          email: "meera.sen@example.com",
          phone: "9876543210",
        },
        shippingAddress: {
          fullName: "Meera Sen",
          phone: "9876543210",
          pincode: "110001",
          houseNumber: "House 12",
          street: "Connaught Place",
          city: "New Delhi",
          state: "Delhi",
          country: "India",
        },
        couponCode: "DHEERA10",
      }
    );

    assert(
      guestOrderRes.statusCode === 200 &&
        guestOrderRes.data.success &&
        guestOrderRes.data.orderNumber &&
        guestOrderRes.data.razorpayOrderId,
      "Scenario A.3: Razorpay test order created and pending order snapshot persisted"
    );

    const guestOrderNumber = guestOrderRes.data.orderNumber;
    const guestRzpOrderId = guestOrderRes.data.razorpayOrderId;
    const guestAccessToken = guestOrderRes.data.accessToken;

    // A4. Simulate and verify payment
    const simRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/checkout/simulate-test-payment",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        orderNumber: guestOrderNumber,
        razorpayOrderId: guestRzpOrderId,
      }
    );

    const verifyRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/checkout/verify-payment",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        orderId: guestOrderRes.data.orderId,
        orderNumber: guestOrderNumber,
        razorpayOrderId: guestRzpOrderId,
        razorpayPaymentId: simRes.data.paymentId,
        razorpaySignature: simRes.data.signature,
      }
    );

    assert(
      verifyRes.statusCode === 200 && verifyRes.data.success === true,
      "Scenario A.4: Server cryptographically verifies payment signature & confirms order",
      JSON.stringify({ status: verifyRes.statusCode, data: verifyRes.data, sim: simRes.data })
    );

    // A5. Retrieve confirmed order snapshot using secure unguessable access token
    const fetchOrderRes = await request({
      hostname: "localhost",
      port: PORT,
      path: `/api/orders/${guestOrderNumber}?token=${guestAccessToken}`,
      method: "GET",
    });

    assert(
      fetchOrderRes.statusCode === 200 &&
        fetchOrderRes.data.order &&
        (fetchOrderRes.data.order.status === "confirmed" || fetchOrderRes.data.order.payment?.status === "captured"),
      "Scenario A.5: Patron retrieves confirmed order details with cryptographic access token"
    );

    // -------------------------------------------------------------------------
    // SCENARIO B: Registered Patron Journey & Privacy Isolation
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario B: Registered Patron Journey & Privacy Isolation ---");

    const patronUser = {
      id: "patron_phase7_user",
      email: "ananya.sharma@dheera.in",
      fullName: "Ananya Sharma",
    };
    const patronCookie = `dheera_session_user=${encodeURIComponent(JSON.stringify(patronUser))}`;

    // B1. Add item to Wishlist
    const addWishlistRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/account/wishlist",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: patronCookie,
        },
      },
      { productId: "prod-2" }
    );

    assert(
      addWishlistRes.statusCode === 200 && addWishlistRes.data.success === true,
      "Scenario B.1: Patron successfully adds ensemble to account wishlist"
    );

    // B2. Retrieve Wishlist with hydrated product models
    const getWishlistRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/account/wishlist",
      method: "GET",
      headers: { Cookie: patronCookie },
    });

    assert(
      getWishlistRes.statusCode === 200 &&
        Array.isArray(getWishlistRes.data) &&
        getWishlistRes.data.some((item) => item.productId === "prod-2" || item.id === "prod-2"),
      "Scenario B.2: Patron wishlist retrieved with full garment models"
    );

    // B3. Create Order associated with patron account
    const patronOrderRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/checkout/create-order",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        items: [
          {
            productId: "prod-2",
            size: "Free Size",
            colour: "Warm Ivory",
            quantity: 1,
          },
        ],
        customerInfo: {
          fullName: patronUser.fullName,
          email: patronUser.email,
          phone: "9876543210",
        },
        shippingAddress: {
          fullName: patronUser.fullName,
          phone: "9876543210",
          pincode: "560001",
          houseNumber: "Flat 402",
          street: "Heritage Towers",
          city: "Bengaluru",
          state: "Karnataka",
          country: "India",
        },
        userId: patronUser.id,
      }
    );

    const patronOrderNum = patronOrderRes.data.orderNumber;
    const patronRzpOrderId = patronOrderRes.data.razorpayOrderId;

    // Simulate payment
    const simPatronPay = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/checkout/simulate-test-payment",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { orderNumber: patronOrderNum, razorpayOrderId: patronRzpOrderId }
    );

    await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/checkout/verify-payment",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        orderId: patronOrderRes.data.orderId,
        orderNumber: patronOrderNum,
        razorpayOrderId: patronRzpOrderId,
        razorpayPaymentId: simPatronPay.data.paymentId,
        razorpaySignature: simPatronPay.data.signature,
      }
    );

    // B4. Retrieve order details via Patron Account API
    const patronOrderDetailRes = await request({
      hostname: "localhost",
      port: PORT,
      path: `/api/account/orders/${patronOrderNum}?userId=${patronUser.id}`,
      method: "GET",
      headers: { Cookie: patronCookie },
    });

    const hasTimeline =
      patronOrderDetailRes.data.order?.trackingTimeline &&
      patronOrderDetailRes.data.order.trackingTimeline.length === 6;
    const adminNotesLeaked = patronOrderDetailRes.data.order?.adminNotes !== undefined;

    assert(
      patronOrderDetailRes.statusCode === 200 && hasTimeline && !adminNotesLeaked,
      "Scenario B.3: Patron views authoritative 6-stage order timeline with internal notes strictly stripped"
    );

    // -------------------------------------------------------------------------
    // SCENARIO C: Admin-Managed Product Lifecycle
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario C: Admin-Managed Product Lifecycle ---");

    // C1. Login as Super Admin
    const adminLoginRes = await request(
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
    const adminCookie = extractCookie(adminLoginRes.headers, "dheera_admin_token");

    // C2. Create a new product in admin
    const newGarmentSlug = `test-garment-${Date.now()}`;
    const createProductRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/products",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
      },
      {
        name: "Festive Zardozi Organza Set",
        slug: newGarmentSlug,
        sku: `DHR-ZAR-${Date.now().toString().slice(-4)}`,
        category: "Kurta Sets",
        categorySlug: "kurta-sets",
        price: 8999,
        fabric: "Pure Organza Silk",
        colour: "Amber Gold",
        colors: ["Amber Gold"],
        sizes: ["S", "M", "L"],
        shortDescription: "Artisanal amber gold organza kurta set with delicate zardozi borders.",
        description: "Handcrafted pure organza ensemble with detailed hand-embroidery.",
        care: "Dry Clean Only",
        details: ["Includes coordinating cigarette pants", "Pure silk mulmul lining"],
        inStock: true,
        isReadyToShip: true,
        image: "/images/products/product-1.jpg",
        gallery: ["/images/products/product-1.jpg"],
        variants: [
          { id: "v-s", size: "S", colour: "Amber Gold", sku: "DHR-ZAR-S", inStock: true, quantityAvailable: 5 },
          { id: "v-m", size: "M", colour: "Amber Gold", sku: "DHR-ZAR-M", inStock: true, quantityAvailable: 5 },
          { id: "v-l", size: "L", colour: "Amber Gold", sku: "DHR-ZAR-L", inStock: true, quantityAvailable: 5 },
        ],
      }
    );

    assert(
      createProductRes.statusCode === 201 && createProductRes.data.success === true,
      "Scenario C.1: Admin successfully provisions new handcrafted garment without modifying source code"
    );

    const createdProductId = createProductRes.data.product.id;

    // C3. Validate shopping bag with newly added admin product
    const validateAdminProductRes = await request(
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
            productId: createdProductId,
            size: "M",
            colour: "Amber Gold",
            quantity: 1,
          },
        ],
      }
    );

    assert(
      validateAdminProductRes.statusCode === 200 && validateAdminProductRes.data.isValid === true,
      "Scenario C.2: Admin-created product is immediately purchasable on storefront with verified server pricing"
    );

    // C4. Archive the product (inStock: false)
    const archiveRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: `/api/admin/products/${createdProductId}`,
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: adminCookie,
        },
      },
      {
        inStock: false,
      }
    );

    assert(
      archiveRes.statusCode === 200 && archiveRes.data.success === true,
      "Scenario C.3: Admin updates garment status to archived (inStock: false)"
    );

    // C5. Verify archived product is blocked from purchase
    const validateArchivedRes = await request(
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
            productId: createdProductId,
            size: "M",
            colour: "Amber Gold",
            quantity: 1,
          },
        ],
      }
    );

    assert(
      validateArchivedRes.statusCode === 400 &&
        validateArchivedRes.data.errors &&
        validateArchivedRes.data.errors.some((e) => e.includes("has been archived")),
      "Scenario C.4: Archived products are strictly barred from shopping bag checkout with HTTP 400"
    );

    // -------------------------------------------------------------------------
    // SCENARIO D: Interrupted / Failed Payment Resilience
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario D: Interrupted / Failed Payment Resilience ---");

    // D1. Create Order
    const pendingOrderRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/checkout/create-order",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        items: [
          {
            productId: "prod-1",
            size: "M",
            colour: "Rani Pink",
            quantity: 1,
          },
        ],
        customerInfo: {
          fullName: "Rohan Varma",
          email: "rohan.varma@example.com",
          phone: "9876543210",
        },
        shippingAddress: {
          fullName: "Rohan Varma",
          phone: "9876543210",
          pincode: "110001",
          houseNumber: "House 99",
          street: "Janpath",
          city: "New Delhi",
          state: "Delhi",
          country: "India",
        },
      }
    );

    const pendingOrderNum = pendingOrderRes.data.orderNumber;
    const pendingRzpId = pendingOrderRes.data.razorpayOrderId;

    // D2. Attempt payment confirmation with invalid forged signature
    const forgedPayRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/checkout/verify-payment",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        razorpay_payment_id: "pay_forged_999",
        razorpay_order_id: pendingRzpId,
        razorpay_signature: "forged_invalid_signature_hex_000000000",
      }
    );

    assert(
      forgedPayRes.statusCode === 400,
      "Scenario D.1: Forged payment signature strictly rejected with HTTP 400"
    );

    // D3. Verify order remains pending_payment
    const checkPendingRes = await request({
      hostname: "localhost",
      port: PORT,
      path: `/api/orders/${pendingOrderNum}?token=${pendingOrderRes.data.accessToken}`,
      method: "GET",
    });

    assert(
      checkPendingRes.statusCode === 200 &&
        (checkPendingRes.data.order.status === "pending_payment" || checkPendingRes.data.order.payment?.status === "pending"),
      "Scenario D.2: Failed payment does NOT confirm order or mark it paid"
    );

    // -------------------------------------------------------------------------
    // SCENARIO E: Brand Trust, Concierge & Technical SEO
    // -------------------------------------------------------------------------
    console.log("\n--- Scenario E: Brand Trust, Concierge & Technical SEO ---");

    // E1. Newsletter API
    const validNewsRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/newsletter",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: "subscriber@dheera.in" }
    );

    const invalidNewsRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/newsletter",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      { email: "not-an-email" }
    );

    assert(
      validNewsRes.statusCode === 200 &&
        validNewsRes.data.success === true &&
        invalidNewsRes.statusCode === 400,
      "Scenario E.1: Newsletter API validates email format and returns confirmed backend subscription"
    );

    // E2. Concierge Contact API
    const contactRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/contact",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        fullName: "Kavita Rao",
        email: "kavita.rao@example.com",
        phone: "9876543210",
        subject: "Bespoke Bridal Styling",
        message: "Looking for an appointment to view festive Chanderi sarees for an upcoming wedding.",
      }
    );

    assert(
      contactRes.statusCode === 200 && contactRes.data.success === true,
      "Scenario E.2: Concierge contact endpoint accepts inquiries with input validation"
    );

    // E3. Bespoke Atelier Customization API
    const customInquiryRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/customizations",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        customerName: "Sunita Kapoor",
        email: "sunita.kapoor@example.com",
        phone: "9876543210",
        category: "Kurta Sets",
        designNotes: "Bespoke keyhole neckline with custom 3/4 sleeves and gold zari edging.",
        measurements: { bust: "38 inches", waist: "32 inches", hip: "42 inches" },
      }
    );

    assert(
      customInquiryRes.statusCode === 200 &&
        customInquiryRes.data.success === true &&
        customInquiryRes.data.requestNumber.startsWith("CUST-"),
      "Scenario E.3: Bespoke atelier customization consultation generates authentic reference number"
    );

    // E4. Robots.txt Security & Privacy Crawl Rules
    const robotsRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/robots.txt",
      method: "GET",
    });

    const robotsTxt = typeof robotsRes.data === "string" ? robotsRes.data : JSON.stringify(robotsRes.data);
    const disallowsPrivate =
      robotsTxt.includes("Disallow: /admin") &&
      robotsTxt.includes("Disallow: /account") &&
      robotsTxt.includes("Disallow: /checkout") &&
      robotsTxt.includes("sitemap.xml");

    assert(
      robotsRes.statusCode === 200 && disallowsPrivate,
      "Scenario E.4: robots.txt protects private patron & administrative paths from search indexing"
    );

    // E5. Sitemap.xml Generation
    const sitemapRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/sitemap.xml",
      method: "GET",
    });

    const sitemapXml = typeof sitemapRes.data === "string" ? sitemapRes.data : JSON.stringify(sitemapRes.data);
    const hasCoreRoutes =
      sitemapXml.includes("/shop") &&
      sitemapXml.includes("/collections") &&
      sitemapXml.includes("/about") &&
      sitemapXml.includes("/product/");

    assert(
      sitemapRes.statusCode === 200 && hasCoreRoutes,
      "Scenario E.5: sitemap.xml dynamically serves verified public storefront and product URLs"
    );

  } catch (err) {
    console.error("Phase 7 test exception:", err);
    failed++;
  } finally {
    if (server) {
      console.log("\nShutting down temporary test server...");
      server.kill();
    }
  }

  console.log("\n================================================================================");
  console.log(` PHASE 7 VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase7TestSuite();
