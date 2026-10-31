const { spawn, execSync } = require("child_process");
const http = require("http");
const path = require("path");

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

async function run() {
  console.log("Starting Next.js production server...");
  const server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", "3000"], {
    cwd: path.join(__dirname, ".."),
    stdio: "ignore",
  });

  let edgeProcess = null;
  let cdp = null;

  try {
    await pollServer(3000);
    console.log("Next.js server is ready at http://localhost:3000");

    console.log("Starting Headless Edge with remote debugging...");
    edgeProcess = spawn(edgePath, [
      "--headless",
      "--disable-gpu",
      "--remote-debugging-port=9222",
      "about:blank"
    ]);

    // Wait for remote debugging to be accessible
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
      throw new Error("Could not connect to Edge remote debugging port 9222");
    }

    const target = targets.find((t) => t.type === "page") || targets[0];
    console.log(`Connected to Edge target: ${target.title} (${target.id})`);

    cdp = new CDPClient(target.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    const widths = [320, 360, 375, 390, 430];
    const pages = [
      { name: "Homepage", url: "http://localhost:3000/" },
      { name: "Shop", url: "http://localhost:3000/shop" },
      { name: "Product Detail", url: "http://localhost:3000/product/gulab-embroidered-kurta-set" },
    ];

    let overallPass = true;
    console.log("\n========================================================");
    console.log("TESTING VIEWPORT HORIZONTAL OVERFLOW ACROSS ALL WIDTHS");
    console.log("========================================================\n");

    for (const p of pages) {
      console.log(`\nTesting Page: ${p.name} (${p.url})`);
      console.log("--------------------------------------------------------");

      for (const w of widths) {
        // Set device metrics
        await cdp.send("Emulation.setDeviceMetricsOverride", {
          width: w,
          height: 812,
          deviceScaleFactor: 2,
          mobile: true,
        });

        await cdp.send("Page.navigate", { url: p.url });
        await wait(1200); // Allow render

        // Evaluate overflow
        const evalRes = await cdp.send("Runtime.evaluate", {
          expression: `
            (() => {
              const docWidth = Math.max(
                document.documentElement.scrollWidth,
                document.body ? document.body.scrollWidth : 0
              );
              const winWidth = window.innerWidth;
              const docClientWidth = document.documentElement.clientWidth;

              // Check elements extending outside right edge
              const overflowingElements = [];
              const all = document.querySelectorAll('*');
              for (const el of all) {
                const rect = el.getBoundingClientRect();
                // 1.5px subpixel tolerance
                if (rect.right > winWidth + 1.5) {
                  overflowingElements.push({
                    tag: el.tagName.toLowerCase(),
                    class: (el.className && typeof el.className === 'string') ? el.className.slice(0, 40) : '',
                    id: el.id || '',
                    right: Math.round(rect.right),
                    winWidth: winWidth,
                    overflowPx: Math.round(rect.right - winWidth)
                  });
                }
              }

              return {
                winWidth,
                docWidth,
                docClientWidth,
                hasDocOverflow: docWidth > winWidth,
                overflowingElements: overflowingElements.slice(0, 3)
              };
            })()
          `,
          returnByValue: true,
        });

        const res = evalRes.result.value;
        const passed = !res.hasDocOverflow && res.overflowingElements.length === 0;

        if (passed) {
          console.log(`  [PASS] Width ${w}px: scrollWidth=${res.docWidth}px, innerWidth=${res.winWidth}px -> No horizontal overflow.`);
        } else {
          overallPass = false;
          console.log(`  [FAIL] Width ${w}px: scrollWidth=${res.docWidth}px, innerWidth=${res.winWidth}px -> OVERFLOW DETECTED!`);
          if (res.overflowingElements.length > 0) {
            console.log(`         Offending elements:`, JSON.stringify(res.overflowingElements));
          }
        }
      }
    }

    console.log("\n========================================================");
    if (overallPass) {
      console.log("RESULT: ALL 15 VIEWPORT CHECKS PASSED WITH ZERO OVERFLOW!");
    } else {
      console.log("RESULT: OVERFLOW FAILURES DETECTED.");
    }
    console.log("========================================================\n");
  } catch (err) {
    console.error("Test execution failed:", err);
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

run();

