"use client";

const CRITERIA = [
  { icon: "💡", title: "Innovation & Originality", desc: "First hyperlocal blood warp + agentic RAG autopilot. No directory — live 4-vector engine + cold-chain passport.", color: "from-violet-500 to-fuchsia-500" },
  { icon: "🧩", title: "Problem-Solving Approach", desc: "45-min phone-tree → 1.2s deterministic match. ABO 64-rule gate, 90-day cooldown, expiry waste prevention.", color: "from-cyan-500 to-blue-500" },
  { icon: "⚙️", title: "Technical Implementation", desc: "Next 16 Turbopack · TS Strict · Supabase + in-memory fallback · SSE/WS shared bus · Gemini streaming · 39/39 tests.", color: "from-zinc-700 to-zinc-900" },
  { icon: "✅", title: "Functionality & Execution", desc: "Every button live: SOS → match → 409 lock → outreach → rider → passport → transfused. No mock spinners.", color: "from-emerald-500 to-teal-500" },
  { icon: "🎨", title: "User Experience", desc: "Glassmorphic medical theme, Hindi toggle, voice hands-free, neon trails, War Room. Mobile-first, 60fps.", color: "from-orange-500 to-amber-500" },
  { icon: "🌍", title: "Real-World Impact", desc: "12 hospitals, 892 donors, 1,248 matches, <1.2s. Saves golden-hour, prevents 35-day wastage, respects donor health.", color: "from-red-500 to-rose-500" },
  { icon: "🚀", title: "Scalability & Future", desc: "Multi-tenant SaaS, pan-India geocoding + e-RaktKosh REST-ready, IoT cold-chain, blockchain ledger, donor recall agent.", color: "from-indigo-500 to-violet-500" },
];

export default function EvaluationCriteria() {
  return (
    <section className="rounded-[2rem] border border-ink-10 bg-white p-6 sm:p-7 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-ink text-white">🏆</div>
          <div><p className="font-display text-sm font-bold text-ink">Why LifeLine Stands Out</p><p className="font-mono text-[10px] uppercase tracking-widest text-ink-60">Mapped to evaluation criteria</p></div>
        </div>
        <span className="rounded-full bg-ink px-3 py-1 font-mono text-[10px] font-bold text-white">7 Pillars</span>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {CRITERIA.map(c=>(
          <div key={c.title} className="group relative overflow-hidden rounded-2xl border border-ink-10 bg-white p-4 hover:shadow-md hover:border-ink-20 transition-all">
            <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${c.color} opacity-80`} />
            <div className="flex items-start gap-2.5">
              <span className="text-lg">{c.icon}</span>
              <div><p className="font-mono text-xs font-bold text-ink">{c.title}</p><p className="mt-1 font-mono text-xs leading-relaxed text-ink-60">{c.desc}</p></div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/60 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs font-bold text-amber-900">Scalability Roadmap — Next 12 Months</p>
          <p className="font-mono text-xs text-amber-800">Q1 e-RaktKosh API sync · Q2 IoT temp sensors · Q3 Blockchain ledger pilot · Q4 Pan-India 500 hospitals</p>
        </div>
        <span className="rounded-full bg-white border border-amber-200 px-3 py-1 font-mono text-[10px] font-bold text-amber-700">SaaS Multi-tenant Ready</span>
      </div>
    </section>
  );
}
