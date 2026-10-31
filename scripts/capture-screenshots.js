const { spawn, execSync } = require("child_process");
const http = require("http");
const fs = require("fs");
const path = require("path");

const screenshotsDir = path.join(__dirname, "..", "public", "screenshots");
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir, { recursive: true });
}

const edgePath = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe";

console.log("Starting Next.js production server on port 3000...");
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

    // Give 2 seconds for client hydration / font rendering
    await new Promise((r) => setTimeout(r, 2000));

    const desktopPath = path.join(screenshotsDir, "desktop-homepage.png");
    const mobilePath = path.join(screenshotsDir, "mobile-homepage.png");

    console.log("Capturing desktop screenshot (1440x900)...");
    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${desktopPath}" --window-size=1440,900 --hide-scrollbars http://localhost:3000`);

    console.log("Capturing mobile screenshot (375x812)...");
    execSync(`"${edgePath}" --headless --disable-gpu --screenshot="${mobilePath}" --window-size=375,812 --hide-scrollbars http://localhost:3000`);

    console.log("Screenshots successfully captured!");
    console.log("Desktop:", desktopPath, fs.statSync(desktopPath).size, "bytes");
    console.log("Mobile:", mobilePath, fs.statSync(mobilePath).size, "bytes");
  } catch (err) {
    console.error("Screenshot error:", err);
  } finally {
    console.log("Stopping Next.js server...");
    // Kill the server and any child processes
    try {
      execSync(`taskkill /F /T /PID ${server.pid}`);
    } catch {
      // Process may already have closed
    }
    process.exit(0);
  }
}

capture();
