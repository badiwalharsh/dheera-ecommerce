/**
 * DHEERA — Phase 8.4: Final Storefront Visual Quality & Pre-Launch Audit
 * Comprehensive Automated Verification Test Suite
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(` ✔ PASS : Test ${totalTests}: ${name}`);
    passedTests++;
  } catch (err) {
    console.error(` ✖ FAIL : Test ${totalTests}: ${name}`);
    console.error(`          ${err.message}`);
  }
}

async function runSuite() {
  console.log("\n" + "=".repeat(80));
  console.log(" DHEERA — PHASE 8.4: STOREFRONT VISUAL QUALITY & PRE-LAUNCH AUDIT SUITE ");
  console.log("=".repeat(80) + "\n");

  // ---------------------------------------------------------------------------
  // Group 1: Accessibility Landmarks, Focus Rings & Skip Links
  // ---------------------------------------------------------------------------
  console.log("--- 1. Accessibility Landmarks & Keyboard Navigation ---");

  const layoutContent = fs.readFileSync(path.join(__dirname, "../src/app/layout.tsx"), "utf8");
  const globalsCssContent = fs.readFileSync(path.join(__dirname, "../src/app/globals.css"), "utf8");

  runTest("Root layout contains accessible 'Skip to main content' link", () => {
    assert(layoutContent.includes('href="#main-content"'), "Must provide skip to main content href");
    assert(layoutContent.includes("Skip to main content"), "Must provide accessible anchor label");
  });

  runTest("Root layout marks main container with id='main-content'", () => {
    assert(layoutContent.includes('id="main-content"'), "Must designate main landmark id");
    assert(layoutContent.includes("<main"), "Must use semantic HTML <main> tag");
  });

  runTest("Global CSS establishes WCAG 2.1 compliant :focus-visible high-contrast ring", () => {
    assert(globalsCssContent.includes(":focus-visible"), "Must declare :focus-visible rules");
    assert(globalsCssContent.includes("outline: 2px solid #176B45") || globalsCssContent.includes("outline: 2px solid"), "Must specify high-contrast 2px outline");
    assert(globalsCssContent.includes("outline-offset: 2px"), "Must maintain outline offset for visibility");
  });

  // ---------------------------------------------------------------------------
  // Group 2: Dynamic & Dedicated Route Metadata
  // ---------------------------------------------------------------------------
  console.log("--- 2. Route Metadata & SEO Titles ---");

  const contactLayoutExists = fs.existsSync(path.join(__dirname, "../src/app/contact/layout.tsx"));
  runTest("Client Concierge /contact route provides dedicated layout metadata", () => {
    assert(contactLayoutExists, "src/app/contact/layout.tsx must exist");
    const content = fs.readFileSync(path.join(__dirname, "../src/app/contact/layout.tsx"), "utf8");
    assert(content.includes("Client Concierge") || content.includes("Contact"), "Must include concierge/contact title");
    assert(content.includes("DHEERA"), "Must include brand name DHEERA");
  });

  const faqLayoutExists = fs.existsSync(path.join(__dirname, "../src/app/faq/layout.tsx"));
  runTest("FAQ & Care Guide /faq route provides dedicated layout metadata", () => {
    assert(faqLayoutExists, "src/app/faq/layout.tsx must exist");
    const content = fs.readFileSync(path.join(__dirname, "../src/app/faq/layout.tsx"), "utf8");
    assert(content.includes("Frequently Asked Questions") || content.includes("FAQ"), "Must include FAQ title");
    assert(content.includes("DHEERA"), "Must include brand name DHEERA");
  });

  const customOrderLayoutExists = fs.existsSync(path.join(__dirname, "../src/app/product/custom/layout.tsx"));
  runTest("Bespoke Atelier /product/custom route provides dedicated layout metadata", () => {
    assert(customOrderLayoutExists, "src/app/product/custom/layout.tsx must exist");
    const content = fs.readFileSync(path.join(__dirname, "../src/app/product/custom/layout.tsx"), "utf8");
    assert(content.includes("Bespoke") || content.includes("Custom"), "Must include Bespoke/Custom title");
    assert(content.includes("DHEERA"), "Must include brand name DHEERA");
  });

  // ---------------------------------------------------------------------------
  // Group 3: Mobile Viewport Alignment & Search Aspect Ratio
  // ---------------------------------------------------------------------------
  console.log("--- 3. Mobile Viewport Alignment & Search Aspect Ratio ---");

  const mobileNavContent = fs.readFileSync(path.join(__dirname, "../src/components/navigation/mobile-nav.tsx"), "utf8");
  runTest("Mobile navigation drawer top offset dynamically aligns with header heights", () => {
    assert(
      mobileNavContent.includes("top-16 sm:top-20 md:top-24"),
      "Mobile nav drawer must offset top-16 sm:top-20 md:top-24 to avoid header overlap"
    );
  });

  const searchModalContent = fs.readFileSync(path.join(__dirname, "../src/components/navigation/search-modal.tsx"), "utf8");
  runTest("Search modal product thumbnails strictly enforce 3:4 portrait aspect ratio", () => {
    assert(
      searchModalContent.includes("aspect-[3/4]"),
      "Search modal thumbnail container must enforce aspect-[3/4]"
    );
  });

  // ---------------------------------------------------------------------------
  // Group 4: In-Browser Automated Viewport Overflow Audit Verification
  // ---------------------------------------------------------------------------
  console.log("--- 4. In-Browser Automated Viewport Overflow Audit Verification ---");

  const auditDataPath = path.join(__dirname, "../scripts/browser-audit-data.json");
  const viewportDataPath = path.join(__dirname, "../scripts/browser-viewport-checks.json");

  runTest("Browser CDP automated audit data and viewport logs exist", () => {
    assert(fs.existsSync(auditDataPath), "browser-audit-data.json must exist");
    assert(fs.existsSync(viewportDataPath), "browser-viewport-checks.json must exist");
  });

  if (fs.existsSync(viewportDataPath)) {
    const viewportData = JSON.parse(fs.readFileSync(viewportDataPath, "utf8"));

    runTest("Automated audit covers all 9 required viewport widths (320px to 1920px)", () => {
      const recordedWidths = new Set(viewportData.map((d) => d.viewportWidth));
      const requiredWidths = [320, 360, 375, 390, 430, 768, 1024, 1440, 1920];
      for (const w of requiredWidths) {
        assert(recordedWidths.has(w), `Missing recorded test width: ${w}px`);
      }
    });

    runTest("Automated in-browser audit confirms ZERO horizontal overflow on tested routes", () => {
      const overflows = viewportData.filter((d) => d.hasHorizontalOverflow === true);
      assert.strictEqual(
        overflows.length,
        0,
        `Detected ${overflows.length} horizontal overflow instances: ${JSON.stringify(overflows)}`
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Group 5: Real-World Core Web Vitals Performance Benchmarks
  // ---------------------------------------------------------------------------
  console.log("--- 5. Real-World Core Web Vitals & Performance Benchmarks ---");

  const vitalsPath = path.join(__dirname, "../scripts/web-vitals-report.json");
  runTest("In-browser Web Vitals telemetry report exists", () => {
    assert(fs.existsSync(vitalsPath), "web-vitals-report.json must exist");
  });

  if (fs.existsSync(vitalsPath)) {
    const vitalsData = JSON.parse(fs.readFileSync(vitalsPath, "utf8"));

    runTest("Homepage First Contentful Paint (FCP) meets sub-second luxury benchmark (< 1000 ms)", () => {
      const home = vitalsData.find((v) => v.route === "Homepage");
      assert(home && home.fcpMs !== null, "Homepage FCP must be captured");
      assert(home.fcpMs < 1000, `Homepage FCP was ${home.fcpMs} ms, expected < 1000 ms`);
    });

    runTest("Catalogue, PDP, and Cart routes achieve instant client transitions (FCP < 250 ms)", () => {
      const internalRoutes = vitalsData.filter((v) => v.route !== "Homepage");
      for (const r of internalRoutes) {
        assert(r.fcpMs < 250, `${r.route} FCP was ${r.fcpMs} ms, expected < 250 ms`);
      }
    });

    runTest("JavaScript memory consumption remains lean and stable (< 20 MB heap across all tested routes)", () => {
      for (const r of vitalsData) {
        assert(r.heapMb < 20, `${r.route} JS heap was ${r.heapMb} MB, expected < 20 MB`);
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Group 6: Visual Artifacts & Full Page Screenshot Verification
  // ---------------------------------------------------------------------------
  console.log("--- 6. Visual Artifacts & Admin Coverage Verification ---");

  const artifactDir = "C:\\Users\\badiw\\.gemini\\antigravity\\brain\\d1418b8c-ddf4-4f21-8d3e-ba52a8e18722";
  runTest("Phase 8.4 artifact directory contains high-fidelity visual audit screenshots", () => {
    assert(fs.existsSync(artifactDir), "Artifact directory must exist");
    const files = fs.readdirSync(artifactDir);
    const phase84Screenshots = files.filter((f) => f.startsWith("phase8.4-") && f.endsWith(".png"));
    assert(phase84Screenshots.length >= 30, `Expected at least 30 audit screenshots, found ${phase84Screenshots.length}`);
  });

  runTest("Admin portal screenshots captured for all 7 management modules across mobile and desktop", () => {
    const files = fs.readdirSync(artifactDir);
    const adminScreenshots = files.filter((f) => f.startsWith("phase8.4-admin-") && f.endsWith(".png"));
    assert(adminScreenshots.length >= 14, `Expected at least 14 admin screenshots (7 desktop + 7 mobile), found ${adminScreenshots.length}`);
  });

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n" + "=".repeat(80));
  console.log(` PHASE 8.4 AUDIT TEST SUITE: ${passedTests} / ${totalTests} PASSED! `);
  console.log("=".repeat(80) + "\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
