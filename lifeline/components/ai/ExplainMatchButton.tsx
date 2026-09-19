"use client";

import { useState } from "react";
import type { BloodRequest, MatchResult } from "@/lib/types";

interface Props {
  request: BloodRequest;
  match: MatchResult;
  compact?: boolean;
}

export default function ExplainMatchButton({ request, match, compact }: Props) {
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  async function handleClick() {
    if (explanation) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request, match }),
      });
      const json = await res.json();
      setExplanation(json.explanation || "Explanation unavailable.");
    } catch {
      setExplanation("Could not reach the explainer.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`rounded-xl border border-violet-200 bg-violet-50 font-mono text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-100 disabled:opacity-40 ${
          compact ? "px-3 py-1.5" : "px-4 py-2"
        }`}
      >
        {loading ? "Thinking…" : explanation ? "🤖 Why this match?" : "🤖 Explain Match"}
      </button>
      {explanation && (
        <div className="mt-2 rounded-xl border border-violet-100 bg-violet-50/50 p-3 text-sm leading-relaxed text-ink whitespace-pre-wrap">
          {explanation}
        </div>
      )}
    </div>
  );
}