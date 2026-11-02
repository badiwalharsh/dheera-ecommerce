const { spawn } = require("child_process");
const http = require("http");
const path = require("path");
const fs = require("fs");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

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
        console.error("WS error:", e);
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
    if (this.ws) this.ws.close();
  }
}

async function measure() {
  console.log("Measuring real browser Web Vitals & performance metrics...");
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
  await cdp.send("Performance.enable");

  const routes = [
    { name: "Homepage", url: "http://localhost:3000/" },
    { name: "Shop", url: "http://localhost:3000/shop" },
    { name: "Product Detail", url: "http://localhost:3000/product/gulab-embroidered-kurta-set" },
    { name: "Cart", url: "http://localhost:3000/cart" },
  ];

  const results = [];

  for (const r of routes) {
    await cdp.send("Page.navigate", { url: r.url });
    await wait(2000);

    const perfMetrics = await cdp.send("Performance.getMetrics");
    const m = {};
    for (const metric of perfMetrics.metrics) {
      m[metric.name] = metric.value;
    }

    const evalRes = await cdp.send("Runtime.evaluate", {
      expression: `(() => {
        const nav = performance.getEntriesByType('navigation')[0];
        const paint = performance.getEntriesByType('paint');
        const fcp = paint.find(p => p.name === 'first-contentful-paint');
        
        return {
          fcpMs: fcp ? Math.round(fcp.startTime) : null,
          domContentLoadedMs: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
          loadEventMs: nav ? Math.round(nav.loadEventEnd) : null,
          transferSizeKb: nav ? Math.round(nav.transferSize / 1024) : null,
          decodedBodyKb: nav ? Math.round(nav.decodedBodySize / 1024) : null,
        };
      })()`,
      returnByValue: true,
    });

    const browserNav = evalRes.result?.value || {};

    console.log(`\n--- ${r.name} (${r.url}) ---`);
    console.log(`  First Contentful Paint (FCP): ${browserNav.fcpMs} ms`);
    console.log(`  DOM Content Loaded: ${browserNav.domContentLoadedMs} ms`);
    console.log(`  Load Event Completed: ${browserNav.loadEventMs} ms`);
    console.log(`  JS Heap Used: ${Math.round((m.JSHeapUsedSize || 0) / (1024 * 1024))} MB`);
    console.log(`  DOM Nodes: ${m.Nodes || "N/A"}`);

    results.push({
      route: r.name,
      url: r.url,
      ...browserNav,
      domNodes: m.Nodes,
      heapMb: Math.round((m.JSHeapUsedSize || 0) / (1024 * 1024)),
    });
  }

  cdp.close();
  edgeProcess.kill();

  fs.writeFileSync(
    path.join(__dirname, "web-vitals-report.json"),
    JSON.stringify(results, null, 2)
  );
  console.log("\nPerformance and Web Vitals measurement complete!");
}

measure();

