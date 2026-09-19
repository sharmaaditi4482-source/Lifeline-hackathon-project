"use client";

import Link from "next/link";
import LanguageToggle from "@/components/LanguageToggle";
import CopilotChat from "@/components/ai/CopilotChat";

export default function CopilotPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14 page-enter">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/"
          className="inline-block font-mono text-xs uppercase tracking-widest text-ink-60 transition-colors hover:text-ink"
        >
          ← Back to Home
        </Link>
        <LanguageToggle />
      </div>

      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-blood/20 bg-blood-50 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-blood">
          <span className="h-2 w-2 rounded-full bg-blood animate-pulse" />
          RAG · LLM · Gen-AI Module
        </span>
        <h1 className="mt-3 font-display text-3xl font-bold text-ink sm:text-4xl">
          Medical Copilot
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-60">
          A retrieval-augmented assistant for hospital staff — ask about ABO/Rh
          compatibility, donor eligibility, storage protocols, and emergency
          response. Every answer cites the grounded medical sources it was
          generated from.
        </p>
      </div>

      <CopilotChat />
    </main>
  );
}