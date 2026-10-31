import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { getAdminCustomers } from "@/lib/services/admin";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const customers = await getAdminCustomers();

  return NextResponse.json({
    success: true,
    customers,
    count: customers.length,
  });
}

