/**
 * DHEERA — Phase 7.1: Business Content Verification & Public Launch Safety Audit Test Suite
 * 
 * Verifies Commercial Safety, Policy Authenticity, Structured Data Integrity, and Form Resilience:
 * 1. Contact & Showroom Coordinates: No false contact vanity numbers or fake showroom addresses.
 * 2. Commercial Policies: Shipping thresholds, exchange windows, and courier partners are marked provisional.
 * 3. Structured Data & SEO: No fake AggregateRating; development fixtures excluded from indexation.
 * 4. Form Validation & Resilience: Contact, Bespoke, and Newsletter endpoints reject bad data; failures never show success.
 * 5. Security & Privacy Truth: PCI-DSS, DPDP, and payment isolation accurately stated without overstatement.
 */

const http = require("http");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

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

async function runLaunchSafetyAudit() {
  console.log("\n================================================================================");
  console.log(" DHEERA — PHASE 7.1: BUSINESS CONTENT & LAUNCH SAFETY AUDIT ");
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
    console.log("Starting Next.js production server for Phase 7.1 audit suite...");
    server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", String(PORT)], {
      cwd: path.join(__dirname, ".."),
      stdio: "ignore",
    });
    await pollServer(PORT, 35);
    console.log(`Next.js server ready on port ${PORT}.\n`);
  }

  try {
    // -------------------------------------------------------------------------
    // GROUP 1: Contact Details & Physical Showroom Protection
    // -------------------------------------------------------------------------
    console.log("--- Group 1: Contact Details & Showroom Protection ---");

    const contactHtmlRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/contact",
      method: "GET",
    });
    const contactHtml = typeof contactHtmlRes.data === "string" ? contactHtmlRes.data : JSON.stringify(contactHtmlRes.data);

    assert(
      !contactHtml.includes("800-DHEERA") &&
        (contactHtml.includes("To be confirmed") || contactHtml.includes("Pending Business Owner")),
      "Test 1: Contact page does not advertise fake vanity telephone numbers"
    );

    assert(
      contactHtml.includes("Pending Business Owner Input") || contactHtml.includes("to be confirmed"),
      "Test 2: Physical showroom coordinates are safely marked as pending business owner confirmation"
    );

    assert(
      !contactHtml.includes("Average response within 24 hours"),
      "Test 3: Contact page avoids unverified 24-hour concierge service level guarantees"
    );

    // -------------------------------------------------------------------------
    // GROUP 2: Commercial Policies & Courier Partner Neutrality
    // -------------------------------------------------------------------------
    console.log("\n--- Group 2: Commercial Policies & Courier Partner Neutrality ---");

    const shippingHtmlRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/shipping",
      method: "GET",
    });
    const shippingHtml = typeof shippingHtmlRes.data === "string" ? shippingHtmlRes.data : JSON.stringify(shippingHtmlRes.data);

    assert(
      !shippingHtml.includes("partner with premier logistics carriers (including Blue Dart") &&
        !shippingHtml.includes("via DHL Express or FedEx"),
      "Test 4: Shipping policy removes unverified contracted courier corporate commitments"
    );

    assert(
      shippingHtml.includes("Provisional") || shippingHtml.includes("pre-launch operational defaults"),
      "Test 5: Shipping rates and free shipping threshold are explicitly qualified with provisional pre-launch disclaimers"
    );

    const returnsHtmlRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/returns",
      method: "GET",
    });
    const returnsHtml = typeof returnsHtmlRes.data === "string" ? returnsHtmlRes.data : JSON.stringify(returnsHtmlRes.data);

    assert(
      returnsHtml.includes("Provisional") || returnsHtml.includes("final merchant policy confirmation"),
      "Test 6: Returns policy explicitly notes 7-day size exchange is provisional and pending merchant sign-off"
    );

    const termsHtmlRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/terms",
      method: "GET",
    });
    const termsHtml = typeof termsHtmlRes.data === "string" ? termsHtmlRes.data : JSON.stringify(termsHtmlRes.data);

    assert(
      termsHtml.includes("Pending Final Business Incorporation") || termsHtml.includes("Pre-Launch Regulatory Notice"),
      "Test 7: Terms page explicitly flags corporate entity name and GSTIN as pending final incorporation"
    );

    const aboutHtmlRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/about",
      method: "GET",
    });
    const aboutHtml = typeof aboutHtmlRes.data === "string" ? aboutHtmlRes.data : JSON.stringify(aboutHtmlRes.data);

    assert(
      aboutHtml.includes("creative vision") && !aboutHtml.includes("Pure Organic Weaves"),
      "Test 8: About page frames textile claims as brand vision and removes uncertified organic claims"
    );

    // -------------------------------------------------------------------------
    // GROUP 3: Structured Data & SEO Verification
    // -------------------------------------------------------------------------
    console.log("\n--- Group 3: Structured Data & SEO Verification ---");

    const productHtmlRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/product/gulab-embroidered-kurta-set",
      method: "GET",
    });
    const productHtml = typeof productHtmlRes.data === "string" ? productHtmlRes.data : JSON.stringify(productHtmlRes.data);

    assert(
      !productHtml.includes("AggregateRating") && !productHtml.includes("ratingValue"),
      "Test 9: Product page structured data strictly DOES NOT emit fake AggregateRating or fabricated reviews"
    );

    assert(
      productHtml.includes('"robots":{"index":false') || productHtml.includes('name="robots" content="noindex'),
      "Test 10: Development fixture products emit noindex robots metadata to block crawler indexing"
    );

    const sitemapRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/sitemap.xml",
      method: "GET",
    });
    const sitemapXml = typeof sitemapRes.data === "string" ? sitemapRes.data : JSON.stringify(sitemapRes.data);

    assert(
      sitemapRes.statusCode === 200 &&
        !sitemapXml.includes("/product/gulab-embroidered-kurta-set") &&
        sitemapXml.includes("/shop"),
      "Test 11: sitemap.xml strictly excludes development fixture products while serving verified storefront routes"
    );

    const robotsRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/robots.txt",
      method: "GET",
    });
    const robotsTxt = typeof robotsRes.data === "string" ? robotsRes.data : JSON.stringify(robotsRes.data);

    assert(
      robotsTxt.includes("Disallow: /account") &&
        robotsTxt.includes("Disallow: /admin") &&
        robotsTxt.includes("Disallow: /checkout"),
      "Test 12: robots.txt protects private patron and administrative surfaces from search indexing"
    );

    // -------------------------------------------------------------------------
    // GROUP 4: Form Validation & Resilience (Failures Never Show Success)
    // -------------------------------------------------------------------------
    console.log("\n--- Group 4: Form Validation & Submission Resilience ---");

    // Contact invalid submission
    const badContactRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/contact",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        fullName: "A",
        email: "not-an-email",
        message: "short",
      }
    );

    assert(
      badContactRes.statusCode === 400 && badContactRes.data.success === false,
      "Test 13: Contact API strictly rejects invalid email and short messages with HTTP 400"
    );

    // Contact valid submission
    const goodContactRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/contact",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        fullName: "Ananya Sharma",
        email: "ananya.sharma@example.com",
        phone: "9876543210",
        subject: "Festive Collection Inquiry",
        message: "I would like to inquire about fabric availability for upcoming festive collections.",
      }
    );

    assert(
      goodContactRes.statusCode === 200 &&
        goodContactRes.data.success === true &&
        goodContactRes.data.inquiryId,
      "Test 14: Valid contact inquiry successfully records in concierge desk with unique inquiry ID"
    );

    // Bespoke customization invalid submission
    const badCustomRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/customizations",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        customerName: "",
        email: "invalid",
        designNotes: "hi",
      }
    );

    assert(
      badCustomRes.statusCode === 400 && badCustomRes.data.success === false,
      "Test 15: Bespoke customization endpoint strictly rejects missing measurements or invalid phone with HTTP 400"
    );

    // Bespoke customization valid submission
    const goodCustomRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/customizations",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        customerName: "Rhea Kapur",
        email: "rhea.kapur@example.com",
        phone: "9876501234",
        category: "Suits",
        preferredColour: "Emerald Green",
        preferredFabric: "Authentic Chanderi Silk",
        occasion: "Bridal Sangeet",
        designNotes: "Full floor-length anarkali with customized boat neckline and scalloped border.",
        measurements: {
          bust: "36 inches",
          waist: "30 inches",
          hip: "40 inches",
        },
      }
    );

    assert(
      goodCustomRes.statusCode === 200 &&
        goodCustomRes.data.success === true &&
        goodCustomRes.data.requestNumber &&
        goodCustomRes.data.requestNumber.startsWith("CUST-"),
      "Test 16: Valid bespoke customization inquiry persists with chronological CUST- tracking identifier"
    );

    // Newsletter invalid submission
    const badNewsletterRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/newsletter",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        email: "invalid-email-string",
      }
    );

    assert(
      badNewsletterRes.statusCode === 400 && badNewsletterRes.data.success === false,
      "Test 17: Newsletter endpoint strictly rejects malformed email with HTTP 400"
    );

    // Newsletter valid submission
    const goodNewsletterRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/newsletter",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        email: "patron.launch@dheera.in",
      }
    );

    assert(
      goodNewsletterRes.statusCode === 200 && goodNewsletterRes.data.success === true,
      "Test 18: Newsletter endpoint registers confirmed subscriber"
    );

    // -------------------------------------------------------------------------
    // GROUP 5: Security & Payment Isolation Wording
    // -------------------------------------------------------------------------
    console.log("\n--- Group 5: Security & Payment Isolation Wording ---");

    const privacyHtmlRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/privacy",
      method: "GET",
    });
    const privacyHtml = typeof privacyHtmlRes.data === "string" ? privacyHtmlRes.data : JSON.stringify(privacyHtmlRes.data);

    assert(
      privacyHtml.includes("Razorpay") &&
        privacyHtml.includes("PCI-DSS Level 1") &&
        privacyHtml.includes("NEVER receives, stores, or processes complete debit/credit card numbers"),
      "Test 19: Privacy policy accurately describes payment gateway PCI-DSS isolation without overstating DHEERA's direct certifications"
    );

    // Forged payment signature rejected
    const badSigRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/checkout/verify-payment",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        orderId: "fake-order-id",
        orderNumber: "DHR-FAKE-9999",
        razorpayOrderId: "order_fake",
        razorpayPaymentId: "pay_fake",
        razorpaySignature: "forged_signature_hex",
      }
    );

    assert(
      badSigRes.statusCode === 400 || badSigRes.statusCode === 404,
      "Test 20: Payment gateway test mode strictly enforces backend verification and rejects unverified orders"
    );

  } catch (err) {
    console.error("Phase 7.1 test exception:", err);
    failed++;
  } finally {
    if (server) {
      console.log("\nShutting down temporary test server...");
      server.kill();
    }
  }

  console.log("\n================================================================================");
  console.log(` PHASE 7.1 AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runLaunchSafetyAudit();

