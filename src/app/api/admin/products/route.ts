import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { createAdminProduct, getAdminProducts } from "@/lib/services/admin";
import { ProductFormData } from "@/types/admin";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.toLowerCase();
  const category = url.searchParams.get("category");

  let products = await getAdminProducts();

  if (category && category !== "all") {
    products = products.filter((p) => p.categorySlug === category || p.category === category);
  }

  if (search) {
    products = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search)
    );
  }

  return NextResponse.json({
    success: true,
    products,
    count: products.length,
  });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = (await req.json()) as ProductFormData;

    if (!body.name || !body.price || !body.category) {
      return NextResponse.json(
        { success: false, error: "Product name, category, and price are mandatory." },
        { status: 400 }
      );
    }

    if (Number(body.price) <= 0) {
      return NextResponse.json(
        { success: false, error: "Selling price must be greater than zero." },
        { status: 400 }
      );
    }

    const created = await createAdminProduct(body, authResult.admin);

    return NextResponse.json(
      {
        success: true,
        product: created,
        message: `Garment "${created.name}" created and published successfully.`,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Product creation failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

