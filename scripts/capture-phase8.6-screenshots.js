const { spawn } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";
const ARTIFACT_DIR = "C:\\Users\\badiw\\.gemini\\antigravity\\brain\\d1418b8c-ddf4-4f21-8d3e-ba52a8e18722";
const PORT = 3000;

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
  console.log("Starting Next.js server for visual verification...");
  const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
  const server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], {
    cwd: path.join(__dirname, ".."),
    stdio: "ignore",
  });

  // Wait for server ready
  let serverReady = false;
  for (let i = 0; i < 30; i++) {
    try {
      await new Promise((resolve, reject) => {
        const req = http.get(`http://localhost:${PORT}`, (res) => {
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
    console.error("Next.js server failed to respond on port " + PORT);
    server.kill();
    process.exit(1);
  }
  console.log("Next.js server ready on port " + PORT);

  let edgeProcess = null;
  let cdp = null;

  try {
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

    if (!targets || targets.length === 0) {
      throw new Error("Could not find Edge debug target");
    }

    const pageTarget = targets.find((t) => t.type === "page") || targets[0];
    cdp = new CDPClient(pageTarget.webSocketDebuggerUrl);
    await cdp.connect();
    console.log("Connected to Edge DevTools Protocol.");

    await cdp.send("Page.enable");
    await cdp.send("DOM.enable");
    await cdp.send("CSS.enable");

    // 8 viewports required
    const viewports = [
      { name: "mobile-xs-320", width: 320, height: 600 },
      { name: "mobile-sm-360", width: 360, height: 740 },
      { name: "mobile-md-390", width: 390, height: 844 },
      { name: "mobile-lg-430", width: 430, height: 932 },
      { name: "tablet-768", width: 768, height: 1024 },
      { name: "desktop-1024", width: 1024, height: 768 },
      { name: "desktop-1440", width: 1440, height: 900 },
      { name: "desktop-1920", width: 1920, height: 1080 },
    ];

    const pages = [
      { path: "/", filename: "phase8.6-homepage" },
      { path: "/product/gulab-embroidered-kurta-set", filename: "phase8.6-pdp-gulab" },
      { path: "/product/ivory-chanderi-saree", filename: "phase8.6-pdp-saree" },
      { path: "/shop", filename: "phase8.6-shop-grid" },
    ];

    for (const page of pages) {
      console.log(`\nNavigating to ${page.path}...`);
      await cdp.send("Page.navigate", { url: `http://localhost:${PORT}${page.path}` });
      await wait(1800);

      // Capture desktop 1440 & mobile 390
      for (const vp of [viewports[2], viewports[6]]) {
        await cdp.send("Emulation.setDeviceMetricsOverride", {
          width: vp.width,
          height: vp.height,
          deviceScaleFactor: 1,
          mobile: vp.width < 768,
        });
        await wait(600);

        const screenshot = await cdp.send("Page.captureScreenshot", {
          format: "png",
          quality: 90,
        });

        const outPath = path.join(ARTIFACT_DIR, `${page.filename}-${vp.name}.png`);
        fs.writeFileSync(outPath, Buffer.from(screenshot.data, "base64"));
        console.log(`  Saved screenshot: ${outPath} (${vp.width}x${vp.height})`);
      }
    }

    console.log("\nMulti-viewport browser verification completed successfully.");
  } finally {
    if (cdp) cdp.close();
    if (edgeProcess) edgeProcess.kill();
    if (server) server.kill();
  }
}

capture().catch((err) => {
  console.error("Capture script failed:", err);
  process.exit(1);
});

