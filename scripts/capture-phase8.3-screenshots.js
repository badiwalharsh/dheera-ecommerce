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
  console.log("Connecting to Edge Headless for Phase 8.3 visual QA screenshots...");
  let edgeProcess = null;
  let cdp = null;

  try {
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

    if (!targets || targets.length === 0) {
      throw new Error("Could not find Edge DevTools targets");
    }

    const target = targets.find((t) => t.type === "page") || targets[0];
    cdp = new CDPClient(target.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    async function takeScreenshot(url, width, height, filename) {
      console.log(`Capturing: ${url} at ${width}x${height} -> ${filename}`);
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 2,
        mobile: width < 768,
      });

      await cdp.send("Page.navigate", { url });
      await wait(2500);

      const screenshot = await cdp.send("Page.captureScreenshot", {
        format: "png",
        fromSurface: true,
      });

      const buffer = Buffer.from(screenshot.data, "base64");
      const artifactPath = path.join(ARTIFACT_DIR, filename);
      fs.writeFileSync(artifactPath, buffer);
      console.log(`Saved screenshot: ${artifactPath} (${buffer.length} bytes)`);
    }

    // 1. Desktop Views (1440x900)
    await takeScreenshot("http://localhost:3000/", 1440, 900, "phase8.3-desktop-homepage.png");
    await takeScreenshot("http://localhost:3000/shop", 1440, 900, "phase8.3-desktop-shop.png");
    await takeScreenshot("http://localhost:3000/product/gulab-embroidered-kurta-set", 1440, 900, "phase8.3-desktop-pdp.png");

    // 2. Mobile Viewports
    await takeScreenshot("http://localhost:3000/", 320, 640, "phase8.3-mobile-320px.png");
    await takeScreenshot("http://localhost:3000/shop", 360, 740, "phase8.3-mobile-360px.png");
    await takeScreenshot("http://localhost:3000/product/gulab-embroidered-kurta-set", 375, 812, "phase8.3-mobile-375px.png");
    await takeScreenshot("http://localhost:3000/", 390, 844, "phase8.3-mobile-390px.png");
    await takeScreenshot("http://localhost:3000/product/ivory-chanderi-saree", 430, 932, "phase8.3-mobile-430px.png");

    // 3. Tablet Viewport
    await takeScreenshot("http://localhost:3000/product/emerald-anarkali-set", 768, 1024, "phase8.3-tablet-768px.png");

    console.log("\nAll Phase 8.3 visual QA screenshots captured successfully!");
  } catch (err) {
    console.error("Screenshot capture failed:", err);
  } finally {
    if (cdp) cdp.close();
    if (edgeProcess) {
      edgeProcess.kill();
    }
  }
}

capture();
