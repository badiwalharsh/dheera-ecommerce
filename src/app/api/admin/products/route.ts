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
  const status = url.searchParams.get("status")?.toLowerCase();

  let products = await getAdminProducts();

  if (category && category !== "all") {
    products = products.filter((p) => p.categorySlug === category || p.category === category);
  }

  if (status && status !== "all") {
    if (status === "prototype") {
      products = products.filter((p) => p.isPrototype === true);
    } else {
      products = products.filter((p) => p.status === status);
    }
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

    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, error: "Product name is mandatory." },
        { status: 400 }
      );
    }

    if (body.price !== undefined && Number(body.price) < 0) {
      return NextResponse.json(
        { success: false, error: "Selling price cannot be negative." },
        { status: 400 }
      );
    }

    const created = await createAdminProduct(body, authResult.admin);

    const statusLabel = created.status === "published" ? "published" : "saved as draft";
    return NextResponse.json(
      {
        success: true,
        product: created,
        message: `Garment "${created.name}" ${statusLabel} successfully.`,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Product creation failed";
    const status = msg.includes("Cannot publish incomplete") ? 400 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

