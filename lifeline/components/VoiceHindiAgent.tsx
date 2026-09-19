"use client";
import { useEffect, useRef, useState } from "react";

const HINDI_PROMPTS = ["मुझे O पॉज़िटिव चाहिए AIIMS में", "दो यूनिट B पॉज़िटिव अर्जेंट", "एबी निगेटिव चाहिए, क्रिटिकल"];

export default function VoiceHindiAgent() {
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const [lang, setLang] = useState<"en-IN"|"hi-IN">("hi-IN");
  const [reply, setReply] = useState("");
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR: any = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false; rec.interimResults = true; rec.lang = lang;
    rec.onresult = (e: any) => {
      let t = ""; for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setText(t);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, [lang]);

  function toggle() {
    if (!recRef.current) { setReply("Browser me voice support nahi — neeche prompt chip dabao."); return; }
    if (listening) { recRef.current.stop(); setListening(false); }
    else { setText(""); setReply(""); recRef.current.lang = lang; recRef.current.start(); setListening(true); }
  }
  function speak(t: string) {
    try { const u = new SpeechSynthesisUtterance(t); u.lang = lang; u.rate = 1; window.speechSynthesis.speak(u); } catch {}
  }
  function useChip(c: string) { setText(c); setLang("hi-IN"); handleSend(c, "hi-IN"); }
  async function handleSend(override?: string, l?: string) {
    const q = (override || text).trim(); if (!q) return;
    const useLang = l || lang;
    setReply("🤖 सोच रहा है...");
    // simple entity extraction demo: blood group + location
    const bg = q.match(/(A\+|A-|B\+|B-|AB\+|AB-|O\+|O-|O positive|A positive)/i)?.[0] || "O+";
    const loc = q.match(/(AIIMS|Max|Fortis|Delhi|Kochi|Mumbai|Panipat|Saket)/i)?.[0] || "Delhi";
    const urgency = q.toLowerCase().includes("critical") || q.includes("अर्जेंट") || q.includes("तुरंत") ? "critical" : "high";
    const ans = useLang==="hi-IN"
      ? `समझ गया — ${bg} चाहिए ${loc} में (${urgency})। मैं तुरंत 4-vector मैच चला रहा हूँ, नज़दीकी donor ढूँढ कर rider dispatch करूँगा।`
      : `Got it — need ${bg} at ${loc} (${urgency}). Running live match and dispatching nearest rider now.`;
    setReply(ans); speak(ans);
  }

  return (
    <div className="rounded-[2rem] border border-ink-10 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">🎙️</div>
        <div><p className="font-display text-sm font-bold text-ink">Voice Hindi Agent — Hands-free SOS</p><p className="font-mono text-[10px] uppercase tracking-widest text-ink-60">hi-IN + en-IN · Real-time entity extraction</p></div>
        <select value={lang} onChange={e=>setLang(e.target.value as any)} className="ml-auto rounded-full border border-ink-10 bg-white px-3 py-1 font-mono text-xs font-bold text-ink">
          <option value="hi-IN">हिंदी</option><option value="en-IN">English</option>
        </select>
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={toggle} className={`flex-1 rounded-full px-5 py-3 font-mono text-xs font-bold uppercase tracking-wider shadow-md transition ${listening?"bg-blood text-white animate-pulse":"bg-ink text-white hover:bg-black"}`}>
          {listening ? "● Listening... Tap to stop" : "🎙️ Hold & Speak — हिंदी / English"}
        </button>
        <button onClick={()=>handleSend()} className="rounded-full border border-ink-10 bg-white px-5 py-3 font-mono text-xs font-bold text-ink hover:bg-ink-5">Send</button>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {HINDI_PROMPTS.map(c=> <button key={c} onClick={()=>useChip(c)} className="rounded-full bg-violet-50 border border-violet-200 px-3 py-1 font-mono text-xs text-violet-700 hover:bg-violet-100">▶ {c}</button>)}
      </div>
      {(text || reply) && (
        <div className="mt-4 space-y-2">
          {text && <div className="rounded-xl bg-ink-5 border border-ink-10 px-3 py-2 font-mono text-xs text-ink"><span className="font-bold text-ink-60">You:</span> {text}</div>}
          {reply && <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2 font-mono text-xs text-emerald-900">{reply}</div>}
        </div>
      )}
    </div>
  );
}
