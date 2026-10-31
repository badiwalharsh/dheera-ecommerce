const { spawn, execSync } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const screenshotsDir = path.join(__dirname, "..", "public", "screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

console.log("Starting Next.js production server on port 3000 for Phase 3 screenshots...");
const server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", "3000"], {
  cwd: path.join(__dirname, ".."),
  stdio: "inherit",
});

function pollServer(retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (remaining) => {
      http.get("http://localhost:3000", (res) => {
        if (res.statusCode === 200) {
          console.log("Server is ready (HTTP 200)!");
          resolve();
        } else {
          retry(remaining);
        }
      }).on("error", () => {
        retry(remaining);
      });
    };

    const retry = (remaining) => {
      if (remaining <= 0) {
        reject(new Error("Server failed to respond within timeout"));
      } else {
        setTimeout(() => check(remaining - 1), 1000);
      }
    };

    check(retries);
  });
}

async function capture() {
  try {
    await pollServer();

    // Settle time for fonts / hydration
    await new Promise((r) => setTimeout(r, 2500));

    const shopDesktopPath = path.join(screenshotsDir, "desktop-shop.png");
    const shopMobilePath = path.join(screenshotsDir, "mobile-shop.png");
    const productDesktopPath = path.join(screenshotsDir, "desktop-product-detail.png");
    const productMobilePath = path.join(screenshotsDir, "mobile-product-detail.png");

    console.log("1. Capturing Shop Page Desktop (1440x900)...");
    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${shopDesktopPath}" --window-size=1440,900 --hide-scrollbars http://localhost:3000/shop`);

    console.log("2. Capturing Shop Page Mobile (375x812)...");
    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${shopMobilePath}" --window-size=375,812 --hide-scrollbars http://localhost:3000/shop`);

    console.log("3. Capturing Product Detail Desktop (1440x900)...");
    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${productDesktopPath}" --window-size=1440,900 --hide-scrollbars http://localhost:3000/product/gulab-embroidered-kurta-set`);

    console.log("4. Capturing Product Detail Mobile (375x812)...");
    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${productMobilePath}" --window-size=375,812 --hide-scrollbars http://localhost:3000/product/gulab-embroidered-kurta-set`);

    console.log("Phase 3 Screenshots successfully captured!");
    console.log("Shop Desktop:", shopDesktopPath, fs.statSync(shopDesktopPath).size, "bytes");
    console.log("Shop Mobile:", shopMobilePath, fs.statSync(shopMobilePath).size, "bytes");
    console.log("Product Detail Desktop:", productDesktopPath, fs.statSync(productDesktopPath).size, "bytes");
    console.log("Product Detail Mobile:", productMobilePath, fs.statSync(productMobilePath).size, "bytes");
  } catch (err) {
    console.error("Screenshot capture error:", err);
  } finally {
    console.log("Stopping Next.js server...");
    try {
      execSync(`taskkill /F /T /PID ${server.pid}`);
    } catch {
      // Process may already have closed
    }
    process.exit(0);
  }
}

capture();
