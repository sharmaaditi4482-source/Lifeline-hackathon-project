export interface SseHandlers {
  onChunk: (text: string) => void;
  onDone?: (meta: Record<string, unknown>) => void;
  onError: (message: string) => void;
}

/**
 * POST to an SSE endpoint and parse `data:` frames with the Fetch Streams API.
 * Works for any endpoint that sends `data: {json}\n\n` frames.
 */
export async function postSse(url: string, body: unknown, handlers: SseHandlers): Promise<void> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok || !res.body) {
    let message = `Request failed (${res.status}).`;
    try {
      const j = await res.json();
      if (j.error) message = j.error;
    } catch {
      // keep generic
    }
    handlers.onError(message);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const frames = buffer.split("\n\n");
    buffer = frames.pop() ?? "";
    for (const frame of frames) {
      const dataLine = frame.split("\n").find((l) => l.startsWith("data:"));
      if (!dataLine) continue;
      const payload = dataLine.slice(5).trim();
      if (!payload) continue;
      try {
        const json = JSON.parse(payload);
        if (json.type === "chunk") handlers.onChunk(String(json.text ?? ""));
        else if (json.type === "done") handlers.onDone?.(json);
        else if (json.type === "error") handlers.onError(String(json.message ?? "Unknown error."));
      } catch {
        // ignore malformed frames
      }
    }
  }
}