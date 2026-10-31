import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, logAdminAction } from "@/lib/security/admin-guard";
import {
  createCouponAdmin,
  getAllCouponsAdmin,
} from "@/lib/services/coupons";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const coupons = await getAllCouponsAdmin();
  return NextResponse.json({ success: true, coupons });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = await req.json();
    if (!body.code || !body.discountValue) {
      return NextResponse.json(
        { success: false, error: "Coupon code and discount value are required." },
        { status: 400 }
      );
    }

    const created = await createCouponAdmin(body);

    await logAdminAction({
      admin: authResult.admin,
      action: "coupon_create",
      targetType: "coupon",
      targetId: created.code,
      details: { code: created.code, discountValue: created.discountValue },
    });

    return NextResponse.json(
      { success: true, coupon: created, message: `Coupon ${created.code} created.` },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create coupon";
    return NextResponse.json({ success: false, error: msg }, { status: 400 });
  }
}

