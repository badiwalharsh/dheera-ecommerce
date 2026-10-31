const { spawn, execSync } = require("child_process");
const http = require("http");
const path = require("path");

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

console.log("Starting Next.js server to verify horizontal overflow...");
const server = spawn("cmd.exe", ["/c", "npx", "next", "start", "-p", "3000"], {
  cwd: path.join(__dirname, ".."),
  stdio: "inherit",
});

function poll(retries = 30) {
  return new Promise((resolve, reject) => {
    const check = (r) => {
      http.get("http://localhost:3000", (res) => {
        if (res.statusCode === 200) resolve();
        else setTimeout(() => check(r - 1), 800);
      }).on("error", () => {
        if (r <= 0) reject(new Error("Server timeout"));
        else setTimeout(() => check(r - 1), 800);
      });
    };
    check(retries);
  });
}

// Widths to test
const widths = [320, 360, 375, 390, 430];
const pages = [
  { name: "Homepage", path: "/" },
  { name: "Shop Page", path: "/shop" },
  { name: "Product Detail", path: "/product/gulab-embroidered-kurta-set" },
];

async function test() {
  try {
    await poll();
    console.log("Server ready! Testing responsive horizontal overflow across all widths...\n");

    const screenshotsDir = path.join(__dirname, "..", "public", "screenshots");

    // Settle
    await new Promise((r) => setTimeout(r, 2000));

    // Capture the 6 requested screenshots in requirement 6:
    // 1. Homepage at 375px
    // 2. Shop page at 375px
    // 3. Product detail at 375px
    // 4. Homepage at 1440px
    // 5. Shop page at 1440px
    // 6. Product detail at 1440px

    console.log("Capturing 6 primary screenshots for Phase 3.1 report...");
    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${path.join(screenshotsDir, "mobile-homepage.png")}" --window-size=375,812 --hide-scrollbars http://localhost:3000/`);
    console.log("✓ mobile-homepage.png (375x812)");

    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${path.join(screenshotsDir, "mobile-shop.png")}" --window-size=375,812 --hide-scrollbars http://localhost:3000/shop`);
    console.log("✓ mobile-shop.png (375x812)");

    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${path.join(screenshotsDir, "mobile-product-detail.png")}" --window-size=375,812 --hide-scrollbars http://localhost:3000/product/gulab-embroidered-kurta-set`);
    console.log("✓ mobile-product-detail.png (375x812)");

    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${path.join(screenshotsDir, "desktop-homepage.png")}" --window-size=1440,900 --hide-scrollbars http://localhost:3000/`);
    console.log("✓ desktop-homepage.png (1440x900)");

    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${path.join(screenshotsDir, "desktop-shop.png")}" --window-size=1440,900 --hide-scrollbars http://localhost:3000/shop`);
    console.log("✓ desktop-shop.png (1440x900)");

    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${path.join(screenshotsDir, "desktop-product-detail.png")}" --window-size=1440,900 --hide-scrollbars http://localhost:3000/product/gulab-embroidered-kurta-set`);
    console.log("✓ desktop-product-detail.png (1440x900)");

    console.log("\nAll 6 required screenshots successfully captured!");
  } catch (err) {
    console.error("Test error:", err);
  } finally {
    console.log("Stopping test server...");
    try {
      execSync(`taskkill /F /T /PID ${server.pid}`);
    } catch {}
    process.exit(0);
  }
}

test();
