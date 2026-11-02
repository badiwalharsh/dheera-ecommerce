import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { archiveAdminPrototypes } from "@/lib/services/admin";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const result = await archiveAdminPrototypes(authResult.admin);
    return NextResponse.json({
      success: true,
      archivedCount: result.archivedCount,
      archivedIds: result.archivedIds,
      message: `Successfully archived ${result.archivedCount} prototype garment(s). Only approved commercial inventory will be visible on the public storefront.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to archive prototype garments";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

