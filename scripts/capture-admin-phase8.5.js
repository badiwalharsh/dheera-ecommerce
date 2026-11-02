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

async function capture() {
  console.log("Starting Next.js production server...");
  const server = spawn("cmd.exe", ["/c", "npm.cmd", "run", "start"], {
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
    console.error("Server did not become ready in time.");
    process.exit(1);
  }

  console.log("Server ready! Authenticating admin session...");
  const loginRes = await postJson("/api/admin/auth/login", {
    email: "admin@dheera.in",
    password: "Admin@Dheera2026!",
  });

  let adminToken = "";
  if (loginRes.cookieHeader) {
    for (const c of loginRes.cookieHeader) {
      if (c.includes("dheera_admin_token=")) {
        const match = c.match(/dheera_admin_token=([^;]+)/);
        if (match) adminToken = match[1];
      }
    }
  }

  console.log("Starting headless Edge CDP session...");
  const edgeProcess = spawn(edgePath, [
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
  await cdp.send("Network.enable");

  if (adminToken) {
    await cdp.send("Network.setCookie", {
      name: "dheera_admin_token",
      value: adminToken,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
    });
  }

  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: 1440,
    height: 900,
    deviceScaleFactor: 2,
    mobile: false,
  });

  // 1. Capture Products List
  console.log("Capturing /admin/products...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/products" });
  await wait(2000);
  const shotList = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "phase8.5-admin-products-list.png"), Buffer.from(shotList.data, "base64"));
  console.log("Saved: phase8.5-admin-products-list.png");

  // 2. Open CSV Import Modal
  console.log("Opening CSV Import Modal...");
  await cdp.send("Runtime.evaluate", {
    expression: `(() => {
      const btn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('Import via CSV'));
      if (btn) btn.click();
    })()`,
  });
  await wait(800);
  const shotModal = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "phase8.5-admin-csv-import-modal.png"), Buffer.from(shotModal.data, "base64"));
  console.log("Saved: phase8.5-admin-csv-import-modal.png");

  // 3. Capture Product New Form
  console.log("Capturing /admin/products/new...");
  await cdp.send("Page.navigate", { url: "http://localhost:3000/admin/products/new" });
  await wait(2000);
  const shotNew = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
  fs.writeFileSync(path.join(ARTIFACT_DIR, "phase8.5-admin-product-new-form.png"), Buffer.from(shotNew.data, "base64"));
  console.log("Saved: phase8.5-admin-product-new-form.png");

  cdp.close();
  edgeProcess.kill();

  try {
    const { execSync } = require("child_process");
    execSync(`taskkill /F /T /PID ${server.pid}`);
  } catch {}

  console.log("\nPhase 8.5 screenshots successfully captured!");
}

capture().catch((err) => {
  console.error("Capture script failed:", err);
  process.exit(1);
});

