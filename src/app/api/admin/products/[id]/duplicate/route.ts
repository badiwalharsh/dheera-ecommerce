import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { duplicateAdminProduct } from "@/lib/services/admin";

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const duplicated = await duplicateAdminProduct(params.id, authResult.admin);
  if (!duplicated) {
    return NextResponse.json({ success: false, error: "Source product not found." }, { status: 404 });
  }

  return NextResponse.json(
    {
      success: true,
      product: duplicated,
      message: `Product cloned successfully as "${duplicated.name}".`,
    },
    { status: 201 }
  );
}

