"use client";
import { useEffect, useRef, useState } from "react";

export default function PulseGlobe() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [panic, setPanic] = useState(false);
  useEffect(() => {
    const c = canvasRef.current; if (!c) return;
    const ctx = c.getContext("2d"); if (!ctx) return;
    let raf=0; let a=0;
    function draw(){
      if(!ctx||!c) return;
      const w=c.width, h=c.height;
      ctx.clearRect(0,0,w,h);
      // globe
      ctx.beginPath(); ctx.arc(w/2,h/2,70,0,Math.PI*2); ctx.strokeStyle="rgba(255,255,255,0.08)"; ctx.lineWidth=1; ctx.stroke();
      for(let i=0;i<3;i++){ ctx.beginPath(); ctx.ellipse(w/2,h/2,70,35+i*6,0,0,Math.PI*2); ctx.strokeStyle="rgba(168,32,26,0.12)"; ctx.stroke(); }
      // dots
      const dots=[{x:-30,y:-15},{x:20,y:-10},{x:10,y:25},{x:-15,y:30},{x:35,y:5}];
      dots.forEach((d,i)=>{
        const ang=a*0.02+i;
        const x=w/2 + d.x + Math.sin(ang)*8;
        const y=h/2 + d.y + Math.cos(ang*0.7)*4;
        const pulse=(Math.sin(a*0.1+i)+1)/2;
        ctx.beginPath(); ctx.arc(x,y,3+ pulse*2,0,Math.PI*2); ctx.fillStyle= i%2?"#FF4B4B":"#22D3EE"; ctx.globalAlpha=0.9; ctx.fill(); ctx.globalAlpha=1;
        ctx.beginPath(); ctx.arc(x,y,8+ pulse*4,0,Math.PI*2); ctx.strokeStyle=i%2?"rgba(255,75,75,0.15)":"rgba(34,211,238,0.15)"; ctx.stroke();
      });
      a++;
      raf=requestAnimationFrame(draw);
    }
    draw(); return()=>cancelAnimationFrame(raf);
  }, []);
  useEffect(()=>{
    if(panic){
      try{ const u=new SpeechSynthesisUtterance("Panic mode. Emergency SOS broadcasting to nearest donors."); u.rate=1.1; speechSynthesis.speak(u); }catch{}
      const t=setTimeout(()=>setPanic(false),4000); return()=>clearTimeout(t);
    }
  },[panic]);
  return (
    <div className="rounded-[2rem] border border-ink-10 bg-[#0B1220] p-6 text-white shadow-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none" />
      <div className="relative flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-violet-600 text-white">🌐</div>
        <div><p className="font-display text-sm font-bold">Pulse Globe — Pan-India Live</p><p className="font-mono text-[10px] uppercase tracking-widest text-white/50">3D pulse · Auto-rotate · Real donors</p></div>
        <button onClick={()=>setPanic(true)} className={`ml-auto rounded-full px-4 py-1.5 font-mono text-xs font-black uppercase tracking-wider shadow-lg transition ${panic?"bg-blood text-white animate-pulse":"bg-white text-ink hover:bg-white/90"}`}>{panic?"🆘 Broadcasting...":"🆘 Panic One-Tap"}</button>
      </div>
      <canvas ref={canvasRef} width={320} height={180} className="mt-4 w-full rounded-xl border border-white/10 bg-white/[0.03]" />
      <p className="relative mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-white/30">Delhi · Mumbai · Kochi · Panipat · Bengaluru — live pulse</p>
      {panic && <div className="absolute inset-0 flex items-center justify-center bg-blood/20 backdrop-blur-sm"><span className="rounded-full bg-white px-6 py-3 font-mono text-sm font-black text-blood animate-bounce">🆘 SOS Sent to 3 nearest donors!</span></div>}
    </div>
  );
}
