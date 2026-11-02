import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/security/admin-guard";
import { getAdminProducts } from "@/lib/services/admin";
import { CatalogProduct } from "@/types/ecommerce";

/**
 * Escapes CSV field value safely
 */
function escapeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return "";
  if (Array.isArray(val)) {
    // Pipe-separated or comma-separated inside quotes
    const str = val.map((v) => String(v).trim()).join("; ");
    return `"${str.replace(/"/g, '""')}"`;
  }
  const str = String(val).trim();
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes(";")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const url = new URL(req.url);
  const statusFilter = url.searchParams.get("status")?.toLowerCase();
  const categoryFilter = url.searchParams.get("category");

  let products = await getAdminProducts();

  if (statusFilter && statusFilter !== "all") {
    if (statusFilter === "prototype") {
      products = products.filter((p) => p.isPrototype === true);
    } else if (statusFilter === "out_of_stock") {
      products = products.filter((p) => p.availabilityStatus === "out_of_stock" || p.inStock === false || p.stock === 0);
    } else {
      products = products.filter((p) => p.status === statusFilter);
    }
  }

  if (categoryFilter && categoryFilter !== "all") {
    products = products.filter(
      (p) => p.categorySlug === categoryFilter || p.category === categoryFilter
    );
  }

  const headers = [
    "name",
    "sku",
    "category",
    "categorySlug",
    "price",
    "originalPrice",
    "mrp",
    "taxRatePercent",
    "stock",
    "status",
    "availabilityStatus",
    "fabric",
    "care",
    "craftsmanship",
    "fitInfo",
    "sizeGuide",
    "garmentType",
    "colour",
    "colors",
    "sizes",
    "shortDescription",
    "description",
    "details",
    "tag",
    "isReadyToShip",
    "isMadeToOrder",
    "isCustomizable",
    "isFeatured",
    "isNewArrival",
    "inStock",
    "image",
    "gallery",
  ];

  const rows: string[] = [headers.join(",")];

  for (const p of products) {
    const row = [
      escapeCsvValue(p.name),
      escapeCsvValue(p.sku),
      escapeCsvValue(p.category),
      escapeCsvValue(p.categorySlug),
      escapeCsvValue(p.price),
      escapeCsvValue(p.originalPrice ?? p.price),
      escapeCsvValue(p.mrp ?? p.originalPrice ?? p.price),
      escapeCsvValue(p.taxRatePercent ?? 12.0),
      escapeCsvValue(p.stock ?? 5),
      escapeCsvValue(p.status || "draft"),
      escapeCsvValue(p.availabilityStatus || "in_stock"),
      escapeCsvValue(p.fabric),
      escapeCsvValue(p.care),
      escapeCsvValue(p.craftsmanship || ""),
      escapeCsvValue(p.fitInfo || ""),
      escapeCsvValue(p.sizeGuide || ""),
      escapeCsvValue(p.garmentType || ""),
      escapeCsvValue((p as any).colour || (p.colors && p.colors[0]) || ""),
      escapeCsvValue(p.colors),
      escapeCsvValue(p.sizes),
      escapeCsvValue(p.shortDescription),
      escapeCsvValue(p.description),
      escapeCsvValue(p.details),
      escapeCsvValue(p.tag || ""),
      escapeCsvValue(p.isReadyToShip !== false),
      escapeCsvValue(!!p.isMadeToOrder),
      escapeCsvValue(!!p.isCustomizable),
      escapeCsvValue(!!p.isFeatured),
      escapeCsvValue(p.isNewArrival !== false),
      escapeCsvValue(p.inStock !== false),
      escapeCsvValue(p.image),
      escapeCsvValue(p.gallery),
    ];
    rows.push(row.join(","));
  }

  const csvContent = rows.join("\r\n");

  await logAdminAction({
    admin: authResult.admin,
    action: "product_export",
    targetType: "product",
    details: { exportedCount: products.length, statusFilter, categoryFilter },
  });

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dheera-product-catalogue-${new Date().toISOString().slice(0, 10)}.csv"`,
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
