import { NextRequest, NextResponse } from "next/server";
import { getDonors, addDonor } from "@/lib/store";
import { Donor, BloodGroup } from "@/lib/types";
import { recordLiveEvent } from "@/lib/services/eventService";

/**
 * GET /api/donors
 * Returns all donors with calculated 90-day medical cooldown eligibility.
 */
export async function GET() {
  try {
    const donorsList = await getDonors();
    return NextResponse.json({ donors: donorsList });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch donors." }, { status: 500 });
  }
}

/**
 * POST /api/donors
 * Registers a new volunteer donor with location, blood group, and last donation date.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, phone, bloodGroup, location, lastDonationDate, available } = body;

    if (!name || !phone || !bloodGroup || !location) {
      return NextResponse.json(
        { error: "Missing required fields: name, phone, bloodGroup, location." },
        { status: 400 }
      );
    }

    const validBloodGroups: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];
    if (!validBloodGroups.includes(bloodGroup)) {
      return NextResponse.json({ error: "Invalid blood group." }, { status: 400 });
    }

    const newDonor: Donor = {
      id: `d_${Date.now()}`,
      name,
      phone,
      bloodGroup,
      location,
      available: available !== undefined ? available : true,
      reliabilityScore: 0.85, // Standard baseline reliability score
      lastDonationDate: lastDonationDate || "2026-05-01",
    };

    const savedDonor = await addDonor(newDonor);

    // Record live event
    recordLiveEvent({
      type: "donor_registered",
      title: `New ${bloodGroup} Donor Registered`,
      description: `${name} joined LifeLine verified network from ${location.label}`,
      bloodGroup,
      locationLabel: location.label,
    });

    return NextResponse.json({ success: true, donor: savedDonor }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to register donor." }, { status: 500 });
  }
}
