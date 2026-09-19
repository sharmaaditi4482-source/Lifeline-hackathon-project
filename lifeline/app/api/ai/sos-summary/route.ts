import { NextRequest, NextResponse } from "next/server";
import { generateSosSummary } from "@/lib/ai/generate";
import type { SosContext } from "@/lib/ai/generate";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/sos-summary
 * Gen-AI emergency dispatcher: generates a bilingual (EN + HI) SOS alert from
 * the raw emergency request payload.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const ctx = body as Partial<SosContext>;

    if (!ctx.bloodGroup || !ctx.locationLabel) {
      return NextResponse.json(
        { error: "Missing bloodGroup or locationLabel." },
        { status: 400 }
      );
    }

    const result = await generateSosSummary({
      hospitalName: ctx.hospitalName || "Emergency Trauma Desk",
      bloodGroup: ctx.bloodGroup,
      unitsNeeded: Number(ctx.unitsNeeded || 1),
      urgency: ctx.urgency || "critical",
      locationLabel: ctx.locationLabel,
      topSourceName: ctx.topSourceName,
      topScore: ctx.topScore,
      contactName: ctx.contactName,
    });

    return NextResponse.json({
      title: result.title,
      alert: result.text,
      mode: result.mode,
    });
  } catch {
    return NextResponse.json(
      { error: "Emergency summarizer is temporarily unavailable." },
      { status: 500 }
    );
  }
}