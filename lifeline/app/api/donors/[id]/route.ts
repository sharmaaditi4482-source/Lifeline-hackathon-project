import { NextRequest, NextResponse } from "next/server";
import { getDonorById, updateDonor } from "@/lib/store";
import { recordLiveEvent } from "@/lib/services/eventService";

/**
 * GET /api/donors/[id]
 * Fetch a single donor profile with eligibility.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const donor = await getDonorById(id);
    if (!donor) {
      return NextResponse.json({ error: "Donor not found." }, { status: 404 });
    }
    return NextResponse.json({ donor });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch donor." }, { status: 500 });
  }
}

/**
 * PATCH /api/donors/[id]
 * Supports standard updates as well as actions: "complete_donation" and "verify"
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (body.action === "complete_donation") {
      const { incrementDonorDonations } = await import("@/lib/store");
      const updated = await incrementDonorDonations(id);
      if (!updated) {
        return NextResponse.json({ error: "Donor not found." }, { status: 404 });
      }

      recordLiveEvent({
        type: "donation_completed",
        title: `Donation Completed: ${updated.name}`,
        description: `Verified successful transfusion! Total donations: ${updated.totalDonations} · 🩸 ${updated.totalDonations} Lives Saved`,
        bloodGroup: updated.bloodGroup,
        locationLabel: updated.location.label,
      });

      return NextResponse.json({ success: true, donor: updated, message: "Donation marked completed and counter incremented!" });
    }

    if (body.action === "verify") {
      const { verifyDonor } = await import("@/lib/store");
      const updated = await verifyDonor(id);
      if (!updated) {
        return NextResponse.json({ error: "Donor not found." }, { status: 404 });
      }

      recordLiveEvent({
        type: "donor_verified",
        title: `Donor Verified: ${updated.name}`,
        description: `Hospital verified credentials & confirmed reliable donor (+0.05 Reliability boost)`,
        bloodGroup: updated.bloodGroup,
        locationLabel: updated.location.label,
      });

      return NextResponse.json({ success: true, donor: updated, message: "Donor verified successfully!" });
    }

    const updated = await updateDonor(id, body);
    if (!updated) {
      return NextResponse.json({ error: "Donor not found." }, { status: 404 });
    }

    if (body.available !== undefined) {
      recordLiveEvent({
        type: "donor_registered",
        title: `Donor Status Changed: ${updated.name}`,
        description: `Availability set to ${updated.available ? "ACTIVE" : "UNAVAILABLE"} (${updated.bloodGroup})`,
        bloodGroup: updated.bloodGroup,
        locationLabel: updated.location.label,
      });
    }

    return NextResponse.json({ success: true, donor: updated });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update donor." }, { status: 500 });
  }
}
