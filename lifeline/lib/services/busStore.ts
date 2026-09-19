import { LiveEvent, Delivery, UnitPassport } from "../types";
import type { LiveDonorPresence } from "./presenceService";

/**
 * Shared in-process realtime store.
 *
 * Next.js bundles each Route Handler / instrumentation entry separately, so a
 * plain module-level singleton like `const map = new Map()` gets a DIFFERENT
 * copy per bundle — the SSE route would mutate one ring while the WebSocket
 * hub subscribes to another. Hanging the state on `globalThis` guarantees a
 * single store for the whole Node process, which is exactly what a realtime
 * broadcast bus needs.
 */
const GLOBAL_KEY = "__lifelineRealtimeBus__";

export interface RealtimeBusStore {
  liveEvents: LiveEvent[];
  subscribers: Set<(event: LiveEvent) => void>;
  presences: Map<string, LiveDonorPresence>;
  deliveries: Map<string, Delivery>;
  passports: Map<string, UnitPassport>;
}

const INITIAL_EVENTS: LiveEvent[] = [
  {
    id: "evt_init_1",
    type: "match_confirmed",
    title: "O- Donor Match Confirmed",
    description: "Emergency unit locked and dispatched to AIIMS Trauma Centre",
    bloodGroup: "O-",
    locationLabel: "Safdarjung Enclave, Delhi",
    timestamp: new Date(Date.now() - 25 * 1000).toISOString(),
  },
  {
    id: "evt_init_2",
    type: "stock_updated",
    title: "A+ Bank Reserve Replenished",
    description: "8 units added at Red Cross Central Blood Bank",
    bloodGroup: "A+",
    locationLabel: "Connaught Place, Delhi",
    timestamp: new Date(Date.now() - 75 * 1000).toISOString(),
  },
  {
    id: "evt_init_3",
    type: "request_created",
    title: "Critical B+ Request Raised",
    description: "Max Super Speciality Hospital raised 3-unit emergency request",
    bloodGroup: "B+",
    locationLabel: "Saket, Delhi",
    timestamp: new Date(Date.now() - 150 * 1000).toISOString(),
  },
  {
    id: "evt_init_4",
    type: "match_found",
    title: "Universal Match Surfaced",
    description: "O- volunteer donor matched within 2.1 km radius",
    bloodGroup: "O-",
    locationLabel: "Rohini, Delhi",
    timestamp: new Date(Date.now() - 240 * 1000).toISOString(),
  },
  {
    id: "evt_init_5",
    type: "donor_registered",
    title: "New Volunteer Donor Joined",
    description: "Verified AB+ donor joined active regional network",
    bloodGroup: "AB+",
    locationLabel: "Gurugram Sector 29",
    timestamp: new Date(Date.now() - 360 * 1000).toISOString(),
  },
];

export function getBusStore(): RealtimeBusStore {
  const g = globalThis as any;
  if (!g[GLOBAL_KEY]) {
    g[GLOBAL_KEY] = {
      liveEvents: [...INITIAL_EVENTS],
      subscribers: new Set(),
      presences: new Map(),
      deliveries: new Map(),
      passports: new Map(),
    };
  }
  return g[GLOBAL_KEY] as RealtimeBusStore;
}