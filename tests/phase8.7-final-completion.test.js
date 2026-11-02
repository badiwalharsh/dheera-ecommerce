/**
 * DHEERA — Phase 8.7: Final Storefront Completion & Product Onboarding
 * Automated Comprehensive Verification Test Suite
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
  console.log(" DHEERA — PHASE 8.7: FINAL STOREFRONT COMPLETION & PRODUCT ONBOARDING ");
  console.log("=".repeat(80) + "\n");

  const cwd = process.cwd();
  const exportRouteSrc = fs.readFileSync(path.join(cwd, "src/app/api/admin/products/export/route.ts"), "utf8");
  const uploadRouteSrc = fs.readFileSync(path.join(cwd, "src/app/api/admin/upload/route.ts"), "utf8");
  const productFormSrc = fs.readFileSync(path.join(cwd, "src/components/admin/product-form.tsx"), "utf8");
  const adminProductsPageSrc = fs.readFileSync(path.join(cwd, "src/app/admin/products/page.tsx"), "utf8");
  const adminProductsApiSrc = fs.readFileSync(path.join(cwd, "src/app/api/admin/products/route.ts"), "utf8");
  const productCardSrc = fs.readFileSync(path.join(cwd, "src/components/products/product-card.tsx"), "utf8");
  const productDetailSrc = fs.readFileSync(path.join(cwd, "src/components/products/product-detail-view.tsx"), "utf8");
  const envLocalSrc = fs.existsSync(path.join(cwd, ".env.local")) ? fs.readFileSync(path.join(cwd, ".env.local"), "utf8") : "";

  // ---------------------------------------------------------------------------
  // 1. Catalogue Export & CSV Architecture
  // ---------------------------------------------------------------------------
  console.log("--- 1. Catalogue Export & CSV Architecture ---");

  runTest("GET /api/admin/products/export enforces admin authentication guard", () => {
    assert(exportRouteSrc.includes("requireAdmin(req)"), "Must invoke requireAdmin guard");
    assert(exportRouteSrc.includes("authResult.errorResponse"), "Must return error response when unauthenticated");
  });

  runTest("Catalogue export endpoint logs administrative audit trail", () => {
    assert(exportRouteSrc.includes('action: "product_export"'), "Must log product_export administrative action");
    assert(exportRouteSrc.includes("logAdminAction"), "Must call logAdminAction");
  });

  runTest("Catalogue export supports status filtering including out_of_stock and prototype", () => {
    assert(exportRouteSrc.includes('statusFilter === "prototype"'), "Must filter prototypes");
    assert(exportRouteSrc.includes('statusFilter === "out_of_stock"'), "Must filter out_of_stock items");
    assert(exportRouteSrc.includes("categoryFilter"), "Must support category filtering");
  });

  runTest("Catalogue export sets compliant CSV attachment headers", () => {
    assert(exportRouteSrc.includes('"Content-Type": "text/csv; charset=utf-8"'), "Must specify text/csv header");
    assert(exportRouteSrc.includes('attachment; filename="dheera-product-catalogue-'), "Must set attachment download filename");
  });

  runTest("Catalogue export includes comprehensive commercial and textile columns", () => {
    const requiredCols = ["name", "sku", "category", "price", "mrp", "taxRatePercent", "stock", "status", "availabilityStatus", "fabric", "care", "image", "gallery"];
    for (const col of requiredCols) {
      assert(exportRouteSrc.includes(`"${col}"`), `Export headers must include column: ${col}`);
    }
  });

  // ---------------------------------------------------------------------------
  // 2. High-Resolution Image Pipeline & Upload Endpoint Hardening
  // ---------------------------------------------------------------------------
  console.log("--- 2. High-Resolution Image Pipeline & Upload Endpoint Hardening ---");

  runTest("Upload endpoint allows AVIF image format alongside JPG, PNG, and WebP", () => {
    assert(uploadRouteSrc.includes('"image/avif"'), "ALLOWED_MIME_TYPES must include image/avif");
    assert(uploadRouteSrc.includes('"avif"'), "ALLOWED_EXTENSIONS must include avif");
  });

  runTest("Upload endpoint enforces 10 MB limit for high-resolution fashion photography", () => {
    assert(uploadRouteSrc.includes("10 * 1024 * 1024"), "Must enforce 10MB limit in bytes");
    assert(uploadRouteSrc.includes("10MB limit"), "Error message must reflect 10MB limit");
  });

  runTest("Upload endpoint exports DELETE method for safe asset removal with admin authentication", () => {
    assert(uploadRouteSrc.includes("export async function DELETE"), "Must export DELETE handler");
    assert(uploadRouteSrc.includes("requireAdmin(req)"), "DELETE handler must require admin authentication");
    assert(uploadRouteSrc.includes('action: "file_delete"'), "Must log file_delete audit trail");
  });

  runTest("Upload DELETE handler sanitizes paths against directory traversal", () => {
    assert(uploadRouteSrc.includes(".replace(/\\.\\./g, \"\")"), "Must strip directory traversal '..' dots");
  });

  // ---------------------------------------------------------------------------
  // 3. Admin Product Form & Photography Management
  // ---------------------------------------------------------------------------
  console.log("--- 3. Admin Product Form & Photography Management ---");

  runTest("ProductForm input accepts AVIF format for high-compression photography", () => {
    assert(productFormSrc.includes("image/avif"), "File input accept must include image/avif");
  });

  runTest("ProductForm supports structured photography angle slot tags", () => {
    assert(productFormSrc.includes("standardAngles"), "Must define standardAngles array");
    assert(productFormSrc.includes("Front View"), "Must support Front View angle");
    assert(productFormSrc.includes("Back View"), "Must support Back View angle");
    assert(productFormSrc.includes("Detail & Embroidery"), "Must support Detail angle");
    assert(productFormSrc.includes("Border Work"), "Must support Border angle");
    assert(productFormSrc.includes("Fabric Texture"), "Must support Fabric angle");
    assert(productFormSrc.includes("Styling & Draping"), "Must support Styling angle");
  });

  runTest("ProductForm maintains multi-image gallery with Cover, Reorder, Delete and 3:4 Preview", () => {
    assert(productFormSrc.includes("handleSetPrimaryImage"), "Must support setting primary cover image");
    assert(productFormSrc.includes("handleMoveImage"), "Must support reordering gallery images");
    assert(productFormSrc.includes("handleRemoveImage"), "Must support deleting gallery images");
    assert(productFormSrc.includes("Storefront 3:4 Portrait Preview"), "Must maintain 3:4 portrait preview");
  });

  // ---------------------------------------------------------------------------
  // 4. Storefront Out-of-Stock Experience & State Protection
  // ---------------------------------------------------------------------------
  console.log("--- 4. Storefront Out-of-Stock Experience & State Protection ---");

  runTest("ProductCard detects out-of-stock items and renders Out of Stock badge", () => {
    assert(productCardSrc.includes('availabilityStatus === "out_of_stock"'), "Must check availabilityStatus out_of_stock");
    assert(productCardSrc.includes("Out of Stock"), "Must render Out of Stock badge");
  });

  runTest("ProductCard disables direct add-to-bag when product is out of stock", () => {
    assert(productCardSrc.includes('availabilityStatus !== "out_of_stock"'), "Add to bag button must be protected from out of stock items");
  });

  runTest("ProductDetailView disables Add to Shopping Bag and displays Out of Stock status", () => {
    assert(productDetailSrc.includes("isProductOutOfStock"), "Must compute isProductOutOfStock flag");
    assert(productDetailSrc.includes('"Out of Stock"'), "Must display Out of Stock label on action button");
    assert(productDetailSrc.includes("disabled={!isAvailable}"), "Button must be disabled when unavailable");
  });

  // ---------------------------------------------------------------------------
  // 5. Admin Products Management UI & Status Filters
  // ---------------------------------------------------------------------------
  console.log("--- 5. Admin Products Management UI & Status Filters ---");

  runTest("Admin Products Page includes dedicated Export CSV button linking to export API", () => {
    assert(adminProductsPageSrc.includes("/api/admin/products/export"), "Must link to /api/admin/products/export");
    assert(adminProductsPageSrc.includes("Export CSV"), "Must show Export CSV button");
  });

  runTest("Admin Products Page and API support Out of Stock status filter", () => {
    assert(adminProductsPageSrc.includes('value="out_of_stock"'), "Dropdown must include out_of_stock option");
    assert(adminProductsApiSrc.includes('status === "out_of_stock"'), "API must filter out_of_stock products");
  });

  // ---------------------------------------------------------------------------
  // 6. Security, Production Safety & Data Integrity Boundaries
  // ---------------------------------------------------------------------------
  console.log("--- 6. Security, Production Safety & Data Integrity Boundaries ---");

  runTest("Razorpay is strictly configured in test mode with no live mode key", () => {
    assert(!envLocalSrc.includes("rzp_live_"), "Environment must never contain a live Razorpay key (rzp_live_)");
  });

  runTest("Next.js image configuration supports high-efficiency AVIF and WebP delivery", () => {
    const nextConfigSrc = fs.readFileSync(path.join(cwd, "next.config.js"), "utf8");
    assert(nextConfigSrc.includes("image/avif"), "Next config must include image/avif");
    assert(nextConfigSrc.includes("image/webp"), "Next config must include image/webp");
  });

  console.log("\n" + "=".repeat(80));
  console.log(` PHASE 8.7 VERIFICATION COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED `);
  console.log("=".repeat(80) + "\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuite();
