import { NextResponse } from "next/server";
import { VerifyPaymentPayload } from "@/types/cart";
import { RazorpayService } from "@/lib/services/razorpay";
import { confirmOrderPayment } from "@/lib/services/orders";

export async function POST(req: Request) {
  try {
    const payload: VerifyPaymentPayload = await req.json();
    const { orderId, orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = payload;

    if (!orderNumber || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, message: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    // 1. Authoritative Signature Verification
    const sigCheck = RazorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!sigCheck.isValid) {
      console.error(`Security alert: Signature verification failed for order ${orderNumber}`);
      return NextResponse.json(
        {
          success: false,
          message: "Payment authentication failed. Cryptographic signature does not match our records.",
          reason: sigCheck.reason,
        },
        { status: 400 }
      );
    }

    // 2. Authoritatively Confirm Order & Payment in Database
    const confirmedOrder = await confirmOrderPayment(
      orderNumber,
      razorpayPaymentId,
      razorpaySignature
    );

    if (!confirmedOrder) {
      return NextResponse.json(
        {
          success: false,
          message: "Could not locate order record to confirm payment.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      orderNumber: confirmedOrder.orderNumber,
      orderId: confirmedOrder.id,
      status: confirmedOrder.status,
      paymentStatus: confirmedOrder.paymentStatus,
      redirectUrl: `/order-confirmation/${confirmedOrder.orderNumber}`,
    });
  } catch (err: any) {
    console.error("Payment verification endpoint error:", err);
    return NextResponse.json(
      { success: false, message: "An error occurred during payment verification. Please contact concierge support." },
      { status: 500 }
    );
  }
}
