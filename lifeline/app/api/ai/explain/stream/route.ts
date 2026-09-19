import { streamGenerateText, generateText, hasGeminiKey } from "@/lib/ai/provider";
import type { BloodRequest, MatchResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

function buildSseMessage(obj: object): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

function buildExplainPrompt(req: BloodRequest, match: MatchResult): string {
  const b = match.breakdown;
  return `You are LifeLine's explainable-matching assistant.
Patient request: ${req.bloodGroup} needed, ${req.unitsNeeded} unit(s), urgency ${req.urgency}, at ${req.location.label}.
Candidate: ${match.sourceName} (${match.sourceType}) offering ${match.bloodGroup}, ${match.distanceKm} km away, score ${Math.round(match.score * 100)}/100.
Score breakdown (0-1): urgency ${b.urgency} (35% weight), proximity ${b.proximity} (30%), expiry ${b.expiry} (20%), reliability ${b.reliability} (15%).
Write a clear 4-5 sentence plain-language explanation of why this candidate ranked this way for a busy hospital nurse. Mention the strongest vector and the weakest vector specifically with their values. End with one practical recommendation. Do not use markdown headings.`;
}

function buildFallbackExplanation(req: BloodRequest, match: MatchResult): string {
  const b = match.breakdown;
  const strongest = [
    { label: "clinical urgency", value: b.urgency, weight: "35%" },
    { label: "proximity", value: b.proximity, weight: "30%" },
    { label: "expiry management", value: b.expiry, weight: "20%" },
    { label: "donor reliability", value: b.reliability, weight: "15%" },
  ].sort((a, z) => z.value - a.value);

  const top = strongest[0];
  const bottom = strongest[3];

  return `${match.sourceName} (${match.bloodGroup}) scored ${Math.round(match.score * 100)}/100 for this ${req.urgency} ${req.unitsNeeded}-unit ${req.bloodGroup} request at ${req.location.label}.

The deciding factor was ${top.label} at ${top.value.toFixed(2)} (weight ${top.weight}). Proximity of ${match.distanceKm} km is ${match.distanceKm <= 10 ? "within emergency dispatch reach" : match.distanceKm <= 25 ? "reachable by city ambulance" : "at the edge of the emergency radius"}.

The weakest vector was ${bottom.label} at ${bottom.value.toFixed(2)}. Also, it is ${match.breakdown.expiry >= 0.8 ? "near expiry and prioritized to prevent bio-waste" : "a fresh unit contributing to supply stability"}.

Recommendation: dispatch this source first and keep the remaining candidates on standby.`;
}

/**
 * POST /api/ai/explain/stream
 * SSE variant of the match explainer — streams the Gemini explanation
 * token-by-token. Events: {type:"chunk", text} → {type:"done", title, mode}.
 */
export async function POST(req: Request) {
  let request: BloodRequest | null = null;
  let match: MatchResult | null = null;
  try {
    const body = await req.json();
    request = body?.request || null;
    match = body?.match || null;
  } catch {
    // handled below
  }

  if (!request?.bloodGroup || !match?.sourceName) {
    return new Response(buildSseMessage({ type: "error", message: "Missing request or match context." }), {
      headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(encoder.encode(buildSseMessage(obj)));

      try {
        const prompt = buildExplainPrompt(request!, match!);
        const full = await streamGenerateText(prompt, {
          temperature: 0.3,
          maxOutputTokens: 400,
          onChunk: (delta) => send({ type: "chunk", text: delta }),
        });

        if (full) {
          send({ type: "done", title: "AI Match Explanation", mode: "llm" });
        } else {
          const fb = await generateText(prompt, { temperature: 0.3, maxOutputTokens: 400 });
          if (fb) {
            send({ type: "chunk", text: fb });
            send({ type: "done", title: "AI Match Explanation", mode: "llm" });
          } else {
            send({ type: "chunk", text: buildFallbackExplanation(request!, match!) });
            send({ type: "done", title: "Match Explanation (deterministic)", mode: "fallback" });
          }
        }
      } catch {
        send({ type: "error", message: "Match explanation is temporarily unavailable." });
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