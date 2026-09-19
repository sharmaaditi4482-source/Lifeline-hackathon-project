const API_BASE = "https://generativelanguage.googleapis.com/v1beta";

function getGeminiConfig() {
  return {
    apiKey: process.env.GEMINI_API_KEY || "",
    model: process.env.GEMINI_MODEL || "gemini-3.5-flash-lite",
    embeddingModel: process.env.GEMINI_EMBEDDING_MODEL || "gemini-embedding-2",
  };
}

export function hasGeminiKey(): boolean {
  return getGeminiConfig().apiKey.length > 0;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Stream a Gemini generateContent response via the SSE streaming endpoint.
 * The `onChunk` callback receives each text delta as it arrives so callers can
 * repaint a typewriter effect. Returns the concatenated full text, or null on
 * any failure (rate-limit / network / model error) so the caller can fall back
 * to a deterministic template — the demo never breaks.
 */
export async function streamGenerateText(
  prompt: string,
  opts: {
    temperature?: number;
    maxOutputTokens?: number;
    onChunk?: (delta: string) => void;
  } = {}
): Promise<string | null> {
  const { apiKey, model } = getGeminiConfig();
  if (!apiKey) return null;

  const { temperature = 0.6, maxOutputTokens = 768, onChunk } = opts;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(
        `${API_BASE}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens },
          }),
          signal: AbortSignal.timeout(90000),
        }
      );

      if (res.status === 429) {
        await sleep(2000 * (attempt + 1));
        continue; // rate-limited: back off and retry
      }
      if (!res.ok || !res.body) return null;

      let full = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by double newlines; parse each complete one.
        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";
        for (const frame of frames) {
          const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
          if (!dataLine) continue;
          const payload = dataLine.slice(5).trim();
          if (!payload) continue;
          try {
            const json = JSON.parse(payload);
            const delta: string | undefined =
              json?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (typeof delta === "string" && delta.length > 0) {
              full += delta;
              onChunk?.(delta);
            }
          } catch {
            // Ignore malformed SSE frames (keepalive `data: {}` etc.)
          }
        }
      }

      if (full.trim().length > 0) return full.trim();
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Try to reach Gemini's generateContent REST endpoint.
 * Any failure (no key, network, model removed, rate-limit) returns null so the
 * caller can fall back to a deterministic template — the demo never breaks.
 */
export async function generateText(
  prompt: string,
  opts: { temperature?: number; maxOutputTokens?: number } = {}
): Promise<string | null> {
  const { apiKey, model } = getGeminiConfig();
  if (!apiKey) return null;

  const { temperature = 0.6, maxOutputTokens = 768 } = opts;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(
        `${API_BASE}/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens },
          }),
          signal: AbortSignal.timeout(90000),
        }
      );

      if (res.status === 429) {
        await sleep(2000 * (attempt + 1));
        continue; // rate-limited: back off and retry
      }
      if (!res.ok) return null;

      const json = await res.json();
      const text: string | undefined = json?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof text === "string" && text.trim().length > 0) return text.trim();
      return null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Generate a single vector (embedding) for a piece of text using Gemini's
 * text-embedding model. Returns null on any failure so callers can fall back
 * to a lightweight keyword overlap scorer.
 */
export async function embedText(text: string): Promise<number[] | null> {
  const { apiKey, embeddingModel } = getGeminiConfig();
  if (!apiKey) return null;

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(
        `${API_BASE}/models/${embeddingModel}:embedContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: `models/${embeddingModel}`,
            content: { parts: [{ text }] },
          }),
          signal: AbortSignal.timeout(15000),
        }
      );

      if (res.status === 429) {
        await sleep(1500 * (attempt + 1));
        continue; // rate-limited: back off and retry
      }
      if (!res.ok) return null;

      const json = await res.json();
      const values: number[] | undefined = json?.embedding?.values;
      if (Array.isArray(values) && values.length > 0) return values;
      return null;
    } catch {
      return null;
    }
  }
  return null;
}