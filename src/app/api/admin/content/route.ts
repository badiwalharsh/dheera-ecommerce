import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { getStoreContent, updateStoreContent } from "@/lib/services/admin";
import { StoreContent } from "@/types/admin";

export async function GET() {
  const content = getStoreContent();
  return NextResponse.json({ success: true, content });
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = (await req.json()) as Partial<StoreContent>;
    const updated = await updateStoreContent(body, authResult.admin);

    return NextResponse.json({
      success: true,
      content: updated,
      message: "Homepage content updated successfully and reflected on storefront.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update content";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  return PUT(req);
}

export async function PATCH(req: NextRequest) {
  return PUT(req);
}

