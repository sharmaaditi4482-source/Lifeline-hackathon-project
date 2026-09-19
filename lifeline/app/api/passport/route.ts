import { NextRequest, NextResponse } from "next/server";
import { createPassport, getAllPassports } from "@/lib/services/passportService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const b = await req.json();
    if (!b.bloodGroup || !b.donorName) return NextResponse.json({ error: "bloodGroup and donorName required" }, { status: 400 });
    const pp = createPassport({ bloodGroup: b.bloodGroup, donorName: String(b.donorName), donorId: String(b.donorId || "d1"), sourceName: String(b.sourceName || "LifeLine Bank"), hospitalName: String(b.hospitalName || "AIIMS Trauma Centre"), unitId: b.unitId });
    return NextResponse.json({ passport: pp }, { status: 201 });
  } catch { return NextResponse.json({ error: "Failed to mint passport" }, { status: 500 }); }
}

export async function GET() {
  return NextResponse.json({ passports: getAllPassports() });
}
