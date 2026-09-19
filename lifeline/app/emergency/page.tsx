"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { BloodGroup, MatchResult, Location } from "@/lib/types";
import { resolveLocation } from "@/lib/store";
import ExplainMatchButton from "@/components/ai/ExplainMatchButton";
import DonorOutreachButton from "@/components/ai/DonorOutreachButton";
import SosSummaryCard from "@/components/ai/SosSummaryCard";

const MatchMap = dynamic(() => import("@/components/MatchMap"), {
  ssr: false,
  loading: () => <div className="skeleton-block w-full rounded-2xl" style={{ height: "300px" }} />,
});

interface MatchWithLocation extends MatchResult {
  location?: { lat: number; lng: number; label: string };
}

const BLOOD_GROUPS: BloodGroup[] = ["O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-"];

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  delhi: { lat: 28.6139, lng: 77.209 },
  "new delhi": { lat: 28.6139, lng: 77.209 },
  aiims: { lat: 28.5672, lng: 77.21 },
  safdarjung: { lat: 28.57, lng: 77.207 },
  panipat: { lat: 29.3909, lng: 76.9635 },
  noida: { lat: 28.5355, lng: 77.391 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  punjab: { lat: 31.1471, lng: 75.3412 },
  ludhiana: { lat: 30.9010, lng: 75.8573 },
  amritsar: { lat: 31.6340, lng: 74.8723 },
  jalandhar: { lat: 31.3260, lng: 75.5762 },
  patiala: { lat: 30.3398, lng: 76.3869 },
  bathinda: { lat: 30.2110, lng: 74.9455 },
  mohali: { lat: 30.7046, lng: 76.7179 },
  haryana: { lat: 29.0588, lng: 76.0856 },
  mumbai: { lat: 19.076, lng: 72.8777 },
  lilavati: { lat: 19.0519, lng: 72.8291 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  hyderabad: { lat: 17.385, lng: 78.4867 },
  chennai: { lat: 13.0827, lng: 80.2707 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  pune: { lat: 18.5204, lng: 73.8567 },
  jaipur: { lat: 26.9124, lng: 75.7873 },
  lucknow: { lat: 26.8467, lng: 80.9462 },
  chandigarh: { lat: 30.7333, lng: 76.7794 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
};

function MatchSkeleton() {
  return (
    <div className="mt-6 space-y-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="card-2xl p-5" style={{ animationDelay: `${i * 150}ms` }}>
          <div className="flex items-center justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex gap-2">
                <div className="skeleton-block" style={{ width: "80px", height: "20px" }} />
                <div className="skeleton-block" style={{ width: "160px", height: "18px" }} />
              </div>
              <div className="flex gap-3">
                <div className="skeleton-block" style={{ width: "40px", height: "14px" }} />
                <div className="skeleton-block" style={{ width: "70px", height: "14px" }} />
              </div>
            </div>
            <div className="skeleton-block" style={{ width: "80px", height: "36px", borderRadius: "12px" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function EmergencyPage() {
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>("O+");
  const [unitsNeeded, setUnitsNeeded] = useState(2);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [selectedLocation, setSelectedLocation] = useState<Location>({ lat: 28.6139, lng: 77.209, label: "New Delhi, India" });
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [gpsState, setGpsState] = useState<"detecting" | "locked" | "error">("detecting");
  const [locationStatus, setLocationStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const [matches, setMatches] = useState<MatchWithLocation[] | null>(null);
  const [escalated, setEscalated] = useState(false);
  const [requestId, setRequestId] = useState<string | null>(null);
  const [confirmedId, setConfirmedId] = useState<string | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [error, setError] = useState("");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [requestTime, setRequestTime] = useState<Date | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const label = `Current GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
          setSelectedLocation({ lat, lng, label });
          setLocationInput(label);
          setGpsState("locked");
          setLocationStatus(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        },
        () => {
          setGpsState("error");
          setLocationInput("New Delhi, India");
          setLocationStatus("GPS unavailable");
        },
        { timeout: 8000 }
      );
    } else {
      setGpsState("error");
      setLocationInput("New Delhi, India");
      setLocationStatus("GPS not supported");
    }
  }, []);

  useEffect(() => {
    if (requestTime) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - requestTime.getTime()) / 1000));
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [requestTime]);

  async function geocodeLocation(query: string): Promise<Location> {
    return resolveLocation(query, selectedLocation);
  }

  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [voiceFeedback, setVoiceFeedback] = useState("");

  const parseVoiceInput = (text: string) => {
    const lower = text.toLowerCase();
    let detectedBg: BloodGroup | null = null;
    let detectedUnits: number | null = null;
    let detectedLoc: string | null = null;

    // Blood groups regex & keyword matching
    if (lower.includes("ab positive") || lower.includes("ab+") || lower.includes("ab plus") || lower.includes("एबी पॉजिटिव")) detectedBg = "AB+";
    else if (lower.includes("ab negative") || lower.includes("ab-") || lower.includes("ab minus") || lower.includes("एबी नेगेटिव")) detectedBg = "AB-";
    else if (lower.includes("o positive") || lower.includes("o+") || lower.includes("o plus") || lower.includes("ओ पॉजिटिव")) detectedBg = "O+";
    else if (lower.includes("o negative") || lower.includes("o-") || lower.includes("o minus") || lower.includes("ओ नेगेटिव")) detectedBg = "O-";
    else if (lower.includes("a positive") || lower.includes("a+") || lower.includes("a plus") || lower.includes("ए पॉजिटिव")) detectedBg = "A+";
    else if (lower.includes("a negative") || lower.includes("a-") || lower.includes("a minus") || lower.includes("ए नेगेटिव")) detectedBg = "A-";
    else if (lower.includes("b positive") || lower.includes("b+") || lower.includes("b plus") || lower.includes("बी पॉजिटिव")) detectedBg = "B+";
    else if (lower.includes("b negative") || lower.includes("b-") || lower.includes("b minus") || lower.includes("बी नेगेटिव")) detectedBg = "B-";

    // Units matching
    const unitMatch = lower.match(/(\d+)\s*(unit|units|यूनिट|bag|bags|bottles?)/i) || lower.match(/(one|two|three|four|five|ek|do|teen|char)\s*(unit|units|यूनिट|bag|bags)/i);
    if (unitMatch) {
      const val = unitMatch[1].toLowerCase();
      if (val === "one" || val === "ek") detectedUnits = 1;
      else if (val === "two" || val === "do") detectedUnits = 2;
      else if (val === "three" || val === "teen") detectedUnits = 3;
      else if (val === "four" || val === "char") detectedUnits = 4;
      else if (val === "five") detectedUnits = 5;
      else detectedUnits = parseInt(val, 10) || null;
    }

    // 1. Natural location extraction patterns (e.g. "location is Punjab", "in Ludhiana", "at AIIMS", "from Delhi")
    const locPattern = /(?:location is|located at|located in|in|at|near|from|city is|place is)\s+([a-zA-Z\s]+?)(?:\.|$|,|\band\b|\bwith\b|\bneed\b|\bunits?\b|\bblood\b|\bgroup\b)/i;
    const locMatch = lower.match(locPattern);
    if (locMatch && locMatch[1]) {
      const candidate = locMatch[1].trim();
      const forbidden = ["o", "a", "b", "ab", "positive", "negative", "unit", "units", "blood", "group", "emergency"];
      if (candidate.length > 2 && !forbidden.includes(candidate.toLowerCase())) {
        detectedLoc = candidate.charAt(0).toUpperCase() + candidate.slice(1);
      }
    }

    // 2. Comprehensive Indian States, Hospitals, and Cities fallback list
    const knownLocations = [
      "Punjab", "Ludhiana", "Amritsar", "Jalandhar", "Patiala", "Bathinda", "Mohali", 
      "Haryana", "Chandigarh", "Panipat", "Karnal", "Rohtak", "Faridabad", "Gurugram", "Gurgaon",
      "AIIMS", "Safdarjung", "Max", "Apollo", "Fortis", "Medanta", "Lilavati", "Ganga Ram",
      "Delhi", "New Delhi", "Noida", "Greater Noida", "Ghaziabad", "Meerut", "Agra", "Kanpur", "Lucknow", "Varanasi",
      "Mumbai", "Pune", "Nagpur", "Bangalore", "Bengaluru", "Hyderabad", "Chennai", "Kolkata", 
      "Jaipur", "Ahmedabad", "Surat", "Indore", "Bhopal", "Patna", "Ranchi", "Bhubaneswar", "Dehradun",
      "Rohini", "Dwarka", "Saket", "Janakpuri", "Lajpat Nagar", "Connaught Place", "Karol Bagh", "Vasant Kunj"
    ];
    for (const loc of knownLocations) {
      if (lower.includes(loc.toLowerCase())) {
        detectedLoc = loc;
        break;
      }
    }

    const feedbacks = [];
    if (detectedBg) {
      setBloodGroup(detectedBg);
      feedbacks.push(`Blood Group: ${detectedBg}`);
    }
    if (detectedUnits && detectedUnits > 0) {
      setUnitsNeeded(detectedUnits);
      feedbacks.push(`Units: ${detectedUnits}`);
    }
    if (detectedLoc) {
      setLocationInput(detectedLoc);
      geocodeLocation(detectedLoc).then((locObj) => {
        setSelectedLocation(locObj);
        setLocationStatus(`${locObj.lat.toFixed(4)}, ${locObj.lng.toFixed(4)}`);
        setGpsState("locked");
      });
      feedbacks.push(`Location: ${detectedLoc}`);
    }

    if (feedbacks.length > 0) {
      setVoiceFeedback(`✓ Auto-filled: ${feedbacks.join(" · ")}`);
    } else {
      setVoiceFeedback(`Captured: "${text}"`);
    }
  };

  const recognitionRef = useRef<any>(null);

  const simulateVoicePrompt = (sampleText: string) => {
    setIsListening(true);
    setVoiceTranscript(sampleText);
    setVoiceFeedback(`🎙️ Processing voice input: "${sampleText}"...`);
    setTimeout(() => {
      parseVoiceInput(sampleText);
      setIsListening(false);
    }, 600);
  };

  const handleVoiceSOS = () => {
    if (typeof window === "undefined") return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceFeedback("Web Speech API not enabled in this browser. Try the 1-Click Voice simulation buttons below!");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceTranscript("");
        setVoiceFeedback("🎙️ Listening... (Say e.g. 'Need 2 units O positive at AIIMS')");
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + " ";
        }
        fullTranscript = fullTranscript.trim();
        setVoiceTranscript(fullTranscript);
        parseVoiceInput(fullTranscript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          setVoiceFeedback("Mic permission denied. Allow mic or use Quick Voice Prompts below.");
        } else {
          setVoiceFeedback(`Mic ended (${event.error || "No audio detected"}). Try Quick Voice Prompts.`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
      setVoiceFeedback("Microphone access blocked. Use Quick Voice Prompts below.");
    }
  };

  function handleDetectGPS() {
    setGpsState("detecting");
    setLocationStatus("Detecting…");
    navigator.geolocation?.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const label = `Current GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
        setSelectedLocation({ lat, lng, label });
        setLocationInput(label);
        setGpsState("locked");
        setLocationStatus(`${lat.toFixed(4)}, ${lng.toFixed(4)}`);
      },
      () => { setGpsState("error"); setLocationStatus("Permission denied"); }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMatches(null); setConfirmedId(null); setLoading(true);
    try {
      let activeLocation = selectedLocation;
      if (locationInput && locationInput !== selectedLocation.label) {
        setIsGeocoding(true);
        activeLocation = await geocodeLocation(locationInput);
        setSelectedLocation(activeLocation);
        setLocationStatus(`${activeLocation.lat.toFixed(4)}, ${activeLocation.lng.toFixed(4)}`);
        setIsGeocoding(false);
      }
      const res = await fetch("/api/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalName: contactName ? `Emergency — ${contactName}` : "Emergency Anonymous Request",
          bloodGroup, unitsNeeded, urgency: "critical", location: activeLocation,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      setMatches(data.matches || []);
      setEscalated(data.escalated || false);
      setRequestId(data.request?.id ?? null);
      setRequestTime(new Date());
      setElapsedSeconds(0);
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  async function handleConfirm(sourceId: string, sourceName?: string) {
    if (!requestId || confirmLoading) return;
    setConfirmLoading(true);
    try {
      const res = await fetch("/api/match/confirm", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          confirmedSourceId: sourceId,
          confirmedSourceName: sourceName,
        }),
      });
      if (!res.ok) { const err = await res.json(); if (res.status !== 409) throw new Error(err.error); }
      setConfirmedId(sourceId);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Confirmation failed.");
    } finally {
      setConfirmLoading(false);
    }
  }

  const formatElapsed = (s: number) => s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;

  return (
    <div className="min-h-screen bg-[#FBF9F5] font-body text-ink">

      {/* ══════════════════════════════════════════
          HERO HEADER — Deep blood red, full drama
      ══════════════════════════════════════════ */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#7B0D09] via-[#A8201A] to-[#8E1410]">

        {/* Background ECG line */}
        <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 1440 200" preserveAspectRatio="none" fill="none">
          <path d="M0 100 H360 L390 40 L420 160 L450 20 L480 140 L510 100 H1440" stroke="white" strokeWidth="3" strokeLinecap="round"/>
        </svg>

        <div className="relative mx-auto max-w-4xl px-5 pt-6 pb-5 sm:px-6">

          {/* Top row */}
          <div className="flex items-center justify-between mb-5">
            <Link href="/" className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-white/60 hover:text-white transition-colors">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/>
              </svg>
              Back
            </Link>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
              </span>
              <span className="font-mono text-xs uppercase tracking-widest text-white/70 font-semibold">Live Line Active</span>
            </div>
          </div>

          {/* Main hero content */}
          <div className="flex items-center gap-5 sm:gap-8">

            {/* SOS Circle */}
            <div className="relative flex-shrink-0">
              <div className="absolute inset-0 rounded-full bg-white/10 animate-ping" style={{ animationDuration: "2s" }} />
              <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-white/10 border-2 border-white/30 backdrop-blur-sm flex flex-col items-center justify-center">
                <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-white/60">tap to</span>
                <span className="font-display font-extrabold text-3xl sm:text-4xl text-white leading-none tracking-tight">SOS</span>
                <svg className="w-8 h-2 mt-1 opacity-60" viewBox="0 0 32 8" fill="none">
                  <path d="M0 4 H7 L9 1 L11 7 L13 0 L15 6 L17 4 H32" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>

            {/* Title */}
            <div>
              <p className="font-mono text-xs sm:text-xs uppercase tracking-[0.25em] text-white/50 mb-1">LifeLine Emergency System</p>
              <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-extrabold text-white leading-[1.05] tracking-tight">
                Emergency<br/>
                <span className="italic font-semibold text-red-200">Blood Request</span>
              </h1>
              <p className="mt-2 text-sm text-white/60 max-w-sm">
                Matching engine finds nearest compatible blood — donors & banks — in seconds.
              </p>
            </div>
          </div>

          {/* GPS Status Strip */}
          <div className={`mt-5 flex items-center gap-3 rounded-xl px-4 py-2.5 border ${
            gpsState === "locked"
              ? "bg-green-900/30 border-green-400/20"
              : gpsState === "detecting"
              ? "bg-yellow-900/30 border-yellow-400/20"
              : "bg-white/10 border-white/15"
          }`}>
            <span className="text-base flex-shrink-0">
              {gpsState === "locked" ? "📍" : gpsState === "detecting" ? "⏳" : "⚠️"}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-mono text-xs uppercase tracking-widest text-white/50">
                {gpsState === "locked" ? "GPS Auto-Detected" : gpsState === "detecting" ? "Detecting Location…" : "GPS Unavailable"}
              </p>
              <p className="font-mono text-xs text-white font-semibold truncate">
                {gpsState === "locked" ? `${selectedLocation.label} · ${locationStatus}` :
                 gpsState === "detecting" ? "Please wait…" :
                 "Enter location manually below"}
              </p>
            </div>
            {gpsState !== "detecting" && (
              <button type="button" onClick={handleDetectGPS}
                className="flex-shrink-0 font-mono text-xs font-bold text-white bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded-lg transition-colors">
                {gpsState === "locked" ? "Re-detect" : "Try GPS"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════
          FORM SECTION
      ══════════════════════════════════════════ */}
      <main className="mx-auto max-w-4xl px-5 py-8 sm:px-6">

        {/* Urgency pill & 1-Click Evaluation Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blood/10 border border-blood/20 px-3 py-1">
              <span className="h-1.5 w-1.5 rounded-full bg-blood animate-pulse" />
              <span className="font-mono text-xs uppercase tracking-widest text-blood font-bold">Critical Urgency (100% Weight)</span>
            </span>
          </div>

          {/* 1-Click Demo Fill Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-ink-40 text-xs uppercase font-bold">⚡ Quick Presets:</span>
            <button
              type="button"
              onClick={() => {
                setContactName("AIIMS Emergency Trauma Desk");
                setBloodGroup("AB+");
                setUnitsNeeded(2);
                setSelectedLocation({ lat: 28.5672, lng: 77.2100, label: "AIIMS Trauma Center, Delhi" });
                setLocationInput("AIIMS Trauma Center, Delhi");
                setLocationStatus("28.5672, 77.2100");
                setGpsState("locked");
              }}
              className="px-2.5 py-1 rounded-lg bg-red-50 hover:bg-blood hover:text-white text-blood border border-blood/20 text-xs font-semibold transition-colors"
            >
              AIIMS (AB+ Universal Match)
            </button>
            <button
              type="button"
              onClick={() => {
                setContactName("Safdarjung Hospital ER");
                setBloodGroup("O-");
                setUnitsNeeded(3);
                setSelectedLocation({ lat: 28.5700, lng: 77.2070, label: "Safdarjung Hospital, Delhi" });
                setLocationInput("Safdarjung Hospital, Delhi");
                setLocationStatus("28.5700, 77.2070");
                setGpsState("locked");
              }}
              className="px-2.5 py-1 rounded-lg bg-ink-5 hover:bg-blood hover:text-white text-ink-60 border border-ink-10 text-xs font-semibold transition-colors"
            >
              Safdarjung (O- Critical)
            </button>
          </div>
        </div>

        {/* 🎙️ Voice SOS Assistant Panel */}
        <div className="mb-5 rounded-2xl border-2 border-dashed border-blood/20 bg-gradient-to-r from-red-50/70 via-white to-red-50/70 p-4 transition-all shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleVoiceSOS}
                className={`relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-white shadow-md transition-all active:scale-95 ${
                  isListening
                    ? "bg-red-600 animate-pulse ring-4 ring-red-300"
                    : "bg-blood hover:bg-blood-light"
                }`}
                title="Click to speak your emergency blood request"
              >
                {isListening ? (
                  <span className="h-4 w-4 rounded-full bg-white animate-ping" />
                ) : (
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display text-sm font-bold text-ink">
                    🎙️ Voice Emergency Dispatcher (Hands-Free)
                  </h3>
                  {isListening && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 font-mono text-[10px] font-bold text-blood animate-pulse">
                      LIVE LISTENING
                    </span>
                  )}
                </div>
                <p className="text-xs text-ink-60 mt-0.5">
                  {voiceFeedback || 'Tap mic and say: "Need 2 units O positive at AIIMS"'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleVoiceSOS}
              className={`rounded-xl px-4 py-2 font-mono text-xs font-bold transition-all shadow-xs flex-shrink-0 ${
                isListening
                  ? "bg-blood text-white shadow-sm"
                  : "border border-blood/30 bg-white text-blood hover:bg-red-50"
              }`}
            >
              {isListening ? "Listening…" : "Speak Emergency"}
            </button>
          </div>

          {voiceTranscript && (
            <div className="mt-2.5 rounded-xl bg-white/90 border border-ink-10 px-3 py-2 text-xs font-mono text-ink">
              <span className="text-ink-40 font-bold uppercase tracking-wider text-[10px]">Speech Heard: </span>
              <span className="italic font-semibold text-blood">"{voiceTranscript}"</span>
            </div>
          )}

          {/* Quick Simulated Voice Prompts for 100% Reliable Demo */}
          <div className="mt-3 pt-2.5 border-t border-ink-10/60 flex flex-wrap items-center gap-1.5 text-xs font-mono">
            <span className="text-ink-40 text-[10px] uppercase font-bold">⚡ Try Voice Prompts:</span>
            <button
              type="button"
              onClick={() => simulateVoicePrompt("Need 2 units O positive at AIIMS Delhi")}
              className="px-2.5 py-1 rounded-lg bg-white border border-blood/20 text-blood hover:bg-blood hover:text-white text-xs font-medium transition-colors shadow-2xs"
            >
              🎙️ "2 units O+ at AIIMS"
            </button>
            <button
              type="button"
              onClick={() => simulateVoicePrompt("Urgent 3 units A negative blood in Safdarjung")}
              className="px-2.5 py-1 rounded-lg bg-white border border-ink-10 text-ink-60 hover:bg-blood hover:text-white text-xs font-medium transition-colors shadow-2xs"
            >
              🎙️ "3 units A- in Safdarjung"
            </button>
          </div>

          {voiceTranscript && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-red-100/60 border border-blood/25 animate-fade-slide-up">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blood animate-ping" />
                <span className="font-mono text-xs font-bold text-ink">
                  Voice Ready: <span className="text-blood font-extrabold">{unitsNeeded} Units · {bloodGroup}</span> near <span className="text-ink font-semibold">{locationInput || selectedLocation.label.split(',')[0]}</span>
                </span>
              </div>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-4 py-2 rounded-xl bg-blood hover:bg-blood-light text-white font-mono text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
              >
                {loading ? "🔍 Scanning…" : "🩸 Find Matches Now →"}
              </button>
            </div>
          )}
        </div>

        {/* Form card */}
        <form onSubmit={handleSubmit}
          className="rounded-2xl border-2 border-blood/15 bg-white p-5 sm:p-7 shadow-[0_4px_24px_rgba(168,32,26,0.08)] grid gap-5 sm:grid-cols-2">

          {/* Contact Name */}
          <div>
            <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">
              Your Name <span className="normal-case font-normal text-ink-40/50 tracking-normal">— optional</span>
            </label>
            <input value={contactName} onChange={(e) => setContactName(e.target.value)}
              placeholder="e.g. Dr. Sharma / Nurse Priya"
              className="mt-2 w-full rounded-xl border border-ink-10 bg-[#FAFAF9] px-4 py-2.5 text-sm text-ink placeholder:text-ink-40 focus:border-blood/30 focus:outline-none focus:bg-white transition" />
          </div>

          {/* Contact Phone */}
          <div>
            <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">
              Phone <span className="normal-case font-normal text-ink-40/50 tracking-normal">— optional</span>
            </label>
            <input type="tel" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
              placeholder="+91 98XXX XXXXX"
              className="mt-2 w-full rounded-xl border border-ink-10 bg-[#FAFAF9] px-4 py-2.5 text-sm text-ink placeholder:text-ink-40 focus:border-blood/30 focus:outline-none focus:bg-white transition" />
          </div>

          {/* Location */}
          <div className="sm:col-span-2">
            <div className="flex justify-between items-center">
              <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">Location / City *</label>
              <button type="button" onClick={handleDetectGPS}
                className="font-mono text-xs text-blood hover:underline font-bold flex items-center gap-1 transition-colors">
                📍 Use My GPS
              </button>
            </div>
            <div className="mt-2 flex gap-2">
              <input
                list="emergency-locations"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onBlur={async () => {
                  if (locationInput && locationInput !== selectedLocation.label) {
                    setIsGeocoding(true);
                    const loc = await geocodeLocation(locationInput);
                    setSelectedLocation(loc);
                    setLocationStatus(`${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
                    setIsGeocoding(false);
                  }
                }}
                placeholder="Type or select area, hospital, or city..."
                className="w-full rounded-xl border border-ink-10 bg-[#FAFAF9] px-4 py-2.5 text-sm text-ink placeholder:text-ink-40 focus:border-blood/30 focus:outline-none focus:bg-white transition shadow-sm"
              />
              <button type="button" disabled={isGeocoding}
                onClick={async () => {
                  setIsGeocoding(true);
                  const loc = await geocodeLocation(locationInput);
                  setSelectedLocation(loc);
                  setLocationStatus(`${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)}`);
                  setIsGeocoding(false);
                }}
                className="flex-shrink-0 px-3 rounded-xl border border-ink-10 bg-ink-5 font-mono text-xs text-ink hover:bg-ink-10 transition-colors disabled:opacity-50">
                {isGeocoding ? "…" : "🔍 Pin"}
              </button>
            </div>
            <datalist id="emergency-locations">
              <option value="AIIMS Trauma Centre, New Delhi" />
              <option value="Safdarjung Hospital, New Delhi" />
              <option value="Max Super Speciality Hospital, Saket" />
              <option value="Indraprastha Apollo Hospital, Sarita Vihar" />
              <option value="Fortis Hospital, Sector 62, Noida" />
              <option value="Medanta - The Medicity, Gurugram" />
              <option value="Sir Ganga Ram Hospital, Rajinder Nagar" />
              <option value="Connaught Place, Central Delhi" />
              <option value="Rohini Sector 9, North West Delhi" />
              <option value="Dwarka Sector 12, South West Delhi" />
              <option value="Lajpat Nagar, South Delhi" />
              <option value="Karol Bagh, Central Delhi" />
              <option value="Vasant Kunj, South Delhi" />
              <option value="Janakpuri, West Delhi" />
            </datalist>
            {locationStatus && (
              <p className={`mt-1.5 font-mono text-xs ${gpsState === "locked" ? "text-green-600" : "text-ink-40"}`}>
                {gpsState === "locked" ? "✓ GPS: " : ""}{locationStatus}
              </p>
            )}
          </div>

          {/* Blood Group with Quick 1-Click Buttons */}
          <div className="sm:col-span-2 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">
                Blood Group Needed *
              </label>
              <span className="font-mono text-xs text-blood font-bold">
                Selected: {bloodGroup}
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {BLOOD_GROUPS.map((bg) => (
                <button
                  key={bg}
                  type="button"
                  onClick={() => setBloodGroup(bg)}
                  className={`px-3.5 py-2 rounded-xl font-mono text-xs font-bold border transition-all ${
                    bloodGroup === bg
                      ? "bg-blood text-white border-blood shadow-sm scale-105"
                      : "bg-[#FAFAF9] text-ink-60 border-ink-10 hover:border-blood/40 hover:text-blood"
                  }`}
                >
                  {bg}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">Units Needed *</label>
            <input type="number" min={1} max={20} value={unitsNeeded}
              onChange={(e) => setUnitsNeeded(Number(e.target.value))}
              className="mt-1.5 w-full rounded-xl border border-ink-10 bg-[#FAFAF9] px-4 py-2.5 text-sm text-ink focus:border-blood/30 focus:outline-none focus:bg-white transition" />
          </div>

          {/* Submit */}
          <div className="sm:col-span-2 pt-1">
            <button type="submit"
              disabled={loading || isGeocoding || gpsState === "detecting"}
              className="w-full rounded-xl bg-blood py-4 font-display text-sm font-bold uppercase tracking-widest text-white transition-all hover:bg-blood-light disabled:opacity-50 shadow-md hover:shadow-[0_8px_28px_rgba(168,32,26,0.35)] active:scale-[0.99]">
              {loading ? "🔍 Scanning Nearest Blood Sources…" :
               isGeocoding ? "📍 Pinpointing Location…" :
               gpsState === "detecting" ? "⏳ Locking GPS…" :
               "🩸 Find Blood Now →"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-blood/20 bg-blood/5 px-4 py-3">
            <span className="text-blood text-sm">⚠️</span>
            <p className="font-mono text-sm text-blood">{error}</p>
          </div>
        )}

        {loading && <MatchSkeleton />}

        {/* ══ RESULTS ══ */}
        {matches && (
          <section className="mt-10" style={{ animation: "fadeSlideUp 0.5s ease-out both" }}>

            {/* Results header */}
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <h2 className="font-display text-2xl font-semibold text-ink">
                  {escalated ? "No matches found" : `${matches.length} Match${matches.length !== 1 ? "es" : ""} Found`}
                </h2>
                <p className="font-mono text-xs text-ink-40 mt-0.5">
                  Near {selectedLocation.label.split(",")[0]}
                  {requestTime && <> · Request raised <span className="text-blood font-semibold">{formatElapsed(elapsedSeconds)}</span> ago</>}
                </p>
              </div>
              {!escalated && (
                <div className="flex-shrink-0 flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="font-mono text-xs uppercase tracking-widest text-green-700 font-semibold">Live Matches</span>
                </div>
              )}
            </div>

            {escalated ? (
              <div className="card-2xl border-amber-200 bg-amber-50/60 p-5">
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-amber-700 mb-1">Auto-Escalated</p>
                <p className="text-sm text-amber-800">Request sent to nearest district blood-bank network for broader matching.</p>
              </div>
            ) : (
              <>
                {/* Map */}
                <div className="rounded-2xl overflow-hidden border border-ink-10 shadow-sm">
                  <MatchMap hospitalLocation={selectedLocation} matches={matches} />
                </div>

                {/* Cards */}
                <div className="mt-4 space-y-3">
                  {matches.map((m, i) => {
                    const isConfirmed = confirmedId === m.sourceId;
                    const isReleased = confirmedId !== null && confirmedId !== m.sourceId;
                    return (
                      <div key={`${m.sourceType}-${m.sourceId}`}
                        className={`rounded-2xl border p-5 transition-all duration-500 ${
                          isReleased ? "opacity-35 bg-white border-ink-10" :
                          i === 0 && !isReleased ? "bg-red-50/60 border-blood/25 shadow-sm" :
                          "bg-white border-ink-10"
                        }`}
                        style={{ animation: "fadeSlideUp 0.4s ease-out both", animationDelay: `${i * 80}ms` }}>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              {i === 0 && !isReleased && (
                                <span className="rounded-lg bg-blood px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-widest text-white">
                                  Best Match
                                </span>
                              )}
                              <p className="font-display text-base font-semibold text-ink sm:text-lg">{m.sourceName}</p>
                              <span className="font-mono text-xs text-ink-40 bg-ink-5 rounded-md px-2 py-0.5">
                                {m.sourceType === "donor" ? "🙋 Donor" : "🏥 Blood Bank"}
                              </span>
                            </div>
                            <p className="font-mono text-xs text-ink-60">
                              <span className="font-bold text-blood text-sm">{m.bloodGroup}</span>
                              {" · "}<span className="text-ink font-semibold">{m.distanceKm} km</span> away
                              {" · "}Score <span className="font-bold text-ink">{Math.round(m.score * 100)}</span><span className="text-ink-40">/100</span>
                            </p>
                          </div>

                          <div className="flex-shrink-0">
                            {isReleased ? (
                              <span className="inline-block rounded-xl bg-ink-5 px-4 py-2 font-mono text-xs text-ink-40">Released</span>
                            ) : isConfirmed ? (
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-green-50 border border-green-200 px-4 py-2 font-mono text-xs font-bold text-green-700">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                                Locked
                              </span>
                            ) : (
                              <button onClick={() => handleConfirm(m.sourceId, m.sourceName)}
                                disabled={confirmedId !== null || confirmLoading}
                                className="rounded-xl border border-ink-10 bg-white px-5 py-2 font-mono text-xs font-semibold text-ink transition-all hover:border-blood hover:text-blood hover:bg-red-50 disabled:opacity-40">
                                {confirmLoading ? "Locking…" : "Confirm →"}
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-4 gap-2 border-t border-ink-5 pt-2.5">
                          {[
                            { label: "Urgency", value: m.breakdown.urgency },
                            { label: "Proximity", value: m.breakdown.proximity },
                            { label: "Expiry", value: m.breakdown.expiry },
                            { label: "Reliability", value: m.breakdown.reliability },
                          ].map((item) => (
                            <div key={item.label} className="text-center">
                              <p className="font-mono text-xs uppercase tracking-widest text-ink-60">{item.label}</p>
                              <p className="font-mono text-xs font-semibold text-ink mt-0.5">{item.value.toFixed(2)}</p>
                              {/* Mini progress bar */}
                              <div className="mt-1 h-1 rounded-full bg-ink-5 overflow-hidden">
                                <div className="h-full rounded-full bg-blood/60 transition-all" style={{ width: `${item.value * 100}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* AI features row */}
                        {!isReleased && (
                          <div className="mt-3 flex flex-wrap items-start gap-3 border-t border-ink-5 pt-3">
                            <ExplainMatchButton
                              compact
                              request={{
                                id: requestId || "pending",
                                hospitalName: `Emergency — ${contactName || "Anonymous"}`,
                                location: selectedLocation,
                                bloodGroup,
                                unitsNeeded,
                                urgency: "critical" as const,
                                status: confirmedId ? "confirmed" : "open",
                                createdAt: new Date().toISOString(),
                              }}
                              match={{
                                sourceType: m.sourceType,
                                sourceId: m.sourceId,
                                sourceName: m.sourceName,
                                bloodGroup: m.bloodGroup,
                                distanceKm: m.distanceKm,
                                score: m.score,
                                breakdown: m.breakdown,
                                eligibilityNote: m.eligibilityNote,
                                location: m.location,
                                phone: m.phone,
                                totalDonations: m.totalDonations,
                                isVerified: m.isVerified,
                              }}
                            />
                            {m.sourceType === "donor" && isConfirmed && (
                              <DonorOutreachButton
                                donorName={m.sourceName}
                                bloodGroup={m.bloodGroup}
                                distanceKm={m.distanceKm}
                                urgency="critical"
                                requestId={requestId || "pending"}
                                verified={m.isVerified}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {confirmedId && (
              <div className="mt-5 rounded-2xl border border-green-200 bg-green-50/80 p-5"
                style={{ animation: "fadeSlideUp 0.4s ease-out both" }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-green-600 text-lg">✅</span>
                  <p className="font-mono text-xs font-bold uppercase tracking-widest text-green-700">Match Confirmed & Locked</p>
                </div>
                <p className="text-sm text-green-800">
                  First-confirmed-lock active. All other candidates auto-released.
                  {contactPhone && <span className="block mt-1 font-mono text-xs">Callback: {contactPhone}</span>}
                </p>
              </div>
            )}

            {/* Gen-AI Emergency Summary */}
            {confirmedId && (
              <SosSummaryCard
                hospitalName={`Emergency — ${contactName || "Anonymous"}`}
                bloodGroup={bloodGroup}
                unitsNeeded={unitsNeeded}
                urgency="critical"
                locationLabel={selectedLocation.label}
                topSourceName={matches?.[0]?.sourceName}
                topScore={matches?.[0]?.score}
                contactName={contactName || undefined}
              />
            )}
          </section>
        )}
      </main>
    </div>
  );
}
