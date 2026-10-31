import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/security/auth-guard";
import { associateGuestOrdersForUser } from "@/lib/services/orders";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId, email } = body;

    const authUser = await getAuthenticatedUser(req);
    const targetUserId = userId || authUser?.id;
    const targetEmail = email || authUser?.email;

    if (!targetUserId || !targetEmail) {
      return NextResponse.json({ error: "Missing customer credentials." }, { status: 400 });
    }

    // Security check: Customer can only associate orders matching their verified email
    if (authUser && authUser.email.toLowerCase() !== targetEmail.toLowerCase() && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Cannot claim orders from an unverified email." },
        { status: 403 }
      );
    }

    const associatedCount = await associateGuestOrdersForUser(targetUserId, targetEmail);

    return NextResponse.json({
      success: true,
      associatedCount,
      message: `Associated ${associatedCount} past order(s) with your patron account.`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to associate guest orders." },
      { status: 500 }
    );
  }
}
