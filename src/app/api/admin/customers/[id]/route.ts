import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { getAdminCustomers, getAdminOrders } from "@/lib/services/admin";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const customers = await getAdminCustomers();
  const customer = customers.find(
    (c) => c.id === params.id || c.email.toLowerCase() === params.id.toLowerCase()
  );

  if (!customer) {
    return NextResponse.json({ success: false, error: "Customer not found." }, { status: 404 });
  }

  const allOrders = await getAdminOrders();
  const customerOrders = allOrders.filter(
    (o) =>
      o.userId === customer.id ||
      o.customerInfo?.email?.toLowerCase() === customer.email.toLowerCase()
  );

  return NextResponse.json({
    success: true,
    customer,
    orders: customerOrders,
  });
}

