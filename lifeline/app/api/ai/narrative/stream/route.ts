import { streamGenerateText, generateText, hasGeminiKey } from "@/lib/ai/provider";
import type { AnalyticsNarrativeInput } from "@/lib/ai/generate";

export const runtime = "nodejs";
export const maxDuration = 60;

function buildSseMessage(obj: object): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function buildNarrativePrompt(input: AnalyticsNarrativeInput): string {
  const trendLine = input.trend.map((t) => `${t.label}: ${t.count} requested / ${t.completed} completed`).join("; ");
  const distLine = input.distribution
    .map((d) => `${d.bloodGroup}: ${d.requests} requests, ${d.liveDonors} donors, ${d.bankStock} stock`)
    .join("; ");
  return `You are LifeLine's regional analytics narrator. Analyze the 7-day regional data and write a punchy executive summary (max 150 words) with EXACTLY these three sections:
INSIGHTS: - three bullet points on demand/supply trends
RISKS: - the most vulnerable blood group(s) and why
RECOMMENDATIONS: - two concrete actions for regional coordinators, including whether to launch a donor drive.
Data — stats: ${JSON.stringify(input.stats)}. 7-day trend: ${trendLine}. Blood group distribution: ${distLine}.
Use plain text bullets starting with "- ". Do not use markdown headings.`;
}

function buildFallbackNarrative(input: AnalyticsNarrativeInput): string {
  const low = [...input.distribution]
    .filter((d) => d.bankStock < d.requests)
    .sort((a, b) => a.bankStock - b.bankStock);
  const peak = input.trend.reduce((a, b) => (b.count > a.count ? b : a), input.trend[0]);

  const risks = low.length
    ? low.slice(0, 2).map((d) => `- ${d.bloodGroup}: demand (${d.requests}) exceeds bank stock (${d.bankStock})`)
    : ["- Overall bank stock is trending above daily demand, but monitor negative groups closely"];

  return `INSIGHTS:
- ${input.stats.totalMatches} matches locked, ${input.stats.totalLivesSaved} lives saved over the last 7 days at an average engine response of ${input.stats.averageMatchResponseTimeSeconds}s.
- ${input.stats.mostRequestedGroup} is the most requested group (${input.stats.mostRequestedCount}) — typical for trauma workloads.
- Peak demand hit ${peak.label} with ${peak.count} units requested.

RISKS:
${risks.join("\n")}

RECOMMENDATIONS:
- Schedule a ${low.length ? low[0].bloodGroup : "O-negative"} donor drive in the next 48 hours to shore up the vulnerable group.
- Enable the wider radius escalation tier for negative blood groups during night hours.`;
}

function normalize(input: any): AnalyticsNarrativeInput {
  return {
    stats: {
      totalMatches: Number(input?.stats?.totalMatches || 0),
      mostRequestedGroup: String(input?.stats?.mostRequestedGroup || "O+"),
      mostRequestedCount: Number(input?.stats?.mostRequestedCount || 0),
      averageMatchResponseTimeSeconds: Number(input?.stats?.averageMatchResponseTimeSeconds || 1.2),
      totalLivesSaved: Number(input?.stats?.totalLivesSaved || 0),
    },
    trend: Array.isArray(input?.trend)
      ? input.trend.map((t: any) => ({
          label: String(t.label),
          count: Number(t.count || 0),
          completed: Number(t.completed || 0),
        }))
      : [],
    distribution: Array.isArray(input?.distribution)
      ? input.distribution.map((d: any) => ({
          bloodGroup: String(d.bloodGroup),
          requests: Number(d.requests || 0),
          liveDonors: Number(d.liveDonors || 0),
          bankStock: Number(d.bankStock || 0),
        }))
      : [],
  };
}

/**
 * POST /api/ai/narrative/stream
 * SSE variant of the analytics narrator — streams the Gemini insight report
 * token-by-token. Events: {type:"chunk", text} → {type:"done", title, mode}.
 */
export async function POST(req: Request) {
  let input: AnalyticsNarrativeInput;
  try {
    input = normalize(await req.json());
  } catch {
    input = normalize(null);
  }

  if (!input.stats || input.trend.length === 0 || input.distribution.length === 0) {
    return new Response(buildSseMessage({ type: "error", message: "Missing stats, trend, or distribution payload." }), {
      headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(encoder.encode(buildSseMessage(obj)));

      try {
        const prompt = buildNarrativePrompt(input);
        const full = await streamGenerateText(prompt, {
          temperature: 0.5,
          maxOutputTokens: 500,
          onChunk: (delta) => send({ type: "chunk", text: delta }),
        });

        if (full) {
          send({ type: "done", title: "7-Day Regional Insight Report", mode: "llm" });
        } else {
          const fb = await generateText(prompt, { temperature: 0.5, maxOutputTokens: 500 });
          if (fb) {
            send({ type: "chunk", text: fb });
            send({ type: "done", title: "7-Day Regional Insight Report", mode: "llm" });
          } else {
            send({ type: "chunk", text: buildFallbackNarrative(input) });
            send({ type: "done", title: "7-Day Regional Insight Report", mode: "fallback" });
          }
        }
      } catch {
        send({ type: "error", message: "Analytics narrator is temporarily unavailable." });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}