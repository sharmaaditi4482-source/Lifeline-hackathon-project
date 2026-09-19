"use client";
import { useEffect, useState } from "react";
import { Donor } from "@/lib/types";

const TIERS: Record<string, { badge: string; color: string; lives: string }> = {
  d1: { badge: "💎 Diamond", color: "from-cyan-400 to-blue-500", lives: "18" },
  d6: { badge: "🏆 Gold", color: "from-amber-400 to-orange-500", lives: "24" },
  d2: { badge: "🥈 Silver", color: "from-zinc-300 to-zinc-500", lives: "6" },
};

export default function DonorLeaderboard() {
  const [donors, setDonors] = useState<Donor[]>([]);
  useEffect(() => {
    fetch("/api/donors").then(r=>r.json()).then(j=>setDonors((j.donors||[]).slice(0,12))).catch(()=>{});
  }, []);
  const sorted = [...donors].sort((a,b)=>(b.totalDonations||0)-(a.totalDonations||0)).slice(0,8);
  return (
    <div className="rounded-[2rem] border border-ink-10 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white">🏆</div>
          <div><p className="font-display text-sm font-bold text-ink">Donor Leaderboard</p><p className="font-mono text-[10px] uppercase tracking-widest text-ink-60">Lives saved · Gamified · Real-time</p></div>
        </div>
        <span className="rounded-full bg-amber-50 border border-amber-200 px-3 py-1 font-mono text-[10px] font-bold text-amber-700">{sorted.length} heroes</span>
      </div>
      <div className="mt-4 grid gap-2">
        {sorted.map((d,i)=> {
          const lives = (d.totalDonations||0)*3;
          const tier = i===0?"💎 Diamond": i===1?"🥇 Gold": i===2?"🥈 Silver":"🥉 Bronze";
          return (
            <div key={d.id} className={`flex items-center justify-between rounded-xl border px-3 py-2.5 ${i===0?"bg-gradient-to-r from-amber-50 to-white border-amber-200 shadow-sm":i<3?"bg-white border-ink-10":"bg-ink-5/50 border-ink-10"}`}>
              <div className="flex items-center gap-3">
                <span className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br text-white font-mono text-xs font-bold ${i===0?"from-amber-400 to-orange-500":i===1?"from-zinc-400 to-zinc-600":i===2?"from-amber-700 to-yellow-600":"from-ink-10 to-ink-20 text-ink-60"}`}>{i+1}</span>
                <div><p className="font-mono text-xs font-bold text-ink">{d.name} <span className="font-normal text-ink-60">· {d.bloodGroup}</span></p><p className="font-mono text-[10px] text-ink-60 truncate">{d.location.label}</p></div>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs font-bold text-blood">{d.totalDonations||0} donations · {lives} lives</p>
                <p className="font-mono text-[10px] text-ink-60">{tier} {d.isVerified?"· ✅ Verified":""}</p>
              </div>
            </div>
          );
        })}
        {sorted.length===0 && <p className="py-6 text-center font-mono text-xs text-ink-60">Loading heroes…</p>}
      </div>
    </div>
  );
}
