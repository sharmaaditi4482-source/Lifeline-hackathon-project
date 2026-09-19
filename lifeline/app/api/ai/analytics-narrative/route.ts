import { NextRequest, NextResponse } from "next/server";
import { generateAnalyticsNarrative } from "@/lib/ai/generate";
import type { AnalyticsNarrativeInput } from "@/lib/ai/generate";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * POST /api/ai/analytics-narrative
 * Gen-AI analytics narrator: converts regional 7-day telemetry into a scannable
 * insights / risks / recommendations report for regional coordinators.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const input = body as Partial<AnalyticsNarrativeInput>;

    if (!input.stats || !Array.isArray(input.trend) || !Array.isArray(input.distribution)) {
      return NextResponse.json(
        { error: "Missing stats, trend, or distribution payload." },
        { status: 400 }
      );
    }

    const result = await generateAnalyticsNarrative({
      stats: {
        totalMatches: Number(input.stats.totalMatches || 0),
        mostRequestedGroup: String(input.stats.mostRequestedGroup || "O+"),
        mostRequestedCount: Number(input.stats.mostRequestedCount || 0),
        averageMatchResponseTimeSeconds: Number(input.stats.averageMatchResponseTimeSeconds || 1.2),
        totalLivesSaved: Number(input.stats.totalLivesSaved || 0),
      },
      trend: input.trend.map((t) => ({
        label: String(t.label),
        count: Number(t.count || 0),
        completed: Number(t.completed || 0),
      })),
      distribution: input.distribution.map((d) => ({
        bloodGroup: String(d.bloodGroup),
        requests: Number(d.requests || 0),
        liveDonors: Number(d.liveDonors || 0),
        bankStock: Number(d.bankStock || 0),
      })),
    });

    return NextResponse.json({
      title: result.title,
      report: result.text,
      mode: result.mode,
    });
  } catch {
    return NextResponse.json(
      { error: "Analytics narrator is temporarily unavailable." },
      { status: 500 }
    );
  }
}