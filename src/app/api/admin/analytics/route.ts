import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { getAdminDashboardStats } from "@/lib/services/admin";
import { getAllProducts } from "@/lib/data/products";
import { getAllOrdersAdmin } from "@/lib/services/orders";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const url = new URL(req.url);
  const timeframe = (url.searchParams.get("timeframe") || "30d") as "today" | "7d" | "30d" | "90d" | "all";

  const stats = await getAdminDashboardStats(timeframe);
  const allOrders = await getAllOrdersAdmin();
  const allProducts = await getAllProducts();

  // Category performance breakdown
  const categoryRevMap = new Map<string, { revenue: number; units: number }>();
  allOrders.forEach((o) => {
    if (["confirmed", "processing", "dispatched", "delivered"].includes(o.status)) {
      o.items.forEach((it) => {
        const prod = allProducts.find((p) => p.id === it.productId);
        const cat = prod?.category || "Designer Apparel";
        const cur = categoryRevMap.get(cat) || { revenue: 0, units: 0 };
        const price = it.unitPrice ?? it.price ?? 0;
        cur.revenue += price * it.quantity;
        cur.units += it.quantity;
        categoryRevMap.set(cat, cur);
      });
    }
  });

  const categoryPerformance = Array.from(categoryRevMap.entries()).map(([category, val]) => ({
    category,
    revenue: val.revenue,
    unitsSold: val.units,
  }));

  // Customer retention ratio (new vs returning)
  const orderCountsByEmail = new Map<string, number>();
  allOrders.forEach((o) => {
    const email = o.customerInfo?.email?.toLowerCase();
    if (email) {
      orderCountsByEmail.set(email, (orderCountsByEmail.get(email) || 0) + 1);
    }
  });

  let newCustomersCount = 0;
  let returningCustomersCount = 0;
  orderCountsByEmail.forEach((count) => {
    if (count > 1) returningCustomersCount++;
    else newCustomersCount++;
  });

  const aov = stats.averageOrderValue;
  const repeatRate =
    orderCountsByEmail.size > 0
      ? Math.round((returningCustomersCount / orderCountsByEmail.size) * 100)
      : 0;

  const retention = {
    newCustomers: newCustomersCount,
    returningCustomers: returningCustomersCount,
    repeatRate,
    retentionRate: repeatRate,
  };

  return NextResponse.json({
    success: true,
    timeframe,
    aov,
    categoryPerformance,
    customerRetention: retention,
    analytics: {
      totalRevenue: stats.totalRevenue,
      totalOrders: stats.totalOrders,
      averageOrderValue: aov,
      aov,
      salesPerformance: stats.salesPerformance,
      bestSellingProducts: stats.bestSellingProducts,
      categoryPerformance,
      customerRetention: retention,
    },
  });
}

