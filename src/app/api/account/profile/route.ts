import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/security/auth-guard";
import { getUserProfile, updateUserProfile, upsertMemoryProfile } from "@/lib/services/customer-accounts";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);

    // 1. Mandatory server-side authentication
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized access: Valid patron session required." },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get("userId");

    // 2. IDOR Shield: Customer can only view their own profile unless admin
    if (requestedUserId && requestedUserId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Cannot view another customer's profile." },
        { status: 403 }
      );
    }

    const targetUserId = authUser.role === "admin" && requestedUserId ? requestedUserId : authUser.id;

    let profile = await getUserProfile(targetUserId);
    if (!profile && authUser.id === targetUserId) {
      profile = {
        id: authUser.id,
        email: authUser.email,
        fullName: authUser.fullName || "Valued Patron",
        role: "customer",
        createdAt: new Date().toISOString(),
      };
      await upsertMemoryProfile(profile);
    }

    if (!profile) {
      return NextResponse.json({ error: "Profile not found." }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to retrieve profile." },
      { status: 500 }
    );
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);

    // 1. Mandatory server-side authentication
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized access: Valid patron session required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { userId, fullName, phone } = body;

    // 2. IDOR Shield: Customer cannot modify another customer's profile
    if (userId && userId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Unauthorized to edit another customer's profile." },
        { status: 403 }
      );
    }

    const targetUserId = authUser.role === "admin" && userId ? userId : authUser.id;

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid 10-digit Indian mobile number." },
        { status: 400 }
      );
    }

    const updated = await updateUserProfile(targetUserId, {
      fullName,
      phone,
      email: authUser.email,
    });

    if (!updated) {
      return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}
