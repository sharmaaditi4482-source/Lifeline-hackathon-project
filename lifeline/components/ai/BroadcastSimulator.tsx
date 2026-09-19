"use client";

import { useEffect, useRef, useState } from "react";

interface ChatMessage {
  id: string;
  role: "platform" | "donor" | "system";
  sender: string;
  body: string;
  time: string;
  status?: "pending" | "delivered" | "read" | "failed";
};

interface DonorProfile {
  name: string;
  bloodGroup: string;
  distanceKm: number;
  verified: boolean;
  emoji: string;
  replies: string[];
  eta: string;
};

const DONORS: DonorProfile[] = [
  {
    name: "Rahul Verma",
    bloodGroup: "O+",
    distanceKm: 1.8,
    verified: true,
    emoji: "🙋",
    replies: ["YES!! I'm 10 mins away — heading to Safdarjung now. 🩸", "Reached the counter, please add me to the queue."],
    eta: "10 min",
  },
  {
    name: "Anita Deshmukh",
    bloodGroup: "O+",
    distanceKm: 3.4,
    verified: true,
    emoji: "🩸",
    replies: ["On my way, will call on arrival.", "Confirmed. ETA 12 mins."],
    eta: "12 min",
  },
  {
    name: "Vikram Singh",
    bloodGroup: "B+",
    distanceKm: 5.1,
    verified: false,
    emoji: "⚠️",
    replies: ["Need 20 extra mins, stuck in traffic.", "Reaching in ~30 mins, please wait."],
    eta: "30 min",
  },
];

function nowTime(): string {
  return new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export default function BroadcastSimulator() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState<"llm" | "template" | null>(null);
  const [llmTimer, setLlmTimer] = useState<number | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => timersRef.current.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const push = (fields: Omit<ChatMessage, "time">) => {
    const msg: ChatMessage = { ...fields, time: nowTime() };
    setMessages((m) => [...m, msg]);
    return msg;
  };

  const schedule = (delayMs: number, fn: () => void) => {
    const id = window.setTimeout(fn, delayMs);
    timersRef.current.push(id);
  };

  const startBroadcast = async () => {
    if (running) return;
    setRunning(true);
    setMessages([]);
    setMode(null);
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];

    // Intro
    schedule(300, () => push({ id: `sys0`, role: "system", sender: "LifeLine Engine", body: "AIR-REAP-091 · O+ · Safdarjung Enclave, Delhi · emergency lockdown initiated" }));
    schedule(900, () => push({ id: "sys1", role: "system", sender: "Match Engine", body: "Ranked 3 donors within 5 km using 4-factor scoring (urgency · distance · expiry · reliability)" }));
    schedule(1400, () => push({ id: "sys2", role: "system", sender: "AI Copilot", body: "Drafting personalized WhatsApp outreach for 3 top donors…" }));

    // AI writes 3 personal outreach messages (real LLM calls)
    const start = Date.now();
    for (let i = 0; i < DONORS.length; i++) {
      const d = DONORS[i];
      schedule(2000 + i * 250, () => {
        push({ id: `p${i}`, role: "platform", sender: "LifeLine (to " + d.name + ")", body: `Drafting via AI…`, status: "pending" });
        void (async () => {
          const res = await fetch("/api/ai/outreach", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              donorName: d.name,
              bloodGroup: d.bloodGroup,
              distanceKm: d.distanceKm,
              urgency: "high",
              requestId: "req_AI201",
              language: "en",
              verified: d.verified,
            }),
          });
          const data = await res.json();
          const timing = Math.round((Date.now() - start) / 1000);
          setMessages((m) =>
            m.map((msg) =>
              msg.id === `p${i}`
                ? {
                    ...msg,
                    body: data.message || data.error || "…",
                    status: "delivered",
                  }
                : msg
            )
          );
          if (i === 0 && data.mode) setMode(data.mode);
          schedule(800 + timing * 300, () => scheduleDonorReplies(d, i));
        })();
      });
    }
  };

  const scheduleDonorReplies = (d: DonorProfile, index: number) => {
    const donorId = `d${index}`;
    schedule(200, () =>
      setMessages((m) => [...m, { id: donorId, role: "donor", sender: d.name, body: "typing…", time: "" } as ChatMessage])
    );
    schedule(1400, () => {
      setMessages((m) => m.map((msg) => (msg.id === donorId ? { ...msg, body: d.replies[0], time: nowTime() } : msg)));
      schedule(900, () => {
        setMessages((m) => m.map((msg) => (msg.id === donorId ? { ...msg, body: d.replies[1] } : msg)));
        schedule(700, () => {
          push({ id: `eta${index}`, role: "system", sender: "Dispatch Tracker", body: `${d.name} confirmed · ETA ${d.eta} · unit reserved (${d.bloodGroup})` });
        });
      });
    });
  };

  const formatMode = (m: string | null) =>
    m === "llm" ? "LIVE GEMINI MODEL" : m === "template" ? "FALLBACK TEMPLATE" : null;

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-ink-10 bg-white shadow-xl">
      {/* WhatsApp-style header */}
      <div className="flex items-center gap-3 bg-gradient-to-r from-[#075E54] to-[#128C7E] px-5 py-3.5 text-white">
        <div className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-display text-sm font-bold">
          🩸
          <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-[#075E54] bg-[#4ADE80]" />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-semibold">LifeLine Broadcast · Donor Squad</p>
          <p className="font-mono text-[10px] text-white/70">3 verified contracts · online</p>
        </div>
        <span className="rounded-full bg-white/15 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider">
          {mode ? formatMode(mode) : "AI"}
        </span>
      </div>

      {/* Chat body */}
      <div ref={chatRef} className="flex h-[420px] flex-col gap-2 space-y-1.5 overflow-y-auto bg-[#ECE5DD] bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2260%22%20height%3D%2260%22%3E%3Cpath%20d%3D%22M0%200h60v60H0z%22%20fill%3D%22none%22/%3E%3Ccircle%20cx%3D%2210%22%20cy%3D%2210%22%20r%3D%221%22%20fill%3D%22%23000000%22%20opacity%3D%220.04%22/%3E%3C/svg%3E')] p-4" style={{ backgroundColor: "#ECE5DD" }}>
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "donor" ? "justify-end" : "justify-start"} animate-fade-slide-up`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[13px] shadow-sm ${
                msg.role === "donor"
                  ? "rounded-br-md bg-[#DCF8C6] text-[#111B21]"
                  : msg.role === "system"
                  ? "bg-ink text-white"
                  : "rounded-bl-md bg-white text-[#111B21]"
              }`}
            >
              {msg.role !== "system" && (
                <p className={`mb-0.5 font-mono text-[10px] font-bold uppercase tracking-wide ${msg.role === "donor" ? "text-[#075E54]" : "text-blood"}`}>
                  {msg.sender}
                </p>
              )}
              <p className={msg.body.includes("…") && msg.time === "" ? "italic opacity-60" : ""}>{msg.body}</p>
              <div className="mt-1 flex items-center justify-end gap-1 font-mono text-[9px] text-ink-40">
                <span>{msg.time || ""}</span>
                {msg.status === "pending" && <span className="text-amber-600">…</span>}
                {msg.status === "delivered" && <span>✓✓</span>}
              </div>
            </div>
          </div>
        ))}
        {!running && messages.length === 0 && (
          <div className="flex h-full items-center justify-center">
            <p className="max-w-xs text-center font-mono text-xs text-ink-40">
              Press <span className="font-bold text-blood">Launch Broadcast</span> to watch the AI Copilot draft donor outreach messages and donors respond in real time.
            </p>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="border-t border-ink-10 bg-white px-5 py-3.5">
        <button
          onClick={() => void startBroadcast()}
          disabled={running}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#075E54] to-[#128C7E] px-4 py-2.5 font-display text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? (
            <>
              <span className="h-2 w-2 animate-ping rounded-full bg-white" />
              Broadcasting live…
            </>
          ) : (
            <>📤 Launch AI Donor Broadcast</>
          )}
        </button>
      </div>
    </div>
  );
}