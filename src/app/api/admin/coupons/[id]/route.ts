import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/security/admin-guard";
import { deleteCouponAdmin, updateCouponAdmin } from "@/lib/services/coupons";

interface RouteParams {
  params: { id: string };
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = await req.json();
    const updated = await updateCouponAdmin(params.id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Coupon not found." }, { status: 404 });
    }

    await logAdminAction({
      admin: authResult.admin,
      action: "coupon_update",
      targetType: "coupon",
      targetId: updated.code,
      details: body,
    });

    return NextResponse.json({ success: true, coupon: updated });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update coupon";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  return PUT(req, { params });
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const success = await deleteCouponAdmin(params.id);
  if (!success) {
    return NextResponse.json({ success: false, error: "Coupon not found." }, { status: 404 });
  }

  await logAdminAction({
    admin: authResult.admin,
    action: "coupon_delete",
    targetType: "coupon",
    targetId: params.id,
  });

  return NextResponse.json({ success: true, message: "Coupon deleted." });
}

