import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/security/auth-guard";
import { getUserProfile, updateUserProfile, upsertMemoryProfile } from "@/lib/services/customer-accounts";

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

    // Customer can only view their own profile unless admin
    if (authUser && authUser.id !== targetUserId && authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Cannot view another customer's profile." }, { status: 403 });
    }

    let profile = await getUserProfile(targetUserId);
    if (!profile && authUser && authUser.id === targetUserId) {
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
    const body = await req.json();
    const { userId, fullName, phone } = body;

    const authUser = await getAuthenticatedUser(req);
    const targetUserId = userId || authUser?.id;

    if (!targetUserId) {
      return NextResponse.json({ error: "Unauthorized access." }, { status: 401 });
    }

    // Security check: cannot modify another patron's profile
    if (authUser && authUser.id !== targetUserId && authUser.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Unauthorized to edit this profile." }, { status: 403 });
    }

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      return NextResponse.json({ error: "Full name is required." }, { status: 400 });
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone.trim())) {
      return NextResponse.json({ error: "Please enter a valid 10-digit Indian mobile number." }, { status: 400 });
    }

    const updated = await updateUserProfile(targetUserId, {
      fullName,
      phone,
      email: authUser?.email,
    });

    if (!updated) {
      return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
    }

    return NextResponse.json(updated);

    return NextResponse.json(updated);
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to update profile." },
      { status: 500 }
    );
  }
}
