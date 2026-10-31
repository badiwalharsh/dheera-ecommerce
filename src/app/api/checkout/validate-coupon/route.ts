import { NextResponse } from "next/server";
import { validateCoupon } from "@/lib/services/coupons";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, subtotal } = body;

    if (typeof subtotal !== "number" || subtotal <= 0) {
      return NextResponse.json(
        { success: false, isValid: false, message: "Valid subtotal is required to apply coupons." },
        { status: 400 }
      );
    }

    const result = await validateCoupon(code, subtotal);

    return NextResponse.json({
      success: true,
      isValid: result.isValid,
      coupon: result.coupon,
      discountAmount: result.discountAmount,
      message: result.message,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Coupon verification failed.", error: err.message },
      { status: 400 }
    );
  }
}

