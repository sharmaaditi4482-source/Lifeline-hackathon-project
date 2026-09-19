"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LiveEvent } from "@/lib/types";

type HubState = "connecting" | "open" | "closed" | "error";

interface HubMessage {
  type: "hello" | "event" | "tick" | "pong" | "broadcast" | "peers" | "presence";
  peerId?: string;
  peers?: number;
  recent?: LiveEvent[];
  donors?: unknown[];
  event?: LiveEvent;
  ts?: number;
  clientSentAt?: number;
  serverEpochMs?: number;
  text?: string;
  from?: string;
  eventCount?: number;
}

export default function RealtimeHub() {
  const [state, setState] = useState<HubState>("connecting");
  const [peerId, setPeerId] = useState<string>("");
  const [peers, setPeers] = useState(0);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [ticker, setTicker] = useState<string[]>([]);
  const [donorCount, setDonorCount] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [toggle, setToggle] = useState(true);

  const wsRef = useRef<WebSocket | null>(null);
  const tickerRef = useRef<string[]>([]);

  const ping = useCallback(() => {
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: "ping", t: Date.now() }));
  }, []);

  useEffect(() => {
    const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
    let ws: WebSocket;
    let pingInterval: ReturnType<typeof setInterval>;

    const connect = () => {
      setState("connecting");
      try {
        ws = new WebSocket(`${proto}//${window.location.hostname}:3001`);
      } catch {
        setState("error");
        return;
      }
      wsRef.current = ws;

      ws.onopen = () => {
        setState("open");
        ping();
        pingInterval = setInterval(() => {
          ws.send(JSON.stringify({ type: "ping", t: Date.now() }));
        }, 5000);
      };

      ws.onclose = () => {
        setState("closed");
        if (pingInterval) clearInterval(pingInterval);
        // Auto-retry after 4s (matches WebSocket-on-hybrid resilience vibe).
        setTimeout(() => {
          if (toggle) connect();
        }, 4000);
      };

      ws.onerror = () => setState("error");

      ws.onmessage = (ev) => {
        let data: HubMessage;
        try {
          data = JSON.parse(String(ev.data));
        } catch {
          return;
        }
        switch (data.type) {
          case "hello":
            setPeerId(data.peerId ?? "");
            setPeers(data.peers ?? 1);
            if (Array.isArray(data.recent) && data.recent.length) {
              const lines = data.recent.slice(0, 3).map((ev: LiveEvent) => ev.title);
              pushTick(lines);
            }
            break;
          case "event":
            if (data.event) pushTick([data.event.title]);
            break;
          case "tick":
            setPeers((p) => (data.peers ? data.peers : p));
            if (typeof data.donors === "number") setDonorCount(data.donors);
            break;
          case "pong":
            if (typeof data.clientSentAt === "number") {
              setLatencyMs(Math.max(0, Date.now() - data.clientSentAt));
            }
            break;
          case "broadcast":
            pushTick([`${data.from}: ${data.text}`]);
            break;
          case "peers":
            if (typeof data.peers === "number") setPeers(data.peers);
            break;
          case "presence":
            if (typeof data.peers === "number") setPeers(data.peers);
            if (data.donors) setDonorCount((c) => (c ?? 0) + 1);
            break;
        }
      };
    };

    if (toggle) connect();
    return () => {
      if (pingInterval) clearInterval(pingInterval);
      if (ws) ws.close();
      wsRef.current = null;
    };
  }, [toggle, ping]);

  function pushTick(lines: string[]) {
    const next = [...lines, ...tickerRef.current].slice(0, 20);
    tickerRef.current = next;
    setTicker(next);
  }

  function sendBroadcast() {
    const ws = wsRef.current;
    const text = message.trim();
    if (!ws || ws.readyState !== WebSocket.OPEN || !text) return;
    ws.send(JSON.stringify({ type: "broadcast", text }));
    pushTick([`me: ${text}`]);
    setMessage("");
  }

  const statusColor =
    state === "open" ? "bg-emerald-400" : state === "connecting" ? "bg-amber-400 animate-pulse" : "bg-red-400";

  return (
    <div className="rounded-3xl border border-ink-10 bg-[#0B1220] p-6 text-white shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className={`h-2.5 w-2.5 rounded-full ${statusColor}`} />
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-white/90">
            ⚡ LifeLine Realtime Hub
          </span>
          <span className="rounded-full bg-white/5 px-2 py-0.5 font-mono text-[10px] text-white/40">
            WebSocket :3001
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-cyan-500/10 px-2 py-0.5 font-mono text-[10px] text-cyan-300">
            {peers} peer{s(peers)}
          </span>
          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-300">
            {latencyMs === null ? "lat –" : `lat ${latencyMs}ms`}
          </span>
          <span className="rounded-full bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] text-violet-300">
            {donorCount === null ? "donors –" : `${donorCount} donors`}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[1fr_auto]">
        <div className="flex gap-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") sendBroadcast();
            }}
            disabled={state !== "open"}
            placeholder={state === "open" ? `You are ${peerId} — broadcast to every connected tab…` : "Connecting to hub…"}
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2 font-mono text-xs text-white placeholder-white/30 outline-none transition focus:border-cyan-400/50 disabled:opacity-40"
          />
          <button
            type="button"
            onClick={sendBroadcast}
            disabled={state !== "open"}
            className="shrink-0 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-white transition hover:opacity-90 disabled:opacity-40"
          >
            Broadcast
          </button>
        </div>
        <button
          type="button"
          onClick={() => setToggle((t) => !t)}
          className={`rounded-xl border px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider transition ${
            toggle
              ? "border-red-500/40 bg-red-500/10 text-red-300 hover:bg-red-500/20"
              : "border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
          }`}
        >
          {toggle ? "Disconnect" : "Connect"}
        </button>
      </div>

      <ul className="mt-4 max-h-44 space-y-1 overflow-y-auto font-mono text-[11px] text-white/60">
        {ticker.map((line, i) => (
          <li key={i} className={`flex items-center gap-2 ${i === 0 ? "text-cyan-200" : "text-white/40"}`}>
            <span className="h-1 w-1 flex-shrink-0 rounded-full bg-current" />
            <span className="truncate">{line}</span>
          </li>
        ))}
        {ticker.length === 0 && (
          <li className="text-white/30">
            {state === "open" ? "Listening for live events on the hub…" : state === "connecting" ? "Handshaking…" : "WebSocket closed."}
          </li>
        )}
      </ul>
    </div>
  );
}

function s(n: number): string {
  return n === 1 ? "" : "s";
}