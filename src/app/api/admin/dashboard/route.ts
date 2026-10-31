import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { getAdminDashboardStats } from "@/lib/services/admin";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const url = new URL(req.url);
  const timeframe = (url.searchParams.get("timeframe") || "30d") as "today" | "7d" | "30d" | "90d" | "all";

  const stats = await getAdminDashboardStats(timeframe);

  return NextResponse.json({
    success: true,
    stats,
  });
}

