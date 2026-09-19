import { retrieveChunks } from "./vectorStore";
import { generateText } from "./provider";
import type { KnowledgeChunk } from "./knowledgeBase";

export interface RagResult {
  answer: string;
  citations: string[];
  mode: "llm" | "fallback";
}

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

function buildFallbackAnswer(question: string, chunks: KnowledgeChunk[]): string {
  const sources = chunks
    .slice(0, 3)
    .map((c) => c.title)
    .join(" · ");

  return `Solved in deterministic mode — connect a Google AI Studio GEMINI_API_KEY to enable full LLM answers.

Based on the knowledge base, the most relevant references for "${question}" are:
- ${sources}

For a definitive clinical decision, always follow your hospital's standard operating procedure and consult the on-duty haematologist or blood bank officer.`;
}

/**
 * RAG (Retrieval-Augmented Generation) pipeline:
 *  1. retrieve  -> top-k knowledge chunks by semantic similarity
 *  2. augment   -> stuff the chunks into a grounded prompt
 *  3. generate  -> Gemini produces a citation-backed answer
 * Falls back to a deterministic, context-cited response when no API key is set.
 */
export async function answerMedicalQuery(question: string): Promise<RagResult> {
  const retrieved = await retrieveChunks(question, 4);
  const citations = retrieved.map((c) => c.title);

  const grounded = await generateText(buildGroundedPrompt(question, retrieved), {
    temperature: 0.4,
    maxOutputTokens: 512,
  });

  if (grounded) return { answer: grounded, citations, mode: "llm" };
  return { answer: buildFallbackAnswer(question, retrieved), citations, mode: "fallback" };
}