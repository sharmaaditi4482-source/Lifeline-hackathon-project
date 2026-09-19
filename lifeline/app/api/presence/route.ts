import { NextRequest, NextResponse } from "next/server";
import { reportDonorPresence, removeDonorPresence, getLiveDonors } from "@/lib/services/presenceService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/presence
 * Returns every currently-live donor presence (geolocated donors who have
 * checked into the network within the last 90 seconds).
 */
export async function GET() {
  return NextResponse.json({ donors: getLiveDonors() });
}

/**
 * POST /api/presence
 * Body: { donorId, name, bloodGroup, lat, lng, label?, distanceKm? }
 * Registers (or refreshes) a live donor presence. New check-ins broadcast a
 * `donor_registered` event over the SSE / WebSocket bus.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { donorId, name, bloodGroup, lat, lng, label, distanceKm } = body as any;

    if (!donorId || !name || !bloodGroup) {
      return NextResponse.json({ error: "donorId, name, and bloodGroup are required." }, { status: 400 });
    }
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "lat and lng must be numbers." }, { status: 400 });
    }

    const presence = reportDonorPresence({
      id: String(donorId),
      name: String(name),
      bloodGroup: String(bloodGroup),
      lat: Number(lat),
      lng: Number(lng),
      label: label ? String(label) : undefined,
      distanceKm: typeof distanceKm === "number" ? distanceKm : undefined,
    });

    return NextResponse.json({ presence });
  } catch {
    return NextResponse.json({ error: "Failed to register presence." }, { status: 500 });
  }
}

/**
 * DELETE /api/presence?donorId=...
 * Removes a donor from the live board (used when a donor goes offline manually).
 */
export async function DELETE(req: NextRequest) {
  const donorId = req.nextUrl.searchParams.get("donorId");
  if (!donorId) return NextResponse.json({ error: "donorId query param required." }, { status: 400 });
  const removed = removeDonorPresence(donorId);
  return NextResponse.json({ removed });
}