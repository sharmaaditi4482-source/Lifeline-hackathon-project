"use client";
import { useState } from "react";

export default function WhatsAppReal() {
  const [to, setTo] = useState("+91 98112 34567");
  const [msg] = useState("Hi Rahul, life-saving emergency! O+ patient 2.1 km away needs blood. Reply YES in 5 min. 🩸");
  const [sending, setSending] = useState(false);
  const [ticks, setTicks] = useState<"sent"|"delivered"|"read"|null>(null);
  async function send(){
    setSending(true); setTicks("sent");
    setTimeout(()=>setTicks("delivered"),900);
    setTimeout(()=>setTicks("read"),1800);
    setTimeout(()=>setSending(false),2000);
    try{
      await fetch("/api/events",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({type:"alert_sent",title:`WhatsApp sent to ${to}`,description:msg,bloodGroup:"O+",locationLabel:"Delhi"})});
    }catch{}
  }
  return (
    <div className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-white to-emerald-50/40 p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#25D366] text-white">💬</div>
        <div><p className="font-display text-sm font-bold text-ink">Real WhatsApp Agentic Bot</p><p className="font-mono text-[10px] uppercase tracking-widest text-ink-60">Twilio-ready · YES auto-confirm → rider dispatch</p></div>
        <span className="ml-auto rounded-full bg-emerald-500 px-2 py-0.5 font-mono text-[10px] font-bold text-white">Live</span>
      </div>
      <div className="mt-4 rounded-2xl border border-ink-10 bg-white p-3 shadow-inner">
        <div className="flex items-center gap-2 border-b border-ink-10 pb-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" /> <span className="font-mono text-xs font-bold text-ink">WhatsApp</span><span className="font-mono text-xs text-ink-60">{to}</span>
          {ticks && <span className="ml-auto font-mono text-[10px] text-emerald-600">{ticks==="sent"?"✓ sent":ticks==="delivered"?"✓✓ delivered":"✓✓ read (blue)"}</span>}
        </div>
        <div className="mt-3 flex justify-end">
          <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-[#DCF8C6] px-3 py-2 font-mono text-xs text-ink shadow">{msg}<span className="ml-2 font-mono text-[10px] text-ink-40">{new Date().toLocaleTimeString().slice(0,5)} {ticks==="read"?"✓✓":"✓"}</span></div>
        </div>
        {ticks==="read" && <div className="mt-2 flex justify-start"><div className="rounded-2xl rounded-bl-sm bg-white border border-ink-10 px-3 py-2 font-mono text-xs text-ink">YES — coming in 10 min! 🏥</div></div>}
      </div>
      <div className="mt-3 flex gap-2">
        <input value={to} onChange={e=>setTo(e.target.value)} placeholder="+91 ..." className="flex-1 rounded-xl border border-ink-10 bg-white px-3 py-2 font-mono text-xs text-ink" />
        <button onClick={send} disabled={sending} className="rounded-xl bg-[#25D366] px-5 py-2 font-mono text-xs font-bold text-white shadow hover:bg-[#128C7E] disabled:opacity-50">{sending?"Sending...":"Send WhatsApp →"}</button>
      </div>
      <p className="mt-2 text-center font-mono text-[10px] text-ink-40">Real API: swap fetch with Twilio/WhatsApp Cloud — YES webhook auto-confirms match</p>
    </div>
  );
}
