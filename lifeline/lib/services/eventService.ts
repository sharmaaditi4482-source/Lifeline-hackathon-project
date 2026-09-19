import { LiveEvent } from "../types";
import { getBusStore } from "./busStore";

// Max ring buffer size
const MAX_EVENTS = 25;

type LiveEventSubscriber = (event: LiveEvent) => void | Promise<void>;

/**
 * Subscribe to live events as they are recorded. Returns an unsubscribe fn.
 * Used by the SSE feed route and the WebSocket realtime hub so every client
 * receives the same broadcast bus. State lives on globalThis so route handlers
 * and instrumentation share one bus despite Next.js per-entry bundling.
 */
export function onLiveEvent(cb: LiveEventSubscriber): () => void {
  const store = getBusStore();
  store.subscribers.add(cb);
  return () => store.subscribers.delete(cb);
}

/**
 * Record a new system matching/inventory event.
 */
export function recordLiveEvent(event: Omit<LiveEvent, "id" | "timestamp">): LiveEvent {
  const store = getBusStore();
  const newEvent: LiveEvent = {
    ...event,
    id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  };

  store.liveEvents.unshift(newEvent);

  if (store.liveEvents.length > MAX_EVENTS) {
    store.liveEvents = store.liveEvents.slice(0, MAX_EVENTS);
  }

  // Fan out to all live subscribers (SSE + WebSocket) — must not block callers.
  for (const cb of store.subscribers) {
    try {
      void Promise.resolve(cb(newEvent));
    } catch {
      // Never let a subscriber break the broadcast bus.
    }
  }

  return newEvent;
}

/**
 * Retrieve recent events for real-time live feed.
 */
export function getRecentLiveEvents(limit: number = 10): LiveEvent[] {
  return getBusStore().liveEvents.slice(0, limit);
}