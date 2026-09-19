import { recordLiveEvent } from "./eventService";
import { getBusStore } from "./busStore";
import type { BloodGroup } from "../types";

export interface LiveDonorPresence {
  id: string;
  name: string;
  bloodGroup: BloodGroup;
  lat: number;
  lng: number;
  label: string;
  distanceKm?: number;
  available: boolean;
  refreshedAt: string; // ISO
  expiresAt: string; // ISO
}

const TTL_MS = 90_000; // presence expires after 90s unless refreshed
const MAX_PRESENCE = 200;

function nowIso(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

export function isStale(p: LiveDonorPresence): boolean {
  return new Date(p.expiresAt).getTime() < Date.now();
}

/**
 * Register or refresh a live donor presence. Broadcasts a live event when a
 * donor first checks in so every connected dashboard/radar picks it up in
 * real time over SSE / WebSocket.
 */
export function reportDonorPresence(input: {
  id: string;
  name: string;
  bloodGroup: string;
  lat: number;
  lng: number;
  label?: string;
  distanceKm?: number;
}): LiveDonorPresence {
  const presences = getBusStore().presences;
  const existing = presences.get(input.id);
  const isNew = !existing || isStale(existing);

  const bloodGroup = input.bloodGroup as BloodGroup;

  const presence: LiveDonorPresence = {
    id: input.id,
    name: input.name,
    bloodGroup,
    lat: input.lat,
    lng: input.lng,
    label: input.label || input.name || "Live Donor",
    distanceKm: input.distanceKm,
    available: true,
    refreshedAt: nowIso(),
    expiresAt: nowIso(TTL_MS),
  };

  presences.set(input.id, presence);
  if (presences.size > MAX_PRESENCE) {
    const oldest = [...presences.entries()].sort(
      (a, b) => new Date(a[1].refreshedAt).getTime() - new Date(b[1].refreshedAt).getTime()
    )[0];
    presences.delete(oldest[0]);
  }

  if (isNew) {
    recordLiveEvent({
      type: "donor_registered",
      title: `${presence.name} is live`,
      description: `${presence.bloodGroup} donor online${presence.distanceKm ? ` · ${presence.distanceKm} km from request` : ""}`,
      bloodGroup: presence.bloodGroup,
      locationLabel: presence.label,
    });
  }

  return presence;
}

/** Remove a donor from the live board. */
export function removeDonorPresence(id: string): boolean {
  return getBusStore().presences.delete(id);
}

/** Snapshot of every non-stale presence. */
export function getLiveDonors(): LiveDonorPresence[] {
  const presences = getBusStore().presences;
  const now = Date.now();
  for (const [id, p] of presences) {
    if (new Date(p.expiresAt).getTime() < now) presences.delete(id);
  }
  return [...presences.values()];
}

/** Every presence, including stale (used for debug / stats). */
export function getPresenceCount(): number {
  return getLiveDonors().length;
}