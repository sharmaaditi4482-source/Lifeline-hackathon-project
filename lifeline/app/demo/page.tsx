"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { BloodRequest } from "@/lib/types";
import JudgeDemoRunner from "@/components/demo/JudgeDemoRunner";
import BroadcastSimulator from "@/components/ai/BroadcastSimulator";
import ConcurrencyRace from "@/components/demo/ConcurrencyRace";
import DeliveryTracker from "@/components/DeliveryTracker";

const STEPS = [
  { key: "play", label: "Watch the Story Unfold", emoji: "▶️" },
  { key: "sos", label: "Emergency SOS Raised", emoji: "🆘" },
  { key: "match", label: "4-Factor Matching Scores", emoji: "🧮" },
  { key: "lock", label: "First-Confirmed-Lock Race", emoji: "⚔️" },
  { key: "explain", label: "AI Explains the Match", emoji: "🤖" },
  { key: "broadcast", label: "AI Donor Broadcast (WhatsApp)", emoji: "📤" },
  { key: "delivery", label: "Blinkit-style Delivery", emoji: "🛵" },
  { key: "narrative", label: "AI Regional Narrative", emoji: "📊" },
] as const;

export default function DemoPage() {
  const [activeStep, setActiveStep] = useState<string>("play");
  const [done, setDone] = useState(false);
  const stepRefs = useRef<Record<string, HTMLElement | null>>({});

  const scrollToStep = (key: string) => {
    stepRefs.current[key]?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      {/* ── Header ── */}
      <div className="mb-8 flex flex-col items-start gap-5">
        <div className="inline-flex items-center gap-2 rounded-full bg-red-100/70 border border-red-200 px-4 py-1.5">
          <span className="h-2 w-2 rounded-full bg-blood animate-pulse" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-blood">
            One-Click Guided Judge Demo
          </span>
        </div>
        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          The story of one emergency.
          <br />
          Told by the whole system.
        </h1>
        <p className="max-w-2xl text-sm text-ink-60 leading-relaxed">
          Every step below runs against the real LifeLine backend in this browser window —
          a live request is created, the deterministic matching engine ranks real candidates,
          the first-confirmed-lock survives a 5-hospital race, and the Gemini-powered AI layer
          narrates, explains, and broadcasts at each stage.
        </p>

        {/* Step progress chips */}
        <div className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.key}
              onClick={() => scrollToStep(s.key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[11px] font-semibold transition ${
                activeStep === s.key
                  ? "border-blood bg-blood text-white shadow-sm"
                  : "border-ink-10 bg-white text-ink-60 hover:border-ink"
              }`}
            >
              <span>{s.emoji}</span>
              <span className="hidden sm:inline">{s.label}</span>
              <span className="sm:hidden">{i + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Step 1: The Runner ── */}
      <section
        ref={(el) => { stepRefs.current["play"] = el; }}
        className="mb-10 scroll-mt-24"
      >
        <JudgeDemoRunner onStepChange={(key) => { setActiveStep(key); setDone(key === "done"); }} />
      </section>

      {/* ── Step 5: Broadcast ── */}
      <section
        ref={(el) => { stepRefs.current["broadcast"] = el; }}
        className="mb-10 scroll-mt-24"
      >
        <StepLabel step="broadcast" title="AI Donor Broadcast (WhatsApp-style)" desc="The AI Copilot drafts 3 personalized WhatsApp outreach messages through the live Gemini endpoint — then watches donors respond." />
        <BroadcastSimulator />
      </section>

      {/* ── Step 5.5: Blinkit-style hyperlocal delivery ── */}
      <section
        ref={(el) => { stepRefs.current["delivery"] = el; }}
        className="mb-10 scroll-mt-24"
      >
        <StepLabel step="delivery" title="Blinkit-style Hyperlocal Delivery" desc="The matched unit doesn't wait in a queue — it's handed to the nearest rider with a live golden-hour ETA, tracked to the hospital door." />
        <DeliveryTracker />
      </section>

      {/* ── Step 4 (embedded): Lock race ── */}
      <section
        ref={(el) => { stepRefs.current["lock"] = el; }}
        className="mb-10 scroll-mt-24"
      >
        <StepLabel step="lock" title="First-Confirmed-Lock · 5-Hospital Race" desc="Five hospitals race to confirm the same request. The atomic in-process lock guarantees exactly one 200 and four 409s — zero double-booking." />
        <ConcurrencyRace />
      </section>

      {/* ── Outcome callout ── */}
      {done && (
        <section className="rounded-3xl border border-emerald-200 bg-emerald-50 p-8 text-center">
          <p className="text-3xl">🎖️</p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
            Demo complete — the full loop ran live.
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-ink-60">
            Identical pipeline powers the{" "}
            <Link href="/hospital" className="font-semibold text-blood hover:underline">Emergency Desk</Link>,{" "}
            <Link href="/analytics" className="font-semibold text-blood hover:underline">Analytics</Link> and{" "}
            <Link href="/copilot" className="font-semibold text-blood hover:underline">AI Copilot</Link> pages.
          </p>
        </section>
      )}

      {/* Shared state fingerprint */}
      <SharedStateNote request={null} />
    </main>
  );
}

function StepLabel({ step, title, desc }: { step: string; title: string; desc: string }) {
  const tag = step.toUpperCase().replace(/-/g, " ");
  return (
    <div className="mb-4 flex items-start gap-3">
      <span className="mt-1 rounded-lg bg-ink px-2 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-white">
        {tag}
      </span>
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-xs text-ink-60 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

function SharedStateNote({ request }: { request: BloodRequest | null }) {
  return (
    <p className="mt-12 text-center font-mono text-[10px] uppercase tracking-widest text-ink-40">
      {request ? `in-memory state: ${request.id}` : "single shared in-memory supply pool · Next.js 16 · App Router · Gemini live"}
    </p>
  );
}