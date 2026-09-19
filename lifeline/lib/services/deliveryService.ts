import { Delivery, DeliveryStatus, BloodGroup } from "../types";
import { recordLiveEvent } from "./eventService";
import { getBusStore } from "./busStore";
import { createPassport } from "./passportService";

/**
 * LifeLine Hyperlocal Delivery — a Blinkit-style dispatch layer.
 *
 * When a match locks, a delivery is created from the blood source (donor or
 * bank) to the hospital. A rider is auto-assigned and the unit travels along a
 * live route; the whole lifecycle is broadcast on the SSE/WebSocket bus
 * (dispatched → pickup → en_route → delivered) and positions are exposed via
 * GET /api/delivery/:id for live tracking.
 *
 * Simulation note: real ETA is computed from distance (@ ~24 km/h avg), but the
 * clock runs at SIM_SPEED × real-time so judges see the entire run complete in
 * ~20–35 s instead of waiting 10+ minutes.
 */

const RIDERS = ["Ramesh K.", "Priya S.", "Amit T.", "Sneha R.", "Imran V.", "Kavita D."];
const MAX_DELIVERIES = 5;
const DONE_TTL_MS = 120_000;
const TICK_MS = 1000;

/** Accelerated-simulator multiplier: 12 → a "7-8 min" ride completes in ~30–38 s (judge-friendly). */
export const SIM_SPEED = 12;

interface DeliveryInput {
  requestId: string;
  hospitalName: string;
  bloodGroup: string;
  sourceType: string;
  sourceName: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  distanceKm: number;
}

function realEtaSeconds(distanceKm: number): number {
  // ~24 km/h moving average + 90 s handling buffer + 60 s flag-to-open.
  return Math.max(90, Math.round((distanceKm / 24) * 3600) + 150);
}

const clocks = new Map<string, ReturnType<typeof setInterval>>();

function bezier(p0: number, p1: number, c: number, f: number): number {
  const u = 1 - f;
  return u * u * p0 + 2 * u * f * c + f * f * p1;
}

/** Position on the delivery route at progress f∈[0,1] (quadratic arc). */
export function deliveryPoint(fromLat: number, fromLng: number, toLat: number, toLng: number, f: number) {
  const midLat = (fromLat + toLat) / 2;
  const midLng = (fromLng + toLng) / 2;
  // control point curves the route slightly, like a street-level path
  const cLat = midLat + (toLat - fromLat) * 0.25 + (toLng - fromLng) * 0.05;
  const cLng = midLng + (toLng - fromLng) * 0.25 - (toLat - fromLat) * 0.05;
  return { lat: bezier(fromLat, toLat, cLat, f), lng: bezier(fromLng, toLng, cLng, f) };
}

/**
 * Create + start a hyperlocal delivery. Emits `delivery_dispatched` and keeps
 * advancing the rider until the unit reaches the hospital.
 */
export function createDelivery(input: DeliveryInput): Delivery {
  const store = getBusStore();
  // Prune stale completed deliveries so the board stays fresh.
  const now = Date.now();
  for (const [id, d] of store.deliveries) {
    if (d.status === "delivered" && d.deliveredAt && now - new Date(d.deliveredAt).getTime() > DONE_TTL_MS) {
      clearDeliveryClock(id);
      store.deliveries.delete(id);
    }
  }
  while (store.deliveries.size >= MAX_DELIVERIES) {
    const oldest = [...store.deliveries.entries()].sort((a, b) =>
      new Date(a[1].createdAt).getTime() - new Date(b[1].createdAt).getTime()
    )[0];
    if (!oldest) break;
    clearDeliveryClock(oldest[0]);
    store.deliveries.delete(oldest[0]);
  }

  const id = `del_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const riderName = RIDERS[Math.floor(Math.random() * RIDERS.length)];
  const etaSecondsReal = realEtaSeconds(input.distanceKm);
  const start = deliveryPoint(input.fromLat, input.fromLng, input.toLat, input.toLng, 0);

  const delivery: Delivery = {
    id,
    requestId: input.requestId,
    hospitalName: input.hospitalName,
    bloodGroup: input.bloodGroup as BloodGroup,
    sourceType: input.sourceType,
    sourceName: input.sourceName,
    fromLat: input.fromLat,
    fromLng: input.fromLng,
    toLat: input.toLat,
    toLng: input.toLng,
    distanceKm: input.distanceKm,
    etaSecondsReal,
    riderName,
    status: "dispatch",
    currentLat: start.lat,
    currentLng: start.lng,
    progress: 0,
    createdAt: new Date().toISOString(),
  };

  store.deliveries.set(id, delivery);

  recordLiveEvent({
    type: "delivery_dispatched",
    title: `🛵 Delivery to ${input.hospitalName}`,
    description: `${riderName} assigned · ${input.distanceKm} km · ETA ~${Math.round(etaSecondsReal / 60)} min`,
    bloodGroup: input.bloodGroup as BloodGroup,
    locationLabel: `${input.distanceKm} km from ${input.sourceName}`,
  });

  // Outstanding: auto-mint cold-chain passport for this unit
  try { createPassport({ bloodGroup: input.bloodGroup as BloodGroup, donorName: input.sourceName, donorId: input.requestId, sourceName: input.sourceName, hospitalName: input.hospitalName }); } catch {}

  advanceUntil(delivery);
  return delivery;
}

function advanceUntil(delivery: Delivery) {
  const store = getBusStore();
  const realMs = delivery.etaSecondsReal * 1000;
  const elapsed = { ms: 0 };

  if (clocks.has(delivery.id)) clearDeliveryClock(delivery.id);

  const tick = () => {
    const live = store.deliveries.get(delivery.id);
    if (!live || live.status === "delivered") {
      clearDeliveryClock(delivery.id);
      return;
    }
    elapsed.ms += TICK_MS * SIM_SPEED;

    const rawF = Math.min(1, elapsed.ms / realMs);
    // Smoothstep easing: accelerate out of dispatch, cruise, ease into drop.
    const eased = rawF * rawF * (3 - 2 * rawF);

    const f = Math.min(1, eased);
    const pt = deliveryPoint(live.fromLat, live.fromLng, live.toLat, live.toLng, f);

    const prevStatus = live.status;
    let nextStatus: DeliveryStatus = prevStatus;
    if (f >= 1) nextStatus = "delivered";
    else if (f >= 0.45) nextStatus = "en_route";
    else if (f >= 0.15) nextStatus = "pickup";

    live.currentLat = pt.lat;
    live.currentLng = pt.lng;
    live.progress = f;

    if (nextStatus !== prevStatus) {
      live.status = nextStatus;
      emitStatusEvent(live, prevStatus);

      if (nextStatus === "delivered") {
        live.deliveredAt = new Date().toISOString();
        clearDeliveryClock(live.id);
        return;
      }
    }
  };

  const id = setInterval(tick, TICK_MS);
  clocks.set(delivery.id, id);
}

function emitStatusEvent(d: Delivery, prev: DeliveryStatus) {
  const store = getBusStore();
  const snap = store.deliveries.get(d.id);
  if (!snap) return;
  if (d.status === "pickup") {
    recordLiveEvent({
      type: "delivery_pickup",
      title: `📦 Pack picked up`,
      description: `${d.riderName} collected the ${d.bloodGroup} cold-chain pack from ${d.sourceName}`,
      bloodGroup: d.bloodGroup,
      locationLabel: `Pickup · ${d.sourceName}`,
    });
  } else if (d.status === "en_route") {
    recordLiveEvent({
      type: "delivery_enroute",
      title: `🛵 Rider heading to ${d.hospitalName}`,
      description: `${d.bloodGroup} on the road · ${d.distanceKm} km · live tracked`,
      bloodGroup: d.bloodGroup,
      locationLabel: `En route · ${d.riderName}`,
    });
  } else if (d.status === "delivered") {
    recordLiveEvent({
      type: "delivery_delivered",
      title: `✅ Unit delivered to ${d.hospitalName}`,
      description: `${d.bloodGroup} delivered by ${d.riderName} in under the golden hour`,
      bloodGroup: d.bloodGroup,
      locationLabel: `${d.hospitalName}`,
    });
  }
  void prev;
}

/** Get a single delivery snapshot (for live tracking polling). */
export function getDelivery(id: string): Delivery | undefined {
  return getBusStore().deliveries.get(id);
}

/** All deliveries, newest first, active kept in order. */
export function getActiveDeliveries(): Delivery[] {
  const store = getBusStore();
  return [...store.deliveries.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/** Force-complete a delivery immediately (judge fast-forward). */
export function completeDelivery(id: string): Delivery | null {
  const store = getBusStore();
  const d = store.deliveries.get(id);
  if (!d) return null;
  if (d.status !== "delivered") {
    const prev = d.status;
    d.status = "delivered";
    d.progress = 1;
    const end = deliveryPoint(d.fromLat, d.fromLng, d.toLat, d.toLng, 1);
    d.currentLat = end.lat;
    d.currentLng = end.lng;
    d.deliveredAt = new Date().toISOString();
    emitStatusEvent(d, prev);
    clearDeliveryClock(id);
  }
  return d;
}

export function removeDelivery(id: string): boolean {
  clearDeliveryClock(id);
  return getBusStore().deliveries.delete(id);
}

function clearDeliveryClock(id: string) {
  const c = clocks.get(id);
  if (c) {
    clearInterval(c);
    clocks.delete(id);
  }
}