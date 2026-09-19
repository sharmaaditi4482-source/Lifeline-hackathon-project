"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
const MiniMap = dynamic(() => import("@/components/MatchMap"), { ssr: false, loading: () => <div className="h-[220px] rounded-xl bg-ink-5 animate-pulse" /> });

export default function AmbulanceTracker() {
  const [pos, setPos] = useState({ lat: 28.5672, lng: 77.21 });
  const from = { lat: 28.5686, lng: 77.1975, label: "Donor — Safdarjung" };
  const to = { lat: 28.6127, lng: 77.2091, label: "AIIMS Trauma Centre" };
  const [eta, setEta] = useState(210);
  const [moving, setMoving] = useState(true);

  useEffect(() => {
    if (!moving) return;
    const iv = setInterval(() => {
      setPos(p => {
        const nx = p.lat + (to.lat - p.lat) * 0.08;
        const ny = p.lng + (to.lng - p.lng) * 0.08;
        if (Math.abs(nx - to.lat) < 0.0005) { setMoving(false); setEta(0); return to; }
        return { lat: nx, lng: ny };
      });
      setEta(e => Math.max(0, e - 7));
    }, 700);
    return () => clearInterval(iv);
  }, [moving]);

  return (
    <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow">🚑</div>
          <div><p className="font-display text-sm font-bold text-ink">Ambulance Live GPS — Uber-style</p><p className="font-mono text-[10px] uppercase tracking-widest text-ink-60">Cold-chain + siren · Real-time ETA</p></div>
        </div>
        <span className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${moving?"bg-amber-500 text-white animate-pulse":"bg-emerald-500 text-white"}`}>{moving?`ETA ${Math.floor(eta/60)}:${String(eta%60).padStart(2,"0")}`:"Arrived ✓"}</span>
      </div>
      <div className="mt-4 overflow-hidden rounded-2xl border border-ink-10">
        <MiniMap hospitalLocation={{ lat: to.lat, lng: to.lng, label: to.label }} matches={[{ sourceType:"donor", sourceId:"ambulance", sourceName:"🚑 Ambulance", bloodGroup:"O-", distanceKm:2.1, score:0.99, breakdown:{urgency:1,proximity:0.9,expiry:0.5,reliability:1}, location:{ lat: pos.lat, lng: pos.lng, label:"Ambulance Live" } } as any]} />
      </div>
      <div className="mt-3 flex items-center justify-between font-mono text-xs">
        <span className="text-ink-60">🩸 {from.label}</span>
        <span className={`h-2 w-2 rounded-full ${moving?"bg-emerald-500 animate-ping":"bg-ink-20"}`} />
        <span className="text-ink-60">🏥 {to.label}</span>
      </div>
      <div className="mt-2 flex gap-2">
        <button onClick={()=>{ setPos(from); setEta(210); setMoving(true); }} className="flex-1 rounded-xl bg-ink px-4 py-2 font-mono text-xs font-bold text-white hover:bg-black">↻ Restart Trip</button>
        <button onClick={()=>setMoving(v=>!v)} className="rounded-xl border border-ink-10 bg-white px-4 py-2 font-mono text-xs font-bold text-ink">{moving?"Pause":"Resume"}</button>
      </div>
    </div>
  );
}
