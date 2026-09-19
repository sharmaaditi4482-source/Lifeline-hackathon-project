"use client";

import { useState } from "react";

interface AnalyticsPayload {
  stats: {
    totalMatches: number;
    mostRequestedGroup: string;
    mostRequestedCount: number;
    averageMatchResponseTimeSeconds: number;
    totalLivesSaved: number;
  };
  trend: Array<{ label: string; count: number; completed: number }>;
  distribution: Array<{ bloodGroup: string; requests: number; liveDonors: number; bankStock: number }>;
}

export default function AnalyticsNarrative({ payload }: { payload: AnalyticsPayload }) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<string | null>(null);
  const [title, setTitle] = useState("");

  async function handleGenerate() {
    if (report) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/analytics-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      setTitle(json.title || "Report");
      setReport(json.report || "Report unavailable.");
    } catch {
      setReport("Could not generate the insight report.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-2xl border border-blood/20 bg-gradient-to-br from-blood-50/50 to-white p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-bold text-ink">🤖 Gen-AI Regional Narrator</h2>
          <p className="mt-0.5 font-mono text-xs text-ink-40">
            Converts 7-day telemetry into insights · risks · recommendations
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-xl bg-blood px-5 py-2.5 font-mono text-xs font-bold text-white transition-all hover:bg-blood-light disabled:opacity-40"
        >
          {loading ? "Analyzing telemetry…" : report ? "Report Ready ✓" : "Generate AI Insights"}
        </button>
      </div>
      {report && (
        <div className="mt-4 space-y-3">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-blood">{title}</p>
          <div className="rounded-xl border border-ink-10 bg-white p-4 text-sm leading-relaxed text-ink whitespace-pre-wrap">
            {report}
          </div>
        </div>
      )}
    </div>
  );
}