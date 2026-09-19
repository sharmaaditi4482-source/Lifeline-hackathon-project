import { generateText, hasGeminiKey } from "./provider";
import { retrieveChunks } from "./vectorStore";

let warmed = false;

/**
 * Pre-warm the Gemini models at server start (fire-and-forget).
 * - Builds the in-memory embedding index for the RAG knowledge base.
 * - Sends one tiny generation to wake up the model so the first user request
 *   avoids the ~60s cold-start and returns quickly.
 * Runs only when a GEMINI_API_KEY is configured; safe to call repeatedly.
 */
export async function warmUpGemini(): Promise<void> {
  if (!hasGeminiKey()) return;
  if (warmed) return;
  warmed = true;

  try {
    await Promise.allSettled([
      generateText("Say OK.", { temperature: 0, maxOutputTokens: 5 }),
      retrieveChunks("blood donation shelf life", 1),
    ]);
  } catch {
    /* warmup best-effort only */
  }
}