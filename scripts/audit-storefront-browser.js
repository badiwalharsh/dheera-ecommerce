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

async function runBrowserAudit() {
  console.log("================================================================================");
  console.log(" DHEERA — PHASE 8.4: IN-BROWSER VISUAL, FUNCTIONAL & ACCESSIBILITY AUDIT ");
  console.log("================================================================================");

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
      throw new Error("Could not find Edge DevTools targets");
    }

    const target = targets.find((t) => t.type === "page") || targets[0];
    cdp = new CDPClient(target.webSocketDebuggerUrl);
    await cdp.connect();

    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");

    // Capture console errors
    const consoleLogs = [];
    cdp.ws.addEventListener("message", (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.method === "Runtime.consoleAPICalled") {
          consoleLogs.push({ type: msg.params.type, args: msg.params.args });
        }
      } catch {}
    });

    const pagesToAudit = [
      { path: "/", name: "homepage", title: "Homepage" },
      { path: "/shop", name: "shop", title: "Catalogue / Shop" },
      { path: "/collections/kurta-sets", name: "category-kurta", title: "Category: Kurta Sets" },
      { path: "/product/gulab-embroidered-kurta-set", name: "pdp-kurta", title: "Product Detail: Gulab Kurta Set" },
      { path: "/cart", name: "cart", title: "Shopping Bag" },
      { path: "/about", name: "about", title: "Our Story / Brand Heritage" },
      { path: "/contact", name: "contact", title: "Client Concierge / Contact" },
      { path: "/faq", name: "faq", title: "FAQ" },
      { path: "/shipping", name: "shipping", title: "Shipping & Delivery" },
      { path: "/returns", name: "returns", title: "Returns & Exchanges" },
      { path: "/product/custom", name: "custom-order", title: "Atelier Customization" },
      { path: "/account/login", name: "login", title: "Customer Login" },
      { path: "/admin/login", name: "admin-login", title: "Admin Portal Login" },
    ];

    const viewports = [
      { name: "desktop-1920", width: 1920, height: 1080, dsf: 1, mobile: false },
      { name: "desktop-1440", width: 1440, height: 900, dsf: 2, mobile: false },
      { name: "tablet-1024", width: 1024, height: 768, dsf: 2, mobile: false },
      { name: "tablet-768", width: 768, height: 1024, dsf: 2, mobile: false },
      { name: "mobile-430", width: 430, height: 932, dsf: 2, mobile: true },
      { name: "mobile-390", width: 390, height: 844, dsf: 2, mobile: true },
      { name: "mobile-375", width: 375, height: 812, dsf: 2, mobile: true },
      { name: "mobile-360", width: 360, height: 740, dsf: 2, mobile: true },
      { name: "mobile-320", width: 320, height: 640, dsf: 2, mobile: true },
    ];

    const auditResults = [];

    for (const page of pagesToAudit) {
      console.log(`\nAuditing: ${page.title} (${page.path})`);

      // 1. Audit at Desktop 1440px
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 1440,
        height: 900,
        deviceScaleFactor: 2,
        mobile: false,
      });

      await cdp.send("Page.navigate", { url: `http://localhost:3000${page.path}` });
      await wait(1800);

      // In-page audit evaluation
      const evalRes = await cdp.send("Runtime.evaluate", {
        expression: `(() => {
          // Images audit
          const imgs = Array.from(document.querySelectorAll('img'));
          const imageStats = imgs.map(img => ({
            src: img.src,
            alt: img.alt,
            naturalWidth: img.naturalWidth,
            naturalHeight: img.naturalHeight,
            clientWidth: img.clientWidth,
            clientHeight: img.clientHeight,
            isBroken: img.naturalWidth === 0 && img.src.length > 0
          }));

          // Overflow check
          const hasHorizontalOverflow = document.documentElement.scrollWidth > window.innerWidth;
          const overflowDelta = document.documentElement.scrollWidth - window.innerWidth;

          // Headings
          const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
            tag: h.tagName,
            text: h.innerText.slice(0, 40)
          }));

          // Buttons and Links accessible labels
          const unlabelledButtons = Array.from(document.querySelectorAll('button')).filter(b => {
            const label = b.innerText.trim() || b.getAttribute('aria-label') || b.getAttribute('title');
            return !label;
          }).length;

          // Core Web Vitals Paint timings
          const paint = performance.getEntriesByType('paint');
          const fcpEntry = paint.find(p => p.name === 'first-contentful-paint');
          const fcp = fcpEntry ? Math.round(fcpEntry.startTime) : null;

          return {
            title: document.title,
            imageCount: imgs.length,
            brokenImages: imageStats.filter(i => i.isBroken).length,
            hasHorizontalOverflow,
            overflowDelta,
            unlabelledButtons,
            fcpMs: fcp,
            imageStats: imageStats.slice(0, 10),
            headingsCount: headings.length
          };
        })()`,
        returnByValue: true,
      });

      const metrics = evalRes.result?.value || {};
      console.log(`  Title: ${metrics.title}`);
      console.log(`  FCP: ${metrics.fcpMs} ms | Images: ${metrics.imageCount} (Broken: ${metrics.brokenImages})`);
      console.log(`  Horizontal Overflow: ${metrics.hasHorizontalOverflow ? `YES (+${metrics.overflowDelta}px)` : "None (Clean)"}`);
      console.log(`  Unlabelled Buttons: ${metrics.unlabelledButtons} | Headings: ${metrics.headingsCount}`);

      auditResults.push({
        page: page.path,
        title: page.title,
        metrics,
      });

      // Capture desktop screenshot
      const shotDesktop = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
      const desktopFilename = `phase8.4-${page.name}-desktop.png`;
      fs.writeFileSync(path.join(ARTIFACT_DIR, desktopFilename), Buffer.from(shotDesktop.data, "base64"));
      console.log(`  Screenshot saved: ${desktopFilename}`);

      // Capture mobile 390px screenshot
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 390,
        height: 844,
        deviceScaleFactor: 2,
        mobile: true,
      });
      await wait(600);
      const shotMobile = await cdp.send("Page.captureScreenshot", { format: "png", fromSurface: true });
      const mobileFilename = `phase8.4-${page.name}-mobile.png`;
      fs.writeFileSync(path.join(ARTIFACT_DIR, mobileFilename), Buffer.from(shotMobile.data, "base64"));
      console.log(`  Screenshot saved: ${mobileFilename}`);
    }

    // Comprehensive Mobile Viewport Overflow Check across all 9 widths on Homepage & PDP
    console.log("\n--- Comprehensive Mobile Viewport Boundary Verification ---");
    const testPagesForViewports = ["/", "/shop", "/product/gulab-embroidered-kurta-set", "/cart"];

    for (const vp of viewports) {
      await cdp.send("Emulation.setDeviceMetricsOverride", {
        width: vp.width,
        height: vp.height,
        deviceScaleFactor: vp.dsf,
        mobile: vp.mobile,
      });

      for (const p of testPagesForViewports) {
        await cdp.send("Page.navigate", { url: `http://localhost:3000${p}` });
        await wait(500);

        const checkRes = await cdp.send("Runtime.evaluate", {
          expression: `({
            scrollWidth: document.documentElement.scrollWidth,
            innerWidth: window.innerWidth,
            hasOverflow: document.documentElement.scrollWidth > window.innerWidth
          })`,
          returnByValue: true,
        });

        const val = checkRes.result.value;
        if (val.hasOverflow) {
          console.error(`  [OVERFLOW] ${p} at ${vp.width}px: scrollWidth ${val.scrollWidth} > ${val.innerWidth}`);
        } else {
          console.log(`  [CLEAN] ${p} at ${vp.width}px: perfect fit (${val.scrollWidth}px)`);
        }
      }
    }

    // Save summary audit JSON for documentation
    fs.writeFileSync(
      path.join(__dirname, "browser-audit-data.json"),
      JSON.stringify(auditResults, null, 2)
    );
    console.log("\nIn-browser visual and functional audit complete!");
  } catch (err) {
    console.error("Browser audit failed:", err);
  } finally {
    if (cdp) cdp.close();
    if (edgeProcess) edgeProcess.kill();
  }
}

runBrowserAudit();

