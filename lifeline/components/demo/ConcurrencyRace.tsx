"use client";

import { useEffect, useRef, useState } from "react";
import { BloodRequest, MatchResult } from "@/lib/types";

interface RaceResult {
  id: string;
  hospitalName: string;
  status: number;
  statusText: string;
  result: string;
  elapsedMs: number;
};

const RACERS = [
  { name: "AIIMS Trauma", color: "#B91C1C" },
  { name: "Safdarjung Hospital", color: "#C2410C" },
  { name: "Max Smart Saket", color: "#B45309" },
  { name: "Fortis Escorts", color: "#A16207" },
  { name: "Apollo Indraprastha", color: "#0E7490" },
];

function fmt(ms: number) {
  return `${ms} ms`;
}

export default function ConcurrencyRace() {
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [topMatch, setTopMatch] = useState<MatchResult | null>(null);
  const [results, setResults] = useState<RaceResult[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => () => timersRef.current.forEach(clearTimeout), []);

  const reset = () => {
    setRequest(null);
    setTopMatch(null);
    setResults([]);
    setError(null);
  };

  const launchRace = async () => {
    if (running) return;
    setRunning(true);
    reset();
    try {
      // Step 1: Create a fresh request so the race is honest
      const createRes = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalName: "Demo Trauma Centre",
          bloodGroup: "O+",
          unitsNeeded: 1,
          urgency: "critical",
          location: { lat: 28.5255, lng: 77.2136, label: "Safdarjung Enclave, Delhi" },
        }),
      });
      const createData = await createRes.json();
      if (!createRes.ok || !createData.request) {
        setError(createData.error || "Failed to create request.");
        setRunning(false);
        return;
      }
      setRequest(createData.request);
      const top = createData.matches?.[0] ?? null;
      setTopMatch(top);

      // Step 2: Fire 5 concurrent confirmations at the SAME request
      const requestId = createData.request.id;
      const starts: RaceResult[] = RACERS.map((r, i) => ({
        id: `r${i}`,
        hospitalName: r.name,
        status: 0,
        statusText: "in-flight",
        result: "…",
        elapsedMs: 0,
      }));
      setResults(starts);

      const responses = await Promise.all(
        RACERS.map(async (r, i) => {
          const t0 = performance.now();
          const res = await fetch("/api/match/confirm", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              requestId,
              confirmedSourceId: top?.sourceId || "donor_demo_1",
              confirmedSourceName: r.name,
            }),
          });
          const elapsed = Math.round(performance.now() - t0);
          let body: any = {};
          try {
            body = await res.json();
          } catch {}
          return { i, res, body, elapsed };
        })
      );

      const winners = responses.filter((r) => r.res.status === 200).length;

      // Render results in order received (arrival order matters in a real race)
      responses
        .slice()
        .sort((a, b) => a.elapsed - b.elapsed)
        .forEach(({ i, res, body, elapsed }, pos) => {
          const t = window.setTimeout(() => {
            const winner = res.status === 200;
            setResults((prev) =>
              prev.map((r) =>
                r.id === `r${i}`
                  ? {
                      ...r,
                      status: res.status,
                      statusText: winner ? "WINNER" : "REJECTED",
                      result: winner
                        ? (body.message || "Match locked.")
                        : (body.error || "First-confirmed-lock denied."),
                      elapsedMs: elapsed,
                    }
                  : r
              )
            );
          }, pos * 400);
          timersRef.current.push(t);
        });

      const t2 = window.setTimeout(() => setRunning(false), responses.length * 420 + 300);
      timersRef.current.push(t2);
      console.info(`race-summary: ${winners}/5 won, ${responses.length - winners}/5 rejected`);
    } catch {
      setError("Race harness failed. Please try again.");
      setRunning(false);
    }
  };

  const winners = results.filter((r) => r.status === 200).length;
  const losers = results.filter((r) => r.status === 409).length;

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-ink-10 bg-white shadow-xl">
      <div className="flex items-center justify-between border-b border-ink-10 bg-gradient-to-r from-ink to-[#1C1917] px-5 py-3.5 text-white">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80] animate-pulse" />
          <span className="font-display text-sm font-semibold">First-Confirmed-Lock Race</span>
        </div>
        <span className="font-mono text-[10px] text-white/50">5 hospitals · same request · one lock</span>
      </div>

      <div className="p-5">
        {/* Scenario description */}
        <p className="mb-4 rounded-2xl border border-ink-10 bg-ink-5/50 px-4 py-3 font-mono text-[11px] leading-relaxed text-ink-60">
          A single critical O+ request is broadcast to <strong className="text-blood">5 competing hospitals</strong>. All five
          click "Confirm" at nearly the same instant. The atomic lock guarantees{" "}
          <strong className="text-ink">exactly one succeeds (200)</strong> — every other hospital is bounced with a{" "}
          <strong className="text-blood">409 Conflict</strong>, with zero double-booking.
        </p>

        {/* Live lane diagram */}
        <div className="mb-5 space-y-2">
          {results.length === 0 && !running && (
            <p className="py-3 text-center font-mono text-xs text-ink-40">
              Launch the race to see the lanes fill with in-flight requests…
            </p>
          )}
          {results.map((r, i) => (
            <div key={r.id} className="flex items-center gap-3">
              <span className="w-4 font-mono text-[10px] text-ink-40">#{i + 1}</span>
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: RACERS[i].color }} />
              <span className="flex-1 font-mono text-[11px] font-semibold text-ink">{r.hospitalName}</span>
              {r.status === 0 ? (
                <span className="flex items-center gap-2 font-mono text-[11px] text-ink-40">
                  <span className="h-2 w-2 animate-ping rounded-full bg-amber-400" />
                  {running ? "in-flight…" : "standby"}
                </span>
              ) : (
                <span
                  className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold tracking-wide ${
                    r.status === 200
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-red-100 text-blood"
                  }`}
                >
                  {r.statusText}
                </span>
              )}
              <span className="w-16 text-right font-mono text-[10px] text-ink-40">
                {r.status === 0 ? "" : fmt(r.elapsedMs)}
              </span>
            </div>
          ))}
        </div>

        {/* Summary verdict */}
        {results.some((r) => r.status === 200) && (
          <div className="mb-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                Winner · HTTP 200
              </p>
              <p className="mt-1 font-display text-xl font-bold text-ink">
                {results.find((r) => r.status === 200)?.hospitalName}
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-ink-40">
                {results.find((r) => r.status === 200)?.result}
              </p>
            </div>
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-blood">
                Rejected · HTTP 409
              </p>
              <p className="mt-1 font-display text-xl font-bold text-ink">
                {losers}/{results.length} hospitals blocked
              </p>
              <p className="mt-0.5 font-mono text-[10px] text-ink-40">
                All released candidates auto-freed back to the pool.
              </p>
            </div>
          </div>
        )}

        {request && (
          <div className="mb-5 rounded-2xl border border-ink-10 bg-ink text-white px-4 py-3 font-mono text-[11px]">
            <span className="text-white/50">race-request → </span>
            <span className="text-emerald-300">{request.id}</span>
            <span className="text-white/50"> · </span>
            <span className="text-white">{request.bloodGroup}</span>
            <span className="text-white/50"> · </span>
            <span className="text-amber-300">{topMatch?.sourceName ?? "waiting for candidate"}</span>
          </div>
        )}

        {error && (
          <p className="mb-4 rounded-xl border border-blood/30 bg-red-50 px-4 py-2.5 font-mono text-xs text-blood">
            ⚠ {error}
          </p>
        )}

        <button
          onClick={() => void launchRace()}
          disabled={running}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blood to-red-600 px-4 py-3 font-display text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {running ? (
            <>
              <span className="h-2 w-2 animate-ping rounded-full bg-white" />
              Racing {RACERS.length} hospitals…
            </>
          ) : (
            <>⚔️ Launch the 5-hospital lock race</>
          )}
        </button>
      </div>
    </div>
  );
}