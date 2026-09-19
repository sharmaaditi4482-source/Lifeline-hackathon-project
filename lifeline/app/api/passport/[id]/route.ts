import { NextRequest, NextResponse } from "next/server";
import { getPassport, advancePassport } from "@/lib/services/passportService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const pp = getPassport(id);
  if (!pp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ passport: pp });
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const b = await req.json().catch(() => ({}));
  const to = String(b?.to || "delivered");
  const pp = advancePassport(id, to as any, b?.by);
  if (!pp) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ passport: pp });
}
