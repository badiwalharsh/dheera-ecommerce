import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { createAdminCategory, getAdminCategories } from "@/lib/services/admin";

export async function GET(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  const categories = await getAdminCategories();
  return NextResponse.json({ success: true, categories });
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = await req.json();
    if (!body.name || !body.slug) {
      return NextResponse.json(
        { success: false, error: "Category name and slug are required." },
        { status: 400 }
      );
    }

    const created = await createAdminCategory(body, authResult.admin);
    return NextResponse.json(
      { success: true, category: created, message: `Category "${created.name}" created.` },
      { status: 201 }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Category creation failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

