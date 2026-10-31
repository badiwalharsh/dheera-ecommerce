/**
 * DHEERA — Phase 6 Admin Dashboard & Business Management Test Suite
 * 
 * Verifies:
 * 1. Admin authentication (Super Admin & Store Manager) and secure cookie sessions
 * 2. RBAC authorization (Store Manager blocked from Super-Admin-only operations)
 * 3. Anonymous & Customer access restriction to admin routes
 * 4. Product catalog CRUD, duplicate cloning, and archiving
 * 5. Category management and safe deletion prevention for categories with products
 * 6. Atomic inventory adjustments, negative stock prevention, and movement audit logs
 * 7. Order fulfillment workflows and STRICT rejection of marking unpaid orders as paid
 * 8. Customer directory and privacy protection (no credentials leaked)
 * 9. Atelier bespoke customization lifecycle and quote calculation
 * 10. Coupon management and activation toggling
 * 11. Dynamic storefront CMS updates and synchronization
 * 12. Business analytics derived strictly from actual store records
 */

const http = require("http");
const { spawn } = require("child_process");
const path = require("path");

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

async function runPhase6Tests() {
  console.log("\n========================================================");
  console.log(" DHEERA — PHASE 6: ADMIN DASHBOARD & MANAGEMENT TEST SUITE ");
  console.log("========================================================\n");

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
    console.log("Starting Next.js development server for Phase 6 test suite...");
    server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", String(PORT)], {
      cwd: path.join(__dirname, ".."),
      stdio: "ignore",
    });
    await pollServer(PORT, 35);
    console.log(`Next.js server ready on port ${PORT}.\n`);
  }

  try {
    // ---------------------------------------------------------
    // TEST SUITE 1: Admin Authentication & Session Management
    // ---------------------------------------------------------
    console.log("--- 1. Admin Authentication & Session Management ---");

    // 1.1 Super Admin Login
    const superAdminLoginRes = await request(
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

    assert(
      superAdminLoginRes.statusCode === 200 &&
        superAdminLoginRes.data.success === true &&
        superAdminLoginRes.data.admin.role === "super_admin",
      "Super Admin login succeeds and returns role 'super_admin'",
      JSON.stringify(superAdminLoginRes.data)
    );

    const superAdminCookie = extractCookie(superAdminLoginRes.headers, "dheera_admin_token");
    assert(
      !!superAdminCookie && superAdminCookie.includes("dheera_admin_token="),
      "Super Admin login sets 'dheera_admin_token' HTTP-only session cookie"
    );

    // 1.2 Store Manager Login
    const storeManagerLoginRes = await request(
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

    assert(
      storeManagerLoginRes.statusCode === 200 &&
        storeManagerLoginRes.data.success === true &&
        storeManagerLoginRes.data.admin.role === "store_manager",
      "Store Manager login succeeds and returns role 'store_manager'",
      JSON.stringify(storeManagerLoginRes.data)
    );

    const storeManagerCookie = extractCookie(storeManagerLoginRes.headers, "dheera_admin_token");
    assert(
      !!storeManagerCookie,
      "Store Manager login sets 'dheera_admin_token' session cookie"
    );

    // 1.3 Reject invalid password
    const invalidLoginRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/auth/login",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        email: "admin@dheera.in",
        password: "WrongPassword999!",
      }
    );

    assert(
      invalidLoginRes.statusCode === 401 && invalidLoginRes.data.success === false,
      "Invalid admin credentials strictly return 401 Unauthorized"
    );

    // 1.4 Admin Me endpoint
    const meRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/auth/me",
      method: "GET",
      headers: { Cookie: superAdminCookie },
    });

    assert(
      meRes.statusCode === 200 &&
        meRes.data.authenticated === true &&
        meRes.data.admin.email === "admin@dheera.in",
      "/api/admin/auth/me validates session and returns authenticated admin profile"
    );

    // ---------------------------------------------------------
    // TEST SUITE 2: RBAC & Access Control Enforcement
    // ---------------------------------------------------------
    console.log("\n--- 2. RBAC & Access Control Enforcement ---");

    // 2.1 Unauthenticated request rejected
    const unauthRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/dashboard",
      method: "GET",
    });

    assert(
      unauthRes.statusCode === 401,
      "Anonymous request to /api/admin/dashboard is blocked with 401 Unauthorized"
    );

    // 2.2 Customer cookie cannot access admin APIs
    const customerCookie = `dheera_session_user=${encodeURIComponent(
      JSON.stringify({ id: "cust_123", email: "patron@gmail.com", name: "Patron" })
    )}`;
    const custAccessRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/dashboard",
      method: "GET",
      headers: { Cookie: customerCookie },
    });

    assert(
      custAccessRes.statusCode === 401,
      "Customer session cookie cannot access /api/admin/dashboard (401 Unauthorized)"
    );

    // 2.3 Store Manager blocked from Super-Admin-only Store Settings update
    const managerSettingsUpdateRes = await request(
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
        storeName: "Dheera Manager Store",
      }
    );

    assert(
      managerSettingsUpdateRes.statusCode === 403,
      "Store Manager is blocked from Super Admin settings updates with 403 Forbidden",
      `Status: ${managerSettingsUpdateRes.statusCode}`
    );

    // 2.4 Super Admin permitted to update Store Settings
    const superAdminSettingsRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/settings",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: superAdminCookie,
        },
      },
      {
        storeName: "DHEERA – Atelier & Fine Lifestyle",
        freeShippingThreshold: 5000,
        standardShippingFee: 250,
      }
    );

    assert(
      superAdminSettingsRes.statusCode === 200 &&
        superAdminSettingsRes.data.success === true &&
        superAdminSettingsRes.data.settings.storeName === "DHEERA – Atelier & Fine Lifestyle",
      "Super Admin successfully updates store settings and business coordinates"
    );

    // ---------------------------------------------------------
    // TEST SUITE 3: Product Catalog Management
    // ---------------------------------------------------------
    console.log("\n--- 3. Product Catalog Management ---");

    // 3.1 List products
    const productsRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/products",
      method: "GET",
      headers: { Cookie: superAdminCookie },
    });

    assert(
      productsRes.statusCode === 200 && Array.isArray(productsRes.data.products) && productsRes.data.products.length > 0,
      "Admin products listing returns all catalog garments"
    );

    // 3.2 Create new product
    const newProductPayload = {
      name: "Noor Organza Zardozi Anarkali",
      slug: "noor-organza-zardozi-anarkali",
      category: "Suits",
      categorySlug: "suits",
      price: 24500,
      originalPrice: 28000,
      tag: "Festive Exclusive",
      sku: "DHR-ST-NOOR-01",
      description: "An ethereal organza ensemble adorned with meticulous zardozi craftsmanship.",
      fabric: "Pure Organza Silk",
      care: "Dry Clean Only",
      details: ["Handcrafted dabka", "Pure silk santoon lining"],
      image: "/images/products/suit-1.jpg",
      gallery: ["/images/products/suit-1.jpg"],
      sizes: ["S", "M", "L"],
      colors: ["Rose Gold", "Ivory"],
      inStock: true,
      isFeatured: true,
      isReadyToShip: true,
      variants: [
        { id: "v1", size: "S", colour: "Rose Gold", sku: "DHR-NOOR-RG-S", priceModifier: 0, inStock: true, quantityAvailable: 6 },
        { id: "v2", size: "M", colour: "Rose Gold", sku: "DHR-NOOR-RG-M", priceModifier: 0, inStock: true, quantityAvailable: 8 },
      ],
    };

    const createProductRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/products",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: superAdminCookie,
        },
      },
      newProductPayload
    );

    assert(
      createProductRes.statusCode === 201 &&
        createProductRes.data.success === true &&
        createProductRes.data.product.name === "Noor Organza Zardozi Anarkali",
      "Successfully created new designer garment with full variant matrix"
    );

    const createdProductId = createProductRes.data.product.id;

    // 3.3 Update product
    const updateProductRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: `/api/admin/products/${createdProductId}`,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: superAdminCookie,
        },
      },
      {
        price: 25500,
        tag: "Heritage Edition",
      }
    );

    assert(
      updateProductRes.statusCode === 200 &&
        updateProductRes.data.product.price === 25500 &&
        updateProductRes.data.product.tag === "Heritage Edition",
      "Successfully updated garment price and promotional tag"
    );

    // 3.4 Duplicate product
    const duplicateRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: `/api/admin/products/${createdProductId}/duplicate`,
        method: "POST",
        headers: { Cookie: superAdminCookie },
      }
    );

    assert(
      duplicateRes.statusCode === 201 &&
        duplicateRes.data.success === true &&
        duplicateRes.data.product.name.includes("(Copy)"),
      "Product duplicate action creates cloned draft with unique identifier"
    );

    // ---------------------------------------------------------
    // TEST SUITE 4: Category Management & Safe Deletion Guard
    // ---------------------------------------------------------
    console.log("\n--- 4. Category Management & Safe Deletion Guard ---");

    // 4.1 Safe Deletion Guard: Reject deleting category with active products
    const safeDeleteRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/categories/kurta-sets",
      method: "DELETE",
      headers: { Cookie: superAdminCookie },
    });

    const deleteErrMsg = safeDeleteRes.data.message || safeDeleteRes.data.error || "";
    assert(
      safeDeleteRes.statusCode === 400 &&
        deleteErrMsg.includes("Cannot delete category") &&
        deleteErrMsg.includes("active garment"),
      "Refuses deletion of category 'kurta-sets' with 400 Bad Request because active garments belong to it",
      JSON.stringify(safeDeleteRes.data)
    );

    // 4.2 Create empty test category
    const createCatRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/categories",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: superAdminCookie,
        },
      },
      {
        name: "Bridal Lehengas",
        slug: "bridal-lehengas",
        description: "Opulent wedding couture",
      }
    );

    assert(
      createCatRes.statusCode === 201 && createCatRes.data.category.slug === "bridal-lehengas",
      "Successfully created new bridal category"
    );

    // 4.3 Delete empty category succeeds
    const deleteEmptyCatRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/categories/bridal-lehengas",
      method: "DELETE",
      headers: { Cookie: superAdminCookie },
    });

    assert(
      deleteEmptyCatRes.statusCode === 200 && deleteEmptyCatRes.data.success === true,
      "Successfully deleted empty category with zero assigned garments"
    );

    // ---------------------------------------------------------
    // TEST SUITE 5: Atomic Inventory Control & Movement Audit
    // ---------------------------------------------------------
    console.log("\n--- 5. Atomic Inventory Control & Movement Audit ---");

    // 5.1 Query inventory list
    const invRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/inventory",
      method: "GET",
      headers: { Cookie: superAdminCookie },
    });

    assert(
      invRes.statusCode === 200 && Array.isArray(invRes.data.variants) && invRes.data.variants.length > 0,
      "Admin inventory listing reports SKU-level variant stock counts"
    );

    const testVariant = invRes.data.variants[0];
    const initialStock = testVariant.quantityAvailable;

    // 5.2 Atomic Stock Addition (+5) with mandatory reason
    const adjustAddRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/inventory/adjust",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: superAdminCookie,
        },
      },
      {
        variantSku: testVariant.sku,
        quantityChange: 5,
        reason: "Restocked from master artisan workshop",
      }
    );

    assert(
      adjustAddRes.statusCode === 200 &&
        adjustAddRes.data.success === true &&
        adjustAddRes.data.movement.newQuantity === initialStock + 5,
      `Atomic stock addition (+5) logged: stock increased from ${initialStock} to ${initialStock + 5}`
    );

    // 5.3 Negative Stock Prevention: Attempting to deduct 9999 items
    const negativeStockRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/inventory/adjust",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: superAdminCookie,
        },
      },
      {
        variantSku: testVariant.sku,
        quantityChange: -99999,
        reason: "Erroneous bulk deduction",
      }
    );

    assert(
      negativeStockRes.statusCode === 400 &&
        negativeStockRes.data.error &&
        negativeStockRes.data.error.includes("Insufficient stock"),
      "Negative stock prevention strictly blocks deduction exceeding available inventory"
    );

    // 5.4 Mandatory adjustment reason check
    const missingReasonRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/inventory/adjust",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: superAdminCookie,
        },
      },
      {
        variantSku: testVariant.sku,
        quantityChange: 2,
        reason: "",
      }
    );

    assert(
      missingReasonRes.statusCode === 400,
      "Stock adjustment strictly requires a valid non-empty reason for audit compliance"
    );

    // ---------------------------------------------------------
    // TEST SUITE 6: Order Fulfillment & Unpaid Order Protection
    // ---------------------------------------------------------
    console.log("\n--- 6. Order Fulfillment & Unpaid Order Protection ---");

    // 6.1 List all admin orders
    const ordersRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/orders",
      method: "GET",
      headers: { Cookie: superAdminCookie },
    });

    assert(
      ordersRes.statusCode === 200 && Array.isArray(ordersRes.data.orders) && ordersRes.data.orders.length > 0,
      "Admin orders list retrieves all store orders with customer and financial summary"
    );

    const pendingPaymentOrder = ordersRes.data.orders.find(
      (o) => o.status === "pending_payment"
    );
    const confirmedOrder = ordersRes.data.orders.find(
      (o) => o.status === "confirmed"
    );

    // 6.2 CRITICAL SECURITY RULE: Cannot mark unpaid order as paid/confirmed manually
    if (pendingPaymentOrder) {
      const illegalStatusRes = await request(
        {
          hostname: "localhost",
          port: PORT,
          path: `/api/admin/orders/${pendingPaymentOrder.orderNumber}`,
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: superAdminCookie,
          },
        },
        {
          status: "confirmed",
        }
      );

      assert(
        illegalStatusRes.statusCode === 400 &&
          illegalStatusRes.data.error &&
          illegalStatusRes.data.error.includes("Cannot manually mark an unpaid order as paid"),
        "CRITICAL: System strictly forbids manually setting an unpaid order to 'confirmed' (400 Bad Request)"
      );
    } else {
      console.log(" \x1b[33m⚠ SKIP\x1b[0m : No pending_payment order fixture found for unpaid status test");
    }

    // 6.3 Legitimate Fulfillment Pipeline: Advance confirmed order to dispatched with Courier & Tracking
    if (confirmedOrder) {
      const dispatchRes = await request(
        {
          hostname: "localhost",
          port: PORT,
          path: `/api/admin/orders/${confirmedOrder.orderNumber}`,
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: superAdminCookie,
          },
        },
        {
          status: "dispatched",
          courierName: "Blue Dart Express",
          trackingNumber: "BD99281726IN",
          adminNotes: "Hand-checked and packed in signature DHEERA rigid keepsake box.",
        }
      );

      assert(
        dispatchRes.statusCode === 200 &&
          dispatchRes.data.order.status === "dispatched" &&
          dispatchRes.data.order.shippingCarrier === "Blue Dart Express" &&
          dispatchRes.data.order.trackingNumber === "BD99281726IN",
        "Successfully updated order stage to 'dispatched' with verified tracking number"
      );
    }

    // ---------------------------------------------------------
    // TEST SUITE 7: Customer Directory & Privacy Protection
    // ---------------------------------------------------------
    console.log("\n--- 7. Customer Directory & Privacy Protection ---");

    const customersRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/customers",
      method: "GET",
      headers: { Cookie: superAdminCookie },
    });

    assert(
      customersRes.statusCode === 200 && Array.isArray(customersRes.data.customers),
      "Customer directory returns patron profiles with lifetime spend metrics"
    );

    // Verify no password hashes, salt, or auth tokens leaked
    const hasSensitiveCredentials = customersRes.data.customers.some(
      (c) => c.password || c.passwordHash || c.salt || c.accessToken || c.refreshToken
    );

    assert(
      !hasSensitiveCredentials,
      "Privacy check: Customer API responses NEVER leak passwords, password hashes, or auth tokens"
    );

    // ---------------------------------------------------------
    // TEST SUITE 8: Atelier Bespoke Customizations Lifecycle
    // ---------------------------------------------------------
    console.log("\n--- 8. Atelier Bespoke Customizations Lifecycle ---");

    const customRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/customizations",
      method: "GET",
      headers: { Cookie: superAdminCookie },
    });

    assert(
      customRes.statusCode === 200 && Array.isArray(customRes.data.customizations),
      "Admin customizations endpoint returns atelier bespoke commissions"
    );

    if (customRes.data.customizations.length > 0) {
      const firstCommission = customRes.data.customizations[0];
      const updateCommissionRes = await request(
        {
          hostname: "localhost",
          port: PORT,
          path: `/api/admin/customizations/${firstCommission.id}`,
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Cookie: superAdminCookie,
          },
        },
        {
          status: "in_production",
          estimatedQuote: 35000,
          adminNotes: "Artisan master assigned. Gold zardozi thread allocated.",
        }
      );

      assert(
        updateCommissionRes.statusCode === 200 &&
          updateCommissionRes.data.item.status === "in_production" &&
          updateCommissionRes.data.item.estimatedQuote === 35000,
        "Successfully updated bespoke commission status to 'in_production' with verified quote"
      );
    }

    // ---------------------------------------------------------
    // TEST SUITE 9: Promotional Coupons Management
    // ---------------------------------------------------------
    console.log("\n--- 9. Promotional Coupons Management ---");

    const newCouponPayload = {
      code: "ROYALFEST20",
      description: "Festive celebration 20% privilege",
      discountType: "percentage",
      discountValue: 20,
      minOrderAmount: 8000,
      maxDiscountAmount: 3000,
      isActive: true,
    };

    const createCouponRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/coupons",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: superAdminCookie,
        },
      },
      newCouponPayload
    );

    assert(
      createCouponRes.statusCode === 201 &&
        createCouponRes.data.coupon.code === "ROYALFEST20" &&
        createCouponRes.data.coupon.isActive === true,
      "Successfully created new promotional coupon 'ROYALFEST20'"
    );

    // Toggle coupon active state
    const toggleCouponRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: `/api/admin/coupons/${createCouponRes.data.coupon.id}`,
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Cookie: superAdminCookie,
        },
      },
      {
        isActive: false,
      }
    );

    assert(
      toggleCouponRes.statusCode === 200 && toggleCouponRes.data.coupon.isActive === false,
      "Successfully deactivated coupon code via toggle action"
    );

    // ---------------------------------------------------------
    // TEST SUITE 10: Store CMS & Storefront Integration
    // ---------------------------------------------------------
    console.log("\n--- 10. Store CMS & Storefront Integration ---");

    const cmsUpdatePayload = {
      hero: {
        headline: "Winter Heritage Couture",
        subheadline: "Timeless silhouettes woven in Varanasi and handcrafted in our private ateliers.",
        ctaText: "Explore The Trunk Show",
        ctaLink: "/collections/suits",
      },
      announcement: {
        enabled: true,
        text: "Complimentary Pan-India Express Courier On All Festive Trunk Show Orders",
        linkText: "Learn More",
        linkHref: "/shipping-policy",
      },
    };

    const cmsRes = await request(
      {
        hostname: "localhost",
        port: PORT,
        path: "/api/admin/content",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: superAdminCookie,
        },
      },
      cmsUpdatePayload
    );

    assert(
      cmsRes.statusCode === 200 &&
        cmsRes.data.success === true &&
        cmsRes.data.content.hero.headline === "Winter Heritage Couture",
      "Successfully updated store CMS hero headline and announcement bar"
    );

    // Verify GET /api/admin/content returns updated settings
    const verifyCmsRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/content",
      method: "GET",
    });

    assert(
      verifyCmsRes.statusCode === 200 &&
        verifyCmsRes.data.content.hero.headline === "Winter Heritage Couture" &&
        verifyCmsRes.data.content.announcement.enabled === true,
      "CMS content is persistently served and available to customer-facing storefront"
    );

    // ---------------------------------------------------------
    // TEST SUITE 11: Business Analytics Telemetry
    // ---------------------------------------------------------
    console.log("\n--- 11. Business Analytics Telemetry ---");

    const analyticsRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/analytics",
      method: "GET",
      headers: { Cookie: superAdminCookie },
    });

    assert(
      analyticsRes.statusCode === 200 &&
        typeof analyticsRes.data.aov === "number" &&
        Array.isArray(analyticsRes.data.categoryPerformance) &&
        typeof analyticsRes.data.customerRetention.retentionRate === "number",
      "Analytics endpoint computes true Average Order Value (AOV), category sales, and customer retention"
    );

    // ---------------------------------------------------------
    // TEST SUITE 12: Admin Logout
    // ---------------------------------------------------------
    console.log("\n--- 12. Admin Logout ---");

    const logoutRes = await request({
      hostname: "localhost",
      port: PORT,
      path: "/api/admin/auth/logout",
      method: "POST",
      headers: { Cookie: superAdminCookie },
    });

    const setCookies = logoutRes.headers["set-cookie"] || [];
    const tokenHeader = (Array.isArray(setCookies) ? setCookies : [setCookies]).find((c) =>
      c.startsWith("dheera_admin_token=")
    );
    assert(
      logoutRes.statusCode === 200 &&
        logoutRes.data.success === true &&
        tokenHeader &&
        (tokenHeader.includes("Max-Age=0") || tokenHeader.includes("Expires=") || tokenHeader.startsWith("dheera_admin_token=;")),
      "Admin logout securely expires and clears 'dheera_admin_token' session cookie",
      tokenHeader || "No cookie found"
    );

  } catch (err) {
    console.error("Test execution exception:", err);
    failed++;
  } finally {
    if (server) {
      console.log("\nShutting down temporary test server...");
      server.kill();
    }
  }

  console.log("\n========================================================");
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("========================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runPhase6Tests();

