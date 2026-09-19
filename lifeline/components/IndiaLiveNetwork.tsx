"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { LiveEvent } from "@/lib/types";

interface CityNode {
  id: string;
  name: string;
  lat: number;
  lng: number;
  hint: string;
}

const CITIES: CityNode[] = [
  { id: "delhi", name: "Delhi NCR", lat: 28.6, lng: 77.2, hint: "AIIMS · Safdarjung · Apollo" },
  { id: "panipat", name: "Panipat", lat: 29.39, lng: 76.96, hint: "Civil Hospital · Prem Hospital" },
  { id: "chandigarh", name: "Chandigarh", lat: 30.73, lng: 76.78, hint: "Regional Network Hub" },
  { id: "mumbai", name: "Mumbai", lat: 19.07, lng: 72.88, hint: "Lilavati · Bandra" },
  { id: "pune", name: "Pune", lat: 18.52, lng: 73.86, hint: "Western Supply Route" },
  { id: "kochi", name: "Kochi", lat: 10.03, lng: 76.31, hint: "Aster Medcity · AIMS" },
  { id: "kozhikode", name: "Kozhikode", lat: 11.26, lng: 75.78, hint: "Coastal Reserve" },
  { id: "trivandrum", name: "Trivandrum", lat: 8.52, lng: 76.94, hint: "Govt Medical College" },
  { id: "bengaluru", name: "Bengaluru", lat: 12.97, lng: 77.59, hint: "Manipal Hospital" },
  { id: "chennai", name: "Chennai", lat: 13.08, lng: 80.27, hint: "Tamil Nadu Hub" },
  { id: "kolkata", name: "Kolkata", lat: 22.57, lng: 88.36, hint: "Eastern Belt" },
  { id: "jaipur", name: "Jaipur", lat: 26.91, lng: 75.79, hint: "Rajasthan Route" },
  { id: "lucknow", name: "Lucknow", lat: 26.85, lng: 80.95, hint: "UP Central Hub" },
  { id: "hyderabad", name: "Hyderabad", lat: 17.38, lng: 78.49, hint: "Telangana Hub" },
  { id: "ahmedabad", name: "Ahmedabad", lat: 23.02, lng: 72.57, hint: "Gujarat Hub" },
];

// Project lat/lng → India-fit viewBox (lng 68-98, lat 8-37)
const W = 460;
const H = 500;
const LON_MIN = 66.5;
const LON_MAX = 99;
const LAT_MIN = 6.5;
const LAT_MAX = 37.2;

function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - LON_MIN) / (LON_MAX - LON_MIN)) * W;
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H;
  return { x, y };
}

// Rough but recognizable India outline (polyline, drawn faintly behind nodes)
const INDIA_OUTLINE_POINTS: [number, number][] = [
  [36.4, 74.8], [36.1, 77.6], [34.8, 78.0], [33.6, 75.8], [32.5, 78.5],
  [31.4, 77.0], [30.4, 78.7], [29.5, 76.0], [28.7, 76.9], [28.3, 78.4],
  [27.9, 76.1], [26.7, 74.5], [25.8, 73.5], [24.8, 72.9], [23.3, 74.8],
  [22.3, 73.2], [21.2, 71.7], [23.6, 68.9], [24.3, 69.8], [25.5, 71.5],
  [27.0, 70.7], [28.5, 70.9], [29.6, 74.2], [31.0, 74.5], [32.3, 76.0],
  [31.9, 77.2], [32.7, 78.6], [33.6, 78.9], [34.4, 79.4], [35.9, 77.8],
  [36.4, 74.8],
];

// Tuned silhouette refinement: southern peninsula + east coast
const INDIA_SOUTH_POINTS: [number, number][] = [
  [27.0, 70.7], [24.1, 72.2], [23.2, 72.6], [22.6, 73.7], [21.3, 72.6],
  [20.6, 73.9], [20.0, 73.3], [19.2, 72.7], [18.6, 72.4], [18.1, 73.1],
  [17.4, 73.7], [16.5, 74.2], [15.6, 73.9], [14.8, 74.1], [14.1, 74.4],
  [13.3, 74.8], [12.5, 75.2], [12.0, 76.8], [11.7, 78.0], [10.9, 78.9],
  [10.1, 79.3], [9.8, 80.1], [9.3, 80.7], [8.8, 79.4], [8.1, 77.5],
  [8.2, 77.3], [8.7, 76.3], [8.5, 76.9], [9.3, 76.3], [10.1, 77.1],
  [11.2, 76.9], [12.1, 77.6], [13.1, 77.5], [13.7, 79.6], [14.5, 80.0],
  [15.4, 80.1], [16.3, 80.7], [17.2, 81.6], [18.3, 82.9], [19.3, 83.2],
  [19.8, 85.0], [20.4, 85.7], [20.8, 86.3], [20.9, 87.2], [21.4, 87.9],
  [21.7, 88.0], [21.9, 89.9], [21.1, 89.5], [21.7, 88.2], [22.1, 88.3],
  [22.6, 88.4], [22.4, 88.9], [22.9, 89.1], [23.4, 88.6], [24.3, 88.1],
  [25.0, 88.3], [26.1, 89.2], [26.7, 89.8], [27.2, 88.6], [26.7, 88.1],
  [26.0, 87.6], [26.5, 86.6], [25.4, 86.1], [25.1, 84.6], [24.6, 83.4],
  [24.1, 82.0], [24.7, 80.7], [25.1, 79.2], [26.1, 78.4], [26.9, 78.4],
  [27.3, 79.6], [28.0, 79.0], [28.5, 78.2], [29.2, 78.9], [29.9, 78.1],
  [30.2, 78.9], [30.9, 78.8], [31.6, 79.7], [31.9, 78.6], [32.8, 79.1],
  [33.2, 78.4], [34.2, 78.9], [34.5, 79.0], [34.8, 78.3], [35.8, 77.5],
  [36.4, 77.2], [36.2, 77.9], [36.4, 76.9], [35.9, 76.4], [35.5, 75.9],
  [36.2, 75.6], [36.4, 74.8],
];

function cityKeywords(): Record<string, string[]> {
  return {
    delhi: ["delhi", "safdarjung", "aiims", "connaught", "lajpat", "rohini", "saket", "max", "apollo", "fortis", "noida", "gurugram", "gurgaon"],
    panipat: ["panipat", "haryana"],
    chandigarh: ["chandigarh"],
    mumbai: ["mumbai", "bandra", "parel", "lilavati"],
    pune: ["pune"],
    kochi: ["kochi", "cochin", "ernakulam", "aster", "amrita"],
    kozhikode: ["kozhikode", "calicut"],
    trivandrum: ["trivandrum", "thiruvananthapuram", "medical college"],
    bengaluru: ["bengaluru", "bangalore", "manipal", "indiranagar"],
    chennai: ["chennai", "madras"],
    kolkata: ["kolkata", "calcutta"],
    jaipur: ["jaipur"],
    lucknow: ["lucknow"],
    hyderabad: ["hyderabad", "secunderabad"],
    ahmedabad: ["ahmedabad"],
  };
}

function parseCity(label: string, mappings: Record<string, string[]>): string[] {
  const lower = (label || "").toLowerCase();
  const hits: string[] = [];
  for (const [city, keys] of Object.entries(mappings)) {
    if (keys.some((k) => lower.includes(k))) hits.push(city);
  }
  return hits;
}

interface LiveDonorPin {
  id: string;
  name: string;
  bloodGroup: string;
  lat: number;
  lng: number;
  label: string;
  self?: boolean;
}

export default function IndiaLiveNetwork() {
  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [activeCity, setActiveCity] = useState<string>("delhi");
  const [pulseNow, setPulseNow] = useState(0);
  const [donors, setDonors] = useState<LiveDonorPin[]>([]);
  const [geoState, setGeoState] = useState<"idle" | "locating" | "sharing" | "live" | "error">("idle");
  const mappings = useMemo(cityKeywords, []);
  const selfIdRef = useRef<string | null>(null);

  /**
   * LIVE EVENT STREAM — Server-Sent Events replaces polling. The server pushes
   * `{type:"event", event}` frames the moment an event is recorded.
   */
  useEffect(() => {
    const es = new EventSource("/api/events/stream");
    es.onmessage = (msg) => {
      try {
        const data = JSON.parse(msg.data);
        if (data.type === "event" && data.event) {
          setEvents((prev) => {
            const merged = [data.event, ...prev].filter(
              (ev, i, arr) => arr.findIndex((x) => x.id === ev.id) === i
            );
            return merged.slice(0, 12);
          });
        }
      } catch {}
    };
    es.onerror = () => {
      // EventSource auto-reconnects; nothing to do here.
    };
    return () => es.close();
  }, []);

  // Poll the presence API so the radar stays fresh even if SSE is blocked.
  useEffect(() => {
    const fetchPresence = async () => {
      try {
        const res = await fetch("/api/presence");
        if (res.ok) {
          const data = await res.json();
          const pins: LiveDonorPin[] = (data.donors || []).map((d: any) => ({
            id: d.id,
            name: d.name,
            bloodGroup: d.bloodGroup,
            lat: d.lat,
            lng: d.lng,
            label: d.label,
            self: d.id === selfIdRef.current,
          }));
          setDonors(pins);
        }
      } catch {}
    };
    fetchPresence();
    const poll = setInterval(fetchPresence, 8000);
    return () => clearInterval(poll);
  }, []);

  // Rotate through hot cities so pins feel alive even without fresh events
  useEffect(() => {
    const rotate = setInterval(() => {
      const hot = CityNamesFromEvents(events, mappings);
      const pool = hot.length ? hot : CITIES.map((c) => c.id);
      setActiveCity(pool[Math.floor(Math.random() * pool.length)]);
      setPulseNow((n) => n + 1);
    }, 2600);
    return () => clearInterval(rotate);
  }, [events, mappings]);

  /** Geolocation → live donor radar pin on the India map. */
  async function shareLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoState("error");
      return;
    }
    setGeoState("locating");
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: false, timeout: 10000 })
      );
      setGeoState("sharing");
      const donorId = `live_${Math.random().toString(36).substring(2, 8)}`;
      selfIdRef.current = donorId;
      const res = await fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          donorId,
          name: "You — live donor",
          bloodGroup: "O+",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          label: "Live Geolocation",
        }),
      });
      if (res.ok) {
        setGeoState("live");
        // Immediately refresh pins so "you" show up on the radar.
        const data = await res.json();
        if (data.presence) {
          setDonors((prev) => [
            ...prev.filter((d) => d.id !== donorId),
            {
              id: donorId,
              name: "You — live donor",
              bloodGroup: data.presence.bloodGroup,
              lat: data.presence.lat,
              lng: data.presence.lng,
              label: "Live Geolocation",
              self: true,
            },
          ]);
        }
      } else {
        setGeoState("error");
      }
    } catch {
      setGeoState("error");
    }
  }

  const outlinePath = useMemo(() => {
    const pts = [...INDIA_OUTLINE_POINTS, ...INDIA_SOUTH_POINTS];
    return pts
      .map(([lat, lng], i) => {
        const { x, y } = project(lat, lng);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, []);

  return (
    <div className="relative overflow-hidden rounded-3xl border border-ink-10 bg-[#0B1220] text-white shadow-xl">
      {/* Header strip */}
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF4B4B] animate-pulse" />
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-white/90">
            🇮🇳 Live India SOS Network
          </span>
        </div>
        <div className="flex items-center gap-4">
          {["OPEN", "MATCHED", "DISPATCHED"].map((s, i) => (
            <span key={s} className="hidden items-center gap-1.5 sm:flex">
              <span className={`h-1.5 w-1.5 rounded-full ${i === 0 ? "bg-[#FF4B4B]" : i === 1 ? "bg-amber-400" : "bg-emerald-400"}`} />
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/50">{s}</span>
            </span>
          ))}
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-white/40">
            <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-emerald-300">SSE push</span>
          </span>
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_300px]">
        {/* ── Map canvas ── */}
        <div className="relative min-h-[340px] overflow-hidden">
          {/* Grid backdrop */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          {/* Radar sweep */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[560px] w-[560px] rounded-full radar-sweep-conic opacity-30" />

          <svg viewBox={`0 0 ${W} ${H}`} className="relative h-full w-full">
            {/* India silhouette */}
            <path d={outlinePath} fill="rgba(255,75,75,0.04)" stroke="rgba(255,255,255,0.18)" strokeWidth={1.2} strokeLinejoin="round" />
            {/* Node connection arcs */}
            <g stroke="rgba(255,75,75,0.25)" strokeWidth={0.8} fill="none">
              {CITIES.map((c) => {
                const a = project(CITIES[0].lat, CITIES[0].lng);
                const b = project(c.lat, c.lng);
                if (c.id === "delhi") return null;
                return (
                  <line
                    key={c.id}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    strokeDasharray="3 5"
                    className="animate-fade-in"
                  />
                );
              })}
            </g>

            {/* LIVE DONOR RADAR PINS (geolocation presence) */}
            {donors.map((d) => (
              <g key={d.id} transform={`translate(${project(d.lat, d.lng).x}, ${project(d.lat, d.lng).y})`}>
                <circle r={18} fill="none" stroke={d.self ? "#4ADE80" : "#22D3EE"} strokeWidth={1.2} opacity={0.7} className="animate-ping-slow" />
                <circle r={6.5} fill={d.self ? "#22C55E" : "#0EA5E9"} className="drop-shadow-[0_0_6px_rgba(34,211,238,0.9)]" />
                <text y={-12} textAnchor="middle" fontSize={8} fill="#d5f5ff" fontFamily="monospace">
                  {d.bloodGroup}
                </text>
              </g>
            ))}

            {/* City nodes */}
            {CITIES.map((c) => {
              const { x, y } = project(c.lat, c.lng);
              const isActive = activeCity === c.id;
              const inActiveRegion = isActive;
              return (
                <g key={c.id} transform={`translate(${x}, ${y})`}>
                  {inActiveRegion && (
                    <>
                      <circle r={26} fill="none" stroke="#FF4B4B" strokeWidth={1} opacity={0.5} className="animate-ping-slow" />
                      <circle r={14} fill="none" stroke="#FF4B4B" strokeWidth={1.5} opacity={0.7} className="animate-ping-slow" />
                    </>
                  )}
                  <circle
                    r={4.5}
                    fill={inActiveRegion ? "#FF4B4B" : "rgba(255,255,255,0.7)"}
                    className={inActiveRegion ? "drop-shadow-[0_0_6px_rgba(255,75,75,0.9)]" : "drop-shadow-[0_0_3px_rgba(255,255,255,0.5)]"}
                    style={{
                      transition: "fill 0.4s",
                    }}
                  />
                  <text y={14} textAnchor="middle" fontSize={9} fill={inActiveRegion ? "#ffd7d7" : "rgba(255,255,255,0.45)"} fontFamily="monospace">
                    {c.name}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Centered pulse: current active city details */}
          <div className="pointer-events-none absolute bottom-3 left-3 rounded-2xl border border-white/10 bg-black/40 px-4 py-2.5 backdrop-blur-sm">
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#FF4B4B] animate-pulse" />
              <span className="font-display text-sm font-semibold text-white">
                {CITIES.find((c) => c.id === activeCity)?.name ?? "Delhi NCR"}
              </span>
            </div>
            <p className="mt-0.5 font-mono text-[10px] text-white/50">
              {CITIES.find((c) => c.id === activeCity)?.hint ?? "AIIMS · Safdarjung · Apollo"}
            </p>
          </div>

          {/* Geolocation share control */}
          <div className="absolute right-3 top-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => void shareLocation()}
              disabled={geoState === "locating" || geoState === "sharing"}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-50"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              {geoState === "locating" ? "Locating…" : geoState === "sharing" ? "Broadcasting…" : geoState === "live" ? "You are live 🟢" : "I'm a live donor"}
            </button>
            {geoState === "error" && (
              <p className="mt-1 text-center font-mono text-[9px] text-red-300">Location unavailable</p>
            )}
          </div>

          {/* Live donor legend */}
          {donors.length > 0 && (
            <div className="pointer-events-none absolute bottom-3 right-3 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 backdrop-blur-sm">
              <span className="font-mono text-[10px] text-white/60">
                <span className="text-cyan-300">●</span> {donors.length} donor{donors.length > 1 ? "s" : ""} live
              </span>
            </div>
          )}
        </div>

        {/* ── Live event side panel ── */}
        <div className="border-t border-white/10 lg:border-l lg:border-t-0">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
            <span className="font-mono text-[10px] font-semibold uppercase tracking-widest text-white/60">
              Event Stream
            </span>
            <span className="font-mono text-[10px] text-white/35">{events.length} live</span>
          </div>
          <ul className="max-h-[300px] space-y-2 overflow-y-auto px-4 py-3">
            {(events.length ? events : []).slice(0, 10).map((ev, i) => (
              <li key={ev.id || i} className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2 animate-fade-in">
                <span className={`mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full ${i === 0 ? "bg-[#FF4B4B] animate-pulse" : "bg-white/25"}`} />
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-white/90">{ev.title}</p>
                  <p className="truncate text-[10px] text-white/45">{ev.description}</p>
                </div>
              </li>
            ))}
            {events.length === 0 && (
              <li className="flex items-center gap-2 px-1 py-2 text-[11px] text-white/40">
                <span className="h-1.5 w-1.5 rounded-full bg-white/30 animate-pulse" />
                Connecting to live matching network…
              </li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CityNamesFromEvents(events: LiveEvent[], mappings: Record<string, string[]>): string[] {
  const names = new Set<string>();
  events.forEach((ev) => {
    const label = ev.locationLabel || ev.description || "";
    parseCity(label, mappings).forEach((c) => names.add(c));
  });
  return [...names];
}