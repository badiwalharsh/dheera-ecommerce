import { NextRequest, NextResponse } from "next/server";
import { EmailService } from "@/lib/services/email";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // 1. Authorize cron request using CRON_SECRET or Bearer token
    const authHeader = req.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ success: false, error: "Unauthorized cron execution." }, { status: 401 });
    }

    // 2. Process up to 25 queued messages with unique worker ID
    const workerId = `cron_${Date.now()}`;
    const result = await EmailService.processQueue(workerId, 25);

    return NextResponse.json({
      success: true,
      workerId,
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Failed to process email queue." },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  return POST(req);
}
