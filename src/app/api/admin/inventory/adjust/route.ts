import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/security/admin-guard";
import { adjustAdminInventory, getAdminInventory } from "@/lib/services/admin";

export async function POST(req: NextRequest) {
  const authResult = await requireAdmin(req);
  if ("errorResponse" in authResult) return authResult.errorResponse;

  try {
    const body = await req.json();
    let { variantId, productId, size, colour, changeAmount, quantityChange, variantSku, movementType, reason } = body;

    // Resolve from variantSku if passed directly
    if (variantSku && (!productId || !size)) {
      const inventory = await getAdminInventory();
      const match = inventory.variants.find((v) => v.sku === variantSku);
      if (match) {
        productId = match.productId;
        size = match.size;
        colour = match.colour;
        variantId = match.variantId;
      }
    }

    const delta = changeAmount !== undefined ? Number(changeAmount) : (quantityChange !== undefined ? Number(quantityChange) : undefined);

    if (!reason || String(reason).trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Adjustment reason is mandatory for inventory audit trail." },
        { status: 400 }
      );
    }

    if (!productId || !size || delta === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: "Product ID, size, and adjustment amount are required.",
        },
        { status: 400 }
      );
    }

    const res = await adjustAdminInventory({
      variantId: variantId || `${productId}_${size}_${colour || "Standard"}`,
      productId,
      size,
      colour,
      changeAmount: delta,
      movementType: movementType || (delta > 0 ? "restock" : "correction"),
      reason,
      admin: authResult.admin,
    });

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      newStock: res.newStock,
      movement: {
        newQuantity: res.newStock,
        changeAmount: delta,
        movementType: movementType || (delta > 0 ? "restock" : "correction"),
        reason,
      },
      message: `Stock updated successfully. New inventory level: ${res.newStock} units.`,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Inventory adjustment failed";
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}

