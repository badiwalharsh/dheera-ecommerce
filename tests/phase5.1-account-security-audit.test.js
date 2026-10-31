/**
 * DHEERA — Phase 5.1 Customer Account Security Hardening Audit Suite
 *
 * Verifies 8 Critical Adversarial Scenarios:
 * 1. Claiming another customer's guest order (Rejected with 403)
 * 2. Passing a different user ID to the SQL function / API (Rejected with 403)
 * 3. Passing an unverified email to claim guest orders (Rejected with 403)
 * 4. Executing guest order association as an anonymous user (Rejected with 401)
 * 5. Reading or modifying another customer's wishlist (Rejected with 401/403)
 * 6. Modifying another customer's address (Rejected with 403/404)
 * 7. Modifying an order status from the browser / client request (Rejected with 405/400)
 * 8. Accessing another customer's order details without token or ownership (Rejected with 401/403)
 */

const http = require("http");
const { spawn, execSync } = require("child_process");
const path = require("path");

const BASE_HOST = "localhost";
const BASE_PORT = 3000;

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

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pollServer(port = 3000, retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (r) => {
      http
        .get(`http://localhost:${port}/account/login`, (res) => {
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

async function runSecurityAudit() {
  console.log("\n================================================================================");
  console.log(" DHEERA — PHASE 5.1: CUSTOMER ACCOUNT SECURITY HARDENING AUDIT ");
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

  try {
    // 1. Check if server already running or start one
    let serverRunning = false;
    try {
      await pollServer(BASE_PORT, 2);
      serverRunning = true;
    } catch {
      serverRunning = false;
    }

    if (!serverRunning) {
      console.log("Starting Next.js production server for security audit...");
      server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", "3000"], {
        cwd: path.join(__dirname, ".."),
        stdio: "ignore",
      });
      await pollServer(BASE_PORT, 30);
      console.log("Next.js server ready at http://localhost:3000\n");
    }

    // Define actors
    const PATRON_VICTIM = {
      id: "patron_victim_sec51",
      email: "victim.patron@dheera.in",
      name: "Radhika Sen",
      isEmailVerified: true,
    };

    const PATRON_ATTACKER = {
      id: "patron_attacker_sec51",
      email: "attacker.adversary@dheera.in",
      name: "Adversary X",
      isEmailVerified: true,
    };

    const PATRON_UNVERIFIED = {
      id: "patron_unverified_sec51",
      email: "unverified.user@dheera.in",
      name: "Unverified User",
      isEmailVerified: false,
    };

    const cookieVictim = `dheera_session_user=${encodeURIComponent(JSON.stringify(PATRON_VICTIM))}`;
    const cookieAttacker = `dheera_session_user=${encodeURIComponent(JSON.stringify(PATRON_ATTACKER))}`;
    const cookieUnverified = `dheera_session_user=${encodeURIComponent(JSON.stringify(PATRON_UNVERIFIED))}`;

    // Seed a guest order belonging to the victim's email
    const guestOrderRes = await request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: "/api/checkout/create-order",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        items: [
          {
            id: "prod-1_M_Emerald Green",
            productId: "prod-1",
            name: "Emerald Raw Silk Kurta Set",
            sku: "DHR-EMR-01",
            price: 18500,
            image: "/images/products/product-1.jpg",
            size: "M",
            colour: "Emerald Green",
            quantity: 1,
          },
        ],
        customerInfo: {
          fullName: "Radhika Sen",
          email: PATRON_VICTIM.email,
          phone: "9876543210",
        },
        shippingAddress: {
          fullName: "Radhika Sen",
          phone: "9876543210",
          pincode: "560038",
          houseNumber: "House 10",
          street: "Indiranagar",
          city: "Bengaluru",
          state: "Karnataka",
          country: "India",
        },
      }
    );
    const victimOrderNumber = guestOrderRes.data?.orderNumber;

    // -------------------------------------------------------------------------
    // SCENARIO 1: Claiming another customer's guest order
    // -------------------------------------------------------------------------
    console.log("--- Adversarial Scenario 1: Claiming another customer's guest order ---");
    const claimOtherEmailRes = await request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: "/api/account/associate-orders",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieAttacker,
        },
      },
      {
        email: PATRON_VICTIM.email,
      }
    );
    assert(
      claimOtherEmailRes.statusCode === 403,
      "Scenario 1: Attacker attempting to claim victim's guest orders is strictly rejected with 403",
      `Status: ${claimOtherEmailRes.statusCode}, Body: ${JSON.stringify(claimOtherEmailRes.data)}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 2: Passing a different user ID to the SQL function / API
    // -------------------------------------------------------------------------
    console.log("\n--- Adversarial Scenario 2: Passing a different user ID ---");
    const claimDifferentIdRes = await request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: "/api/account/associate-orders",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieAttacker,
        },
      },
      {
        userId: PATRON_VICTIM.id,
        email: PATRON_ATTACKER.email,
      }
    );
    assert(
      claimDifferentIdRes.statusCode === 403,
      "Scenario 2: Supplying a forged client user ID is strictly rejected with 403",
      `Status: ${claimDifferentIdRes.statusCode}, Body: ${JSON.stringify(claimDifferentIdRes.data)}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 3: Passing an unverified email to claim guest orders
    // -------------------------------------------------------------------------
    console.log("\n--- Adversarial Scenario 3: Unverified email protection ---");
    const unverifiedClaimRes = await request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: "/api/account/associate-orders",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieUnverified,
        },
      },
      {
        userId: PATRON_UNVERIFIED.id,
        email: PATRON_UNVERIFIED.email,
      }
    );
    assert(
      unverifiedClaimRes.statusCode === 403,
      "Scenario 3: Unconfirmed patron account cannot claim orders (rejected with 403)",
      `Status: ${unverifiedClaimRes.statusCode}, Body: ${JSON.stringify(unverifiedClaimRes.data)}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 4: Anonymous user executing guest order association
    // -------------------------------------------------------------------------
    console.log("\n--- Adversarial Scenario 4: Anonymous user execution ---");
    const anonClaimRes = await request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: "/api/account/associate-orders",
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
      {
        userId: "random_id",
        email: "random@dheera.in",
      }
    );
    assert(
      anonClaimRes.statusCode === 401,
      "Scenario 4: Anonymous execution is blocked with 401 Unauthorized",
      `Status: ${anonClaimRes.statusCode}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 5: Reading or modifying another customer's wishlist
    // -------------------------------------------------------------------------
    console.log("\n--- Adversarial Scenario 5: Wishlist Cross-Customer Isolation ---");
    // Victim adds item
    await request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: "/api/account/wishlist",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookieVictim },
      },
      { userId: PATRON_VICTIM.id, productId: "prod-3" }
    );

    // Attacker tries to read victim's wishlist
    const attackerReadWishlistRes = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/account/wishlist?userId=${PATRON_VICTIM.id}`,
      method: "GET",
      headers: { Cookie: cookieAttacker },
    });
    assert(
      attackerReadWishlistRes.statusCode === 403,
      "Scenario 5a: Cross-patron wishlist reading rejected with 403 Forbidden",
      `Status: ${attackerReadWishlistRes.statusCode}`
    );

    // Anonymous tries to read victim's wishlist
    const anonReadWishlistRes = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/account/wishlist?userId=${PATRON_VICTIM.id}`,
      method: "GET",
    });
    assert(
      anonReadWishlistRes.statusCode === 401,
      "Scenario 5b: Anonymous wishlist reading rejected with 401 Unauthorized",
      `Status: ${anonReadWishlistRes.statusCode}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 6: Modifying another customer's address
    // -------------------------------------------------------------------------
    console.log("\n--- Adversarial Scenario 6: Address Book IDOR Protection ---");
    // Victim creates address
    const victimAddAddressRes = await request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: "/api/account/addresses",
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: cookieVictim },
      },
      {
        userId: PATRON_VICTIM.id,
        recipientName: "Radhika Sen",
        phone: "9876543210",
        addressLine1: "Victim Palace",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560038",
      }
    );
    const victimAddressId = victimAddAddressRes.data?.id;

    // Attacker tries to modify victim's address
    const attackerModAddressRes = await request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: "/api/account/addresses",
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: cookieAttacker },
      },
      {
        id: victimAddressId,
        userId: PATRON_VICTIM.id,
        recipientName: "Hacked by Attacker",
      }
    );
    assert(
      attackerModAddressRes.statusCode === 403,
      "Scenario 6: Cross-patron address modification rejected with 403 Forbidden",
      `Status: ${attackerModAddressRes.statusCode}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 7: Modifying order status from browser / client request
    // -------------------------------------------------------------------------
    console.log("\n--- Adversarial Scenario 7: Order Status Immutability ---");
    // Attacker tries to directly PATCH order status
    const patchOrderStatusRes = await request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: `/api/account/orders/${victimOrderNumber}`,
        method: "PATCH",
        headers: { "Content-Type": "application/json", Cookie: cookieAttacker },
      },
      { status: "delivered" }
    );
    assert(
      patchOrderStatusRes.statusCode === 405 || patchOrderStatusRes.statusCode === 404,
      "Scenario 7a: Direct client status modification endpoint does not exist (HTTP 405/404)",
      `Status: ${patchOrderStatusRes.statusCode}`
    );

    // Attacker tries to PUT order status
    const putOrderStatusRes = await request(
      {
        hostname: BASE_HOST,
        port: BASE_PORT,
        path: `/api/orders/${victimOrderNumber}`,
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      },
      { status: "confirmed" }
    );
    assert(
      putOrderStatusRes.statusCode === 405 || putOrderStatusRes.statusCode === 404,
      "Scenario 7b: Order store mutation via PUT strictly rejected (HTTP 405/404)",
      `Status: ${putOrderStatusRes.statusCode}`
    );

    // -------------------------------------------------------------------------
    // SCENARIO 8: Accessing another customer's order details without token
    // -------------------------------------------------------------------------
    console.log("\n--- Adversarial Scenario 8: Order Details Direct Object Reference (IDOR) ---");
    // Attacker attempts to read victim's order details without access token
    const attackerReadOrderRes = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/account/orders/${victimOrderNumber}`,
      method: "GET",
      headers: { Cookie: cookieAttacker },
    });
    assert(
      attackerReadOrderRes.statusCode === 403 || attackerReadOrderRes.statusCode === 404,
      "Scenario 8a: Attacker accessing victim order details without token blocked (HTTP 403/404)",
      `Status: ${attackerReadOrderRes.statusCode}`
    );

    // Anonymous attempts to read order details without token
    const anonReadOrderRes = await request({
      hostname: BASE_HOST,
      port: BASE_PORT,
      path: `/api/account/orders/${victimOrderNumber}`,
      method: "GET",
    });
    assert(
      anonReadOrderRes.statusCode === 401 || anonReadOrderRes.statusCode === 403,
      "Scenario 8b: Anonymous access to customer order without token blocked (HTTP 401/403)",
      `Status: ${anonReadOrderRes.statusCode}`
    );

  } catch (err) {
    console.error("Security Audit error:", err);
    failed++;
  } finally {
    if (server) {
      try {
        execSync(`taskkill /F /T /PID ${server.pid}`);
      } catch {}
    }
  }

  console.log("\n================================================================================");
  console.log(` SECURITY AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityAudit();
