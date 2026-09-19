import { NextResponse } from "next/server";
import { getRecentLiveEvents } from "@/lib/services/eventService";

/**
 * GET /api/events
 * Returns the stream of real-time matching and dispatch events for live dashboard & landing page feed.
 */
export async function GET() {
  try {
    const events = getRecentLiveEvents(15);
    return NextResponse.json({ events });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch live events." }, { status: 500 });
  }
}
