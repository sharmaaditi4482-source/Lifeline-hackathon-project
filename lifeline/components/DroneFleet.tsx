"use client";
import { useState } from "react";

export default function DroneFleet() {
  const [mode, setMode] = useState<"bike"|"drone">("bike");
  const bikeEta = 8.2, droneEta = 3.4;
  const activeEta = mode==="bike"?bikeEta:droneEta;
  return (
    <div className="rounded-[2rem] border border-ink-10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 text-white">{mode==="drone"?"🚁":"🛵"}</div>
          <div><p className="font-display text-sm font-bold text-ink">Drone Fleet Simulator — Rural Wings</p><p className="font-mono text-[10px] uppercase tracking-widest text-ink-60">Auto-switch if &gt;5km · Wind + temp sim</p></div>
        </div>
        <div className="flex rounded-full bg-ink-5 p-1 border border-ink-10">
          <button onClick={()=>setMode("bike")} className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${mode==="bike"?"bg-ink text-white":"text-ink-60"}`}>🛵 Bike</button>
          <button onClick={()=>setMode("drone")} className={`rounded-full px-3 py-1 font-mono text-xs font-bold ${mode==="drone"?"bg-sky-600 text-white":"text-ink-60"}`}>🚁 Drone</button>
        </div>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-10 bg-gradient-to-br from-sky-50 to-white p-4">
          <p className="font-mono text-xs font-bold text-ink">{mode==="drone"?"Drone":"Bike"} ETA Comparison</p>
          <div className="mt-3 space-y-2 font-mono text-xs">
            <div className="flex justify-between"><span className="text-ink-60">Bike (24 km/h)</span><span className={mode==="bike"?"font-bold text-blood":"text-ink-60"}>{bikeEta} min {mode==="bike"?"◀":""}</span></div>
            <div className="flex justify-between"><span className="text-ink-60">Drone (60 km/h)</span><span className={mode==="drone"?"font-bold text-sky-600":"text-ink-60"}>{droneEta} min {mode==="drone"?"◀":""}</span></div>
            <div className="h-2 rounded-full bg-ink-5 overflow-hidden flex">
              <div className="bg-blood transition-all" style={{ width: `${mode==="bike"?100:60}%` }} />
              <div className="bg-sky-500 transition-all" style={{ width: `${mode==="drone"?40:0}%` }} />
            </div>
            <p className="text-[11px] text-ink-60">{mode==="drone" ? "Wind 8 km/h, Temp 4°C — auto-selected for 4.2km rural" : "City traffic — bike optimal for 2.1km"}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-ink-10 bg-ink-5/30 p-4 flex flex-col items-center justify-center gap-2">
          <div className="text-4xl animate-bounce">{mode==="drone"?"🚁":"🛵"}</div>
          <p className="font-mono text-xs font-bold text-ink">{mode==="drone"?"Air corridor active":"Street route active"}</p>
          <p className="font-mono text-[10px] text-ink-60 text-center">Eco: {mode==="drone"?"0.2 kWh":"0.8 L"} · Cold-chain {mode==="drone"?"3.9°C":"4.1°C"}</p>
          <button onClick={()=>setMode(m=>m==="bike"?"drone":"bike")} className="rounded-full bg-ink px-4 py-1.5 font-mono text-xs font-bold text-white">Switch to {mode==="bike"?"Drone":"Bike"}</button>
        </div>
      </div>
    </div>
  );
}
