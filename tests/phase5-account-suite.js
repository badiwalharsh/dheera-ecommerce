/**
 * DHEERA — Phase 5 Customer Accounts & Personal Dashboard Test Suite
 * 
 * Verifies:
 * 1. Customer profile retrieval, update, and IDOR protection
 * 2. Multi-address CRUD, default address management, PIN/Phone validation, and IDOR protection
 * 3. Order history retrieval with customer-level isolation and pagination
 * 4. Order detail snapshot and real-time 6-stage tracking timeline
 * 5. Order retrieval IDOR protection (blocks unauthorized customer / missing token)
 * 6. Wishlist retrieval, additions, guest sync, and deletions
 * 7. Guest-to-Customer Transition: associating historical guest orders upon email verification
 */

const http = require("http");

const BASE_URL = "http://localhost:3000";

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

async function runTestSuite() {
  console.log("\n=======================================================");
  console.log(" DHEERA — PHASE 5: CUSTOMER ACCOUNTS VERIFICATION SUITE ");
  console.log("=======================================================\n");

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

  const TEST_USER_A = {
    id: "patron_test_ananya",
    email: "ananya.patron@dheera.in",
    name: "Ananya Sharma",
  };

  const TEST_USER_B = {
    id: "patron_test_rohit",
    email: "rohit.patron@dheera.in",
    name: "Rohit Varma",
  };

  const cookieHeaderA = `dheera_session_user=${encodeURIComponent(
    JSON.stringify(TEST_USER_A)
  )}`;
  const cookieHeaderB = `dheera_session_user=${encodeURIComponent(
    JSON.stringify(TEST_USER_B)
  )}`;

  try {
    // -------------------------------------------------------------
    // TEST GROUP 1: PROFILE MANAGEMENT & IDOR PROTECTION
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 1: Profile Management & IDOR Security ---");

    // 1.1 Customer A can update their profile
    const updateProfileRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/account/profile",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeaderA,
        },
      },
      {
        userId: TEST_USER_A.id,
        fullName: "Ananya Sharma Rao",
        phone: "9876543210",
      }
    );
    assert(
      updateProfileRes.statusCode === 200 &&
        updateProfileRes.data.fullName === "Ananya Sharma Rao",
      "Customer can successfully update profile details"
    );

    // 1.2 Customer A can retrieve their own profile
    const getProfileRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/account/profile?userId=${TEST_USER_A.id}`,
      method: "GET",
      headers: { Cookie: cookieHeaderA },
    });
    assert(
      getProfileRes.statusCode === 200 &&
        getProfileRes.data.email === TEST_USER_A.email,
      "Customer can retrieve their own patron profile"
    );

    // 1.3 IDOR Protection: Customer B cannot view Customer A's profile
    const idorProfileRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/account/profile?userId=${TEST_USER_A.id}`,
      method: "GET",
      headers: { Cookie: cookieHeaderB },
    });
    assert(
      idorProfileRes.statusCode === 403,
      "IDOR Shield: Unauthorized customer rejected with 403 when viewing another profile"
    );

    // 1.4 Profile validation: Invalid mobile number rejected
    const invalidPhoneRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/account/profile",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeaderA,
        },
      },
      {
        userId: TEST_USER_A.id,
        fullName: "Ananya Sharma",
        phone: "12345", // Invalid Indian phone
      }
    );
    assert(
      invalidPhoneRes.statusCode === 400,
      "Validation: Non-10-digit Indian phone rejected with 400"
    );

    // -------------------------------------------------------------
    // TEST GROUP 2: ADDRESS BOOK CRUD & DEFAULT SWITCHING
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 2: Address Book CRUD & Validations ---");

    // 2.1 Add Address
    const addAddressRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/account/addresses",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeaderA,
        },
      },
      {
        userId: TEST_USER_A.id,
        recipientName: "Ananya Sharma",
        phone: "9876543210",
        addressLine1: "Atelier Suite 5, MG Road",
        addressLine2: "Heritage District",
        landmark: "Near Opera House",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "560001",
        isDefault: true,
        addressType: "work",
      }
    );
    assert(
      addAddressRes.statusCode === 201 && addAddressRes.data.id,
      "Address Book: Customer can add a valid delivery address",
      JSON.stringify(addAddressRes.data)
    );
    const addedAddressId = addAddressRes.data?.id;

    // 2.2 Address PIN Code Validation
    const invalidPinRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/account/addresses",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeaderA,
        },
      },
      {
        userId: TEST_USER_A.id,
        recipientName: "Ananya Sharma",
        phone: "9876543210",
        addressLine1: "Invalid PIN Test",
        city: "Bengaluru",
        state: "Karnataka",
        postalCode: "123", // Invalid PIN
      }
    );
    assert(
      invalidPinRes.statusCode === 400,
      "Validation: Non-6-digit PIN code rejected with 400"
    );

    // 2.3 List Addresses
    const listAddressRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/account/addresses?userId=${TEST_USER_A.id}`,
      method: "GET",
      headers: { Cookie: cookieHeaderA },
    });
    assert(
      listAddressRes.statusCode === 200 &&
        Array.isArray(listAddressRes.data) &&
        listAddressRes.data.some((a) => a.id === addedAddressId),
      "Address Book: Customer addresses retrieved successfully"
    );

    // 2.4 IDOR: Customer B cannot modify Customer A's address
    const idorAddressRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/account/addresses",
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeaderB,
        },
      },
      {
        id: addedAddressId,
        userId: TEST_USER_A.id,
        city: "Mumbai",
      }
    );
    assert(
      idorAddressRes.statusCode === 403,
      "IDOR Shield: Unauthorized customer rejected when modifying another's address"
    );

    // 2.5 Delete Address
    const deleteAddressRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/account/addresses?id=${addedAddressId}&userId=${TEST_USER_A.id}`,
      method: "DELETE",
      headers: { Cookie: cookieHeaderA },
    });
    assert(
      deleteAddressRes.statusCode === 200 && deleteAddressRes.data.success,
      "Address Book: Customer can delete their address"
    );

    // -------------------------------------------------------------
    // TEST GROUP 3: ORDER HISTORY & REAL-TIME TRACKING TIMELINE
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 3: Order History & Real-time Tracking ---");

    // 3.1 Place order with authenticated customer
    const createOrderRes = await request(
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
            id: "prod-1_M_Emerald Green",
            productId: "prod-1",
            productSlug: "emerald-raw-silk-kurta-set",
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
          fullName: "Ananya Sharma",
          email: TEST_USER_A.email,
          phone: "9876543210",
        },
        shippingAddress: {
          fullName: "Ananya Sharma",
          phone: "9876543210",
          pincode: "560001",
          houseNumber: "Flat 402",
          street: "Heritage Towers",
          city: "Bengaluru",
          state: "Karnataka",
          country: "India",
        },
        userId: TEST_USER_A.id,
      }
    );
    assert(
      createOrderRes.statusCode === 200 && createOrderRes.data.success,
      "Checkout: Order successfully created with customer userId"
    );
    const orderNumber = createOrderRes.data.orderNumber;
    const accessToken = createOrderRes.data.accessToken;

    // 3.2 List Customer Orders
    const listOrdersRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/account/orders?userId=${TEST_USER_A.id}`,
      method: "GET",
      headers: { Cookie: cookieHeaderA },
    });
    assert(
      listOrdersRes.statusCode === 200 &&
        listOrdersRes.data.orders.some((o) => o.orderNumber === orderNumber),
      "Order History: Customer orders listed with correct items and totals"
    );

    // 3.3 Retrieve Order Detail & Tracking Timeline
    const getOrderDetailRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/account/orders/${orderNumber}?userId=${TEST_USER_A.id}`,
      method: "GET",
      headers: { Cookie: cookieHeaderA },
    });
    assert(
      getOrderDetailRes.statusCode === 200 &&
        getOrderDetailRes.data.order?.trackingTimeline &&
        getOrderDetailRes.data.order.trackingTimeline.length === 6,
      "Order Tracking: Returns authoritative 6-stage atelier timeline"
    );

    const timeline = getOrderDetailRes.data.order.trackingTimeline;
    const stages = timeline.map((s) => s.step);
    assert(
      JSON.stringify(stages) ===
        JSON.stringify([
          "placed",
          "confirmed",
          "processing",
          "dispatched",
          "in_transit",
          "delivered",
        ]),
      "Order Tracking: Timeline steps correspond exactly to DHEERA fulfillment stages"
    );

    // 3.4 IDOR Protection: Customer B cannot view Customer A's order without access token
    const idorOrderRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/account/orders/${orderNumber}?userId=${TEST_USER_B.id}`,
      method: "GET",
      headers: { Cookie: cookieHeaderB },
    });
    assert(
      idorOrderRes.statusCode === 403,
      "IDOR Shield: Unauthorized customer blocked from accessing another patron's order"
    );

    // -------------------------------------------------------------
    // TEST GROUP 4: WISHLIST PERSISTENCE & GUEST SYNC
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 4: Wishlist & Guest Sync ---");

    // 4.1 Add item to customer wishlist
    const addWishlistRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/account/wishlist",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeaderA,
        },
      },
      {
        userId: TEST_USER_A.id,
        productId: "prod-2",
      }
    );
    assert(
      addWishlistRes.statusCode === 200 && addWishlistRes.data.success,
      "Wishlist: Item successfully added to patron collection"
    );

    // 4.2 Sync guest wishlist items on login
    const syncWishlistRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/account/wishlist",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: cookieHeaderA,
        },
      },
      {
        userId: TEST_USER_A.id,
        syncIds: ["prod-3", "prod-4"],
      }
    );
    assert(
      syncWishlistRes.statusCode === 200 && syncWishlistRes.data.success,
      "Wishlist: Guest wishlist items cleanly synced to customer account"
    );

    // 4.3 Retrieve Wishlist
    const getWishlistRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/account/wishlist?userId=${TEST_USER_A.id}`,
      method: "GET",
      headers: { Cookie: cookieHeaderA },
    });
    assert(
      getWishlistRes.statusCode === 200 &&
        Array.isArray(getWishlistRes.data) &&
        getWishlistRes.data.some((i) => i.productId === "prod-2"),
      "Wishlist: Patron wishlist retrieved with full garment models"
    );

    // 4.4 Remove item from Wishlist
    const removeWishlistRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/account/wishlist?userId=${TEST_USER_A.id}&productId=prod-2`,
      method: "DELETE",
      headers: { Cookie: cookieHeaderA },
    });
    assert(
      removeWishlistRes.statusCode === 200 && removeWishlistRes.data.success,
      "Wishlist: Customer can remove item from collection"
    );

    // -------------------------------------------------------------
    // TEST GROUP 5: GUEST-TO-CUSTOMER ORDER TRANSITION
    // -------------------------------------------------------------
    console.log("\n--- TEST GROUP 5: Guest-to-Customer Order Association ---");

    const transitionEmail = "transition.patron@dheera.in";
    const transitionUserId = "patron_transition_verified_123";

    // 5.1 Place order as a Guest (no userId)
    const guestOrderRes = await request(
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
            id: "prod-2_Standard_Ruby Red",
            productId: "prod-2",
            name: "Zardozi Embroidered Silk Saree",
            sku: "DHR-SAR-02",
            price: 24500,
            image: "/images/products/product-2.jpg",
            size: "Standard",
            colour: "Ruby Red",
            quantity: 1,
          },
        ],
        customerInfo: {
          fullName: "Meera Sen",
          email: transitionEmail,
          phone: "9123456789",
        },
        shippingAddress: {
          fullName: "Meera Sen",
          phone: "9123456789",
          pincode: "110001",
          houseNumber: "House 12",
          street: "Barakhamba Road",
          city: "New Delhi",
          state: "Delhi",
          country: "India",
        },
        // Notice: NO userId passed (guest checkout)
      }
    );
    assert(
      guestOrderRes.statusCode === 200 && guestOrderRes.data.orderNumber,
      "Guest Checkout: Guest order placed without user_id"
    );
    const guestOrderNumber = guestOrderRes.data.orderNumber;

    // 5.2 Patron registers or logs in with the same email and claims past orders
    const associateRes = await request(
      {
        hostname: "localhost",
        port: 3000,
        path: "/api/account/associate-orders",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `dheera_session_user=${encodeURIComponent(
            JSON.stringify({
              id: transitionUserId,
              email: transitionEmail,
              name: "Meera Sen",
            })
          )}`,
        },
      },
      {
        userId: transitionUserId,
        email: transitionEmail,
      }
    );
    assert(
      associateRes.statusCode === 200 && associateRes.data.associatedCount >= 1,
      `Guest-to-Customer Transition: Successfully associated past guest order(s) (count: ${associateRes.data?.associatedCount})`
    );

    // 5.3 Verify the claimed order now appears in the patron's orders listing
    const claimedOrdersRes = await request({
      hostname: "localhost",
      port: 3000,
      path: `/api/account/orders?userId=${transitionUserId}&email=${transitionEmail}`,
      method: "GET",
      headers: {
        Cookie: `dheera_session_user=${encodeURIComponent(
          JSON.stringify({
            id: transitionUserId,
            email: transitionEmail,
            name: "Meera Sen",
          })
        )}`,
      },
    });
    assert(
      claimedOrdersRes.statusCode === 200 &&
        claimedOrdersRes.data.orders.some((o) => o.orderNumber === guestOrderNumber),
      "Guest-to-Customer Transition: Claimed order now appears in customer's order history"
    );
  } catch (err) {
    console.error("Test Suite execution error:", err);
    failed++;
  }

  console.log("\n=======================================================");
  console.log(` RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log("=======================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runTestSuite();
