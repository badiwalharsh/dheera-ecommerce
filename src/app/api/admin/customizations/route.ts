import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { getAdminCustomizations } from "@/lib/services/admin";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");

  let items = await getAdminCustomizations();
  if (status && status !== "all") {
    items = items.filter((c) => c.status === status);
  }

  return NextResponse.json({
    success: true,
    customizations: items,
    count: items.length,
  });
}

