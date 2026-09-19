"use client";

import { useState } from "react";

interface Props {
  hospitalName: string;
  bloodGroup: string;
  unitsNeeded: number;
  urgency: string;
  locationLabel: string;
  topSourceName?: string;
  topScore?: number;
  contactName?: string;
}

export default function SosSummaryCard(props: Props) {
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<string | null>(null);

  async function handleGenerate() {
    if (alert) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/sos-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props),
      });
      const json = await res.json();
      setAlert(json.alert || "Summary unavailable.");
    } catch {
      setAlert("Could not generate the alert.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-2xl border border-orange-200 bg-orange-50/40 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">📢</span>
          <p className="font-mono text-xs font-bold uppercase tracking-widest text-orange-700">
            Gen-AI Emergency Summary & Broadcast
          </p>
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
          className="rounded-xl bg-orange-600 px-4 py-2 font-mono text-xs font-bold text-white transition-colors hover:bg-orange-700 disabled:opacity-40"
        >
          {loading ? "Generating…" : alert ? "Alert Ready ⚡" : "Generate Bilingual Alert"}
        </button>
      </div>
      {alert && (
        <div className="mt-3 space-y-2 rounded-xl border border-orange-200 bg-white p-4 font-mono text-sm leading-relaxed text-ink whitespace-pre-wrap">
          {alert}
        </div>
      )}
    </div>
  );
}