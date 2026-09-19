import { NextRequest, NextResponse } from "next/server";
import { explainMatch } from "@/lib/ai/generate";
import type { BloodRequest, MatchResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/explain
 * Explainable-AI: turns a scored match (4-vector breakdown) into a plain-language
 * explanation for hospital staff.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { request, match } = body as { request: BloodRequest; match: MatchResult };

    if (!request?.bloodGroup || !match?.sourceName) {
      return NextResponse.json(
        { error: "Missing request or match context." },
        { status: 400 }
      );
    }

    const result = await explainMatch(request, match);
    return NextResponse.json({
      title: result.title,
      explanation: result.text,
      mode: result.mode,
    });
  } catch {
    return NextResponse.json(
      { error: "Match explanation is temporarily unavailable." },
      { status: 500 }
    );
  }
}