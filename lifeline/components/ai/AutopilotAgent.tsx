"use client";
import { useState, useRef } from "react";

type Step = { id: string; title: string; detail?: string; status: "running" | "done"; citations?: string[] };

export default function AutopilotAgent() {
  const [hospitalName, setHospitalName] = useState("AIIMS Trauma Centre");
  const [bloodGroup, setBloodGroup] = useState("O-");
  const [urgency, setUrgency] = useState("critical");
  const [units, setUnits] = useState(2);
  const [locationLabel, setLocationLabel] = useState("AIIMS, New Delhi");
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [chunks, setChunks] = useState<Record<string, string>>({});
  const [done, setDone] = useState<any>(null);
  const [crazy, setCrazy] = useState(true);
  const [warRoom, setWarRoom] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Crazy voice hologram — speak each step as it completes
  function speak(text: string) {
    if (!crazy || typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try { const u = new SpeechSynthesisUtterance(text); u.rate = 1.05; u.pitch = 1; u.volume = 0.6; window.speechSynthesis.speak(u); } catch {}
  }

  async function run() {
    if (running) return;
    setRunning(true); setSteps([]); setChunks({}); setDone(null);
    const ctrl = new AbortController(); abortRef.current = ctrl;
    try {
      const res = await fetch("/api/ai/autopilot/stream", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalName, bloodGroup, urgency, locationLabel, unitsNeeded: units }),
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) throw new Error("autopilot stream failed");
      const reader = res.body.getReader(); const dec = new TextDecoder(); let buf = "";
      while (true) {
        const { value, done: d } = await reader.read(); if (d) break;
        buf += dec.decode(value, { stream: true });
        let idx; while ((idx = buf.indexOf("\n\n")) !== -1) {
          const frame = buf.slice(0, idx); buf = buf.slice(idx + 2);
          const line = frame.split("\n").find(l => l.startsWith("data:")); if (!line) continue;
          try {
            const j = JSON.parse(line.slice(5).trim());
            if (j.type === "step") { setSteps(s => { const i = s.findIndex(x => x.id === j.id); const nxt = { id: j.id, title: j.title, detail: j.detail, status: j.status, citations: j.citations } as Step; return i === -1 ? [...s, nxt] : s.map((x, k) => k === i ? nxt : x); }); if (j.status==="done") speak(j.title); }
            else if (j.type === "chunk") setChunks(c => ({ ...c, [j.step]: (c[j.step] || "") + j.text }));
            else if (j.type === "done") setDone(j);
            else if (j.type === "error") setChunks(c => ({ ...c, error: j.message }));
          } catch {}
        }
      }
    } catch {} finally { setRunning(false); }
  }

  function stop() { abortRef.current?.abort(); setRunning(false); }

  return (
    <div data-autopilot className={`relative overflow-hidden rounded-[2rem] border bg-gradient-to-br from-white via-violet-50/40 to-white p-6 sm:p-7 shadow-[0_20px_60px_rgba(124,58,237,0.12)] ${crazy ? "border-fuchsia-300 shadow-[0_0_40px_rgba(192,38,211,0.15)]" : "border-violet-200"} ${warRoom ? "ring-4 ring-violet-500/20" : ""}`}>
      <div className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-violet-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-fuchsia-500/5 blur-3xl" />
      {crazy && <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(124,58,237,0.02)_50%)] bg-[length:100%_4px] opacity-40" />}
      {crazy && running && <div className="pointer-events-none absolute inset-0 overflow-hidden"><div className="absolute inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-fuchsia-500 to-transparent opacity-60 animate-[scan_2s_linear_infinite]" style={{ top: "30%" }} /></div>}
      {warRoom && <div className="pointer-events-none absolute inset-0 bg-violet-900/5 backdrop-blur-[0.5px]" />}

      {/* Header */}
      <div className="relative flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-500/20 text-white animate-pulse">🤖</div>
          <div>
            <p className="flex items-center gap-2 font-display text-sm font-bold tracking-tight text-ink sm:text-base">SaaS Agentic RAG Autopilot <span className="hidden sm:inline rounded-full bg-ink px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-white">Live</span> <button onClick={()=>setCrazy(v=>!v)} className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider border ${crazy?"bg-fuchsia-500 text-white border-fuchsia-500 animate-pulse":"bg-white text-ink-60 border-ink-10"}`}>{crazy?"🤯 CRAZY ON":"Crazy Off"}</button></p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-ink-60">RAG · Agentic · Generative · Multi-tenant SaaS · One-click SOS → Delivery {crazy && "· Voice Hologram · War Room"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline rounded-full border border-violet-200 bg-violet-50 px-2.5 py-1 font-mono text-[10px] font-bold text-violet-700">Gemini Live</span>
          <button onClick={()=>setWarRoom(v=>!v)} className={`hidden sm:inline rounded-full border px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-wider ${warRoom?"bg-violet-600 text-white border-violet-600":"bg-white text-ink border-ink-10"}`}>{warRoom?"◧ Exit War Room":"◩ War Room"}</button>
          {running ? <button onClick={stop} className="rounded-full bg-ink px-5 py-1.5 font-mono text-xs font-bold text-white hover:bg-black">■ Stop</button> : <button data-run-autopilot onClick={run} className="rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 bg-[length:200%_100%] animate-[gradient_3s_ease_infinite] px-6 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-violet-500/25 hover:shadow-xl hover:scale-[1.02] transition">▶ Run Autopilot</button>}
        </div>
      </div>

      {/* SaaS tenant controls */}
      <div className="relative mt-5 grid gap-3 rounded-2xl border border-ink-10 bg-white p-4 shadow-sm sm:grid-cols-5">
        <label className="sm:col-span-2">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-60">🏢 Hospital (SaaS Tenant)</span>
          <input list="auto-hosp" value={hospitalName} onChange={e=>setHospitalName(e.target.value)} className="mt-1 w-full rounded-xl border border-ink-10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10" />
          <datalist id="auto-hosp"><option value="AIIMS Trauma Centre" /><option value="Max Super Speciality, Saket" /><option value="Fortis Hospital, Vasant Kunj" /><option value="Red Cross Central Blood Bank" /><option value="Aster Medcity, Kochi" /></datalist>
        </label>
        <label>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-60">🩸 Group</span>
          <select value={bloodGroup} onChange={e=>setBloodGroup(e.target.value)} className="mt-1 w-full rounded-xl border border-ink-10 bg-white px-3 py-2 text-sm font-bold text-blood outline-none focus:border-violet-300">
            {["O+","O-","A+","A-","B+","B-","AB+","AB-"].map(bg=><option key={bg} value={bg}>{bg}</option>)}
          </select>
        </label>
        <label>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-60">⚡ Urgency</span>
          <select value={urgency} onChange={e=>setUrgency(e.target.value)} className="mt-1 w-full rounded-xl border border-ink-10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-violet-300">
            <option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option>
          </select>
        </label>
        <label>
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-60">Units</span>
          <input type="number" min={1} max={10} value={units} onChange={e=>setUnits(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-ink-10 bg-white px-3 py-2 text-sm font-medium text-ink outline-none focus:border-violet-300" />
        </label>
        <label className="sm:col-span-5">
          <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-60">📍 Location</span>
          <input value={locationLabel} onChange={e=>setLocationLabel(e.target.value)} placeholder="AIIMS, New Delhi" className="mt-1 w-full rounded-xl border border-ink-10 bg-white px-3 py-2 text-sm text-ink placeholder:text-ink-40 outline-none focus:border-violet-300 focus:ring-4 focus:ring-violet-500/10" />
        </label>
      </div>

      {/* Live steps */}
      <div className="relative mt-5 space-y-2.5">
        {steps.length===0 && !running && <p className="rounded-xl border border-dashed border-violet-200 bg-violet-50/50 px-4 py-3 text-center font-mono text-xs text-violet-700">Hit <span className="font-bold">Run Autopilot</span> — agent will RAG-retrieve, forecast risk, match, explain, draft outreach & dispatch rider live.</p>}
        {steps.map(s=>(
          <div key={s.id} className={`rounded-xl border px-4 py-3 flex gap-3 ${s.status==="running" ? "border-amber-200 bg-amber-50/60 animate-pulse" : "border-emerald-200 bg-emerald-50/40"}`}>
            <span className={`mt-0.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold flex-shrink-0 ${s.status==="running" ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"}`}>{s.status==="running" ? "◷" : "✓"}</span>
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs font-bold text-ink">{s.title}</p>
              {s.detail && <p className="mt-0.5 font-mono text-xs leading-relaxed text-ink-60 truncate">{s.detail}</p>}
              {s.citations && <p className="mt-1 font-mono text-[10px] text-violet-700">📚 {s.citations.join(" · ")}</p>}
              {chunks[s.id] && <pre className="mt-2 whitespace-pre-wrap rounded-xl bg-white border border-ink-10 p-3 font-mono text-xs leading-relaxed text-ink shadow-sm">{chunks[s.id]}</pre>}
            </div>
          </div>
        ))}
        {done && <div className={`rounded-xl border px-4 py-3 text-white shadow-xl ${crazy?"bg-gradient-to-r from-violet-600 via-fuchsia-600 to-violet-600 border-fuchsia-300 animate-pulse":"bg-violet-600 border-violet-300"}`}><p className="font-mono text-xs font-bold uppercase tracking-wider flex items-center gap-2">✅ Autopilot {done.mode} complete {crazy && "🎉✨"}</p><p className="mt-1 font-mono text-xs leading-relaxed text-violet-100">{done.summary}</p>{done.citations?.length>0 && <p className="mt-2 font-mono text-[10px] text-violet-200">📚 Citations: {done.citations.join(" · ")}</p>}{crazy && <p className="mt-2 text-lg">🎉🩸🏆✨</p>}</div>}
        {chunks["error"] && <p className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 font-mono text-xs font-bold text-blood">{chunks["error"]}</p>}
      </div>

      <p className="relative mt-3 text-center font-mono text-[10px] uppercase tracking-widest text-ink-40">SaaS tenant-isolated · RAG grounded · Agentic multi-step · Generative streaming · Real delivery dispatch</p>
    </div>
  );
}
