import { UnitPassport, PassportEvent, BloodGroup } from "../types";
import { getBusStore } from "./busStore";
import { recordLiveEvent } from "./eventService";

function hash(s: string): string {
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return "0x" + h.toString(16).padStart(8, "0").toUpperCase();
}
function tempLog(): number[] {
  // 12 readings, 2-6°C with one safe drift — looks like real sensor
  return Array.from({ length: 12 }, (_, i) => Number((3.8 + Math.sin(i * 0.9) * 0.6 + (Math.random() * 0.4 - 0.2)).toFixed(1)));
}
function qrStub(id: string): string {
  // fake QR payload — hash of passport id, scannable-looking
  return `LIFELINE:${id}:${hash(id + Date.now().toString()).slice(0, 8)}`;
}

export function createPassport(input: { unitId?: string; bloodGroup: BloodGroup; donorName: string; donorId: string; sourceName: string; hospitalName: string }): UnitPassport {
  const store = getBusStore();
  const id = `pp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const unitId = input.unitId || `UNIT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const now = new Date();
  const expiry = new Date(now.getTime() + 28 * 86400000);
  const coldChain = tempLog();
  const events: PassportEvent[] = [
    { type: "collected", title: `Collected from ${input.donorName}`, at: new Date(now.getTime() - 2 * 3600000).toISOString(), by: input.sourceName, tempC: coldChain[0], hash: hash(id + "collected") },
    { type: "tested", title: "Screened: HIV/HBV/HCV/Syphilis — Negative", at: new Date(now.getTime() - 1 * 3600000).toISOString(), by: "NABL Lab", tempC: coldChain[3], hash: hash(id + "tested") },
    { type: "stored", title: `Stored at 3–5°C — ${input.sourceName}`, at: now.toISOString(), by: input.sourceName, tempC: coldChain[6], hash: hash(id + "stored") },
  ];
  const pp: UnitPassport = {
    id, unitId, bloodGroup: input.bloodGroup, donorName: input.donorName, donorId: input.donorId,
    sourceName: input.sourceName, hospitalName: input.hospitalName,
    collectedAt: events[0].at, expiryAt: expiry.toISOString(),
    coldChain, events, impactLives: Math.floor(1 + Math.random() * 3), qr: qrStub(id), status: "in_stock",
  };
  store.passports.set(id, pp);
  recordLiveEvent({ type: "donor_registered", title: `🧬 Passport minted: ${unitId} (${input.bloodGroup})`, description: `Donor ${input.donorName} → ${input.hospitalName} · Cold-chain 3.8°C · QR ${pp.qr.slice(0, 18)}`, bloodGroup: input.bloodGroup, locationLabel: input.hospitalName });
  return pp;
}

export function advancePassport(id: string, to: PassportEvent["type"], by?: string) {
  const pp = getBusStore().passports.get(id);
  if (!pp) return null;
  const titleMap: Record<string, string> = {
    dispatched: `Dispatched via hyperlocal rider`,
    in_transit: `In transit — cold-chain 4.1°C`,
    delivered: `Delivered to ${pp.hospitalName}`,
    transfused: `Transfused — ${pp.impactLives} lives impacted 🩸`,
  };
  const ev: PassportEvent = { type: to as any, title: titleMap[to] || to, at: new Date().toISOString(), by: by || pp.hospitalName, tempC: Number((3.5 + Math.random() * 1.2).toFixed(1)), hash: hash(id + to + Date.now().toString()) };
  pp.events.push(ev);
  if (to === "in_transit" || to === "dispatched") pp.status = "in_transit";
  if (to === "delivered") pp.status = "delivered";
  if (to === "transfused") pp.status = "transfused";
  pp.coldChain.push(ev.tempC!);
  if (pp.coldChain.length > 18) pp.coldChain.shift();
  return pp;
}

export function getPassport(id: string) { return getBusStore().passports.get(id); }
export function getAllPassports(): UnitPassport[] { return [...getBusStore().passports.values()].sort((a,b)=> new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()); }
