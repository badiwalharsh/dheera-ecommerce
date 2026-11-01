import { NextRequest, NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { createClientServer } from "@/lib/supabase/server";

interface ContactMessage {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  createdAt: string;
}

const IN_MEMORY_CONTACT_INQUIRIES: ContactMessage[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { fullName, email, phone, subject, message } = body;

    if (!fullName || typeof fullName !== "string" || fullName.trim().length < 2) {
      return NextResponse.json(
        { success: false, error: "Please enter your full name (minimum 2 characters)." },
        { status: 400 }
      );
    }

    if (!email || typeof email !== "string") {
      return NextResponse.json(
        { success: false, error: "A valid email address is required." },
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

    if (!message || typeof message !== "string" || message.trim().length < 10) {
      return NextResponse.json(
        { success: false, error: "Message must be at least 10 characters long." },
        { status: 400 }
      );
    }

    const inquiry: ContactMessage = {
      id: `inq_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: fullName.trim(),
      email: cleanEmail,
      phone: phone ? String(phone).trim() : undefined,
      subject: subject ? String(subject).trim() : "General Client Concierge Inquiry",
      message: message.trim(),
      createdAt: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClientServer();
        await supabase.from("contact_inquiries").insert({
          id: inquiry.id,
          full_name: inquiry.fullName,
          email: inquiry.email,
          phone: inquiry.phone,
          subject: inquiry.subject,
          message: inquiry.message,
          created_at: inquiry.createdAt,
        });
      } catch {
        // Fall back to in-memory store
      }
    }

    IN_MEMORY_CONTACT_INQUIRIES.push(inquiry);

    return NextResponse.json({
      success: true,
      message: "Thank you for reaching out. Our concierge will review your message and respond within 24 hours.",
      inquiryId: inquiry.id,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process contact inquiry." },
      { status: 500 }
    );
  }
}

