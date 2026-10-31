import { NextResponse } from "next/server";
import { VerifyPaymentPayload } from "@/types/cart";
import { RazorpayService } from "@/lib/services/razorpay";
import { confirmOrderPayment, getInternalOrder } from "@/lib/services/orders";
import { checkRateLimit } from "@/lib/security/rate-limit";

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting Check (Max 25 verification attempts per minute per IP)
    const rateLimit = checkRateLimit(req, "verify-payment", 25, 60000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          success: false,
          message: "Too many payment verification attempts. Please wait a moment before trying again.",
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.ceil(rateLimit.resetMs / 1000)),
          },
        }
      );
    }

    const payload: VerifyPaymentPayload = await req.json();
    const { orderId, orderNumber, razorpayOrderId, razorpayPaymentId, razorpaySignature } = payload;

    if (!orderNumber || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json(
        { success: false, message: "Missing required payment verification parameters." },
        { status: 400 }
      );
    }

    // 2. Fetch Pending Order to Validate Binding
    const existingOrder = await getInternalOrder(orderNumber);

    // If order was already confirmed earlier (e.g. by webhook race), return success idempotently
    if (existingOrder && existingOrder.status === "confirmed" && existingOrder.paymentStatus === "captured") {
      return NextResponse.json({
        success: true,
        orderNumber: existingOrder.orderNumber,
        orderId: existingOrder.id,
        accessToken: existingOrder.accessToken,
        status: existingOrder.status,
        paymentStatus: existingOrder.paymentStatus,
        redirectUrl: `/order-confirmation/${existingOrder.orderNumber}?token=${existingOrder.accessToken}`,
      });
    }

    if (!existingOrder) {
      return NextResponse.json(
        { success: false, message: "Order not found. Cannot verify payment." },
        { status: 404 }
      );
    }

    // 3. Verify Order Binding (razorpayOrderId must match the order's gatewayOrderId)
    if (existingOrder.payment.gatewayOrderId && existingOrder.payment.gatewayOrderId !== razorpayOrderId) {
      return NextResponse.json(
        {
          success: false,
          message: "Security error: Payment gateway order identifier does not match this order.",
        },
        { status: 400 }
      );
    }

    // 4. Authoritative Cryptographic Signature Verification
    const sigCheck = RazorpayService.verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!sigCheck.isValid) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment authentication failed. Cryptographic signature does not match our records.",
          reason: sigCheck.reason,
        },
        { status: 400 }
      );
    }

    // 5. Authoritatively Confirm Order & Payment in Database (Atomically Deducting Stock)
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
      accessToken: confirmedOrder.accessToken,
      status: confirmedOrder.status,
      paymentStatus: confirmedOrder.paymentStatus,
      redirectUrl: `/order-confirmation/${confirmedOrder.orderNumber}?token=${confirmedOrder.accessToken}`,
    });
  } catch (err: any) {
    // Sanitized logging (no secret tokens or PII printed)
    console.error("Payment verification endpoint error:", err.message);
    return NextResponse.json(
      { success: false, message: "An error occurred during payment verification. Please contact concierge support." },
      { status: 500 }
    );
  }
}
