import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { getAdminInventory, getInventoryMovements } from "@/lib/services/admin";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const inventoryData = await getAdminInventory();
  const movements = await getInventoryMovements();

  return NextResponse.json({
    success: true,
    ...inventoryData,
    recentMovements: movements.slice(0, 50),
  });
}

