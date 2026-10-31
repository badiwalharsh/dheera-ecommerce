import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/security/auth-guard";
import {
  getCustomerAddresses,
  addCustomerAddress,
  updateCustomerAddress,
  deleteCustomerAddress,
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
        { error: "Forbidden: Cannot view addresses of another customer." },
        { status: 403 }
      );
    }

    const targetUserId = authUser.role === "admin" && requestedUserId ? requestedUserId : authUser.id;
    const addresses = await getCustomerAddresses(targetUserId);
    return NextResponse.json(addresses);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve addresses." },
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
    const { userId, recipientName, phone, addressLine1, addressLine2, landmark, city, state, postalCode, country, isDefault, addressType } = body;

    if (userId && userId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Cannot add address for another customer." },
        { status: 403 }
      );
    }

    const targetUserId = authUser.role === "admin" && userId ? userId : authUser.id;

    // Input validation
    if (!recipientName?.trim()) {
      return NextResponse.json({ error: "Recipient name is required." }, { status: 400 });
    }
    if (!phone?.trim() || !/^[6-9]\d{9}$/.test(phone.trim())) {
      return NextResponse.json({ error: "A valid 10-digit Indian phone number is required." }, { status: 400 });
    }
    if (!addressLine1?.trim()) {
      return NextResponse.json({ error: "Address line 1 is required." }, { status: 400 });
    }
    if (!city?.trim() || !state?.trim()) {
      return NextResponse.json({ error: "City and state are required." }, { status: 400 });
    }
    if (!postalCode?.trim() || !/^\d{6}$/.test(postalCode.trim())) {
      return NextResponse.json({ error: "A valid 6-digit Indian PIN code is required." }, { status: 400 });
    }

    const address = await addCustomerAddress(targetUserId, {
      recipientName,
      phone,
      addressLine1,
      addressLine2,
      landmark,
      city,
      state,
      postalCode,
      country: country || "India",
      isDefault: !!isDefault,
      addressType: addressType || "home",
    });

    return NextResponse.json(address, { status: 201 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to add address." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized access: Valid patron session required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { id, userId, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Address ID is required." }, { status: 400 });
    }

    if (userId && userId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Cannot update address for another customer." },
        { status: 403 }
      );
    }

    const targetUserId = authUser.role === "admin" && userId ? userId : authUser.id;

    if (updates.phone && !/^[6-9]\d{9}$/.test(updates.phone.trim())) {
      return NextResponse.json({ error: "A valid 10-digit Indian phone number is required." }, { status: 400 });
    }
    if (updates.postalCode && !/^\d{6}$/.test(updates.postalCode.trim())) {
      return NextResponse.json({ error: "A valid 6-digit Indian PIN code is required." }, { status: 400 });
    }

    const updated = await updateCustomerAddress(targetUserId, id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Address not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update address." },
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
    const addressId = searchParams.get("id");
    const requestedUserId = searchParams.get("userId");

    if (!addressId) {
      return NextResponse.json({ error: "Address ID is required." }, { status: 400 });
    }

    if (requestedUserId && requestedUserId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Cannot delete address for another customer." },
        { status: 403 }
      );
    }

    const targetUserId = authUser.role === "admin" && requestedUserId ? requestedUserId : authUser.id;
    const success = await deleteCustomerAddress(targetUserId, addressId);
    if (!success) {
      return NextResponse.json({ error: "Address not found or unauthorized." }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to delete address." },
      { status: 500 }
    );
  }
}
