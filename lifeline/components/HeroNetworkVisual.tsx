"use client";

import { useEffect, useState } from "react";

export default function HeroNetworkVisual() {
  const [pulseIndex, setPulseIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIndex((prev) => (prev + 1) % 3);
    }, 2800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-full max-w-[500px] h-[375px] sm:h-[415px] rounded-[32px] bg-gradient-to-b from-[#420A0A] via-[#220404] to-[#0F0202] border border-red-800/40 shadow-[0_25px_60px_rgba(168,32,26,0.35)] overflow-hidden p-6 select-none flex flex-col justify-between">
      
      {/* ── 1. Dotted Map World Grid ── */}
      <div className="absolute inset-0 opacity-35 pointer-events-none">
        <svg width="100%" height="100%">
          <pattern id="dot-matrix-glow-dynamic" width="16" height="16" patternUnits="userSpaceOnUse">
            <circle cx="2.5" cy="2.5" r="1.3" fill="#FF4D4D" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#dot-matrix-glow-dynamic)" />
        </svg>
      </div>

      {/* ── 2. Rotating Radar Sweep Beam ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] h-[340px] pointer-events-none z-0">
        <div className="w-full h-full rounded-full animate-radar-spin">
          <svg viewBox="0 0 200 200" className="w-full h-full">
            <defs>
              <radialGradient id="radar-beam" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="rgba(255, 50, 50, 0.45)" />
                <stop offset="80%" stopColor="rgba(255, 30, 30, 0.08)" />
                <stop offset="100%" stopColor="rgba(255, 0, 0, 0)" />
              </radialGradient>
            </defs>
            <path
              d="M 100 100 L 200 100 A 100 100 0 0 0 170 30 Z"
              fill="url(#radar-beam)"
            />
            <line x1="100" y1="100" x2="200" y2="100" stroke="#FF5555" strokeWidth="1.5" opacity="0.7" />
          </svg>
        </div>
      </div>

      {/* ── 3. Ambient Breathing Crimson Core Glow ── */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-600/25 rounded-full blur-3xl pointer-events-none animate-crimson-glow" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-52 h-52 bg-red-500/35 rounded-full blur-2xl pointer-events-none" />

      {/* ── 4. Dynamic Flowing Laser Signals SVG ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        {/* Base Static Connection Lines */}
        <line x1="22%" y1="22%" x2="50%" y2="76%" stroke="rgba(255, 80, 80, 0.25)" strokeWidth="1.5" />
        <line x1="50%" y1="22%" x2="50%" y2="76%" stroke="rgba(255, 80, 80, 0.3)" strokeWidth="2" />
        <line x1="78%" y1="22%" x2="50%" y2="76%" stroke="rgba(255, 80, 80, 0.25)" strokeWidth="1.5" />

        {/* Animated Moving Laser Pulses */}
        <line
          x1="22%"
          y1="22%"
          x2="50%"
          y2="76%"
          stroke="#FF7777"
          strokeWidth="2"
          className="animate-laser-dash"
        />
        <line
          x1="50%"
          y1="22%"
          x2="50%"
          y2="76%"
          stroke="#FF2B2B"
          strokeWidth="3.5"
          className="animate-laser-dash"
          style={{ animationDuration: "0.8s" }}
        />
        <line
          x1="78%"
          y1="22%"
          x2="50%"
          y2="76%"
          stroke="#FF7777"
          strokeWidth="2"
          className="animate-laser-dash"
          style={{ animationDelay: "0.4s" }}
        />
      </svg>

      {/* ── 5. Top 3 Candidate Nodes ── */}
      <div className="relative z-10 grid grid-cols-3 gap-2 pt-1 text-center items-start">
        {/* Node 1: O- */}
        <div className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-105">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/30 flex items-center justify-center backdrop-blur-md shadow-lg">
            <span className="font-display font-bold text-sm text-white">O-</span>
          </div>
          <p className="mt-1.5 font-mono text-[9px] font-medium text-white/70 uppercase tracking-wider">DONOR #231</p>
          <span className="font-mono text-[8px] text-emerald-400 flex items-center gap-1 font-semibold mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" /> 1.6 km
          </span>
        </div>

        {/* Node 2: B+ Bank (ACTIVE NEON HIGHLIGHT) */}
        <div className="flex flex-col items-center -mt-2 group cursor-pointer">
          <div className="relative">
            <span className="absolute -inset-2.5 rounded-full bg-red-500/60 blur-md animate-ping" />
            <div className="relative w-14 h-14 rounded-full bg-gradient-to-b from-red-500 via-red-600 to-red-700 border-2 border-red-200 flex items-center justify-center shadow-[0_0_35px_rgba(255,40,40,1)] transition-transform hover:scale-110">
              <span className="font-display font-extrabold text-base text-white tracking-tight">B+</span>
            </div>
          </div>
          <p className="mt-1.5 font-mono text-[9px] font-extrabold text-white uppercase tracking-wider">BANK #12</p>
          <span className="font-mono text-[8px] font-bold text-emerald-300 bg-emerald-950/90 border border-emerald-500/50 px-2 py-0.5 rounded-md mt-0.5 shadow-md">
            AVAILABLE
          </span>
        </div>

        {/* Node 3: A+ */}
        <div className="flex flex-col items-center group cursor-pointer transition-transform hover:scale-105">
          <div className="w-12 h-12 rounded-full bg-white/10 border border-white/30 flex items-center justify-center backdrop-blur-md shadow-lg">
            <span className="font-display font-bold text-sm text-white">A+</span>
          </div>
          <p className="mt-1.5 font-mono text-[9px] font-medium text-white/70 uppercase tracking-wider">DONOR #448</p>
          <span className="font-mono text-[8px] text-amber-300 flex items-center gap-1 font-semibold mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block animate-pulse" /> 2.9 km
          </span>
        </div>
      </div>

      {/* ── 6. Floating Center Match Card Badge (Animated Sway) ── */}
      <div className="relative z-20 mx-auto w-full max-w-[280px] bg-black/70 backdrop-blur-xl border border-red-500/50 rounded-2xl p-3.5 shadow-[0_15px_35px_rgba(0,0,0,0.6)] animate-float-sway">
        <div className="flex items-center gap-1.5 font-mono text-[8px] uppercase tracking-wider text-red-400 font-bold">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          LIVE MATCH FOUND
        </div>
        <h4 className="mt-1 font-display font-bold text-sm text-white">B+ Bank Reserve</h4>
        <div className="mt-1.5 flex items-center justify-between font-mono text-[9px] text-white/85">
          <span className="flex items-center gap-1 text-white/80">⏱ 1.8 km away</span>
          <span className="text-emerald-400 font-bold flex items-center gap-0.5 bg-emerald-950/70 px-1.5 py-0.5 rounded border border-emerald-500/40">
            98% Compatibility ✓
          </span>
        </div>
      </div>

      {/* ── 7. Bottom Center Node: Trauma Unit with Expanding Concentric Glow Rings ── */}
      <div className="relative z-10 flex flex-col items-center -mb-1">
        <div className="relative flex items-center justify-center">
          {/* Animated Expanding Outer Ring 1 */}
          <div className="absolute w-24 h-24 rounded-full border border-red-500/25 animate-ring-expand" />
          {/* Outer Ring 2 */}
          <div className="absolute w-18 h-18 rounded-full border border-red-500/45 animate-ping" style={{ animationDuration: "3s" }} />
          {/* Middle Ring */}
          <div className="absolute w-14 h-14 rounded-full border-2 border-red-500/70 shadow-[0_0_15px_rgba(255,40,40,0.6)]" />
          {/* Center Glowing Heartbeat Disc */}
          <div className="relative w-11 h-11 rounded-full bg-gradient-to-tr from-red-700 via-red-600 to-red-500 border-2 border-red-200 flex items-center justify-center shadow-[0_0_30px_rgba(255,50,50,0.95)] animate-droplet-breathe">
            <svg className="w-5 h-5 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
            </svg>
          </div>
        </div>
        <p className="mt-2 font-mono text-[10px] font-extrabold text-white uppercase tracking-wider drop-shadow-md">
          TRAUMA UNIT
        </p>
        <span className="font-mono text-[8px] uppercase tracking-widest text-red-100 font-extrabold bg-gradient-to-r from-red-900 to-red-950 px-2.5 py-0.5 rounded-full border border-red-600/70 mt-0.5 shadow-sm">
          HIGH PRIORITY
        </span>
      </div>
    </div>
  );
}
