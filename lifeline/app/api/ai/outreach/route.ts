import { NextRequest, NextResponse } from "next/server";
import { generateDonorOutreach } from "@/lib/ai/generate";
import type { OutreachContext } from "@/lib/ai/generate";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/outreach
 * Gen-AI donor volunteer outreach: writes a personalized WhatsApp/SMS-style
 * message for a specific matched donor (handles EN/Hinglish).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx = body as Partial<OutreachContext>;

    if (!ctx.donorName || !ctx.bloodGroup) {
      return NextResponse.json(
        { error: "Missing donorName or bloodGroup." },
        { status: 400 }
      );
    }

    const result = await generateDonorOutreach({
      donorName: ctx.donorName,
      bloodGroup: ctx.bloodGroup,
      distanceKm: Number(ctx.distanceKm || 0),
      urgency: ctx.urgency || "high",
      requestId: ctx.requestId || `req_${Date.now()}`,
      language: ctx.language === "hi" ? "hi" : "en",
      verified: Boolean(ctx.verified),
    });

    return NextResponse.json({
      title: result.title,
      message: result.text,
      mode: result.mode,
    });
  } catch {
    return NextResponse.json(
      { error: "Outreach generator is temporarily unavailable." },
      { status: 500 }
    );
  }
}