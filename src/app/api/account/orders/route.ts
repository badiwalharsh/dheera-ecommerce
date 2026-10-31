import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/security/auth-guard";
import { getCustomerOrders } from "@/lib/services/orders";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized access: Valid patron session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");
    const requestedEmail = searchParams.get("email");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, Math.min(50, parseInt(searchParams.get("limit") || "10", 10)));

    if (requestedUserId && requestedUserId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Cannot view orders of another customer." },
        { status: 403 }
      );
    }

    if (
      requestedEmail &&
      requestedEmail.toLowerCase() !== authUser.email.toLowerCase() &&
      authUser.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden: Cannot view orders of another customer email." },
        { status: 403 }
      );
    }

    const targetUserId = authUser.role === "admin" && requestedUserId ? requestedUserId : authUser.id;
    const targetEmail = authUser.role === "admin" && requestedEmail ? requestedEmail : authUser.email;

    const allOrders = await getCustomerOrders(targetUserId, targetEmail);

    const totalOrders = allOrders.length;
    const totalPages = Math.ceil(totalOrders / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginatedOrders = allOrders.slice(startIndex, startIndex + limit);

    // Map to customer summary
    const formatted = paginatedOrders.map((ord) => ({
      id: ord.id,
      orderNumber: ord.orderNumber,
      createdAt: ord.createdAt,
      status: ord.status,
      paymentStatus: ord.paymentStatus,
      totalAmount: ord.pricing.totalAmount,
      subtotal: ord.pricing.subtotal,
      shippingFee: ord.pricing.shippingFee,
      discountAmount: ord.pricing.discountAmount,
      taxAmount: ord.pricing.taxAmount,
      itemCount: ord.items.reduce((sum, item) => sum + item.quantity, 0),
      itemsPreview: ord.items.map((i) => ({
        id: i.id,
        productId: i.productId,
        name: i.name,
        sku: i.sku,
        size: i.size,
        colour: i.colour,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        totalPrice: i.totalPrice,
        image: i.image,
      })),
      trackingNumber: (ord as any).trackingNumber,
    }));

    return NextResponse.json({
      orders: formatted,
      pagination: {
        page,
        limit,
        totalOrders,
        totalPages,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve orders." },
      { status: 500 }
    );
  }
}

