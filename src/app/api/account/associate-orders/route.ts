import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/security/auth-guard";
import { associateGuestOrdersForUser } from "@/lib/services/orders";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const authUser = await getAuthenticatedUser(req);

    // 1. Enforce authenticated patron session (Blocks anonymous callers)
    if (!authUser) {
      return NextResponse.json(
        { error: "Unauthorized: Caller must be an authenticated patron." },
        { status: 401 }
      );
    }

    // 2. Enforce verified email requirement (Blocks unconfirmed email accounts)
    if (!authUser.isEmailVerified && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Customer email must be confirmed before claiming guest orders." },
        { status: 403 }
      );
    }

    // Parse body optionally passed
    let clientUserId: string | undefined;
    let clientEmail: string | undefined;
    try {
      const body = await req.json();
      clientUserId = body?.userId;
      clientEmail = body?.email;
    } catch {
      // Body is optional when deriving directly from session
    }

    // 3. Prevent client-supplied identity tampering (Never trust client ID)
    if (clientUserId && clientUserId !== authUser.id && authUser.role !== "admin") {
      return NextResponse.json(
        { error: "Forbidden: Cannot claim orders on behalf of another user ID." },
        { status: 403 }
      );
    }

    // 4. Prevent claiming another customer's email orders
    if (
      clientEmail &&
      clientEmail.trim().toLowerCase() !== authUser.email.toLowerCase() &&
      authUser.role !== "admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden: Cannot claim orders belonging to a different email address." },
        { status: 403 }
      );
    }

    // 5. Strictly derive patron identity from verified session
    const effectiveUserId = authUser.role === "admin" && clientUserId ? clientUserId : authUser.id;
    const effectiveEmail = authUser.role === "admin" && clientEmail ? clientEmail : authUser.email;
    const isAdmin = authUser.role === "admin";

    const associatedCount = await associateGuestOrdersForUser(
      effectiveUserId,
      effectiveEmail,
      isAdmin
    );

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
