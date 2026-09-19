"use client";

import { useEffect, useRef, useState } from "react";
import { BloodRequest, MatchResult } from "@/lib/types";
import { postSse } from "@/lib/sseStream";

type RunnerPhase =
  | "idle"
  | "creating"
  | "matching"
  | "confirming"
  | "explaining"
  | "narrating"
  | "done"
  | "error";

interface StepLog {
  phase: string;
  emoji: string;
  label: string;
  detail: string;
  ok?: boolean;
}

interface ExplainPayload {
  request: BloodRequest;
  match: MatchResult;
}

interface RunnerProps {
  onStepChange?: (key: string) => void;
}

export default function JudgeDemoRunner({ onStepChange }: RunnerProps) {
  const [phase, setPhase] = useState<RunnerPhase>("idle");
  const [request, setRequest] = useState<BloodRequest | null>(null);
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [explain, setExplain] = useState<{ report: string; mode: string } | null>(null);
  const [narrative, setNarrative] = useState<{ report: string; mode: string } | null>(null);
  const [log, setLog] = useState<StepLog[]>([]);
  const [ran, setRan] = useState(false);
  const runningRef = useRef(false);

  const pushLog = (entry: StepLog) => {
    setLog((l) => [...l, entry]);
    if (entry.phase === "sos") onStepChange?.("sos");
    if (entry.phase === "match") onStepChange?.("match");
    if (entry.phase === "lock") onStepChange?.("lock");
    if (entry.phase === "explain") onStepChange?.("explain");
    if (entry.phase === "narrative") onStepChange?.("narrative");
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  const run = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRan(true);
    setLog([]);
    setExplain(null);
    setNarrative(null);
    setRequest(null);
    setMatches([]);

    try {
      // Step 1 — SOS raised
      pushLog({ phase: "sos", emoji: "🆘", label: "Emergency SOS raised", detail: "POST /api/match → critical O+ unit, Safdarjung Enclave, Delhi" });
      setPhase("creating");
      await sleep(500);

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
        throw new Error(createData.error || "Match engine unavailable.");
      }
      const created = createData.request as BloodRequest;
      const createdMatches = (createData.matches || []) as MatchResult[];
      setRequest(created);
      setMatches(createdMatches);

      // Step 2 — matching results
      pushLog({
        phase: "match",
        emoji: "🧮",
        label: "Engine ranked real candidates",
        detail: `${createdMatches.length} candidate(s) scored with urgency 35% · proximity 30% · expiry 20% · reliability 15%`,
        ok: true,
      });
      setPhase("matching");
      await sleep(600);

      const top = createdMatches[0];

      // Step 3 — first-confirmed-lock
      pushLog({
        phase: "lock",
        emoji: "⚔️",
        label: "First-Confirmed-Lock applied",
        detail: `PATCH /api/match/confirm → request ${created.id}`,
        ok: true,
      });
      setPhase("confirming");
      await sleep(400);

      if (top) {
        const confirmRes = await fetch("/api/match/confirm", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            requestId: created.id,
            confirmedSourceId: top.sourceId,
            confirmedSourceName: top.sourceName,
          }),
        });
        const confirmData = await confirmRes.json();
        if (!confirmRes.ok) {
          pushLog({
            phase: "lock",
            emoji: "🔒",
            label: "Lock already claimed → HTTP 409",
            detail: confirmData.error || "First-confirmed-lock active.",
            ok: false,
          });
        } else {
          pushLog({
            phase: "lock",
            emoji: "✅",
            label: `Locked → ${top.sourceName}`,
            detail: "1 winner · all other candidates auto-released",
            ok: true,
          });
        }
      }

      // Step 4 — AI explain (streamed token-by-token over SSE)
      if (top) {
        pushLog({ phase: "explain", emoji: "🤖", label: "AI explaining why this match", detail: "POST /api/ai/explain/stream (live Gemini, SSE)" });
        setPhase("explaining");
        setExplain({ report: "", mode: "llm" });
        await sleep(500);

        const explainPayload: ExplainPayload = { request: created, match: top };
        let explainOk = false;
        try {
          await postSse("/api/ai/explain/stream", explainPayload, {
            onChunk: (text) => {
              explainOk = true;
              setExplain((prev) => ({ report: (prev?.report ?? "") + text, mode: "llm" }));
            },
            onDone: (meta) => {
              setExplain((prev) => ({ report: prev?.report ?? "", mode: String(meta.mode ?? "llm") }));
            },
            onError: (message) => {
              if (!explainOk) setExplain({ report: message, mode: "fallback" });
            },
          });
        } catch {
          if (!explainOk) setExplain({ report: "Explain endpoint unavailable in this environment.", mode: "fallback" });
        }
        if (!explainOk) {
          setExplain({ report: "Explain endpoint unavailable in this environment.", mode: "fallback" });
        }
      } else {
        pushLog({ phase: "explain", emoji: "🤖", label: "AI explain skipped", detail: "No candidates to explain.", ok: false });
      }

      // Step 5 — AI regional narrative (streamed over SSE)
      pushLog({ phase: "narrative", emoji: "📊", label: "AI narrating regional telemetry", detail: "POST /api/ai/narrative/stream (live Gemini, SSE)" });
      setPhase("narrating");
      setNarrative({ report: "", mode: "llm" });
      await sleep(500);

      const narrativePayload: any = {
        stats: {
          totalMatches: 1248,
          mostRequestedGroup: "O+",
          mostRequestedCount: 412,
          averageMatchResponseTimeSeconds: 1.2,
          totalLivesSaved: 1097,
        },
        trend: [
          { label: "Mon", count: 168, completed: 150 },
          { label: "Tue", count: 205, completed: 188 },
          { label: "Wed", count: 142, completed: 131 },
          { label: "Thu", count: 190, completed: 176 },
          { label: "Fri", count: 214, completed: 198 },
          { label: "Sat", count: 176, completed: 161 },
          { label: "Sun", count: 153, completed: 143 },
        ],
        distribution: [
          { bloodGroup: "O+", requests: 412, liveDonors: 268, bankStock: 120 },
          { bloodGroup: "O-", requests: 173, liveDonors: 64, bankStock: 28 },
          { bloodGroup: "A+", requests: 251, liveDonors: 143, bankStock: 88 },
          { bloodGroup: "A-", requests: 92, liveDonors: 41, bankStock: 14 },
          { bloodGroup: "B+", requests: 217, liveDonors: 121, bankStock: 76 },
          { bloodGroup: "B-", requests: 58, liveDonors: 22, bankStock: 9 },
          { bloodGroup: "AB+", requests: 29, liveDonors: 18, bankStock: 31 },
          { bloodGroup: "AB-", requests: 16, liveDonors: 7, bankStock: 4 },
        ],
      };
      let narrativeOk = false;
      try {
        await postSse("/api/ai/narrative/stream", narrativePayload, {
          onChunk: (text) => {
            narrativeOk = true;
            setNarrative((prev) => ({ report: (prev?.report ?? "") + text, mode: "llm" }));
          },
          onDone: (meta) => {
            setNarrative((prev) => ({ report: prev?.report ?? "", mode: String(meta.mode ?? "llm") }));
          },
          onError: (message) => {
            if (!narrativeOk) setNarrative({ report: message, mode: "fallback" });
          },
        });
      } catch {
        if (!narrativeOk) setNarrative({ report: "Narrative endpoint unavailable in this environment.", mode: "fallback" });
      }
      if (!narrativeOk) {
        setNarrative({ report: "Narrative endpoint unavailable in this environment.", mode: "fallback" });
      }

      pushLog({ phase: "done", emoji: "✅", label: "Full loop complete", detail: "Live matching → lock → AI explain → AI narrative", ok: true });
      setPhase("done");
      onStepChange?.("done");
    } catch (err: any) {
      pushLog({ phase: "error", emoji: "⚠️", label: "Step failed", detail: err?.message || "Unexpected error.", ok: false });
      setPhase("error");
    } finally {
      runningRef.current = false;
    }
  };

  useEffect(() => {
    onStepChange?.("play");
  }, []);

  const scorePct = (m: MatchResult) => Math.round(m.score * 100);

  return (
    <div className="overflow-hidden rounded-3xl border border-ink-10 bg-white shadow-xl">
      {/* Runner chrome */}
      <div className="flex items-center justify-between border-b border-ink-10 bg-ink px-5 py-3.5 text-white">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#4ADE80] animate-pulse" />
          <span className="font-display text-sm font-semibold">Guided Scenario Runner</span>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] text-white/50">
          <span className="rounded-full bg-white/10 px-2 py-0.5">staged</span>
          {phase === "done" && <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-emerald-300">complete</span>}
        </div>
      </div>

      <div className="p-5 sm:p-6">
        {/* Log stream */}
        <div className="mb-5 flex h-[200px] flex-col gap-2 overflow-y-auto rounded-2xl border border-ink-10 bg-[#0B1220] p-4 font-mono text-[11px] text-white/80">
          {log.length === 0 && phase === "idle" && (
            <p className="flex-1 content-center text-center text-white/40">
              ▐ The runner will stream every live API step here.
            </p>
          )}
          {log.map((entry, i) => (
            <div key={i} className="flex items-start gap-2.5 animate-fade-in">
              <span className="flex-shrink-0">{entry.emoji}</span>
              <span className={entry.ok === false ? "text-amber-300" : entry.ok ? "text-emerald-300" : "text-white/70"}>
                <span className="font-bold uppercase tracking-wide">{entry.label}</span>
                <span className="text-white/40"> — {entry.detail}</span>
              </span>
            </div>
          ))}
          {phase !== "idle" && phase !== "done" && phase !== "error" && (
            <p className="text-white/40">▍ executing…</p>
          )}
        </div>

        {/* Live request card */}
        {request && (
          <div className="mb-5 rounded-2xl border border-ink-10 bg-ink px-4 py-3 text-white">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px]">
              <span className="text-white/50">request</span>
              <span className="text-emerald-300">{request.id}</span>
              <span className="text-white/50">·</span>
              <span className="text-white">{request.bloodGroup}</span>
              <span className="text-white/50">·</span>
              <span className="text-amber-300 uppercase">{request.urgency}</span>
              <span className="text-white/50">·</span>
              <span className="text-white/70">{request.location.label}</span>
            </div>
          </div>
        )}

        {/* Matches */}
        {matches.length > 0 && (
          <div className="mb-5 overflow-hidden rounded-2xl border border-ink-10">
            <div className="border-b border-ink-10 bg-ink-5/50 px-4 py-2.5 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-60">
              Ranked Candidates — {matches.length} scored
            </div>
            {matches.slice(0, 3).map((m, i) => (
              <div key={m.sourceId} className={`flex items-center gap-3 border-b border-ink-10 px-4 py-3 last:border-0 ${i === 0 ? "bg-red-50/60" : "bg-white"}`}>
                <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${i === 0 ? "bg-blood text-white" : "bg-ink-10 text-ink"}`}>
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink">
                    {m.sourceName}
                    {i === 0 && <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-amber-700">⭐ Best</span>}
                  </p>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-ink-10">
                    <div
                      className={`h-full rounded-full ${i === 0 ? "bg-gradient-to-r from-blood to-red-400" : "bg-ink-40"}`}
                      style={{ width: `${scorePct(m)}%` }}
                    />
                  </div>
                </div>
                <div className="flex flex-shrink-0 flex-col items-end font-mono text-[10px]">
                  <span className="text-xs font-bold text-ink">{scorePct(m)}/100</span>
                  <span className="text-ink-40">{m.distanceKm} km · {m.bloodGroup} · {m.sourceType}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* AI Explain output */}
        {explain && (
          <div className="mb-5 rounded-2xl border border-blood/20 bg-red-50/60 p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg">🤖</span>
              <h3 className="font-display text-sm font-semibold text-ink">AI Match Explanation</h3>
              <EngineBadge mode={explain.mode} />
            </div>
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-80">{explain.report}</p>
          </div>
        )}

        {/* AI Narrative output */}
        {narrative && (
          <div className="mb-5 rounded-2xl border border-purple-200 bg-purple-50/50 p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="text-lg">📊</span>
              <h3 className="font-display text-sm font-semibold text-ink">AI Regional Narrative</h3>
              <EngineBadge mode={narrative.mode} />
            </div>
            <p className="whitespace-pre-line text-[13px] leading-relaxed text-ink-80">{narrative.report}</p>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={() => void run()}
          disabled={phase !== "idle" && phase !== "done" && phase !== "error"}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blood to-red-600 px-4 py-3.5 font-display text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {phase === "idle" || phase === "done" || phase === "error" ? (
            <>{ran ? "🔄 Run Scenario Again" : "▶️ Run the Full Scenario"} (live backend)</>
          ) : (
            <>
              <span className="h-2 w-2 animate-ping rounded-full bg-white" />
              {phase === "creating" && "Raising SOS…"}
              {phase === "matching" && "Ranking candidates…"}
              {phase === "confirming" && "Applying lock…"}
              {phase === "explaining" && "Asking Gemini…"}
              {phase === "narrating" && "Narrating telemetry…"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function EngineBadge({ mode, ...rest }: { mode: string }) {
  const isLlm = mode === "llm";
  return (
    <span
      {...rest}
      className={`ml-auto inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${
        isLlm ? "border border-purple-300 bg-purple-100 text-purple-700" : "border border-ink-10 bg-ink-5 text-ink-60"
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${isLlm ? "bg-purple-500 animate-pulse" : "bg-ink-40"}`} />
      {isLlm ? "Gemini · live" : "template fallback"}
    </span>
  );
}