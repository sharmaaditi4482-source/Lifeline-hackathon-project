import { KNOWLEDGE_BASE, findChunksByKeywords } from "./knowledgeBase";
import type { KnowledgeChunk } from "./knowledgeBase";
import { embedText } from "./provider";

interface EmbeddedChunk {
  chunk: KnowledgeChunk;
  embedding: number[];
}

let indexPromise: Promise<EmbeddedChunk[]> | null = null;

function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Build an in-memory embedding index of the full knowledge base once, reusing
 * the cache for subsequent queries. If Gemini embedding is unavailable, returns
 * an empty index and the caller falls back to keyword scoring.
 */
async function getEmbeddingIndex(): Promise<EmbeddedChunk[]> {
  if (!indexPromise) {
    indexPromise = (async () => {
      const embedded = await Promise.all(
        KNOWLEDGE_BASE.map(async (chunk) => {
          const embedding = await embedText(`${chunk.title}\n${chunk.content}`);
          return embedding ? { chunk, embedding } : null;
        })
      );
      return embedded.filter((e): e is EmbeddedChunk => e !== null);
    })();
  }
  return indexPromise;
}

function retrieveEmbeddingTopK(queryEmbedding: number[], index: EmbeddedChunk[], k: number): KnowledgeChunk[] {
  return index
    .map(({ chunk, embedding }) => ({
      chunk,
      score: cosineSimilarity(queryEmbedding, embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map((s) => s.chunk);
}

/**
 * Retrieve the top-k most relevant knowledge chunks for a query.
 * Uses semantic retrieval (Gemini text-embedding + cosine similarity) when an
 * API key is available, and transparently falls back to keyword overlap scoring
 * otherwise, so the RAG pipeline works in fully offline/demo mode too.
 */
export async function retrieveChunks(query: string, k = 4): Promise<KnowledgeChunk[]> {
  const queryEmbedding = await embedText(query);
  if (queryEmbedding) {
    const index = await getEmbeddingIndex();
    if (index.length > 0) {
      return retrieveEmbeddingTopK(queryEmbedding, index, k);
    }
  }
  return findChunksByKeywords(query);
}