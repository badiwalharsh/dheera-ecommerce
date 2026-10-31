import { NextResponse } from "next/server";
import { RazorpayService } from "@/lib/services/razorpay";
import { confirmOrderPayment, recordWebhookEvent } from "@/lib/services/orders";

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

    // 1. Verify Webhook Signature using timing-safe comparison
    const isValid = RazorpayService.verifyWebhookSignature(rawBody, signature);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid webhook signature." },
        { status: 401 }
      );
    }

    const event = JSON.parse(rawBody);
    const eventId = event.event_id || `${event.event}_${event.payload?.payment?.entity?.id || ""}`;

    // 2. Database-Enforced Webhook Idempotency Check
    if (eventId) {
      const { alreadyProcessed } = await recordWebhookEvent(eventId, event.event, event);
      if (alreadyProcessed) {
        return NextResponse.json({ success: true, message: "Event already processed (Idempotent)." });
      }
    }

    // 3. Handle Events
    switch (event.event) {
      case "payment.captured": {
        const paymentEntity = event.payload?.payment?.entity;
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
        // Log event type only without sensitive card details
        break;
      }

      default:
        // Ignore unhandled event types gracefully
        break;
    }

    return NextResponse.json({ success: true, received: true });
  } catch (err: any) {
    console.error("Webhook processing error:", err.message);
    return NextResponse.json(
      { success: false, message: "Webhook execution error." },
      { status: 500 }
    );
  }
}
