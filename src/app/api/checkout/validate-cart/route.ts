import { NextResponse } from "next/server";
import { validateCartServer } from "@/lib/services/inventory-and-pricing";
import { calculateShipping } from "@/lib/services/shipping";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, pincode } = body;

    const validation = await validateCartServer(items);
    const shipping = calculateShipping(validation.subtotal, pincode);

    return NextResponse.json({
      success: true,
      isValid: validation.isValid,
      items: validation.items,
      subtotal: validation.subtotal,
      shipping,
      errors: validation.errors,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Failed to validate shopping bag contents.", error: err.message },
      { status: 400 }
    );
  }
}
