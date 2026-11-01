import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";

// Fallback in-memory subscribers store
const IN_MEMORY_SUBSCRIBERS = new Set<string>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClientServer();
        // Insert into newsletter table if exists, ignore duplicate key error
        await supabase
          .from("newsletter_subscribers")
          .insert({ email: cleanEmail, subscribed_at: new Date().toISOString() });
      } catch {
        // Fall back to in-memory store
      }
    }

    IN_MEMORY_SUBSCRIBERS.add(cleanEmail);

    return NextResponse.json({
      success: true,
      message: "Thank you for subscribing to DHEERA — Apparel & Lifestyle.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process newsletter subscription." },
      { status: 500 }
    );
  }
}

