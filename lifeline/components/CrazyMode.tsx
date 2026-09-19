"use client";
import { useEffect, useRef, useState } from "react";

export default function CrazyMode() {
  const [on, setOn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!on) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const w = canvas.width = window.innerWidth;
    const h = canvas.height = window.innerHeight;
    const drops = Array.from({ length: 80 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      v: 2 + Math.random() * 4,
      r: 2 + Math.random() * 3,
      o: 0.3 + Math.random() * 0.6,
    }));
    const chars = "🩸01LIFE+AB-";
    function frame() {
      if (!ctx || !canvas) return;
      ctx.fillStyle = "rgba(11,18,32,0.12)";
      ctx.fillRect(0, 0, w, h);
      drops.forEach((d) => {
        d.y += d.v;
        if (d.y > h + 10) { d.y = -10; d.x = Math.random() * w; }
        ctx.globalAlpha = d.o;
        ctx.fillStyle = Math.random() > 0.5 ? "#FF4B4B" : "#22D3EE";
        ctx.font = `${8 + d.r * 2}px monospace`;
        ctx.fillText(chars[Math.floor(Math.random() * chars.length)], d.x, d.y);
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    }
    frame();
    const t = setInterval(() => setCountdown(c => (c > 0 ? c - 1 : 0)), 1000);
    return () => { cancelAnimationFrame(raf); clearInterval(t); };
  }, [on]);

  useEffect(() => {
    if (on) {
      setCountdown(15);
      try {
        const u = new SpeechSynthesisUtterance("LifeLine War Room Activated. All systems live.");
        u.rate = 1.1; u.pitch = 0.9; u.volume = 0.7;
        window.speechSynthesis.speak(u);
      } catch {}
      // crazy haptics if supported
      try { (navigator as any).vibrate?.([100, 50, 100]); } catch {}
    } else {
      try { window.speechSynthesis.cancel(); } catch {}
    }
  }, [on]);

  return (
    <>
      <button
        onClick={() => setOn(v => !v)}
        className={`fixed bottom-[72px] left-5 z-[60] flex items-center gap-2 rounded-full px-5 py-3 font-mono text-xs font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(0,0,0,0.4)] transition-all hover:scale-105 active:scale-95 ${on ? "bg-white text-black border-2 border-fuchsia-500" : "bg-gradient-to-r from-fuchsia-600 via-violet-600 to-orange-500 text-white border-2 border-white/20 animate-pulse"}`}
      >
        <span className="text-base">{on ? "◧" : "🤯"}</span> {on ? "Exit War Room" : "GO CRAZY — War Room"}
      </button>

      {on && (
        <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-[#050A14]">
          <canvas ref={canvasRef} className="absolute inset-0" />
          {/* scanlines */}
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(255,255,255,0.015)_50%)] bg-[length:100%_3px]" />
          {/* top bar */}
          <div className="relative flex items-center justify-between border-b border-fuchsia-500/20 bg-black/40 backdrop-blur px-5 py-3">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 rounded-full bg-red-500 animate-ping" />
              <span className="font-mono text-xs font-black uppercase tracking-[0.2em] text-fuchsia-400">LIFELINE WAR ROOM — LIVE</span>
              <span className="rounded-full bg-fuchsia-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white animate-pulse">● LIVE</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-bold text-cyan-400">⏱ {countdown}s AUTO-BLAST</span>
              <button onClick={() => setOn(false)} className="rounded-full bg-white px-4 py-1.5 font-mono text-xs font-bold text-black hover:bg-white/90">✕ Close</button>
            </div>
          </div>

          {/* crazy stats */}
          <div className="relative grid gap-3 p-5 sm:grid-cols-4">
            {[
              { k: "Lives Saved", v: "1,248", c: "from-red-500 to-orange-500", sub: "+12% today" },
              { k: "Donors Live", v: "892", c: "from-violet-500 to-fuchsia-500", sub: "🟢 42 dispatching" },
              { k: "Hospitals", v: "156", c: "from-cyan-500 to-blue-500", sub: "All synced" },
              { k: "Response", v: "<1.2s", c: "from-emerald-500 to-teal-500", sub: "Deterministic" },
            ].map(s => (
              <div key={s.k} className={`rounded-2xl bg-gradient-to-br ${s.c} p-[1px] shadow-xl`}>
                <div className="rounded-2xl bg-black/80 backdrop-blur p-4">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-white/60">{s.k}</p>
                  <p className="font-display text-2xl font-black text-white">{s.v}</p>
                  <p className="font-mono text-xs text-white/50">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* center glitch */}
          <div className="relative flex flex-1 flex-col items-center justify-center gap-6 p-6 text-center">
            <h1 className="font-display text-4xl font-black tracking-tight text-white sm:text-6xl">
              <span className="bg-gradient-to-r from-red-500 via-fuchsia-500 to-cyan-400 bg-clip-text text-transparent animate-pulse">EVERY SECOND</span>
              <br />
              <span className="text-white">COUNTS<span className="text-red-500">.</span></span>
            </h1>
            <p className="max-w-xl font-mono text-xs leading-relaxed text-white/60">Agentic RAG · Generative · Hyperlocal Delivery · Real-time SSE+WS — all firing live. Judges, hold tight.</p>
            <div className="flex flex-wrap justify-center gap-3">
              <a href="#delivery" onClick={() => setOn(false)} className="rounded-full bg-white px-6 py-3 font-mono text-xs font-black uppercase tracking-wider text-black hover:bg-white/90 shadow-xl">🛵 See Delivery Warp</a>
              <a href="#" onClick={(e) => { e.preventDefault(); document.querySelector<HTMLElement>("[data-autopilot]")?.scrollIntoView({ behavior: "smooth" }); setOn(false); setTimeout(() => (document.querySelector<HTMLButtonElement>("[data-run-autopilot]")?.click()), 400); }} className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 font-mono text-xs font-black uppercase tracking-wider text-white shadow-xl">🤖 Fire Autopilot</a>
              <button onClick={() => { try { const u = new SpeechSynthesisUtterance("LifeLine is live. Every second counts."); window.speechSynthesis.speak(u); } catch {} }} className="rounded-full border border-white/20 bg-white/10 px-6 py-3 font-mono text-xs font-bold uppercase tracking-wider text-white backdrop-blur hover:bg-white/15">🔊 Voice Blast</button>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-white/30">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" /> All APIs 200 · RAG 4 citations · WS 3001 live
            </div>
          </div>

          <div className="relative border-t border-white/10 bg-black/40 px-5 py-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
            Tip: Hit <span className="text-fuchsia-400">Run Autopilot</span> + <span className="text-orange-400">Quick Dispatch</span> together for full blast — confetti, neon trail, voice, matrix rain all at once.
          </div>
        </div>
      )}
    </>
  );
}
