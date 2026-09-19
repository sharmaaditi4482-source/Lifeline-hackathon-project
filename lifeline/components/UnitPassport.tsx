"use client";
import { useEffect, useState } from "react";
import { UnitPassport } from "@/lib/types";

function MiniQR({ text }: { text: string }) {
  // tiny fake QR — 9x9 grid hashed from text
  const h = [...text].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 0);
  const cells = Array.from({ length: 81 }, (_, i) => ((h >> (i % 16)) & 1) ^ (i % 3 === 0 ? 1 : 0));
  return (
    <div className="grid grid-cols-9 gap-[1px] bg-white p-2 rounded-xl border border-ink-10 shadow-sm">
      {cells.map((v, i) => (
        <div key={i} className={`h-2 w-2 rounded-[1px] ${v ? "bg-ink" : "bg-white"} ${[0,1,2,6,7,8,72,73,74,78,79,80].includes(i) ? "!bg-ink" : ""}`} />
      ))}
    </div>
  );
}

function TempSpark({ data }: { data: number[] }) {
  const w = 160, h = 40, pad = 4;
  const min = 2, max = 6;
  const pts = data.map((v, i) => {
    const x = pad + (i / Math.max(1, data.length - 1)) * (w - pad * 2);
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");
  const breach = data.some(v => v > 5.5 || v < 2.5);
  return (
    <div className={`rounded-xl border p-2 ${breach ? "border-amber-300 bg-amber-50/60" : "border-emerald-200 bg-emerald-50/40"}`}>
      <p className="font-mono text-[9px] font-bold uppercase tracking-widest flex items-center justify-between">
        <span className={breach ? "text-amber-700" : "text-emerald-700"}>{breach ? "⚠️ Cold-chain drift" : "✓ Cold-chain 2–6°C"} · {data[data.length-1]?.toFixed(1)}°C</span>
        <span className="text-ink-40">{data.length} readings</span>
      </p>
      <svg viewBox={`0 0 ${w} ${h}`} className="mt-1 w-full h-10">
        <path d={`M ${pts}`} fill="none" stroke={breach ? "#d97706" : "#059669"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {/* safe band */}
        <rect x={pad} y={h - pad - ((6 - min)/(max-min))*(h-pad*2)} width={w-pad*2} height={((6-2.5)/(max-min))*(h-pad*2) - ((6-5.5)/(max-min))*(h-pad*2)} fill={breach?"rgba(217,119,6,0.08)":"rgba(16,185,129,0.06)"} />
      </svg>
    </div>
  );
}

export default function UnitPassportCard() {
  const [list, setList] = useState<UnitPassport[]>([]);
  const [focused, setFocused] = useState<UnitPassport | null>(null);
  const [form, setForm] = useState({ donorName: "Dr. Ananya Verma", bloodGroup: "O-", hospitalName: "AIIMS Trauma Centre" });

  async function refresh() {
    const r = await fetch("/api/passport"); if (r.ok) { const j = await r.json(); setList(j.passports || []); if (!focused && j.passports?.[0]) setFocused(j.passports[0]); else if (focused) { const f = j.passports.find((p: UnitPassport)=>p.id===focused.id); if (f) setFocused(f); } }
  }
  useEffect(() => { void refresh(); const iv = setInterval(refresh, 2500); return () => clearInterval(iv); }, []);

  async function mint(e: React.FormEvent) {
    e.preventDefault();
    const r = await fetch("/api/passport", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ bloodGroup: form.bloodGroup, donorName: form.donorName, donorId: "d1", sourceName: "LifeLine NABL Bank", hospitalName: form.hospitalName }) });
    if (r.ok) { const j = await r.json(); setFocused(j.passport); await refresh(); }
  }
  async function advance(to: string) {
    if (!focused) return;
    const r = await fetch(`/api/passport/${focused.id}`, { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ to }) });
    if (r.ok) { const j = await r.json(); setFocused(j.passport); await refresh(); }
  }

  const f = focused;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-amber-200 bg-gradient-to-br from-white via-amber-50/30 to-white p-6 sm:p-7 shadow-[0_20px_60px_rgba(245,158,11,0.12)]">
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl" />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-lg text-white">🧬</div>
          <div>
            <p className="font-display text-sm font-bold tracking-tight text-ink sm:text-base flex items-center gap-2">Blood Unit Passport <span className="rounded-full bg-amber-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">Outstanding</span></p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-60">Cold-chain traceability · QR · Immutable ledger · Impact</p>
          </div>
        </div>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 font-mono text-[10px] font-bold text-amber-700">{list.length} passports</span>
      </div>

      <form onSubmit={mint} className="mt-4 grid gap-3 rounded-2xl border border-ink-10 bg-white p-4 shadow-sm sm:grid-cols-4">
        <label className="sm:col-span-2"><span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-60">Donor Name</span><input value={form.donorName} onChange={e=>setForm(f=>({...f, donorName:e.target.value}))} className="mt-1 w-full rounded-xl border border-ink-10 px-3 py-2 text-sm font-medium text-ink outline-none focus:border-amber-300 focus:ring-4 focus:ring-amber-500/10" /></label>
        <label><span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-60">Group</span><select value={form.bloodGroup} onChange={e=>setForm(f=>({...f, bloodGroup:e.target.value}))} className="mt-1 w-full rounded-xl border border-ink-10 bg-white px-3 py-2 text-sm font-bold text-blood outline-none focus:border-amber-300">{["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(bg=><option key={bg} value={bg}>{bg}</option>)}</select></label>
        <label><span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-60">Hospital</span><input value={form.hospitalName} onChange={e=>setForm(f=>({...f, hospitalName:e.target.value}))} className="mt-1 w-full rounded-xl border border-ink-10 px-3 py-2 text-sm font-medium text-ink outline-none focus:border-amber-300" /></label>
        <button type="submit" className="sm:col-span-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-2.5 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-md hover:shadow-lg">🧬 Mint Passport + QR →</button>
      </form>

      <div className="mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        {/* Passport card */}
        <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-white to-amber-50/50 p-4 shadow-inner">
          {f ? (
            <div className="space-y-4">
              <div className="flex gap-4">
                <MiniQR text={f.qr} />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-bold text-ink">{f.unitId} <span className="rounded-full bg-blood px-2 py-0.5 font-mono text-xs font-bold text-white">{f.bloodGroup}</span></p>
                  <p className="font-mono text-xs text-ink-60">{f.donorName} → {f.hospitalName}</p>
                  <p className="font-mono text-[10px] text-ink-40 break-all">{f.qr} · {f.status.toUpperCase()}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2 py-0.5 font-mono text-xs font-bold text-emerald-700">🩸 {f.impactLives} lives</span>
                    <span className="rounded-full bg-white border border-ink-10 px-2 py-0.5 font-mono text-xs text-ink-60">Exp {new Date(f.expiryAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <TempSpark data={f.coldChain} />

              <div className="relative border-l-2 border-amber-200 pl-4 space-y-3">
                {f.events.map((ev, i) => (
                  <div key={i} className="relative">
                    <span className={`absolute -left-[9px] top-1 h-3 w-3 rounded-full border-2 border-white shadow ${ev.type==="transfused"?"bg-emerald-500":ev.type==="delivered"?"bg-cyan-500":ev.type==="in_transit"?"bg-violet-500":"bg-amber-500"}`} />
                    <p className="font-mono text-xs font-bold text-ink">{ev.title} <span className="font-normal text-ink-40">· {new Date(ev.at).toLocaleTimeString()}</span></p>
                    <p className="font-mono text-[10px] text-ink-60">{ev.by} · {ev.tempC}°C · <span className="font-mono text-[9px] text-ink-40">{ev.hash}</span></p>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 pt-2 border-t border-amber-200">
                <button onClick={() => advance("dispatched")} className="rounded-full bg-ink px-3 py-1.5 font-mono text-xs font-bold text-white hover:bg-black">🛵 Dispatch</button>
                <button onClick={() => advance("in_transit")} className="rounded-full bg-violet-600 px-3 py-1.5 font-mono text-xs font-bold text-white hover:bg-violet-700">In Transit</button>
                <button onClick={() => advance("delivered")} className="rounded-full bg-cyan-600 px-3 py-1.5 font-mono text-xs font-bold text-white hover:bg-cyan-700">Delivered</button>
                <button onClick={() => advance("transfused")} className="rounded-full bg-emerald-600 px-3 py-1.5 font-mono text-xs font-bold text-white hover:bg-emerald-700">✓ Transfused</button>
              </div>
            </div>
          ) : <p className="py-8 text-center font-mono text-xs text-ink-60">Mint a passport to see QR + cold-chain + trace</p>}
        </div>

        {/* List */}
        <div className="rounded-2xl border border-ink-10 bg-white p-3">
          <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-ink-60">Recent Passports</p>
          <ul className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
            {list.map(p => (
              <li key={p.id} onClick={()=>setFocused(p)} className={`cursor-pointer rounded-xl border px-3 py-2.5 transition ${focused?.id===p.id?"border-amber-400 bg-amber-50 shadow":"border-ink-10 bg-white hover:border-amber-200"}`}>
                <div className="flex items-center justify-between gap-2"><span className="font-mono text-xs font-bold text-ink">{p.unitId} <span className="text-blood">{p.bloodGroup}</span></span><span className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold ${p.status==="transfused"?"bg-emerald-100 text-emerald-700":p.status==="delivered"?"bg-cyan-100 text-cyan-700":p.status==="in_transit"?"bg-violet-100 text-violet-700":"bg-white border border-ink-10 text-ink-60"}`}>{p.status}</span></div>
                <p className="font-mono text-xs text-ink-60 truncate">{p.donorName} → {p.hospitalName}</p>
                <p className="font-mono text-[10px] text-ink-40 truncate">{p.qr}</p>
              </li>
            ))}
            {list.length===0 && <li className="py-6 text-center font-mono text-xs text-ink-40 border border-dashed border-ink-10 rounded-xl">No passports yet — mint one ✨</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
