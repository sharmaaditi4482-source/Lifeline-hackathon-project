"use client";
import { useEffect, useState } from "react";

type Cell = { label: string; risk: "CRITICAL"|"MODERATE"|"STABLE"; units: number };

export default function ShortageHeatmap() {
  const [cells, setCells] = useState<Cell[]>([]);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    async function load(){
      try{
        const r=await fetch("/api/banks"); const j=await r.json();
        const hs=j.hospitals||[];
        const hist=j.requestHistory||[];
        const { compute7DayShortageAlerts } = await import("@/lib/services/inventoryService");
        const out: Cell[] = hs.slice(0,12).map((h:any)=>{
          const alerts=compute7DayShortageAlerts(h.inventory, hist);
          const crit=alerts.filter(a=>a.isUrgentAlert);
          return { label:h.name.split(" ")[0]+" · "+h.location.label.split(",")[0], risk: crit.length? "CRITICAL" as const : "STABLE" as const, units: Object.values(h.inventory as Record<string,number>).reduce((a,b)=>a+b,0) };
        });
        setCells(out);
      }catch{}
    }
    void load(); const iv=setInterval(()=>{ setTick(t=>t+1); void load(); }, 8000);
    return ()=>clearInterval(iv);
  }, [tick]);

  const color: Record<string,string> = { CRITICAL:"bg-blood text-white animate-pulse", MODERATE:"bg-amber-500 text-white", STABLE:"bg-emerald-500 text-white" };
  return (
    <div className="rounded-[2rem] border border-ink-10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-red-600 to-orange-500 text-white">🗺️</div>
          <div><p className="font-display text-sm font-bold text-ink">India Shortage Heatmap — 7-Day Forecast</p><p className="font-mono text-[10px] uppercase tracking-widest text-ink-60">Live animation · Updates every 8s</p></div>
        </div>
        <span className="hidden sm:inline rounded-full bg-ink px-3 py-1 font-mono text-[10px] font-bold text-white">{cells.filter(c=>c.risk==="CRITICAL").length} critical</span>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {cells.map(c=>(
          <div key={c.label} className="rounded-xl border border-ink-10 bg-white p-3 flex flex-col gap-1.5 hover:shadow-sm transition">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-bold text-ink truncate">{c.label}</span>
              <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider ${color[c.risk]}`}>{c.risk}</span>
            </div>
            <div className="h-1.5 rounded-full bg-ink-5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-700 ${c.risk==="CRITICAL"?"bg-blood w-[85%]":c.risk==="MODERATE"?"bg-amber-500 w-[55%]":"bg-emerald-500 w-[25%]"}`} />
            </div>
            <p className="font-mono text-[10px] text-ink-60">{c.units} units · {c.risk==="CRITICAL"?"<48h runout":c.risk==="MODERATE"?"3-5d":"Stable"}</p>
          </div>
        ))}
        {cells.length===0 && <p className="col-span-3 py-8 text-center font-mono text-xs text-ink-60">Loading heatmap…</p>}
      </div>
    </div>
  );
}
