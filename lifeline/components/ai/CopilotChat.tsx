"use client";

import { useState } from "react";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
  streaming?: boolean;
}

const SUGGESTIONS = [
  "Which blood groups can an O-negative patient receive?",
  "What are the WHO donor eligibility criteria?",
  "Why is the 90-day donation gap necessary?",
  "What is the shelf life of stored blood?",
  "How is a massive transfusion protocol run?",
];

interface StreamHandlers {
  onRetrieving?: () => void;
  onChunk: (text: string) => void;
  onDone?: (meta: { mode: string; citations: string[] }) => void;
  onError: (message: string) => void;
}

/** POST to an SSE endpoint and parse `data:` frames with the Fetch Streams API. */
async function postSse(url: string, body: unknown, handlers: StreamHandlers): Promise<void> {
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
        if (json.type === "retrieving") handlers.onRetrieving?.();
        else if (json.type === "chunk") handlers.onChunk(String(json.text ?? ""));
        else if (json.type === "done") handlers.onDone?.({ mode: json.mode, citations: json.citations });
        else if (json.type === "error") handlers.onError(String(json.message ?? "Unknown error."));
      } catch {
        // ignore malformed frames
      }
    }
  }
}

export default function CopilotChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"llm" | "fallback" | null>(null);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    setInput("");
    setMode(null);
    setMessages((prev) => [...prev, { role: "user", content: q }]);
    setLoading(true);

    // Assistant bubble starts empty and fills up as tokens stream in.
    setMessages((prev) => [...prev, { role: "assistant", content: "", streaming: true }]);

    try {
      await postSse(
        "/api/ai/copilot/stream",
        { question: q },
        {
          onRetrieving: () => {
            // Optional: surface the retrieval step in the UI header.
          },
          onChunk: (text) => {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") copy[copy.length - 1] = { ...last, content: last.content + text };
              return copy;
            });
          },
          onDone: ({ mode: m, citations }) => {
            if (m) setMode(m as "llm" | "fallback");
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                const hadContent = last.content.trim().length > 0;
                copy[copy.length - 1] = {
                  ...last,
                  streaming: false,
                  content: hadContent ? last.content : "I could not answer that right now. Please try again.",
                  citations: hadContent ? citations : undefined,
                };
              }
              return copy;
            });
          },
          onError: (message) => {
            setMessages((prev) => {
              const copy = [...prev];
              const last = copy[copy.length - 1];
              if (last?.role === "assistant") {
                const hadContent = last.content.trim().length > 0;
                copy[copy.length - 1] = {
                  ...last,
                  streaming: false,
                  content: hadContent ? last.content : message,
                };
              }
              return copy;
            });
          },
        }
      );
    } catch {
      setMessages((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last?.role === "assistant") {
          copy[copy.length - 1] = {
            ...last,
            streaming: false,
            content: last.content.trim().length > 0 ? last.content : "Network error — the copilot could not be reached.",
          };
        }
        return copy;
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
      {/* Chat window */}
      <div className="card-2xl flex flex-col overflow-hidden bg-white border border-ink-10">
        <div className="flex items-center justify-between border-b border-ink-10 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-blood to-red-600 text-white text-sm shadow-sm">
              🤖
            </div>
            <div>
              <p className="font-display text-sm font-bold text-ink">Medical Copilot</p>
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-40">
                RAG · Gemini LLM · 15 medical chunks
              </p>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-[11px] font-semibold ${
              mode === "llm"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-amber-50 text-amber-700 border border-amber-200"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${mode === "llm" ? "bg-emerald-500" : "bg-amber-500"} animate-pulse`} />
            {loading ? "Streaming…" : mode === "llm" ? "Gemini Live" : mode === "fallback" ? "Offline Fallback" : "Ready"}
          </span>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-5" style={{ maxHeight: "480px", minHeight: "360px" }}>
          {messages.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="text-4xl">🩺</p>
              <p className="mt-3 font-display text-sm font-semibold text-ink">Ask anything about blood matching & transfusion safety</p>
              <p className="mt-1 max-w-xs font-mono text-xs text-ink-40">
                Answers are grounded on the LifeLine medical knowledge base with sources cited.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blood text-white rounded-br-md"
                    : "bg-ink-5 text-ink border border-ink-10 rounded-bl-md"
                }`}
              >
                {msg.content}
                {msg.streaming && (
                  <span className="ml-0.5 inline-block h-3.5 w-1.5 translate-y-0.5 animate-pulse rounded-sm bg-blood" />
                )}
                {msg.citations && msg.citations.length > 0 && !msg.streaming && (
                  <div className="mt-2 border-t border-ink-10 pt-2">
                    <p className="font-mono text-[10px] uppercase tracking-widest text-ink-40">Sources</p>
                    {msg.citations.map((c, j) => (
                      <p key={j} className="mt-0.5 font-mono text-[11px] text-ink-60">· {c}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && messages.filter((m) => m.role === "assistant").length === 0 && (
            <div className="flex justify-start">
              <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-ink-5 border border-ink-10 px-4 py-3">
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="h-2 w-2 rounded-full bg-blood animate-bounce"
                      style={{ animationDelay: `${i * 120}ms` }}
                    />
                  ))}
                </span>
                <span className="font-mono text-xs text-ink-40">Retrieving & synthesizing…</span>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions */}
        <div className="flex flex-wrap gap-2 border-t border-ink-10 px-5 py-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              disabled={loading}
              onClick={() => ask(s)}
              className="rounded-full border border-blood/20 bg-blood-50 px-3 py-1 font-mono text-[11px] text-blood transition-colors hover:bg-blood hover:text-white disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <form
          className="border-t border-ink-10 p-3"
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
        >
          <div className="flex items-center gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. Why can AB+ receive from everyone?"
              className="flex-1 rounded-xl border border-ink-10 bg-white px-4 py-2.5 text-sm text-ink placeholder:text-ink-40 focus:border-blood focus:outline-none"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="rounded-xl bg-blood px-5 py-2.5 font-mono text-xs font-bold text-white transition-all hover:bg-blood-light disabled:opacity-40"
            >
              Ask →
            </button>
          </div>
        </form>
      </div>

      {/* RAG explainer panel */}
      <div className="card-2xl border border-ink-10 bg-white p-5">
        <p className="font-mono text-xs font-bold uppercase tracking-widest text-ink">How RAG works here</p>
        <ol className="mt-3 space-y-3 text-sm text-ink-70">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-blood/10 font-mono text-xs font-bold text-blood">1</span>
            <p><span className="font-semibold text-ink">Retrieve</span> — question is embedded and top-4 relevant medical chunks are fetched by cosine similarity.</p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-blood/10 font-mono text-xs font-bold text-blood">2</span>
            <p><span className="font-semibold text-ink">Augment</span> — retrieved protocol text is injected into the prompt as grounded context.</p>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg bg-blood/10 font-mono text-xs font-bold text-blood">3</span>
            <p><span className="font-semibold text-ink">Generate</span> — Gemini streams the answer token-by-token over SSE, cited from the retrieved context.</p>
          </li>
        </ol>
        <div className="mt-5 rounded-xl border border-ink-10 bg-ink-5 p-3 font-mono text-[11px] text-ink-60">
          <p className="text-ink-40">💡 Without a GEMINI_API_KEY the copilot runs a deterministic retrieval + template fallback, so this demo always works offline.</p>
        </div>
      </div>
    </div>
  );
}