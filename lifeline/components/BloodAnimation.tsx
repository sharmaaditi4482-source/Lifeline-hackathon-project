"use client";

import { useEffect, useState } from "react";

export default function BloodAnimation() {
  const [heartbeat, setHeartbeat] = useState(false);

  // Trigger heartbeat scale pulse on a rhythmic cycle
  useEffect(() => {
    const pulseInterval = setInterval(() => {
      setHeartbeat(true);
      setTimeout(() => setHeartbeat(false), 300);
    }, 1800);

    return () => clearInterval(pulseInterval);
  }, []);

  return (
    <div className="relative w-full h-[260px] rounded-2xl border border-ink-10 bg-white overflow-hidden flex items-center justify-center">
      {/* Background grid texture representing blood diagnostics */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
        <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="var(--ink)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Capillary/Vein pipeline network */}
      <svg className="absolute w-[90%] h-[90%] pointer-events-none" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Capillary path background */}
        <path
          d="M -20 100 C 50 100, 50 60, 100 60 C 150 60, 150 140, 220 140"
          stroke="var(--blood-10)"
          strokeWidth="16"
          strokeLinecap="round"
        />
        
        {/* Animated signal pulse flowing along the dashed capillary path */}
        <path
          d="M -20 100 C 50 100, 50 60, 100 60 C 150 60, 150 140, 220 140"
          stroke="var(--blood)"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="animate-path-signal opacity-45"
        />

        {/* Dynamic Branch Capillary */}
        <path
          d="M 85 80 C 110 110, 130 140, 160 140"
          stroke="var(--blood-10)"
          strokeWidth="8"
          strokeLinecap="round"
        />
        
        <path
          d="M 85 80 C 110 110, 130 140, 160 140"
          stroke="var(--blood)"
          strokeWidth="1.5"
          strokeLinecap="round"
          className="animate-path-signal opacity-30"
          style={{ animationDelay: "1.5s" }}
        />
      </svg>

      {/* Breathing scale animation on the central droplet card */}
      <div 
        className={`absolute z-10 w-16 h-16 rounded-full border border-blood-10 flex items-center justify-center bg-blood-50 transition-transform duration-300 animate-droplet-breathe ${
          heartbeat ? "scale-[1.14] border-blood/40" : ""
        }`}
      >
        <div className={`w-10 h-10 rounded-full bg-blood flex items-center justify-center transition-all`}>
          {/* Drop shape */}
          <svg className="w-4 h-4 text-white" viewBox="0 0 12 16" fill="currentColor">
            <path d="M6 0C2.4 4.8 0 8 0 11.2C0 14 2.2 16 6 16C9.8 16 12 14 12 11.2C12 8 9.6 4.8 6 0Z" />
          </svg>
        </div>
      </div>

      {/* Floating Red Blood Cell (RBC) particles along the capillary */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Cell 1 */}
        <div className="absolute left-[10%] top-[40%] animate-rbc-flow-1">
          <div className="w-5 h-5 rounded-full bg-blood-light opacity-80 border border-blood/20 shadow-sm flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-blood" />
          </div>
        </div>

        {/* Cell 2 */}
        <div className="absolute left-[35%] top-[25%] animate-rbc-flow-2">
          <div className="w-6 h-6 rounded-full bg-blood-light opacity-95 border border-blood/20 shadow-sm flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-blood" />
          </div>
        </div>

        {/* Cell 3 */}
        <div className="absolute left-[65%] top-[45%] animate-rbc-flow-3">
          <div className="w-5.5 h-5.5 rounded-full bg-blood-light opacity-85 border border-blood/20 shadow-sm flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-blood" />
          </div>
        </div>

        {/* Cell 4 */}
        <div className="absolute left-[80%] top-[55%] animate-rbc-flow-4">
          <div className="w-4.5 h-4.5 rounded-full bg-blood-light opacity-75 border border-blood/20 shadow-sm flex items-center justify-center">
            <div className="w-2 h-2 rounded-full bg-blood" />
          </div>
        </div>
      </div>

      {/* Capillary Line Title overlay */}
      <div className="absolute bottom-3 left-4 font-mono text-[9px] uppercase tracking-widest text-ink-40">
        Live Circulation Network
      </div>

      {/* CSS Keyframes injected here for RBC movement */}
      <style jsx global>{`
        @keyframes rbcFlow1 {
          0% { transform: translate(-20px, 0px) rotate(0deg); opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { transform: translate(160px, -28px) rotate(360deg); opacity: 0; }
        }

        @keyframes rbcFlow2 {
          0% { transform: translate(-30px, 15px) rotate(0deg); opacity: 0; }
          15% { opacity: 0.95; }
          85% { opacity: 0.95; }
          100% { transform: translate(180px, 50px) rotate(-180deg); opacity: 0; }
        }

        @keyframes rbcFlow3 {
          0% { transform: translate(-10px, -20px) rotate(0deg); opacity: 0; }
          5% { opacity: 0.85; }
          95% { opacity: 0.85; }
          100% { transform: translate(140px, 60px) rotate(270deg); opacity: 0; }
        }

        @keyframes rbcFlow4 {
          0% { transform: translate(-40px, 30px) rotate(0deg); opacity: 0; }
          20% { opacity: 0.75; }
          80% { opacity: 0.75; }
          100% { transform: translate(190px, -10px) rotate(-360deg); opacity: 0; }
        }

        .animate-rbc-flow-1 {
          animation: rbcFlow1 8s linear infinite;
        }
        .animate-rbc-flow-2 {
          animation: rbcFlow2 12s linear infinite;
          animation-delay: 2s;
        }
        .animate-rbc-flow-3 {
          animation: rbcFlow3 10s linear infinite;
          animation-delay: 4s;
        }
        .animate-rbc-flow-4 {
          animation: rbcFlow4 14s linear infinite;
          animation-delay: 1s;
        }
      `}</style>
    </div>
  );
}
