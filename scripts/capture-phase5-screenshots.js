const { spawn, execSync } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pollServer(port = 3000, retries = 35) {
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

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", reject);
  });
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.msgId = 0;
    this.pending = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { resolve, reject } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) reject(new Error(msg.error.message));
          else resolve(msg.result);
        }
      } catch (e) {
        console.error("WS error parsing message:", e);
      }
    };
  }

  send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.msgId;
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) {
      this.ws.close();
    }
  }
}

async function capture() {
  console.log("Starting Next.js production server for Phase 5 screenshots...");
  const server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", "3000"], {
    cwd: path.join(__dirname, ".."),
    stdio: "ignore",
  });

  let edgeProcess = null;
  let cdp = null;

  try {
    await pollServer(3000);
    console.log("Next.js server is ready at http://localhost:3000");

    // Launch Edge in Headless mode with Remote Debugging
    edgeProcess = spawn(edgePath, [
      "--headless",
      "--disable-gpu",
      "--remote-debugging-port=9222",
      "about:blank",
    ]);

    let targets = null;
    for (let i = 0; i < 20; i++) {
      try {
        targets = await fetchJson("http://localhost:9222/json");
        if (targets && targets.length > 0) break;
      } catch {
        await wait(300);
      }
    }

    const target = targets.find((t) => t.type === "page") || targets[0];
    cdp = new CDPClient(target.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    const screenshotsDir = path.join(__dirname, "..", "public", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    async function takeScreenshot(fileName, width, height, mobile = false) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 2,
        mobile,
      });
      await wait(800);
      const res = await cdp.send("Page.captureScreenshot", { format: "png" });
      const buffer = Buffer.from(res.data, "base64");
      const filePath = path.join(screenshotsDir, fileName);
      fs.writeFileSync(filePath, buffer);
      console.log(`✓ Saved ${fileName} (${width}x${height})`);
    }

    // -----------------------------------------------------------------
    // 1. CAPTURE LOGIN PAGE (Desktop & Mobile)
    // -----------------------------------------------------------------
    console.log("Capturing Login View...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/account/login" });
    await wait(1200);
    await takeScreenshot("phase5-login-desktop.png", 1280, 800, false);
    await takeScreenshot("phase5-login-mobile.png", 390, 844, true);

    // -----------------------------------------------------------------
    // 2. CAPTURE REGISTER PAGE (Desktop & Mobile)
    // -----------------------------------------------------------------
    console.log("Capturing Register View...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/account/register" });
    await wait(1200);
    await takeScreenshot("phase5-register-desktop.png", 1280, 800, false);
    await takeScreenshot("phase5-register-mobile.png", 390, 844, true);

    // -----------------------------------------------------------------
    // 3. AUTHENTICATE PATRON IN BROWSER CONTEXT & SEED AN ORDER
    // -----------------------------------------------------------------
    console.log("Authenticating demo patron in browser...");
    await cdp.send("Runtime.evaluate", {
      expression: `
        const patron = {
          id: "00000000-0000-0000-0000-000000000001",
          email: "patron@dheera.in",
          fullName: "Ananya Sharma",
          phone: "9876543210",
          role: "customer",
          createdAt: "2026-01-15T10:00:00.000Z"
        };
        localStorage.setItem("dheera_auth_patron", JSON.stringify(patron));
        document.cookie = "dheera_session_user=" + encodeURIComponent(JSON.stringify({
          id: patron.id,
          email: patron.email,
          name: patron.fullName
        })) + "; path=/";
      `,
    });

    // Create a confirmed order for this user via API
    let createdOrderNumber = "DHR-20261031-1001";
    try {
      const orderRes = await fetch("http://localhost:3000/api/checkout/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
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
            {
              id: "prod-2_Standard_Ruby Red",
              productId: "prod-2",
              productSlug: "ivory-chanderi-saree",
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
            fullName: "Ananya Sharma",
            email: "patron@dheera.in",
            phone: "9876543210",
          },
          shippingAddress: {
            fullName: "Ananya Sharma",
            phone: "9876543210",
            pincode: "560038",
            houseNumber: "Flat 402, Lotus Grandeur",
            street: "Indiranagar",
            city: "Bengaluru",
            state: "Karnataka",
            country: "India",
          },
          userId: "00000000-0000-0000-0000-000000000001",
        }),
      });

      if (orderRes.ok) {
        const orderData = await orderRes.json();
        createdOrderNumber = orderData.orderNumber;

        // Confirm the payment
        await fetch("http://localhost:3000/api/checkout/simulate-test-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderNumber: createdOrderNumber,
            shouldSucceed: true,
          }),
        });
      }
    } catch {
      // Ignore
    }

    // -----------------------------------------------------------------
    // 4. CAPTURE CUSTOMER DASHBOARD OVERVIEW (Desktop & Mobile)
    // -----------------------------------------------------------------
    console.log("Capturing Dashboard Overview...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/account" });
    await wait(1500);
    await takeScreenshot("phase5-dashboard-desktop.png", 1280, 800, false);
    await takeScreenshot("phase5-dashboard-mobile.png", 390, 844, true);

    // -----------------------------------------------------------------
    // 5. CAPTURE ORDER HISTORY (Desktop & Mobile)
    // -----------------------------------------------------------------
    console.log("Capturing Order History View...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/account/orders" });
    await wait(1500);
    await takeScreenshot("phase5-orders-desktop.png", 1280, 800, false);
    await takeScreenshot("phase5-orders-mobile.png", 390, 844, true);

    // -----------------------------------------------------------------
    // 6. CAPTURE ORDER DETAIL & TRACKING TIMELINE (Desktop & Mobile)
    // -----------------------------------------------------------------
    console.log("Capturing Order Detail & Tracking View...");
    await cdp.send("Page.navigate", {
      url: `http://localhost:3000/account/orders/${createdOrderNumber}`,
    });
    await wait(1500);
    await takeScreenshot("phase5-order-detail-desktop.png", 1280, 900, false);
    await takeScreenshot("phase5-order-detail-mobile.png", 390, 950, true);

    // -----------------------------------------------------------------
    // 7. CAPTURE ADDRESS BOOK (Desktop)
    // -----------------------------------------------------------------
    console.log("Capturing Address Book View...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/account/addresses" });
    await wait(1200);
    await takeScreenshot("phase5-addresses-desktop.png", 1280, 800, false);

    // -----------------------------------------------------------------
    // 8. CAPTURE WISHLIST (Desktop)
    // -----------------------------------------------------------------
    console.log("Capturing Wishlist View...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/account/wishlist" });
    await wait(1200);
    await takeScreenshot("phase5-wishlist-desktop.png", 1280, 800, false);

    console.log("\nAll Phase 5 screenshots captured successfully!");
  } catch (err) {
    console.error("Screenshot capture error:", err);
  } finally {
    if (cdp) cdp.close();
    if (edgeProcess) {
      try {
        process.kill(edgeProcess.pid);
      } catch {}
    }
    if (server) {
      try {
        execSync(`taskkill /F /T /PID ${server.pid}`);
      } catch {}
    }
  }
}

capture();
