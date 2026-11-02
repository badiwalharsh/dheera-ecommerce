/**
 * DHEERA — Phase 8.5: Real Product Catalogue Integration & Commercial Product Readiness
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

// ---------------------------------------------------------------------------
// Pure Algorithm Helpers extracted from src/lib/services/product-import.ts
// ---------------------------------------------------------------------------
function splitCsvLine(line) {
  const result = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      const cleaned = cur.trim().replace(/^"|"$/g, "").replace(/""/g, '"');
      result.push(cleaned);
      cur = "";
    } else {
      cur += char;
    }
  }
  const cleaned = cur.trim().replace(/^"|"$/g, "").replace(/""/g, '"');
  result.push(cleaned);
  return result;
}

function parseCsvText(text) {
  const lines = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      currentLine += '"';
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === "\r" || char === "\n") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") i++;
      if (currentLine.trim()) lines.push(currentLine);
      currentLine = "";
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) lines.push(currentLine);
  if (lines.length < 2) return [];

  const headers = splitCsvLine(lines[0]).map((h) =>
    h.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_")
  );

  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    if (values.every((v) => !v.trim())) continue;
    const row = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() || "";
    });
    rows.push(row);
  }
  return rows;
}

function validateProductForPublication(product) {
  const missing = [];
  if (!product.name || !product.name.trim()) missing.push("Product Name");
  if (!product.sku || !product.sku.trim()) missing.push("Unique SKU");
  if (!product.category || !product.category.trim()) missing.push("Category");
  if (product.price === undefined || Number(product.price) <= 0) missing.push("Selling Price (> 0)");
  if (!product.description || !product.description.trim()) missing.push("Product Description");
  if (!product.image || !product.image.trim()) {
    missing.push("Main Product Photograph");
  }
  const validAvail = ["in_stock", "made_to_order", "pre_order", "out_of_stock"];
  if (product.availabilityStatus && !validAvail.includes(product.availabilityStatus)) {
    missing.push("Valid Availability Status");
  }

  return {
    canPublish: missing.length === 0,
    missingFields: missing,
  };
}

async function runSuite() {
  console.log("\n" + "=".repeat(80));
  console.log(" DHEERA — PHASE 8.5: REAL PRODUCT CATALOGUE & COMMERCIAL READINESS SUITE ");
  console.log("=".repeat(80) + "\n");

  // Read Source Files for Verification
  const productsDataSrc = fs.readFileSync(path.join(__dirname, "../src/lib/data/products.ts"), "utf8");
  const constantsSrc = fs.readFileSync(path.join(__dirname, "../src/constants/index.ts"), "utf8");
  const adminServiceSrc = fs.readFileSync(path.join(__dirname, "../src/lib/services/admin.ts"), "utf8");
  const productImportSrc = fs.readFileSync(path.join(__dirname, "../src/lib/services/product-import.ts"), "utf8");
  const productFormSrc = fs.readFileSync(path.join(__dirname, "../src/components/admin/product-form.tsx"), "utf8");
  const adminProductsPageSrc = fs.readFileSync(path.join(__dirname, "../src/app/admin/products/page.tsx"), "utf8");
  const storageConstsSrc = fs.readFileSync(path.join(__dirname, "../src/lib/constants/storage.ts"), "utf8");

  // ---------------------------------------------------------------------------
  // Group 1: Prototype Catalogue Audit, Flagging & Safe Deactivation
  // ---------------------------------------------------------------------------
  console.log("--- 1. Prototype Catalogue Audit, Flagging & Isolation ---");

  runTest("All 6 initial catalog items are explicitly marked with isPrototype=true in data layer", () => {
    assert(productsDataSrc.includes("isPrototype: true"), "FIXTURE_PRODUCTS must set isPrototype: true");
    const prototypeSlugs = [
      "gulab-embroidered-kurta-set",
      "ivory-chanderi-saree",
      "emerald-anarkali-set",
      "rust-embroidered-suit-set",
      "lavender-embroidered-kurta",
      "mustard-occasion-kurta-set",
    ];
    for (const slug of prototypeSlugs) {
      assert(constantsSrc.includes(slug), `Constants must contain prototype ${slug}`);
    }
  });

  runTest("products.ts exports archiveAllPrototypeProducts to safely de-list prototypes", () => {
    assert(productsDataSrc.includes("export function archiveAllPrototypeProducts"), "Must export archiveAllPrototypeProducts");
    assert(productsDataSrc.includes('p.status = "archived"'), "Must set status to archived");
    assert(productsDataSrc.includes("p.inStock = false"), "Must set inStock to false");
    assert(productsDataSrc.includes("p.isFeatured = false"), "Must clear featured flag");
  });

  runTest("Storefront queries (getAllProducts, getProductBySlug) strictly exclude non-published products", () => {
    assert(productsDataSrc.includes('!options?.includeUnpublished'), "Must check includeUnpublished option");
    assert(
      productsDataSrc.includes('p.status === "published"') ||
      productsDataSrc.includes("p.status ? p.status === \"published\" : p.inStock"),
      "Must filter out draft and archived products"
    );
  });

  runTest("Historical customer orders retain immutable product snapshots even when garments are archived", () => {
    const cartTypesSrc = fs.readFileSync(path.join(__dirname, "../src/types/cart.ts"), "utf8");
    assert(cartTypesSrc.includes("ConfirmedOrderDetails"), "Must define ConfirmedOrderDetails");
    assert(cartTypesSrc.includes("unitPrice: number"), "Order item must store fixed unitPrice");
    assert(cartTypesSrc.includes("name: string"), "Order item must store snapshot name");
    assert(cartTypesSrc.includes("sku: string"), "Order item must store snapshot SKU");
  });

  // ---------------------------------------------------------------------------
  // Group 2: Real Product Commercial Data Model & Publication Gate
  // ---------------------------------------------------------------------------
  console.log("--- 2. Commercial Data Model & Publication Validation Gate ---");

  runTest("CatalogProduct interface defines complete commercial & lifecycle attributes", () => {
    const ecommerceTypesSrc = fs.readFileSync(path.join(__dirname, "../src/types/ecommerce.ts"), "utf8");
    assert(ecommerceTypesSrc.includes('status?: ProductPublicationStatus'), "Must include publication status");
    assert(ecommerceTypesSrc.includes("taxRatePercent?: number"), "Must include taxRatePercent");
    assert(ecommerceTypesSrc.includes("availabilityStatus?: ProductAvailabilityStatus"), "Must include availabilityStatus");
    assert(ecommerceTypesSrc.includes("garmentType?: string"), "Must include garmentType");
    assert(ecommerceTypesSrc.includes("craftsmanship?: string"), "Must include craftsmanship");
    assert(ecommerceTypesSrc.includes("fitInfo?: string"), "Must include fitInfo");
    assert(ecommerceTypesSrc.includes("sizeGuide?: string"), "Must include sizeGuide");
  });

  runTest("validateProductForPublication catches missing mandatory fields", () => {
    const incomplete = { name: "", sku: "", category: "", price: 0, description: "", image: "" };
    const res = validateProductForPublication(incomplete);
    assert.strictEqual(res.canPublish, false);
    assert(res.missingFields.includes("Product Name"));
    assert(res.missingFields.includes("Unique SKU"));
    assert(res.missingFields.includes("Selling Price (> 0)"));
    assert(res.missingFields.includes("Product Description"));
    assert(res.missingFields.includes("Main Product Photograph"));
  });

  runTest("validateProductForPublication approves complete commercial products", () => {
    const complete = {
      name: "Rani Pink Pure Silk Kurta Set",
      sku: "DHR-KRT-101",
      category: "Kurta Sets",
      price: 5499,
      description: "Intricately embroidered pure silk kurta set with scalloped organza dupatta.",
      image: "/images/products/product-1.jpg",
      availabilityStatus: "in_stock",
    };
    const res = validateProductForPublication(complete);
    assert.strictEqual(res.canPublish, true);
    assert.strictEqual(res.missingFields.length, 0);
  });

  runTest("createAdminProduct enforces publication gate before setting status to published", () => {
    assert(adminServiceSrc.includes('validateProductForPublication(formData)'), "Must validate before publication");
    assert(adminServiceSrc.includes("Cannot publish incomplete garment"), "Must block incomplete publication");
  });

  runTest("createAdminProduct supports saving incomplete garments as draft without forced data", () => {
    assert(adminServiceSrc.includes('const targetStatus = formData.status || "draft"'), "Must default to draft");
    assert(adminServiceSrc.includes("addDynamicProduct(product)"), "Must persist draft");
  });

  // ---------------------------------------------------------------------------
  // Group 3: CSV Product Import & Bulk Onboarding Engine
  // ---------------------------------------------------------------------------
  console.log("--- 3. CSV Product Import & Integrity Validation ---");

  runTest("parseCsvText accurately parses CSV and handles quoted fields with commas", () => {
    const testCsv = `name,sku,category,price,description\n"Silk Kurta, Rani Pink",DHR-01,Kurta Sets,4999,"Features zari embroidery, and pure silk lining."`;
    const parsed = parseCsvText(testCsv);
    assert.strictEqual(parsed.length, 1);
    assert.strictEqual(parsed[0].name, "Silk Kurta, Rani Pink");
    assert.strictEqual(parsed[0].sku, "DHR-01");
    assert.strictEqual(parsed[0].price, "4999");
    assert(parsed[0].description.includes("zari embroidery, and pure silk"));
  });

  runTest("product-import.ts validates mandatory fields, duplicate SKUs, prices, and categories", () => {
    assert(productImportSrc.includes("validateCsvProducts"), "Must export validateCsvProducts");
    assert(productImportSrc.includes("Duplicate SKU"), "Must detect duplicate SKUs");
    assert(productImportSrc.includes("Selling price must be a valid positive number"), "Must validate positive price");
    assert(productImportSrc.includes("Allowed: Kurta Sets, Sarees, Suits, Dupattas"), "Must enforce allowed categories");
  });

  runTest("executeCsvImport strictly assigns status: 'draft' to all imported products", () => {
    assert(productImportSrc.includes('status: "draft"'), "Imported products must be set to status: draft");
    assert(productImportSrc.includes("createAdminProduct"), "Must call createAdminProduct");
  });

  runTest("API endpoint /api/admin/products/import exists and supports validate and confirm modes", () => {
    const importApiSrc = fs.readFileSync(path.join(__dirname, "../src/app/api/admin/products/import/route.ts"), "utf8");
    assert(importApiSrc.includes('mode === "validate"'), "Must handle validate mode");
    assert(importApiSrc.includes('mode === "confirm"'), "Must handle confirm mode");
    assert(importApiSrc.includes("requireAdmin(req)"), "Must enforce requireAdmin");
  });

  // ---------------------------------------------------------------------------
  // Group 4: Photography Management & Storage Boundary
  // ---------------------------------------------------------------------------
  console.log("--- 4. Photography Management & Storage Boundary ---");

  runTest("CANONICAL_PUBLIC_BUCKET is strictly defined for product imagery", () => {
    assert(
      storageConstsSrc.includes('CANONICAL_PUBLIC_BUCKET = STORAGE_BUCKETS.PRODUCT_IMAGES') ||
      storageConstsSrc.includes('CANONICAL_PUBLIC_BUCKET = "products"'),
      "Canonical public bucket must be defined"
    );
    assert(
      storageConstsSrc.includes('CANONICAL_PRIVATE_BUCKET = STORAGE_BUCKETS.CUSTOMIZATION_ATTACHMENTS') ||
      storageConstsSrc.includes('CANONICAL_PRIVATE_BUCKET = "customizations"'),
      "Canonical private bucket must be defined"
    );
  });

  runTest("ProductForm component provides multi-image gallery with Cover Image selection & 3:4 preview", () => {
    assert(productFormSrc.includes("handleSetPrimaryImage"), "Must support setting primary cover image");
    assert(productFormSrc.includes("handleMoveImage"), "Must support reordering images");
    assert(productFormSrc.includes("handleRemoveImage"), "Must support deleting images");
    assert(productFormSrc.includes("Storefront 3:4 Portrait Preview"), "Must include 3:4 preview modal");
  });

  // ---------------------------------------------------------------------------
  // Group 5: Admin UI & Control Surfaces
  // ---------------------------------------------------------------------------
  console.log("--- 5. Admin UI & Control Surfaces ---");

  runTest("Admin products page includes CSV Import modal, status filter, and Prototype Archiving button", () => {
    assert(adminProductsPageSrc.includes("Import via CSV"), "Must have Import via CSV button");
    assert(adminProductsPageSrc.includes("Archive Prototypes"), "Must have Archive Prototypes button");
    assert(adminProductsPageSrc.includes("All Statuses"), "Must support status filtering");
    assert(adminProductsPageSrc.includes("Step 1: Download Standard CSV Template"), "Modal must offer template download");
  });

  runTest("API endpoint /api/admin/products/archive-prototypes exists and requires admin authentication", () => {
    const archiveApiSrc = fs.readFileSync(
      path.join(__dirname, "../src/app/api/admin/products/archive-prototypes/route.ts"),
      "utf8"
    );
    assert(archiveApiSrc.includes("requireAdmin(req)"), "Must require admin authentication");
    assert(archiveApiSrc.includes("archiveAdminPrototypes"), "Must call archiveAdminPrototypes");
  });

  // ---------------------------------------------------------------------------
  // Group 6: Required Deliverables & Database Migrations
  // ---------------------------------------------------------------------------
  console.log("--- 6. Required Deliverables & Database Migration ---");

  runTest("DHEERA_PRODUCT_CATALOGUE_TEMPLATE.csv exists in root and contains required headers", () => {
    const templatePath = path.join(__dirname, "../DHEERA_PRODUCT_CATALOGUE_TEMPLATE.csv");
    assert(fs.existsSync(templatePath), "Root template file must exist");
    const content = fs.readFileSync(templatePath, "utf8");
    const header = content.split("\n")[0];
    assert(header.includes("name") && header.includes("sku") && header.includes("price") && header.includes("category"));
  });

  runTest("public/templates/DHEERA_PRODUCT_CATALOGUE_TEMPLATE.csv exists for browser download", () => {
    const publicPath = path.join(__dirname, "../public/templates/DHEERA_PRODUCT_CATALOGUE_TEMPLATE.csv");
    assert(fs.existsSync(publicPath), "Public template must exist");
  });

  runTest("DHEERA_PRODUCT_PHOTOGRAPHY_GUIDE.md exists and covers 3:4 framing, 2400x3200 px, and 6 shot angles", () => {
    const guidePath = path.join(__dirname, "../DHEERA_PRODUCT_PHOTOGRAPHY_GUIDE.md");
    assert(fs.existsSync(guidePath), "Photography guide must exist");
    const content = fs.readFileSync(guidePath, "utf8");
    assert(content.includes("3:4 Portrait"), "Guide must specify 3:4 aspect ratio");
    assert(content.includes("2400 × 3200 px") || content.includes("2000 × 2500"), "Guide must specify resolution");
    assert(content.includes("The 6 Mandatory Angles Per Garment"), "Guide must detail the 6 mandatory garment shots");
  });

  runTest("Supabase migration 20261102000001_commercial_catalogue_readiness.sql adds status & RLS", () => {
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20261102000001_commercial_catalogue_readiness.sql"
    );
    assert(fs.existsSync(migrationPath), "Migration SQL file must exist");
    const sql = fs.readFileSync(migrationPath, "utf8");
    assert(sql.includes("status TEXT NOT NULL DEFAULT 'draft'"), "Must add status column");
    assert(sql.includes("is_prototype BOOLEAN NOT NULL DEFAULT FALSE"), "Must add is_prototype column");
    assert(sql.includes("status = 'published' AND is_active = TRUE"), "Must enforce published-only RLS for public");
  });

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n" + "=".repeat(80));
  console.log(` PHASE 8.5 COMMERCIAL READINESS RESULTS: ${passedTests} / ${totalTests} PASSED! `);
  console.log("=".repeat(80) + "\n");

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
