import { NextResponse } from "next/server";
import { getOrderForConfirmation } from "@/lib/services/orders";

export async function GET(
  req: Request,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params;
    if (!orderNumber) {
      return NextResponse.json({ success: false, message: "Order number is required." }, { status: 400 });
    }

    const order = await getOrderForConfirmation(orderNumber);

    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      order,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Error retrieving order details.", error: err.message },
      { status: 500 }
    );
  }
}
