import { NextResponse } from "next/server";
import { RazorpayService } from "@/lib/services/razorpay";
import { getInternalOrder } from "@/lib/services/orders";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { orderNumber, razorpayOrderId } = body;

    if (!orderNumber || !razorpayOrderId) {
      return NextResponse.json(
        { success: false, message: "Missing required simulation parameters." },
        { status: 400 }
      );
    }

    // Verify order exists
    const order = await getInternalOrder(orderNumber);
    if (!order) {
      return NextResponse.json({ success: false, message: "Order not found." }, { status: 404 });
    }

    // Generate valid simulated test payment ID and server HMAC signature
    const paymentId = `pay_sim_${Date.now()}`;
    const signature = RazorpayService.generateTestSignature(razorpayOrderId, paymentId);

    return NextResponse.json({
      success: true,
      paymentId,
      signature,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

