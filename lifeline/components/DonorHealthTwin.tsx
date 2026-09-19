"use client";
import { useState } from "react";

export default function DonorHealthTwin() {
  const [donations, setDonations] = useState(4);
  const iron = Math.max(10, 100 - donations * 12);
  const nextEligible = 90 - (donations * 7 % 90);
  const curve = Array.from({ length: 12 }, (_, i) => 40 + Math.sin(i * 0.8) * 15 + i * 3);
  return (
    <div className="rounded-[2rem] border border-ink-10 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white">🧬</div>
        <div><p className="font-display text-sm font-bold text-ink">Donor Health Twin</p><p className="font-mono text-[10px] uppercase tracking-widest text-ink-60">Iron recovery · Personalized · RAG</p></div>
        <span className="ml-auto rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-mono text-[10px] font-bold text-emerald-700">Twin Live</span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-ink-10 bg-ink-5/30 p-4">
          <p className="font-mono text-xs font-bold text-ink">Hemoglobin Rebuild — 12 weeks</p>
          <svg viewBox="0 0 120 40" className="mt-2 w-full h-14">
            <path d={`M ${curve.map((y,i)=>`${i*10},${40-y/3}`).join(" L ")}`} fill="none" stroke="#0d9488" strokeWidth={2.5} strokeLinecap="round" />
            <circle cx={donations*10} cy={40-curve[donations]/3} r={4} fill="#0d9488" stroke="white" strokeWidth={2} />
          </svg>
          <p className="font-mono text-xs text-ink-60">Iron stores: <span className="font-bold text-ink">{iron}%</span> · Next eligible: <span className="font-bold text-emerald-700">{nextEligible} days</span></p>
          <div className="mt-2 flex gap-1">
            <button onClick={()=>setDonations(v=>Math.max(0,v-1))} className="rounded-full border border-ink-10 bg-white px-3 py-1 font-mono text-xs">−</button>
            <span className="flex-1 text-center font-mono text-xs font-bold py-1">{donations} donations</span>
            <button onClick={()=>setDonations(v=>Math.min(10,v+1))} className="rounded-full bg-teal-600 px-3 py-1 font-mono text-xs font-bold text-white">+</button>
          </div>
          <p className="mt-2 rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 font-mono text-xs text-amber-800">💡 Tip: Eat iron-rich (spinach, jaggery) + hydrate. Avoid next donation for {nextEligible} days.</p>
        </div>
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 p-[1px] shadow-lg">
          <div className="rounded-2xl bg-gradient-to-br from-white to-amber-50 p-4 h-full">
            <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-amber-700">Impact NFT — Generative</p>
            <div className="mt-2 flex gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white text-2xl shadow">🏅</div>
              <div><p className="font-display text-sm font-bold text-ink">Lives Chain #{donations+7}</p><p className="font-mono text-xs text-ink-60">{donations*3} lives saved · {donations} donations</p><p className="font-mono text-[10px] text-ink-40">0x{(donations*123456).toString(16).toUpperCase()} · Referral: +{donations*2} friends</p></div>
            </div>
            <button onClick={()=>{ const u=new SpeechSynthesisUtterance(`You have saved ${donations*3} lives. Thank you hero.`); speechSynthesis.speak(u); }} className="mt-3 w-full rounded-xl bg-ink px-4 py-2 font-mono text-xs font-bold text-white">🔊 Hear Impact Story</button>
          </div>
        </div>
      </div>
    </div>
  );
}
