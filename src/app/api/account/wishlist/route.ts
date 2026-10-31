import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/security/auth-guard";
import {
  getCustomerWishlist,
  addCustomerWishlistItem,
  removeCustomerWishlistItem,
  syncGuestWishlistToCustomer,
} from "@/lib/services/customer-accounts";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    const authUser = await getAuthenticatedUser(req);
    const targetUserId = requestedUserId || authUser?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    if (authUser && authUser.id !== targetUserId && authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Cannot view wishlist of another patron." }, { status: 403 });
    }

    const items = await getCustomerWishlist(targetUserId);
    return NextResponse.json(items);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve wishlist." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, productId, syncIds } = body;

    const authUser = await getAuthenticatedUser(req);
    const targetUserId = userId || authUser?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    if (authUser && authUser.id !== targetUserId && authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Cannot modify wishlist of another patron." }, { status: 403 });
    }

    // Bulk sync from guest storage
    if (Array.isArray(syncIds)) {
      const added = await syncGuestWishlistToCustomer(targetUserId, syncIds);
      return NextResponse.json({ success: true, addedCount: added });
    }

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    await addCustomerWishlistItem(targetUserId, productId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to add to wishlist." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const requestedUserId = searchParams.get("userId");

    const authUser = await getAuthenticatedUser(req);
    const targetUserId = requestedUserId || authUser?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    if (authUser && authUser.id !== targetUserId && authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Cannot modify wishlist of another patron." }, { status: 403 });
    }

    if (!productId) {
      return NextResponse.json({ error: "Product ID is required." }, { status: 400 });
    }

    await removeCustomerWishlistItem(targetUserId, productId);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to remove from wishlist." },
      { status: 500 }
    );
  }
}
