import { NextRequest, NextResponse } from "next/server";
import { createCustomizationRequest } from "@/lib/services/admin";
import { EmailService } from "@/lib/services/email";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      customerName,
      email,
      phone,
      category,
      preferredColour,
      preferredFabric,
      occasion,
      measurements,
      designNotes,
      referenceImages,
      userId,
    } = body;

    if (!customerName || typeof customerName !== "string" || customerName.trim().length < 2) {
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

    if (!phone || typeof phone !== "string" || phone.trim().length < 8) {
      return NextResponse.json(
        { success: false, error: "Please enter a valid contact phone number." },
        { status: 400 }
      );
    }

    if (!designNotes || typeof designNotes !== "string" || designNotes.trim().length < 5) {
      return NextResponse.json(
        { success: false, error: "Please share details or styling preferences for your custom piece." },
        { status: 400 }
      );
    }

    const item = await createCustomizationRequest({
      customerName: customerName.trim(),
      email: cleanEmail,
      phone: phone.trim(),
      category: category || "Bespoke Ensemble",
      preferredColour,
      preferredFabric,
      occasion,
      measurements,
      designNotes: designNotes.trim(),
      referenceImages,
      userId,
    });

    // Queue / dispatch customization acknowledgement
    await EmailService.send({
      type: "customization_inquiry",
      to: { email: cleanEmail, name: customerName.trim() },
      subject: `DHEERA Atelier — Bespoke Consultation #${item.requestNumber} Received`,
      data: {
        requestNumber: item.requestNumber,
        category: item.category,
        customerName: item.customerName,
      },
      idempotencyKey: `customization_${item.requestNumber}`,
    });

    return NextResponse.json({
      success: true,
      requestNumber: item.requestNumber,
      message: "Your bespoke consultation request has been received by our atelier.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to submit customization request." },
      { status: 500 }
    );
  }
}

