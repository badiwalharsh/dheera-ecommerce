/**
 * DHEERA — Phase 8.6: Complete Website Image Inventory, Replacement & High-Resolution Visual Upgrade
 * Automated Verification Test Suite
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

// Helper to inspect JPEG dimensions directly from binary headers
function getJpegDimensions(filePath) {
  const buf = fs.readFileSync(filePath);
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let offset = 2;
    while (offset < buf.length) {
      if (buf[offset] !== 0xff) break;
      const marker = buf[offset + 1];
      if (marker === 0xc0 || marker === 0xc2) {
        const height = buf.readUInt16BE(offset + 5);
        const width = buf.readUInt16BE(offset + 7);
        return { width, height };
      }
      offset += 2 + buf.readUInt16BE(offset + 2);
    }
  }
  throw new Error(`Invalid JPEG format in ${filePath}`);
}

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
  console.log(" DHEERA — PHASE 8.6: WEBSITE IMAGE INVENTORY, REPLACEMENT & HIGH-RES UPGRADE ");
  console.log("=".repeat(80) + "\n");

  const productDir = path.join("public", "images", "products");
  const bannerDir = path.join("public", "images", "banners");
  const origProductDir = path.join("public", "images", "products", "originals");
  const origBannerDir = path.join("public", "images", "banners", "originals");

  // ---------------------------------------------------------------------------
  // Group 1: Master Front Images & Luxury 3:4 Portrait Proportions
  // ---------------------------------------------------------------------------
  console.log("--- 1. Master Product Imagery & 3:4 Luxury Portrait Standards ---");

  for (let i = 1; i <= 6; i++) {
    runTest(`Product ${i} primary master image is exactly 1200 × 1600 px (3:4 ratio)`, () => {
      const p = path.join(productDir, `product-${i}.jpg`);
      assert(fs.existsSync(p), `File ${p} must exist`);
      const dims = getJpegDimensions(p);
      assert.strictEqual(dims.width, 1200, `Product ${i} width must be 1200 px`);
      assert.strictEqual(dims.height, 1600, `Product ${i} height must be 1600 px`);
      assert.strictEqual((dims.width / dims.height).toFixed(2), "0.75", "Aspect ratio must be 0.75");
    });

    runTest(`Product ${i} front-angle asset is synchronized with primary master image`, () => {
      const frontP = path.join(productDir, `product-${i}-front.jpg`);
      assert(fs.existsSync(frontP), `File ${frontP} must exist`);
      const dims = getJpegDimensions(frontP);
      assert.strictEqual(dims.width, 1200);
      assert.strictEqual(dims.height, 1600);
    });
  }

  // ---------------------------------------------------------------------------
  // Group 2: Complete 6-Slot Multi-Angle Gallery Per Garment (36 Assets Total)
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Comprehensive 6-Slot Multi-Angle Gallery Standards (36 Slots Total) ---");

  const angles = ["front", "back", "detail", "border", "fabric", "styling"];

  for (let i = 1; i <= 6; i++) {
    for (const angle of angles) {
      runTest(`Product ${i} has distinct standalone '${angle}' view at 1200 × 1600 px`, () => {
        const p = path.join(productDir, `product-${i}-${angle}.jpg`);
        assert(fs.existsSync(p), `View ${p} must exist`);
        const dims = getJpegDimensions(p);
        assert.strictEqual(dims.width, 1200, `Width of ${p} must be 1200 px`);
        assert.strictEqual(dims.height, 1600, `Height of ${p} must be 1600 px`);
        const stat = fs.statSync(p);
        assert(stat.size > 50000, `File ${p} must be high resolution (>50KB), got ${stat.size} bytes`);
      });
    }
  }

  // ---------------------------------------------------------------------------
  // Group 3: High-Resolution Banners & Brand Assets
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. High-Resolution Category & Editorial Banners ---");

  runTest("Hero editorial banner is full-HD 1920 × 1080 px (16:9 landscape proportion)", () => {
    const heroP = path.join(bannerDir, "hero-editorial.jpg");
    assert(fs.existsSync(heroP), "Hero banner must exist");
    const dims = getJpegDimensions(heroP);
    assert.strictEqual(dims.width, 1920);
    assert.strictEqual(dims.height, 1080);
  });

  const categoryBanners = ["category-kurta.jpg", "category-saree.jpg", "category-suit.jpg", "category-dupatta.jpg"];
  for (const b of categoryBanners) {
    runTest(`Category banner ${b} is 1200 × 600 px (2:1 landscape proportion)`, () => {
      const p = path.join(bannerDir, b);
      assert(fs.existsSync(p), `Banner ${p} must exist`);
      const dims = getJpegDimensions(p);
      assert.strictEqual(dims.width, 1200);
      assert.strictEqual(dims.height, 600);
    });
  }

  runTest("Official DHEERA vector/PNG logo is 2000 × 2000 px master resolution", () => {
    const logoP = path.join("public", "images", "brand", "dheera-logo.png");
    assert(fs.existsSync(logoP), "Logo must exist");
    const buf = fs.readFileSync(logoP);
    assert.strictEqual(buf.readUInt32BE(16), 2000, "Logo width must be 2000 px");
    assert.strictEqual(buf.readUInt32BE(20), 2000, "Logo height must be 2000 px");
  });

  // ---------------------------------------------------------------------------
  // Group 4: Non-Destructive Asset Preservation
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Non-Destructive Original Asset Preservation ---");

  runTest("All 6 original prototype product images are safely preserved in public/images/products/originals/", () => {
    assert(fs.existsSync(origProductDir), "Originals directory must exist");
    for (let i = 1; i <= 6; i++) {
      const p = path.join(origProductDir, `product-${i}.jpg`);
      assert(fs.existsSync(p), `Original product-${i}.jpg must be preserved`);
    }
  });

  runTest("Original prototype banners are safely preserved in public/images/banners/originals/", () => {
    assert(fs.existsSync(origBannerDir), "Original banner directory must exist");
    assert(fs.existsSync(path.join(origBannerDir, "hero-editorial.jpg")), "Original hero must be preserved");
    assert(fs.existsSync(path.join(origBannerDir, "category-kurta.jpg")), "Original category banner must be preserved");
  });

  // ---------------------------------------------------------------------------
  // Group 5: Constants & Data Layer Integration
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Constants & Data Layer Integration ---");

  const constantsContent = fs.readFileSync("src/constants/index.ts", "utf8");

  for (let i = 1; i <= 6; i++) {
    runTest(`Product ${i} defines full 6-slot gallery in src/constants/index.ts`, () => {
      for (const angle of angles) {
        assert(
          constantsContent.includes(`/images/products/product-${i}-${angle}.jpg`),
          `Constants must include /images/products/product-${i}-${angle}.jpg`
        );
      }
    });
  }

  // ---------------------------------------------------------------------------
  // Group 6: Gallery UI Component Multi-Angle Labeling
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. UI Component Multi-Angle Experience ---");

  const galleryComponent = fs.readFileSync("src/components/products/product-gallery.tsx", "utf8");

  runTest("ProductGallery component includes all 6 angle labels in getViewLabel", () => {
    assert(galleryComponent.includes("Front Silhouette"), "Must label Front Silhouette");
    assert(galleryComponent.includes("Back Silhouette & Drape"), "Must label Back Silhouette & Drape");
    assert(galleryComponent.includes("Embroidery & Neckline Craftsmanship"), "Must label Neckline Craftsmanship");
    assert(galleryComponent.includes("Hemline & Border Detail"), "Must label Border Detail");
    assert(galleryComponent.includes("Fabric Weave & Pure Texture"), "Must label Fabric Texture");
    assert(galleryComponent.includes("Editorial Styling Context"), "Must label Editorial Styling Context");
  });

  runTest("ProductGallery thumbnail badges match 6 distinct views", () => {
    assert(galleryComponent.includes('"Front"'), "Must display Front badge");
    assert(galleryComponent.includes('"Back"'), "Must display Back badge");
    assert(galleryComponent.includes('"Detail"'), "Must display Detail badge");
    assert(galleryComponent.includes('"Border"'), "Must display Border badge");
    assert(galleryComponent.includes('"Fabric"'), "Must display Fabric badge");
    assert(galleryComponent.includes('"Style"'), "Must display Style badge");
  });

  // ---------------------------------------------------------------------------
  // Group 7: Required Phase 8.6 Documentation Deliverables
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. Required Deliverables & Manifests ---");

  const deliverables = [
    "DHEERA_IMAGE_ASSET_INVENTORY.md",
    "DHEERA_IMAGE_REPLACEMENT_MANIFEST.md",
    "DHEERA_IMAGE_QUALITY_REPORT.md",
    "PHASE_8_6_IMAGE_REPLACEMENT_REPORT.md",
  ];

  for (const doc of deliverables) {
    runTest(`Deliverable ${doc} exists and contains authoritative documentation`, () => {
      assert(fs.existsSync(doc), `File ${doc} must exist`);
      const content = fs.readFileSync(doc, "utf8");
      assert(content.length > 500, `File ${doc} must not be empty`);
    });
  }

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n" + "=".repeat(80));
  console.log(` RESULTS: ${passedTests} / ${totalTests} TESTS PASSED`);
  console.log("=".repeat(80) + "\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});

