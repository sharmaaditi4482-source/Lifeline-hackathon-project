"use client";

import { useEffect, useState } from "react";
import { LiveEvent } from "@/lib/types";

export default function LiveFeed() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [index, setIndex] = useState(0);

  // 1. Fetch live events from real backend event bus
  const fetchLiveEvents = async () => {
    try {
      const res = await fetch("/api/events");
      if (res.ok) {
        const data = await res.json();
        if (data.events && data.events.length > 0) {
          setEvents(data.events);
        }
      }
    } catch {
      // Keep previous events if fetch fails
    }
  };

  useEffect(() => {
    fetchLiveEvents();
    // Poll every 3 seconds for snappy demo live updates
    const pollInterval = setInterval(fetchLiveEvents, 3000);
    return () => clearInterval(pollInterval);
  }, []);

  // 2. Rotate through recent events
  useEffect(() => {
    if (events.length <= 1) return;
    const rotateInterval = setInterval(() => {
      setIndex((prev) => (prev + 1) % events.length);
    }, 4000);
    return () => clearInterval(rotateInterval);
  }, [events.length]);

  if (events.length === 0) {
    return (
      <div className="relative overflow-hidden card border-ink-10 bg-white/40 px-5 py-3.5 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-blood animate-ping" />
          <span className="font-mono text-xs text-ink-60">Connecting to live matching network…</span>
        </div>
      </div>
    );
  }

  const currentEvent = events[index % events.length];

  const formatTimeAgo = (timestampIso: string) => {
    const elapsedSec = Math.floor((Date.now() - new Date(timestampIso).getTime()) / 1000);
    if (elapsedSec < 15) return "Just now";
    if (elapsedSec < 60) return `${elapsedSec}s ago`;
    if (elapsedSec < 3600) return `${Math.floor(elapsedSec / 60)}m ago`;
    return `${Math.floor(elapsedSec / 3600)}h ago`;
  };

  return (
    <div
      key={currentEvent.id}
      className="relative overflow-hidden card border-ink-10 bg-white/50 px-5 py-3.5 backdrop-blur-sm transition-all duration-300 shadow-sm"
    >
      {/* Light shimmer sweep scanner line */}
      <div className="ticker-shimmer-overlay pointer-events-none" />

      <div className="relative z-10 flex items-center justify-between gap-4">
        {/* Left Side Ticker */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-2 w-2 rounded-full bg-blood animate-heartbeat-ecg flex-shrink-0" />

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-60 animate-fade-in">
            <span className="font-display italic text-blood font-semibold">
              {currentEvent.title}
            </span>
            <span className="text-ink-40">·</span>
            <span className="truncate text-ink-60 font-body">
              {currentEvent.description}
            </span>
          </div>
        </div>

        {/* Timestamp */}
        <span className="font-mono text-xs uppercase tracking-widest text-ink-40 animate-fade-in flex-shrink-0">
          {formatTimeAgo(currentEvent.timestamp)}
        </span>
      </div>
    </div>
  );
}
