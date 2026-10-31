const { spawn, execSync } = require("child_process");
const http = require("http");
const path = require("path");
const crypto = require("crypto");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function pollServer(port = 3000, retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (r) => {
      http.get(`http://localhost:${port}`, (res) => {
        if (res.statusCode === 200) resolve();
        else setTimeout(() => check(r - 1), 500);
      }).on("error", () => {
        if (r <= 0) reject(new Error("Server timeout"));
        else setTimeout(() => check(r - 1), 500);
      });
    };
    check(retries);
  });
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on("error", reject);
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
  console.log("Starting Next.js production server for Phase 4 screenshots...");
  const server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", "3000"], {
    cwd: path.join(__dirname, ".."),
    stdio: "ignore",
  });

  let edgeProcess = null;
  let cdp = null;

  try {
    await pollServer(3000);
    console.log("Next.js server is ready at http://localhost:3000");

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

    // 1. Seed cart data in localStorage
    await cdp.send("Page.navigate", { url: "http://localhost:3000/" });
    await wait(1000);

    await cdp.send("Runtime.evaluate", {
      expression: `
        localStorage.setItem("dheera_cart_items", JSON.stringify([
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
            quantity: 1
          },
          {
            id: "prod-2_Free Size_Warm Ivory",
            productId: "prod-2",
            productSlug: "ivory-chanderi-saree",
            name: "Ivory Chanderi Saree",
            sku: "DHR-SAR-002-FS",
            price: 4299,
            image: "/images/products/product-2.jpg",
            size: "Free Size",
            colour: "Warm Ivory",
            quantity: 1
          }
        ]));
        localStorage.setItem("dheera_cart_count", "2");
      `,
    });

    console.log("Cart items seeded in localStorage.");

    // Helper to capture screenshot
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
      require("fs").writeFileSync(filePath, buffer);
      console.log(`✓ Saved ${fileName} (${width}x${height})`);
    }

    // Capture 1: Desktop Cart Page
    await cdp.send("Page.navigate", { url: "http://localhost:3000/cart" });
    await wait(1500);
    await takeScreenshot("desktop-cart.png", 1440, 900, false);

    // Capture 2: Mobile Cart Page
    await takeScreenshot("mobile-cart.png", 375, 812, true);

    // Capture 3: Desktop Checkout Page
    await cdp.send("Page.navigate", { url: "http://localhost:3000/checkout" });
    await wait(1500);
    await takeScreenshot("desktop-checkout.png", 1440, 900, false);

    // Capture 4: Mobile Checkout Page
    await takeScreenshot("mobile-checkout.png", 375, 812, true);

    // Capture 5: Desktop Shopping Bag Drawer (Open)
    await cdp.send("Page.navigate", { url: "http://localhost:3000/shop" });
    await wait(1500);
    // Click shopping bag icon
    await cdp.send("Runtime.evaluate", {
      expression: `
        const bagBtn = document.querySelector('button[aria-label="Open Shopping Bag"]');
        if (bagBtn) bagBtn.click();
      `,
    });
    await wait(800);
    await takeScreenshot("shopping-bag-drawer.png", 1440, 900, false);

    // Capture 6: Mobile Shopping Bag Drawer (Open)
    await takeScreenshot("mobile-shopping-bag-drawer.png", 375, 812, true);

    // Capture 7: Order Confirmation Page
    // First create and confirm an order via API
    const testOrderRes = await new Promise((resolve) => {
      const req = http.request(
        {
          hostname: "localhost",
          port: 3000,
          path: "/api/checkout/create-order",
          method: "POST",
          headers: { "Content-Type": "application/json" },
        },
        (res) => {
          let data = "";
          res.on("data", (c) => (data += c));
          res.on("end", () => resolve(JSON.parse(data)));
        }
      );
      req.write(
        JSON.stringify({
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
            fullName: "Aaradhya Kapoor",
            email: "aaradhya@example.com",
            phone: "9876543210",
          },
          shippingAddress: {
            fullName: "Aaradhya Kapoor",
            phone: "9876543210",
            pincode: "110001",
            houseNumber: "B-42, Gulmohar Enclave",
            street: "South Extension Part II",
            landmark: "Near Arya Samaj Mandir",
            city: "New Delhi",
            state: "Delhi",
            country: "India",
          },
          couponCode: "DHEERA10",
        })
      );
      req.end();
    });

    if (testOrderRes && testOrderRes.orderNumber) {
      // Verify payment
      const secret = "placeholder_secret";
      const paymentId = `pay_test_${Date.now()}`;
      const validSig = crypto
        .createHmac("sha256", secret)
        .update(`${testOrderRes.razorpayOrderId}|${paymentId}`)
        .digest("hex");

      await new Promise((resolve) => {
        const req = http.request(
          {
            hostname: "localhost",
            port: 3000,
            path: "/api/checkout/verify-payment",
            method: "POST",
            headers: { "Content-Type": "application/json" },
          },
          (res) => resolve()
        );
        req.write(
          JSON.stringify({
            orderId: testOrderRes.orderId,
            orderNumber: testOrderRes.orderNumber,
            razorpayOrderId: testOrderRes.razorpayOrderId,
            razorpayPaymentId: paymentId,
            razorpaySignature: validSig,
          })
        );
        req.end();
      });

      // Navigate to order confirmation
      await cdp.send("Page.navigate", {
        url: `http://localhost:3000/order-confirmation/${testOrderRes.orderNumber}`,
      });
      await wait(1800);
      await takeScreenshot("desktop-order-confirmation.png", 1440, 900, false);
      await takeScreenshot("mobile-order-confirmation.png", 375, 812, true);
    }

    console.log("\nAll Phase 4 screenshots successfully generated and saved!");
  } catch (err) {
    console.error("Screenshot capture error:", err);
  } finally {
    if (cdp) cdp.close();
    if (edgeProcess) {
      try {
        execSync(`taskkill /F /T /PID ${edgeProcess.pid}`);
      } catch {}
    }
    if (server) {
      try {
        execSync(`taskkill /F /T /PID ${server.pid}`);
      } catch {}
    }
    process.exit(0);
  }
}

capture();
