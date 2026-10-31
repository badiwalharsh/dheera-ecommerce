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
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized access: Valid patron session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    if (requestedUserId && requestedUserId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Cannot view wishlist of another patron." },
        { status: 403 }
      );
    }

    const targetUserId = authUser.role === "admin" && requestedUserId ? requestedUserId : authUser.id;
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
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized access: Valid patron session required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, productId, syncIds } = body;

    if (userId && userId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Cannot modify wishlist of another patron." },
        { status: 403 }
      );
    }

    const targetUserId = authUser.role === "admin" && userId ? userId : authUser.id;

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
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized access: Valid patron session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const requestedUserId = searchParams.get("userId");

    if (requestedUserId && requestedUserId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Cannot modify wishlist of another patron." },
        { status: 403 }
      );
    }

    const targetUserId = authUser.role === "admin" && requestedUserId ? requestedUserId : authUser.id;

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
