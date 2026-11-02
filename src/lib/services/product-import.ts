import { CatalogProduct, ProductVariantInfo } from "@/types/ecommerce";
import { AdminUser, ProductFormData } from "@/types/admin";
import { createAdminProduct, getAdminProducts } from "./admin";

export interface CsvRowError {
  rowNumber: number;
  field: string;
  message: string;
  value: string;
}

export interface CsvPreviewRow {
  rowNumber: number;
  name: string;
  sku: string;
  category: string;
  price: number;
  originalPrice?: number;
  stock: number;
  availabilityStatus: string;
  isValid: boolean;
  errors: string[];
}

export interface CsvImportReport {
  totalRows: number;
  validCount: number;
  invalidCount: number;
  errors: CsvRowError[];
  previewRows: CsvPreviewRow[];
}

const VALID_CATEGORIES: Record<string, { name: string; slug: string }> = {
  "kurta sets": { name: "Kurta Sets", slug: "kurta-sets" },
  "kurta-sets": { name: "Kurta Sets", slug: "kurta-sets" },
  kurtas: { name: "Kurta Sets", slug: "kurta-sets" },
  sarees: { name: "Sarees", slug: "sarees" },
  saree: { name: "Sarees", slug: "sarees" },
  suits: { name: "Suits", slug: "suits" },
  suit: { name: "Suits", slug: "suits" },
  dupattas: { name: "Dupattas", slug: "dupattas" },
  dupatta: { name: "Dupattas", slug: "dupattas" },
};

const VALID_AVAILABILITY = ["in_stock", "made_to_order", "pre_order", "out_of_stock"];

/**
 * Parses raw CSV string into rows with key-value dictionaries.
 * Properly respects double-quoted values containing commas and escaped quotes.
 */
export function parseCsvText(text: string): Array<Record<string, string>> {
  const lines: string[] = [];
  let currentLine = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      currentLine += '"';
      if (inQuotes && nextChar === '"') {
        currentLine += '"';
        i++; // skip escaped quote
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

  // Parse header
  const headers = splitCsvLine(lines[0]).map((h) =>
    h.toLowerCase().trim().replace(/[^a-z0-9_]/g, "_")
  );

  const rows: Array<Record<string, string>> = [];

  for (let i = 1; i < lines.length; i++) {
    const values = splitCsvLine(lines[i]);
    if (values.every((v) => !v.trim())) continue; // Skip completely empty lines

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx]?.trim() || "";
    });
    rows.push(row);
  }

  return rows;
}

function splitCsvLine(line: string): string[] {
  const result: string[] = [];
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

/**
 * Validates parsed CSV rows against DHEERA commercial catalogue integrity rules
 */
export function validateCsvProducts(
  rows: Array<Record<string, string>>,
  existingProducts: CatalogProduct[]
): CsvImportReport {
  const errors: CsvRowError[] = [];
  const previewRows: CsvPreviewRow[] = [];

  const seenSkusInCsv = new Set<string>();
  const seenSlugsInCsv = new Set<string>();

  const existingSkus = new Set(existingProducts.map((p) => p.sku?.toUpperCase()).filter(Boolean));
  const existingSlugs = new Set(existingProducts.map((p) => p.slug?.toLowerCase()).filter(Boolean));

  rows.forEach((row, index) => {
    const rowNumber = index + 2; // Row 1 is header
    const rowErrors: string[] = [];

    const name = row.name || row.product_name || "";
    const rawSku = row.sku || "";
    const sku = rawSku.toUpperCase().trim();
    const rawCat = (row.category || row.category_name || "").toLowerCase().trim();
    const rawPrice = row.price || row.selling_price || "";
    const rawOrigPrice = row.original_price || row.mrp || "";
    const rawStock = row.stock || row.quantity || "5";
    const rawAvail = (row.availability_status || row.availability || "in_stock").toLowerCase().trim();
    const description = row.description || "";

    // 1. Name validation
    if (!name.trim()) {
      errors.push({ rowNumber, field: "name", message: "Garment name is mandatory", value: name });
      rowErrors.push("Missing garment name");
    }

    // 2. SKU validation
    if (!sku) {
      errors.push({ rowNumber, field: "sku", message: "Unique SKU is mandatory", value: sku });
      rowErrors.push("Missing SKU");
    } else if (seenSkusInCsv.has(sku)) {
      errors.push({ rowNumber, field: "sku", message: `Duplicate SKU "${sku}" found within CSV`, value: sku });
      rowErrors.push(`Duplicate SKU in CSV: ${sku}`);
    } else if (existingSkus.has(sku)) {
      errors.push({
        rowNumber,
        field: "sku",
        message: `SKU "${sku}" already exists in product database`,
        value: sku,
      });
      rowErrors.push(`SKU already exists in catalogue: ${sku}`);
    } else {
      seenSkusInCsv.add(sku);
    }

    // 3. Slug collision validation
    const autoSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    if (autoSlug) {
      if (seenSlugsInCsv.has(autoSlug)) {
        errors.push({
          rowNumber,
          field: "name",
          message: `Product name generates duplicate URL slug "${autoSlug}" in CSV`,
          value: name,
        });
        rowErrors.push(`Duplicate URL slug: ${autoSlug}`);
      } else if (existingSlugs.has(autoSlug)) {
        errors.push({
          rowNumber,
          field: "name",
          message: `Product URL slug "${autoSlug}" already exists in catalogue`,
          value: name,
        });
        rowErrors.push(`URL slug conflict in catalogue: ${autoSlug}`);
      } else {
        seenSlugsInCsv.add(autoSlug);
      }
    }

    // 4. Category validation
    const matchedCategory = VALID_CATEGORIES[rawCat];
    if (!rawCat) {
      errors.push({ rowNumber, field: "category", message: "Category is mandatory", value: rawCat });
      rowErrors.push("Missing category");
    } else if (!matchedCategory) {
      errors.push({
        rowNumber,
        field: "category",
        message: `Invalid category "${rawCat}". Allowed: Kurta Sets, Sarees, Suits, Dupattas`,
        value: rawCat,
      });
      rowErrors.push(`Invalid category: ${rawCat}`);
    }

    // 5. Price validation
    const price = Number(rawPrice);
    if (!rawPrice || isNaN(price) || price <= 0) {
      errors.push({
        rowNumber,
        field: "price",
        message: "Selling price must be a valid positive number greater than zero",
        value: rawPrice,
      });
      rowErrors.push("Invalid price (must be > 0)");
    }

    // 6. Original Price / MRP validation
    let originalPrice: number | undefined = undefined;
    if (rawOrigPrice) {
      const orig = Number(rawOrigPrice);
      if (isNaN(orig) || orig < 0) {
        errors.push({
          rowNumber,
          field: "original_price",
          message: "Original/MRP price must be a valid number",
          value: rawOrigPrice,
        });
        rowErrors.push("Invalid original/MRP price");
      } else if (!isNaN(price) && orig < price) {
        errors.push({
          rowNumber,
          field: "original_price",
          message: `Original/MRP price (₹${orig}) cannot be less than selling price (₹${price})`,
          value: rawOrigPrice,
        });
        rowErrors.push("MRP cannot be lower than selling price");
      } else {
        originalPrice = orig;
      }
    }

    // 7. Stock validation
    const stock = Number(rawStock);
    if (isNaN(stock) || stock < 0 || !Number.isInteger(stock)) {
      errors.push({
        rowNumber,
        field: "stock",
        message: "Stock must be a non-negative integer (0 or greater)",
        value: rawStock,
      });
      rowErrors.push("Invalid stock (must be integer >= 0)");
    }

    // 8. Availability status validation
    const availStatus = rawAvail.replace(/\s+/g, "_");
    if (availStatus && !VALID_AVAILABILITY.includes(availStatus)) {
      errors.push({
        rowNumber,
        field: "availability_status",
        message: `Invalid availability "${rawAvail}". Allowed: in_stock, made_to_order, pre_order, out_of_stock`,
        value: rawAvail,
      });
      rowErrors.push(`Invalid availability status: ${rawAvail}`);
    }

    // 9. Description validation
    if (!description.trim()) {
      errors.push({
        rowNumber,
        field: "description",
        message: "Product description is mandatory",
        value: description,
      });
      rowErrors.push("Missing description");
    }

    const isValid = rowErrors.length === 0;

    previewRows.push({
      rowNumber,
      name,
      sku,
      category: matchedCategory?.name || rawCat || "Uncategorized",
      price: isNaN(price) ? 0 : price,
      originalPrice,
      stock: isNaN(stock) ? 0 : stock,
      availabilityStatus: availStatus || "in_stock",
      isValid,
      errors: rowErrors,
    });
  });

  const validCount = previewRows.filter((r) => r.isValid).length;
  const invalidCount = previewRows.length - validCount;

  return {
    totalRows: previewRows.length,
    validCount,
    invalidCount,
    errors,
    previewRows,
  };
}

/**
 * Safely imports validated CSV rows as DRAFT products.
 * NEVER publishes automatically; explicit admin action required to publish.
 */
export async function executeCsvImport(
  rows: Array<Record<string, string>>,
  admin: AdminUser
): Promise<{ importedCount: number; importedProducts: CatalogProduct[] }> {
  const existingProducts = await getAdminProducts();
  const report = validateCsvProducts(rows, existingProducts);

  const importedProducts: CatalogProduct[] = [];

  for (let i = 0; i < rows.length; i++) {
    const preview = report.previewRows[i];
    if (!preview || !preview.isValid) continue;

    const row = rows[i];
    const name = (row.name || row.product_name || "").trim();
    const sku = (row.sku || "").toUpperCase().trim();
    const rawCat = (row.category || row.category_name || "").toLowerCase().trim();
    const matchedCategory = VALID_CATEGORIES[rawCat] || { name: "Kurta Sets", slug: "kurta-sets" };
    const price = Number(row.price || row.selling_price || 0);
    const originalPrice = row.original_price || row.mrp ? Number(row.original_price || row.mrp) : undefined;
    const stock = Number(row.stock || 5);
    const availabilityStatus = (row.availability_status || "in_stock").toLowerCase().trim() as any;

    const sizes = row.sizes
      ? row.sizes.split(/[,;|]/).map((s) => s.trim()).filter(Boolean)
      : ["XS", "S", "M", "L", "XL"];

    const colours = row.colour || row.colors
      ? (row.colour || row.colors).split(/[,;|]/).map((c) => c.trim()).filter(Boolean)
      : ["Natural"];

    const formData: ProductFormData = {
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
      sku,
      category: matchedCategory.name,
      categorySlug: matchedCategory.slug,
      shortDescription: row.short_description || "",
      description: row.description || "",
      price,
      originalPrice,
      mrp: originalPrice,
      stock,
      availabilityStatus,
      status: "draft", // STRICT RULE: All imported records start as DRAFT
      fabric: row.fabric || "Handloom Textile",
      care: row.care || "Dry Clean Recommended",
      craftsmanship: row.craftsmanship || undefined,
      fitInfo: row.fit_info || undefined,
      garmentType: row.garment_type || undefined,
      colour: colours[0] || "Natural",
      colors: colours,
      sizes,
      details: row.details
        ? row.details.split(";").map((d) => d.trim()).filter(Boolean)
        : ["Handcrafted Indian heritage construction"],
      isReadyToShip: availabilityStatus === "in_stock",
      isMadeToOrder: availabilityStatus === "made_to_order",
      isCustomizable: false,
      isFeatured: false,
      isNewArrival: true,
      inStock: stock > 0,
      isPrototype: false,
      image: "/images/banners/hero-editorial.jpg", // Default placeholder image for newly imported drafts
      gallery: ["/images/banners/hero-editorial.jpg"],
    };

    const created = await createAdminProduct(formData, admin);
    importedProducts.push(created);
  }

  return {
    importedCount: importedProducts.length,
    importedProducts,
  };
}

