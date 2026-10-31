import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { updateAdminCustomization } from "@/lib/services/admin";

interface RouteParams {
  params: { id: string };
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = await req.json();
    const { status, adminNotes, estimatedQuote } = body;

    if (!status) {
      return NextResponse.json({ success: false, error: "Status is required." }, { status: 400 });
    }

    const updated = await updateAdminCustomization({
      id: params.id,
      status,
      adminNotes,
      estimatedQuote: estimatedQuote ? Number(estimatedQuote) : undefined,
      admin: authResult.admin,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Customization request not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      customization: updated,
      item: updated,
      message: `Customization enquiry #${updated.requestNumber} updated.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update customization request";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

