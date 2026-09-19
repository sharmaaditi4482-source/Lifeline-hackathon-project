"use client";

import { useState } from "react";

interface Candidate {
  id: string;
  name: string;
  type: "donor" | "bank";
  bloodGroup: string;
  distanceKm: number;
  rawUrgency: number;
  rawProximity: number;
  rawExpiry: number;
  rawReliability: number;
  note: string;
}

const SAMPLE_CANDIDATES: Candidate[] = [
  {
    id: "c1",
    name: "AIIMS Trauma Center Blood Bank",
    type: "bank",
    bloodGroup: "O-",
    distanceKm: 2.1,
    rawUrgency: 1.0,
    rawProximity: 0.958,
    rawExpiry: 0.85, // Expiring in 5 days (high priority to prevent waste)
    rawReliability: 1.0,
    note: "4 units ready · 5 days to expiry (High Waste Risk)",
  },
  {
    id: "c2",
    name: "Suresh Iyer (Volunteer Donor)",
    type: "donor",
    bloodGroup: "O-",
    distanceKm: 4.8,
    rawUrgency: 1.0,
    rawProximity: 0.904,
    rawExpiry: 0.50, // Neutral for live donor
    rawReliability: 0.95,
    note: "Eligible to donate · 95% turnout reliability",
  },
  {
    id: "c3",
    name: "Red Cross Central Blood Bank",
    type: "bank",
    bloodGroup: "O+",
    distanceKm: 6.2,
    rawUrgency: 1.0,
    rawProximity: 0.876,
    rawExpiry: 0.35, // Fresh units (23 days left)
    rawReliability: 1.0,
    note: "14 units available · 23 days to expiry",
  },
  {
    id: "c4",
    name: "Pooja Hegde (Volunteer Donor)",
    type: "donor",
    bloodGroup: "A+",
    distanceKm: 1.2,
    rawUrgency: 1.0,
    rawProximity: 0.976,
    rawExpiry: 0.50,
    rawReliability: 0.72,
    note: "Eligible to donate · 72% turnout reliability",
  },
];

export default function InteractiveAlgorithmSimulator() {
  const [urgencyWeight, setUrgencyWeight] = useState(35);
  const [proximityWeight, setProximityWeight] = useState(30);
  const [expiryWeight, setExpiryWeight] = useState(20);
  const [reliabilityWeight, setReliabilityWeight] = useState(15);

  const [urgencyMode, setUrgencyMode] = useState<"critical" | "high" | "medium">("critical");

  const getUrgencyValue = () => {
    if (urgencyMode === "critical") return 1.0;
    if (urgencyMode === "high") return 0.75;
    return 0.45;
  };

  const computeScore = (c: Candidate) => {
    const u = getUrgencyValue();
    const p = c.rawProximity;
    const e = c.rawExpiry;
    const r = c.rawReliability;

    const wU = urgencyWeight / 100;
    const wP = proximityWeight / 100;
    const wE = expiryWeight / 100;
    const wR = reliabilityWeight / 100;

    const totalScore = wU * u + wP * p + wE * e + wR * r;
    return Math.round(totalScore * 1000) / 1000;
  };

  const rankedCandidates = [...SAMPLE_CANDIDATES]
    .map((c) => ({
      ...c,
      calculatedScore: computeScore(c),
    }))
    .sort((a, b) => b.calculatedScore - a.calculatedScore);

  const resetDefaultWeights = () => {
    setUrgencyWeight(35);
    setProximityWeight(30);
    setExpiryWeight(20);
    setReliabilityWeight(15);
    setUrgencyMode("critical");
  };

  return (
    <div className="card-2xl bg-white border border-ink-10 p-6 md:p-8 shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-ink-10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blood animate-pulse" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-widest text-blood">
              Interactive Algorithm Sandbox
            </span>
          </div>
          <h3 className="mt-1 font-display text-2xl font-bold text-ink">
            Live Deterministic Multi-Factor Scoring Engine
          </h3>
          <p className="mt-1 text-xs text-ink-60 max-w-xl leading-relaxed">
            Drag the 4 weight sliders below. Watch how candidate rankings and priorities change in real time based on medical urgency and near-expiry waste prevention.
          </p>
        </div>

        <button
          type="button"
          onClick={resetDefaultWeights}
          className="self-start md:self-auto rounded-xl border border-ink-10 bg-ink-5 px-3.5 py-1.5 font-mono text-xs font-semibold text-ink hover:bg-ink-10 transition-colors"
        >
          ↺ Reset Clinical Defaults (35/30/20/15)
        </button>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Left Column: Sliders */}
        <div className="lg:col-span-5 space-y-5 bg-ink-5/50 p-5 rounded-2xl border border-ink-10/70">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink">
              1. Clinical Urgency
            </span>
            <div className="flex gap-1 text-[10px] font-mono">
              {(["critical", "high", "medium"] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setUrgencyMode(mode)}
                  className={`px-2 py-1 rounded-lg font-bold capitalize transition-all ${
                    urgencyMode === mode
                      ? "bg-blood text-white shadow-xs"
                      : "bg-white text-ink-60 hover:text-ink"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Slider 1: Urgency */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-ink-60">Urgency Weight ($U$)</span>
              <span className="font-bold text-blood">{urgencyWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={urgencyWeight}
              onChange={(e) => setUrgencyWeight(Number(e.target.value))}
              className="w-full accent-blood"
            />
          </div>

          {/* Slider 2: Proximity */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-ink-60">Proximity / Distance Weight ($P$)</span>
              <span className="font-bold text-blood">{proximityWeight}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              value={proximityWeight}
              onChange={(e) => setProximityWeight(Number(e.target.value))}
              className="w-full accent-blood"
            />
          </div>

          {/* Slider 3: Expiry */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-ink-60">Shelf-Life Expiry Prevention ($E$)</span>
              <span className="font-bold text-blood">{expiryWeight}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="40"
              value={expiryWeight}
              onChange={(e) => setExpiryWeight(Number(e.target.value))}
              className="w-full accent-blood"
            />
          </div>

          {/* Slider 4: Reliability */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-ink-60">Donor Turnout Reliability ($R$)</span>
              <span className="font-bold text-blood">{reliabilityWeight}%</span>
            </div>
            <input
              type="range"
              min="5"
              max="30"
              value={reliabilityWeight}
              onChange={(e) => setReliabilityWeight(Number(e.target.value))}
              className="w-full accent-blood"
            />
          </div>

          {/* Live Mathematical Formula Output */}
          <div className="pt-3 border-t border-ink-10 text-[11px] font-mono text-ink-60 space-y-1">
            <span className="font-bold uppercase text-[9px] text-ink-40 block">Current Equation:</span>
            <div className="bg-white p-2.5 rounded-xl border border-ink-10 text-ink font-semibold">
              Score = ({urgencyWeight}%)×U + ({proximityWeight}%)×P + ({expiryWeight}%)×E + ({reliabilityWeight}%)×R
            </div>
          </div>
        </div>

        {/* Right Column: Live Re-ranking Candidates */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold uppercase tracking-wider text-ink-40">
              Live Ranked Candidates (Dynamic Re-ordering)
            </span>
            <span className="text-green-700 bg-green-50 border border-green-200 px-2 py-0.5 rounded-md font-semibold">
              ✓ Deterministic Sort
            </span>
          </div>

          <div className="space-y-2.5">
            {rankedCandidates.map((c, rankIndex) => {
              const isFirst = rankIndex === 0;
              const scorePercent = Math.round(c.calculatedScore * 100);

              return (
                <div
                  key={c.id}
                  className={`p-4 rounded-2xl border transition-all duration-300 ${
                    isFirst
                      ? "bg-blood-50/70 border-blood/40 shadow-sm ring-1 ring-blood/20"
                      : "bg-white border-ink-10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-6 h-6 rounded-full flex items-center justify-center font-mono text-xs font-bold ${
                          isFirst ? "bg-blood text-white" : "bg-ink-10 text-ink-60"
                        }`}
                      >
                        #{rankIndex + 1}
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-display font-semibold text-sm text-ink">
                            {c.name}
                          </h4>
                          {isFirst && (
                            <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-white bg-blood px-2 py-0.5 rounded">
                              Top Match
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-ink-60 mt-0.5">
                          {c.note}
                        </p>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0">
                      <div className="font-display text-xl font-bold text-ink">
                        {scorePercent}
                        <span className="font-mono text-xs font-normal text-ink-40">/100</span>
                      </div>
                      <span className="font-mono text-[10px] text-ink-40 block">
                        {c.distanceKm} km away
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
