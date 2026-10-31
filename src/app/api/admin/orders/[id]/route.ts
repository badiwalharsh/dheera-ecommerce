import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import {
  getAdminOrderById,
  updateAdminOrderFulfillment,
} from "@/lib/services/admin";
import { OrderStatus } from "@/types/cart";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const order = await getAdminOrderById(params.id);
  if (!order) {
    return NextResponse.json({ success: false, error: "Order not found." }, { status: 404 });
  }

  return NextResponse.json({ success: true, order });
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = await req.json();
    const { status, courierName, trackingNumber, notes } = body;

    if (!status) {
      return NextResponse.json(
        { success: false, error: "New order status is required." },
        { status: 400 }
      );
    }

    const res = await updateAdminOrderFulfillment({
      orderNumber: params.id,
      newStatus: status as OrderStatus,
      courierName,
      trackingNumber,
      notes,
      admin: authResult.admin,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      order: res.order,
      message: `Order #${params.id} updated to status "${status}".`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update order status";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

