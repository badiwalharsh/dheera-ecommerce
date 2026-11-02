import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import {
  deleteAdminProduct,
  getAdminProductById,
  updateAdminProduct,
} from "@/lib/services/admin";
import { ProductFormData } from "@/types/admin";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const product = await getAdminProductById(params.id);
  if (!product) {
    return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, product });
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = (await req.json()) as Partial<ProductFormData>;
    const updated = await updateAdminProduct(params.id, body, authResult.admin);

    if (!updated) {
      return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: updated,
      message: `Garment "${updated.name}" updated successfully.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Product update failed";
    const status = msg.includes("Cannot publish incomplete") ? 400 : 500;
    return NextResponse.json({ success: false, error: msg }, { status });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return PUT(req, { params });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const success = await deleteAdminProduct(params.id, authResult.admin);
  if (!success) {
    return NextResponse.json({ success: false, error: "Product not found." }, { status: 404 });
  }

  return NextResponse.json({
    success: true,
    message: "Garment archived successfully from storefront.",
  });
}

