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

    const url = new URL(req.url);
    const token = url.searchParams.get("token");

    // Retrieve order with cryptographic token or user session validation
    const { order, authorized } = await getOrderForConfirmation(orderNumber, token, null);

    if (!authorized || !order) {
      return NextResponse.json(
        {
          success: false,
          message: "Access denied. Order details can only be viewed with verified authorization or a valid order token.",
        },
        { status: 403 }
      );
    }

    // Strip private internal admin notes before sending to customer
    const customerSafeOrder = { ...order };
    delete (customerSafeOrder as { adminNotes?: string }).adminNotes;

    return NextResponse.json({
      success: true,
      order: customerSafeOrder,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, message: "Error retrieving order details.", error: err.message },
      { status: 500 }
    );
  }
}
