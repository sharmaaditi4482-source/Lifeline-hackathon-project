import { NextRequest, NextResponse } from "next/server";
import { createDelivery, getActiveDeliveries } from "@/lib/services/deliveryService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/delivery
 * Body: { requestId, hospitalName, bloodGroup, sourceType, sourceName,
 *         fromLat, fromLng, toLat, toLng, distanceKm }
 * Launches a Blinkit-style hyperlocal blood delivery. The rider is auto-assigned
 * and the trip broadcasts lifecycle events on the SSE/WebSocket bus.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      requestId,
      hospitalName,
      bloodGroup,
      sourceType,
      sourceName,
      fromLat,
      fromLng,
      toLat,
      toLng,
      distanceKm,
    } = body as any;

    if (!requestId || !hospitalName || !bloodGroup) {
      return NextResponse.json({ error: "requestId, hospitalName, and bloodGroup are required." }, { status: 400 });
    }
    if ([fromLat, fromLng, toLat, toLng, distanceKm].some((v) => typeof v !== "number")) {
      return NextResponse.json({ error: "fromLat, fromLng, toLat, toLng, and distanceKm must be numbers." }, { status: 400 });
    }

    const delivery = createDelivery({
      requestId: String(requestId),
      hospitalName: String(hospitalName),
      bloodGroup: String(bloodGroup),
      sourceType: String(sourceType || "donor"),
      sourceName: String(sourceName || "Rapid Response Donor"),
      fromLat: Number(fromLat),
      fromLng: Number(fromLng),
      toLat: Number(toLat),
      toLng: Number(toLng),
      distanceKm: Number(distanceKm),
    });

    return NextResponse.json({ delivery }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to launch delivery." }, { status: 500 });
  }
}

/**
 * GET /api/delivery
 * All current deliveries (newest first) — powers the tracker board.
 */
export async function GET() {
  return NextResponse.json({ deliveries: getActiveDeliveries() });
}