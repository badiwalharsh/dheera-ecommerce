import { NextResponse } from "next/server";
import { RazorpayService } from "@/lib/services/razorpay";
import { confirmOrderPayment } from "@/lib/services/orders";

// Idempotency cache for processed webhook event IDs
const PROCESSED_WEBHOOK_EVENTS = new Set<string>();

export async function POST(req: Request) {
  try {
    const signature = req.headers.get("x-razorpay-signature") || "";
    const rawBody = await req.text();

    if (!signature) {
      return NextResponse.json(
        { success: false, message: "Missing Razorpay webhook signature header." },
        { status: 400 }
      );
    }

    // 1. Verify Webhook Signature
    const isValid = RazorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      console.warn("Unauthorized webhook attempt rejected: Invalid HMAC signature");
      return NextResponse.json(
        { success: false, message: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event_id || `${event.event}_${event.payload?.payment?.entity?.id || ""}`;

    // 2. Idempotency Check
    if (eventId && PROCESSED_WEBHOOK_EVENTS.has(eventId)) {
      return NextResponse.json({ success: true, message: "Event already processed." });
    }

    if (eventId) {
      PROCESSED_WEBHOOK_EVENTS.add(eventId);
    }

    // 3. Handle Events
    switch (event.event) {
      case "payment.captured": {
        const paymentEntity = event.payload?.payment?.entity;
        const orderId = paymentEntity?.order_id;
        const paymentId = paymentEntity?.id;
        const orderNumber = paymentEntity?.notes?.orderNumber;

        if (orderNumber && paymentId) {
          await confirmOrderPayment(orderNumber, paymentId, signature);
        }
        break;
      }

      case "order.paid": {
        const orderEntity = event.payload?.order?.entity;
        const paymentEntity = event.payload?.payment?.entity;
        const orderNumber = orderEntity?.receipt || paymentEntity?.notes?.orderNumber;
        const paymentId = paymentEntity?.id || "webhook_captured";

        if (orderNumber) {
          await confirmOrderPayment(orderNumber, paymentId, signature);
        }
        break;
      }

      case "payment.failed": {
        const paymentEntity = event.payload?.payment?.entity;
        console.warn(`Payment failed event received for order ${paymentEntity?.order_id}: ${paymentEntity?.error_description}`);
        break;
      }

      default:
        // Ignore unhandled event types gracefully
        break;
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { success: false, message: "Webhook execution error.", error: err.message },
      { status: 500 }
    );
  }
}
