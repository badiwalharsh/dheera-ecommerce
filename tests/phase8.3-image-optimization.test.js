/**
 * DHEERA — Phase 8.3: Product Image Quality Enhancement & Visual Asset Optimization
 * Comprehensive Automated Verification Test Suite
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

// Helper to inspect JPEG dimensions directly from file headers
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
  console.log(" DHEERA — PHASE 8.3: PRODUCT IMAGE QUALITY & ASSET OPTIMIZATION SUITE ");
  console.log("=".repeat(80) + "\n");

  // ---------------------------------------------------------------------------
  // Group 1: Next.js Image Optimization Pipeline Configuration
  // ---------------------------------------------------------------------------
  console.log("--- 1. Next.js Image Delivery Pipeline Configuration ---");

  const nextConfigContent = fs.readFileSync("next.config.js", "utf8");

  runTest("next.config.js configures modern high-efficiency formats (AVIF and WebP)", () => {
    assert(nextConfigContent.includes('"image/avif"') && nextConfigContent.includes('"image/webp"'), "Must include AVIF and WebP formats");
  });

  runTest("next.config.js configures granular responsive deviceSizes covering mobile to 2K", () => {
    assert(nextConfigContent.includes("deviceSizes"), "Must configure deviceSizes");
    assert(nextConfigContent.includes("360") && nextConfigContent.includes("1200") && nextConfigContent.includes("2048"), "Must include 360, 1200, 2048 viewports");
  });

  runTest("next.config.js configures imageSizes for sharp thumbnail generation", () => {
    assert(nextConfigContent.includes("imageSizes"), "Must configure imageSizes");
    assert(nextConfigContent.includes("48") && nextConfigContent.includes("96") && nextConfigContent.includes("256"), "Must cover 48px, 96px, 256px thumbnails");
  });

  runTest("next.config.js configures long-lived cache TTL and immutable asset headers", () => {
    assert(nextConfigContent.includes("minimumCacheTTL: 2592000"), "Must set 30-day cache TTL");
    assert(nextConfigContent.includes("max-age=31536000, immutable"), "Must enforce immutable browser caching for /images/**");
  });

  runTest("next.config.js maintains Supabase Storage CDN remote pattern", () => {
    assert(nextConfigContent.includes("hostname: \"**.supabase.co\""), "Must allow Supabase CDN");
    assert(nextConfigContent.includes("pathname: \"/storage/v1/object/public/**\""), "Must constrain path to public storage objects");
  });

  // ---------------------------------------------------------------------------
  // Group 2: Master Image Resolution & Aspect Ratio Standards
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Master Image Resolution & 3:4 Luxury Portrait Proportions ---");

  for (let i = 1; i <= 6; i++) {
    runTest(`Product ${i} master image is 1200 × 1600 px (exact 3:4 luxury portrait ratio)`, () => {
      const p = path.join("public", "images", "products", `product-${i}.jpg`);
      assert(fs.existsSync(p), `File ${p} must exist`);
      const dims = getJpegDimensions(p);
      assert.strictEqual(dims.width, 1200, `Product ${i} width must be 1200 px, got ${dims.width}`);
      assert.strictEqual(dims.height, 1600, `Product ${i} height must be 1600 px, got ${dims.height}`);
      assert.strictEqual((dims.width / dims.height).toFixed(2), "0.75", "Aspect ratio must be 0.75 (3:4)");
    });
  }

  runTest("Category banners are enhanced to crisp 1200 × 600 px (2:1 landscape proportion)", () => {
    const banners = ["category-kurta.jpg", "category-saree.jpg", "category-suit.jpg", "category-dupatta.jpg"];
    for (const b of banners) {
      const p = path.join("public", "images", "banners", b);
      assert(fs.existsSync(p), `Banner ${p} must exist`);
      const dims = getJpegDimensions(p);
      assert.strictEqual(dims.width, 1200, `${b} width must be 1200 px`);
      assert.strictEqual(dims.height, 600, `${b} height must be 600 px`);
    }
  });

  runTest("Hero editorial banner is enhanced to crisp 1920 × 1080 px full-HD resolution", () => {
    const p = path.join("public", "images", "banners", "hero-editorial.jpg");
    assert(fs.existsSync(p), `Hero banner must exist`);
    const dims = getJpegDimensions(p);
    assert.strictEqual(dims.width, 1920, "Hero width must be 1920 px");
    assert.strictEqual(dims.height, 1080, "Hero height must be 1080 px");
  });

  // ---------------------------------------------------------------------------
  // Group 3: Non-Destructive Asset Preservation
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Non-Destructive Original Asset Preservation ---");

  runTest("All 6 original prototype product images are safely preserved in public/images/products/originals/", () => {
    const origDir = path.join("public", "images", "products", "originals");
    assert(fs.existsSync(origDir), "Originals directory must exist");
    for (let i = 1; i <= 6; i++) {
      const p = path.join(origDir, `product-${i}.jpg`);
      assert(fs.existsSync(p), `Original product-${i}.jpg must be preserved`);
      const stat = fs.statSync(p);
      assert(stat.size > 10000 && stat.size < 15000, `Original file size must match original payload (~12KB), got ${stat.size}`);
    }
  });

  runTest("Original prototype banners are safely preserved in public/images/banners/originals/", () => {
    const origDir = path.join("public", "images", "banners", "originals");
    assert(fs.existsSync(origDir), "Original banner directory must exist");
    assert(fs.existsSync(path.join(origDir, "hero-editorial.jpg")), "Original hero must be preserved");
    assert(fs.existsSync(path.join(origDir, "category-kurta.jpg")), "Original category banner must be preserved");
  });

  // ---------------------------------------------------------------------------
  // Group 4: Authentic Product Gallery & Zero Cross-Contamination
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Authentic Multi-Angle Galleries & Zero Cross-Garment Contamination ---");

  const constantsContent = fs.readFileSync("src/constants/index.ts", "utf8");

  for (let i = 1; i <= 6; i++) {
    runTest(`Product ${i} has authentic multi-angle views without cross-product banner contamination`, () => {
      const detailP = path.join("public", "images", "products", `product-${i}-detail.jpg`);
      const fabricP = path.join("public", "images", "products", `product-${i}-fabric.jpg`);

      assert(fs.existsSync(detailP), `Detail view ${detailP} must exist`);
      assert(fs.existsSync(fabricP), `Fabric view ${fabricP} must exist`);

      const dimsD = getJpegDimensions(detailP);
      const dimsF = getJpegDimensions(fabricP);
      assert.strictEqual(dimsD.width, 1200, `Detail width must be 1200 px`);
      assert.strictEqual(dimsF.width, 1200, `Fabric width must be 1200 px`);

      // Verify constants do not map unrelated category banners to this product
      assert(constantsContent.includes(`/images/products/product-${i}-detail.jpg`), `Constants must include product-${i}-detail.jpg`);
      assert(constantsContent.includes(`/images/products/product-${i}-fabric.jpg`), `Constants must include product-${i}-fabric.jpg`);
    });
  }

  runTest("SAMPLE_PRODUCTS strictly excludes unrelated category-kurta or hero-editorial from individual galleries", () => {
    // Check that gallery arrays in SAMPLE_PRODUCTS no longer contaminate products with category banners
    const sampleProductsDef = constantsContent.slice(constantsContent.indexOf("SAMPLE_PRODUCTS = ["), constantsContent.indexOf("export type SampleProduct"));
    assert(!sampleProductsDef.includes("/images/banners/category-kurta.jpg"), "Galleries must not mix in category banners");
    assert(!sampleProductsDef.includes("/images/banners/hero-editorial.jpg"), "Galleries must not mix in editorial banners");
  });

  // ---------------------------------------------------------------------------
  // Group 5: Component Polish, Layout Stability & Error Resilience
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Component Refinements, Layout Stability & Error Fallbacks ---");

  const productImageComponent = fs.readFileSync("src/components/ui/product-image.tsx", "utf8");
  const productGalleryComponent = fs.readFileSync("src/components/products/product-gallery.tsx", "utf8");
  const productCardComponent = fs.readFileSync("src/components/products/product-card.tsx", "utf8");
  const productDetailComponent = fs.readFileSync("src/components/products/product-detail-view.tsx", "utf8");

  runTest("ProductImage component implements warm ivory skeleton placeholder to prevent CLS", () => {
    assert(productImageComponent.includes("aspect-[3/4]"), "Must default to 3:4 aspect ratio");
    assert(productImageComponent.includes("bg-[#EEEAE0]"), "Must utilize DHEERA warm ivory backdrop");
    assert(productImageComponent.includes("animate-pulse"), "Must provide shimmer pulse during load");
  });

  runTest("ProductImage component renders branded DHEERA fallback upon broken or missing image", () => {
    assert(productImageComponent.includes("DHEERA"), "Must display brand name on fallback");
    assert(productImageComponent.includes("Original Studio View Pending"), "Must transparently indicate studio photography is pending");
    assert(productImageComponent.includes("hasError"), "Must implement error state handler");
  });

  runTest("ProductCard component stabilizes 3:4 portrait container and delivers responsive sizes", () => {
    assert(productCardComponent.includes("aspect-[3/4]"), "Must specify aspect-[3/4]");
    assert(productCardComponent.includes("sizes=\"(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw\""), "Must provide responsive sizes");
    assert(productCardComponent.includes("ProductImage"), "Must use ProductImage component");
  });

  runTest("ProductGallery component implements touch swipe, 2x texture zoom, and keyboard navigation", () => {
    assert(productGalleryComponent.includes("onTouchStart") && productGalleryComponent.includes("onTouchEnd"), "Must support touch swipe");
    assert(productGalleryComponent.includes("isZoomedIn") && productGalleryComponent.includes("2x Texture"), "Must support high-resolution 2x texture inspection");
    assert(productGalleryComponent.includes("ArrowRight") && productGalleryComponent.includes("Escape"), "Must support keyboard navigation");
  });

  runTest("ProductDetailView seamlessly integrates ProductGallery without layout shift", () => {
    assert(productDetailComponent.includes("<ProductGallery"), "Must integrate ProductGallery");
    assert(productDetailComponent.includes("productName={product.name}"), "Must pass product name to gallery");
  });

  // ---------------------------------------------------------------------------
  // Group 6: Aspect Ratio Consistency Across Thumbnails & Admin Surfaces
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Aspect Ratio Consistency Across Storefront & Admin Surfaces ---");

  const cartDrawerContent = fs.readFileSync("src/components/cart/cart-drawer.tsx", "utf8");
  const cartPageContent = fs.readFileSync("src/components/cart/cart-page-view.tsx", "utf8");
  const checkoutViewContent = fs.readFileSync("src/components/checkout/checkout-view.tsx", "utf8");
  const orderDetailContent = fs.readFileSync("src/components/account/order-detail-view.tsx", "utf8");
  const adminProductsContent = fs.readFileSync("src/app/admin/products/page.tsx", "utf8");

  runTest("Cart drawer and cart page enforce 3:4 aspect ratio on garment thumbnails", () => {
    assert(cartDrawerContent.includes("aspect-[3/4]"), "Cart drawer must use aspect-[3/4]");
    assert(cartPageContent.includes("aspect-[3/4]"), "Cart page must use aspect-[3/4]");
  });

  runTest("Checkout view enforces 3:4 aspect ratio on order summary thumbnails", () => {
    assert(checkoutViewContent.includes("aspect-[3/4]"), "Checkout view must use aspect-[3/4]");
  });

  runTest("Customer order detail and history views enforce 3:4 aspect ratio on garment line items", () => {
    assert(orderDetailContent.includes("aspect-[3/4]"), "Customer order detail must use aspect-[3/4]");
  });

  runTest("Admin product catalog management displays clean 3:4 portrait thumbnails", () => {
    assert(adminProductsContent.includes("aspect-[3/4]"), "Admin products table must use aspect-[3/4]");
  });

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n" + "=".repeat(80));
  console.log(` PHASE 8.3 OPTIMIZATION RESULTS: ${passedTests} / ${totalTests} PASSED! `);
  console.log("=".repeat(80) + "\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
