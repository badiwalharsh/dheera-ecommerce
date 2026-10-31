import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { deleteAdminCategory, updateAdminCategory } from "@/lib/services/admin";

interface RouteParams {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = await req.json();
    const updated = await updateAdminCategory(params.id, body, authResult.admin);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Category not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      category: updated,
      message: `Category "${updated.name}" updated.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Category update failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const result = await deleteAdminCategory(params.id, authResult.admin);
  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error, message: result.error },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    message: "Category safely deleted.",
  });
}

