const { spawn } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\badiw\\.gemini\\antigravity\\brain\\d1418b8c-ddf4-4f21-8d3e-ba52a8e18722";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

function postJson(urlPath, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(
      {
        hostname: "localhost",
        port: 3000,
        path: urlPath,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(data),
        },
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => {
          const cookieHeader = res.headers["set-cookie"];
          try {
            resolve({ statusCode: res.statusCode, headers: res.headers, cookieHeader, body: JSON.parse(body) });
          } catch {
            resolve({ statusCode: res.statusCode, headers: res.headers, cookieHeader, body });
          }
        });
      }
    );
    req.on("error", reject);
    req.write(data);
    req.end();
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

async function captureAdmin() {
  console.log("Logging into Admin Portal...");
  const loginRes = await postJson("/api/admin/auth/login", {
    email: "admin@dheera.in",
    password: "Admin@Dheera2026!",
  });

  if (loginRes.statusCode !== 200 || !loginRes.cookieHeader) {
    console.error("Admin login failed:", loginRes);
    return;
  }

  console.log("Login successful! Extracted cookies:", loginRes.cookieHeader);

  // Extract token from Set-Cookie header
  let adminToken = "";
  for (const c of loginRes.cookieHeader) {
    if (c.includes("dheera_admin_token=")) {
      const match = c.match(/dheera_admin_token=([^;]+)/);
      if (match) adminToken = match[1];
    }
  }

  console.log("Starting Edge for Admin Screenshots...");
  let edgeProcess = spawn(edgePath, [
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
  const cdp = new CDPClient(target.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send("Page.enable");
  await cdp.send("Runtime.enable");
  await cdp.send("Network.enable");

  // Set the admin authentication cookie
  await cdp.send("Network.setCookie", {
    name: "dheera_admin_token",
    value: adminToken,
    domain: "localhost",
    path: "/",
    httpOnly: true,
    secure: false,
    sameSite: "Lax",
  });

  const adminPages = [
    { path: "/admin", name: "admin-dashboard" },
    { path: "/admin/products", name: "admin-products" },
    { path: "/admin/inventory", name: "admin-inventory" },
    { path: "/admin/orders", name: "admin-orders" },
    { path: "/admin/customers", name: "admin-customers" },
    { path: "/admin/customizations", name: "admin-customizations" },
    { path: "/admin/analytics", name: "admin-analytics" },
  ];

  for (const page of adminPages) {
    console.log(`Capturing Admin Page: ${page.path}`);

    // Desktop 1440
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });
    await cdp.send("Page.navigate", { url: `http://localhost:3000${page.path}` });
    await wait(1800);

    const shotDesktop = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    const fnDesktop = `phase8.4-${page.name}-desktop.png`;
    fs.writeFileSync(path.join(ARTIFACT_DIR, fnDesktop), Buffer.from(shotDesktop.data, "base64"));
    console.log(`  Saved: ${fnDesktop}`);

    // Mobile 390
    await cdp.send("Emulation.setDeviceMetricsOverride", {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await wait(600);
    const shotMobile = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
    const fnMobile = `phase8.4-${page.name}-mobile.png`;
    fs.writeFileSync(path.join(ARTIFACT_DIR, fnMobile), Buffer.from(shotMobile.data, "base64"));
    console.log(`  Saved: ${fnMobile}`);
  }

  cdp.close();
  edgeProcess.kill();
  console.log("All admin screenshots captured!");
}

captureAdmin();

