"use client";
import { useState } from "react";

const BLOCKS = [
  { hash: "0xA1F3C9D2", prev: "0x00000000", event: "Genesis · AIIMS O- collected", time: "2h ago", by: "Dr. Ananya" },
  { hash: "0x7B2E8A11", prev: "0xA1F3C9D2", event: "Tested · NABL Negative", time: "1h ago", by: "NABL Lab" },
  { hash: "0xC4D91F3A", prev: "0x7B2E8A11", event: "Stored · 4.2°C", time: "now", by: "LifeLine Bank" },
  { hash: "0x9E3B2C77", prev: "0xC4D91F3A", event: "Dispatched · Rider Ramesh", time: "live", by: "Hyperlocal" },
];

export default function BlockchainLedger() {
  const [chain] = useState(BLOCKS);
  const [verifying, setVerifying] = useState<string | null>(null);
  function verify(h: string) { setVerifying(h); setTimeout(()=>setVerifying(null),1200); }
  return (
    <div className="rounded-[2rem] border border-ink-10 bg-[#0B1220] p-6 text-white shadow-xl">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">⛓️</div>
        <div><p className="font-display text-sm font-bold">Blockchain Blood Ledger</p><p className="font-mono text-[10px] uppercase tracking-widest text-white/50">Polygon testnet · Immutable journey · QR verified</p></div>
        <span className="ml-auto rounded-full bg-emerald-500 px-3 py-1 font-mono text-[10px] font-bold text-white animate-pulse">● On-chain</span>
      </div>
      <div className="mt-4 space-y-2">
        {chain.map((b,i)=>(
          <div key={b.hash} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-3 hover:bg-white/[0.07] transition">
            <span className="font-mono text-[10px] font-bold text-white/40">#{i}</span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-bold text-white truncate">{b.event} <span className="font-normal text-white/40">· {b.by}</span></p>
              <p className="font-mono text-[10px] text-white/40 truncate">{b.hash} ← {b.prev} · {b.time}</p>
            </div>
            <button onClick={()=>verify(b.hash)} className={`rounded-full px-3 py-1 font-mono text-[10px] font-bold border ${verifying===b.hash?"bg-emerald-500 text-white border-emerald-500":"bg-white/10 text-white border-white/15 hover:bg-white/15"}`}>{verifying===b.hash?"✓ Verified":"Verify"}</button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex gap-2">
        <button onClick={()=>{ navigator.clipboard?.writeText(chain[chain.length-1].hash); }} className="flex-1 rounded-xl bg-white px-4 py-2 font-mono text-xs font-bold text-ink">⎘ Copy Latest Hash</button>
        <a href="#passport" className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 font-mono text-xs font-bold text-white backdrop-blur">View Passport →</a>
      </div>
    </div>
  );
}
