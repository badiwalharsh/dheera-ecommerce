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
  console.log("Starting Next.js production server for Phase 6 screenshots...");
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
    await cdp.send("Network.enable");

    const screenshotsDir = path.join(__dirname, "..", "public", "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      fs.mkdirSync(screenshotsDir, { recursive: true });
    }

    const artifactsDir = "C:\\Users\\badiw\\.gemini\\antigravity\\brain\\d1418b8c-ddf4-4f21-8d3e-ba52a8e18722";

    // Set super admin authentication cookie
    const adminSessionToken = JSON.stringify({
      id: "admin-super",
      email: "admin@dheera.in",
      name: "Radhika Singhania",
      role: "super_admin",
      permissions: ["all"],
    });

    await cdp.send("Network.setCookie", {
      name: "dheera_admin_token",
      value: encodeURIComponent(adminSessionToken),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });

    await cdp.send("Network.setCookie", {
      name: "dheera_admin_session",
      value: encodeURIComponent(adminSessionToken),
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    });

    async function takeScreenshot(fileName, width, height, mobile = false) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 2,
        mobile,
        screenOrientation: { angle: 0, type: "portraitPrimary" },
      });

      await wait(1800);

      const { data } = await cdp.send("Page.captureScreenshot", {
        format: "png",
        captureBeyondViewport: false,
      });

      const buffer = Buffer.from(data, "base64");
      const pubPath = path.join(screenshotsDir, fileName);
      const artPath = path.join(artifactsDir, fileName);

      fs.writeFileSync(pubPath, buffer);
      fs.writeFileSync(artPath, buffer);
      console.log(`Saved screenshot: ${fileName} (${width}x${height})`);
    }

    // 1. Admin Login
    console.log("Navigating to /admin/login...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/login" });
    await wait(1500);
    await takeScreenshot("phase6-admin-login-desktop.png", 1440, 900);
    await takeScreenshot("phase6-admin-login-mobile.png", 390, 844, true);

    // 2. Admin Dashboard Overview
    console.log("Navigating to /admin...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin" });
    await wait(2000);
    await takeScreenshot("phase6-admin-dashboard-desktop.png", 1440, 900);
    await takeScreenshot("phase6-admin-dashboard-mobile.png", 390, 844, true);

    // 3. Products List
    console.log("Navigating to /admin/products...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/products" });
    await wait(2000);
    await takeScreenshot("phase6-admin-products-desktop.png", 1440, 900);
    await takeScreenshot("phase6-admin-products-mobile.png", 390, 844, true);

    // 4. Garment Creation Form
    console.log("Navigating to /admin/products/new...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/products/new" });
    await wait(2000);
    await takeScreenshot("phase6-admin-product-form-desktop.png", 1440, 900);

    // 5. Inventory & Stock Audit
    console.log("Navigating to /admin/inventory...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/inventory" });
    await wait(2000);
    await takeScreenshot("phase6-admin-inventory-desktop.png", 1440, 900);
    await takeScreenshot("phase6-admin-inventory-mobile.png", 390, 844, true);

    // 6. Orders Queue
    console.log("Navigating to /admin/orders...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/orders" });
    await wait(2000);
    await takeScreenshot("phase6-admin-orders-desktop.png", 1440, 900);
    await takeScreenshot("phase6-admin-orders-mobile.png", 390, 844, true);

    // 7. Order Detail
    console.log("Navigating to /admin/orders/DHR-2026-8921...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/orders/DHR-2026-8921" });
    await wait(2000);
    await takeScreenshot("phase6-admin-order-detail-desktop.png", 1440, 900);

    // 8. Customizations (Atelier)
    console.log("Navigating to /admin/customizations...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/customizations" });
    await wait(2000);
    await takeScreenshot("phase6-admin-customizations-desktop.png", 1440, 900);

    // 9. Customers Directory
    console.log("Navigating to /admin/customers...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/customers" });
    await wait(2000);
    await takeScreenshot("phase6-admin-customers-desktop.png", 1440, 900);

    // 10. Analytics & Performance
    console.log("Navigating to /admin/analytics...");
    await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/analytics" });
    await wait(2000);
    await takeScreenshot("phase6-admin-analytics-desktop.png", 1440, 900);

    console.log("\nAll Phase 6 screenshots captured successfully!");
  } catch (err) {
    console.error("Screenshot capture error:", err);
  } finally {
    if (cdp) cdp.close();
    if (edgeProcess) edgeProcess.kill();
    if (server) server.kill();
    try {
      execSync("taskkill /F /IM msedge.exe /T", { stdio: "ignore" });
    } catch {}
  }
}

capture();

