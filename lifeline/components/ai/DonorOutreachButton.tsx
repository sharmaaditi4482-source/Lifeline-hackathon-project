"use client";

import { useState } from "react";

interface Props {
  donorName: string;
  bloodGroup: string;
  distanceKm: number;
  urgency: string;
  requestId: string;
  verified?: boolean;
  language?: "en" | "hi";
}

export default function DonorOutreachButton({
  donorName,
  bloodGroup,
  distanceKm,
  urgency,
  requestId,
  verified,
  language = "en",
}: Props) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleClick() {
    if (message) return;
    setLoading(true);
    try {
      const res = await fetch("/api/ai/outreach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ donorName, bloodGroup, distanceKm, urgency, requestId, verified, language }),
      });
      const json = await res.json();
      setMessage(json.message || "Message unavailable.");
    } catch {
      setMessage("Could not generate the message.");
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
        className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 font-mono text-xs font-semibold text-sky-700 transition-colors hover:bg-sky-100 disabled:opacity-40"
      >
        {loading ? "Writing…" : message ? "💬 AI Message" : "💬 AI Donor Message"}
      </button>
      {message && (
        <div className="mt-2 rounded-xl border border-sky-100 bg-sky-50/50 p-3 text-sm leading-relaxed text-ink whitespace-pre-wrap">
          {message}
        </div>
      )}
    </div>
  );
}