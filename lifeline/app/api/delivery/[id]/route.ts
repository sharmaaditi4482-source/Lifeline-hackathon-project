import { NextRequest, NextResponse } from "next/server";
import { getDelivery, completeDelivery, removeDelivery } from "@/lib/services/deliveryService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/delivery/[id]
 * Live snapshot of one delivery (polled by the tracker for rider position).
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const delivery = getDelivery(id);
  if (!delivery) return NextResponse.json({ error: "Delivery not found." }, { status: 404 });
  return NextResponse.json({ delivery });
}

/**
 * POST /api/delivery/[id] — fast-forward a delivery to "delivered".
 * DELETE /api/delivery/[id] — clear it off the board.
 */
export async function POST(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const delivery = completeDelivery(id);
  if (!delivery) return NextResponse.json({ error: "Delivery not found." }, { status: 404 });
  return NextResponse.json({ delivery });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const removed = removeDelivery(id);
  return NextResponse.json({ removed });
}