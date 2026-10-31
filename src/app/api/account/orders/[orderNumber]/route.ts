import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/security/auth-guard";
import { getOrderForConfirmation } from "@/lib/services/orders";
import { generateTrackingTimeline } from "@/lib/services/customer-accounts";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: { orderNumber: string } }
) {
  try {
    const { orderNumber } = params;
    const { searchParams } = new URL(req.url);
    const providedToken = searchParams.get("token");
    const requestedUserId = searchParams.get("userId");

    const authUser = await getAuthenticatedUser(req);
    const effectiveUserId = requestedUserId || authUser?.id || null;

    if (!orderNumber) {
      return NextResponse.json({ error: "Order number is required." }, { status: 400 });
    }

    const { order, authorized } = await getOrderForConfirmation(
      orderNumber,
      providedToken,
      effectiveUserId
    );

    if (!order) {
      if (!authorized) {
        return NextResponse.json(
          { error: "Unauthorized access: Valid customer credentials or access token required." },
          { status: 403 }
        );
      }
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    // Generate real-time luxury order tracking timeline
    const trackingTimeline = generateTrackingTimeline(order);

    return NextResponse.json({
      order: {
        ...order,
        trackingTimeline,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve order." },
      { status: 500 }
    );
  }
}
