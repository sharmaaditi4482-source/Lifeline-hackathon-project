import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "node:http";
import type { Server } from "node:http";
import { onLiveEvent, getRecentLiveEvents } from "./eventService";
import { getLiveDonors } from "./presenceService";

const PORT = Number(process.env.REALTIME_PORT || 3001);
const TICK_MS = 3000;

/**
 * Next.js bundles instrumented/route entries separately, so the hub server
 * state is pinned to `globalThis` to avoid double-binding when more than one
 * bundled copy of this module lands in the same process.
 */
const HUB_KEY = "__lifelineRealtimeHub__";

interface HubState {
  wss: WebSocketServer;
  httpServer: Server;
  intervalId: ReturnType<typeof setInterval>;
  busUnsub?: () => void;
}

export interface RealtimeHubInfo {
  port: number;
  clients: number;
  running: boolean;
}

function getHubState(): HubState | undefined {
  return (globalThis as any)[HUB_KEY] as HubState | undefined;
}

/**
 * Start the WebSocket hub. Guarded so it only ever binds once per process
 * (dev hot-reload, multiple instrumentation calls, etc.).
 */
export function startRealtimeHub(): RealtimeHubInfo {
  const existing = getHubState();
  if (existing) return { port: PORT, clients: existing.wss.clients.size, running: true };

  const httpServer = createServer();
  const wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (socket: WebSocket) => {
    const meta: any = (socket as any)._lifelineMeta = {
      peerId: `peer_${Math.random().toString(36).substring(2, 8)}`,
      lastPingAt: 0,
    };

    send(socket, {
      type: "hello",
      peerId: meta.peerId,
      peers: wss.clients.size,
      model: "LifeLine Realtime Hub",
      protocol: "websocket: stream-json-broadcast-v1",
      recent: getRecentLiveEvents(15),
      donors: getLiveDonors(),
    });

    socket.on("message", (raw) => {
      let payload: any;
      try {
        payload = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (payload?.type === "ping") {
        meta.lastPingAt = Date.now();
        send(socket, { type: "pong", clientSentAt: Number(payload.t || 0), serverEpochMs: Date.now() });
      } else if (payload?.type === "broadcast") {
        const text = String(payload.text || "").slice(0, 120);
        if (text) broadcastHub({ type: "broadcast", text, from: meta.peerId });
      } else if (payload?.type === "presence") {
        broadcastHub({ type: "presence", donor: payload.donor });
      }
    });

    socket.on("close", () => broadcastHub({ type: "peers", peers: wss.clients.size }));
    socket.on("error", () => { /* drop */ });
  });

  httpServer.on("error", (err: any) => {
    console.error("[realtime-hub] websocket server error:", err?.message || err);
  });

  httpServer.listen(PORT, () => {
    console.log(`[realtime-hub] WebSocket ready on port ${PORT}`);
  });

  const busUnsub = onLiveEvent((event) => {
    broadcastHub({ type: "event", event });
  });

  const intervalId = setInterval(() => {
    const hub = getHubState();
    if (!hub) return;
    const ts = Date.now();
    for (const client of hub.wss.clients) {
      if (client.readyState === WebSocket.OPEN) {
        send(client, { type: "tick", ts, eventCount: getRecentLiveEvents(1).length, donors: getLiveDonors().length });
      }
    }
  }, TICK_MS);

  (globalThis as any)[HUB_KEY] = { wss, httpServer, intervalId, busUnsub } as HubState;
  return { port: PORT, clients: wss.clients.size, running: true };
}

/** Stop the hub (used in tests / graceful shutdown). */
export function stopRealtimeHub(): void {
  const hub = getHubState();
  if (!hub) return;
  clearInterval(hub.intervalId);
  hub.busUnsub?.();
  hub.wss.close();
  (globalThis as any)[HUB_KEY] = undefined;
}

export function getRealtimeHubInfo(): RealtimeHubInfo {
  const hub = getHubState();
  return {
    port: PORT,
    clients: hub?.wss.clients.size ?? 0,
    running: !!hub,
  };
}

function send(socket: WebSocket, obj: object): void {
  if (socket.readyState === WebSocket.OPEN) {
    try { socket.send(JSON.stringify(obj)); } catch { /* drop */ }
  }
}

function broadcastHub(obj: object): void {
  const hub = getHubState();
  if (!hub) return;
  const data = JSON.stringify(obj);
  for (const client of hub.wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      try { client.send(data); } catch { /* drop */ }
    }
  }
}