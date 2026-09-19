import { retrieveChunks } from "@/lib/ai/vectorStore";
import { streamGenerateText, generateText, hasGeminiKey } from "@/lib/ai/provider";
import type { KnowledgeChunk } from "@/lib/ai/knowledgeBase";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_PROMPT = `You are the LifeLine Medical Copilot, an expert blood-bank and transfusion assistant for Indian hospital staff.
Answer ONLY from the retrieved context below. Be concise, medically accurate, and practical. If the context does not contain the answer, say you do not have that information and suggest the hospital follow its standard protocol.
Reference source titles as [1], [2] etc. where relevant.
Formatting rules:
- Use plain text with short paragraphs and occasional - bullet points.
- Never invent numbers, rules, or lab values that are not in the context.`;

function buildGroundedPrompt(question: string, chunks: KnowledgeChunk[]): string {
  const context = chunks
    .map((c, i) => `[${i + 1}] ${c.title}\n${c.content}`)
    .join("\n\n");

  return `${SYSTEM_PROMPT}

=== RETRIEVED CONTEXT ===
${context}

=== QUESTION ===
${question}`;
}

function buildSseMessage(obj: object): string {
  return `data: ${JSON.stringify(obj)}\n\n`;
}

/**
 * POST /api/ai/copilot/stream
 * Server-Sent-Events variant of the RAG copilot: retrieves the grounded chunks,
 * then streams the Gemini answer token-by-token so the UI shows a live
 * typewriter effect. Events:
 *   {type:"retrieving"}                 → hitting the knowledge base
 *   {type:"chunk", text:"..."}          → one text delta from the model
 *   {type:"done", mode, citations}      → final frame with sources
 *   {type:"error", message}             → stopped early
 */
export async function POST(req: Request) {
  let question: string;
  try {
    const body = await req.json();
    question = String(body?.question || "").trim();
  } catch {
    question = "";
  }

  if (question.length < 4) {
    return new Response(buildSseMessage({ type: "error", message: "Please ask a meaningful medical question." }), {
      headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform", Connection: "keep-alive", "X-Accel-Buffering": "no" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: object) => controller.enqueue(encoder.encode(buildSseMessage(obj)));

      try {
        // 1. Retrieve grounded chunks
        send({ type: "retrieving" });
        const retrieved = await retrieveChunks(question, 4);
        const citations = retrieved.map((c) => c.title);
        if (retrieved.length === 0) {
          send({ type: "chunk", text: "I could not find any relevant protocol in the knowledge base for that question. Please contact your hospital blood bank." });
          send({ type: "done", mode: "fallback", citations: [], aiEnabled: hasGeminiKey() });
          controller.close();
          return;
        }

        // 2. Stream the grounded generation from Gemini
        const prompt = buildGroundedPrompt(question, retrieved);
        const full = await streamGenerateText(prompt, {
          temperature: 0.4,
          maxOutputTokens: 512,
          onChunk: (delta) => send({ type: "chunk", text: delta }),
        });

        if (full) {
          send({ type: "done", mode: "llm", citations, aiEnabled: hasGeminiKey() });
        } else {
          // Deterministic fallback keeps the stream alive even offline
          const fb = await generateText(prompt, { temperature: 0.4, maxOutputTokens: 512 });
          if (fb) {
            send({ type: "chunk", text: fb });
            send({ type: "done", mode: "llm", citations, aiEnabled: hasGeminiKey() });
          } else {
            const sources = citations.slice(0, 3).join(" · ");
            send({
              type: "chunk",
              text:
                "Solved in deterministic mode — connect a Google AI Studio GEMINI_API_KEY to enable full LLM answers.\n\n" +
                `Based on the knowledge base, the most relevant references for "${question}" are:\n- ${sources}\n\n` +
                "For a definitive clinical decision, always follow your hospital's standard operating procedure.",
            });
            send({ type: "done", mode: "fallback", citations, aiEnabled: false });
          }
        }
      } catch {
        send({ type: "error", message: "The medical copilot is temporarily unavailable." });
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