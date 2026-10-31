import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { getStoreSettings, updateStoreSettings } from "@/lib/services/admin";
import { StoreSettings } from "@/types/admin";

export async function GET() {
  const settings = getStoreSettings();
  return NextResponse.json({ success: true, settings });
}

async function handleUpdate(req: NextRequest) {
  // Super Admin check for settings
  const authResult = await requireAdmin(req, "super_admin");
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = (await req.json()) as Partial<StoreSettings>;
    const updated = await updateStoreSettings(body, authResult.admin);

    return NextResponse.json({
      success: true,
      settings: updated,
      message: "Store configuration saved successfully.",
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update store settings";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return handleUpdate(req);
}

export async function POST(req: NextRequest) {
  return handleUpdate(req);
}

export async function PATCH(req: NextRequest) {
  return handleUpdate(req);
}

