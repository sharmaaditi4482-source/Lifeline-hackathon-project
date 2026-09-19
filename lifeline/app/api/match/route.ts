import { NextRequest, NextResponse } from "next/server";
import { matchRequest } from "@/lib/services/matchingService";
import { getDonors, getBankUnits, addRequest, resolveLocation, ensureLocalFacilitiesForLocation } from "@/lib/store";
import { BloodRequest } from "@/lib/types";
import { recordLiveEvent } from "@/lib/services/eventService";

/**
 * POST /api/match
 * 
 * Takes hospital request parameters, records the request, runs the multi-factor
 * ABO/Rh safe matching engine against verified live database donors and hospital reserves,
 * records a live event, and returns the sorted matches with score breakdown.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospitalName, bloodGroup, unitsNeeded, urgency, location } = body;

    if (!bloodGroup || !unitsNeeded || !urgency || !location) {
      return NextResponse.json(
        { error: "Missing required fields: bloodGroup, unitsNeeded, urgency, location." },
        { status: 400 }
      );
    }

    // Resolve accurate coordinates from city / facility label
    const resolvedLocation = await resolveLocation(location.label || hospitalName, location);

    // Dynamically ensure authentic local hospitals & donors exist for searched city
    await ensureLocalFacilitiesForLocation(resolvedLocation);

    const newRequest: BloodRequest = {
      id: `req_${Date.now()}`,
      hospitalName: hospitalName || "Emergency Trauma Desk",
      bloodGroup,
      unitsNeeded: Number(unitsNeeded),
      urgency,
      location: resolvedLocation,
      status: "open",
      createdAt: new Date().toISOString(),
    };

    // 1. Fetch real candidate donors & bank inventory units from database
    const dbDonors = await getDonors();
    const dbBankUnits = await getBankUnits();

    // 2. Persist request
    await addRequest(newRequest);

    // 3. Evaluate real candidates through matching engine
    const allMatches = matchRequest(newRequest, {
      donors: dbDonors,
      bankUnits: dbBankUnits,
    });

    // Tier 1: Local candidates within emergency transit radius (< 60 km)
    let matches = allMatches.filter((m) => m.distanceKm <= 60);
    
    // Tier 2: If fewer than 2 candidates, escalate to district/regional radius (< 150 km)
    if (matches.length < 2) {
      matches = allMatches.filter((m) => m.distanceKm <= 150);
    }
    
    // Tier 3: National escalation fallback if completely empty
    if (matches.length === 0) {
      matches = allMatches;
    }

    const escalated = matches.length === 0;

    // 4. Record live event for real-time dashboards & landing page feed
    recordLiveEvent({
      type: "request_created",
      title: `${newRequest.urgency.toUpperCase()} ${bloodGroup} Request Raised`,
      description: `${newRequest.hospitalName} requested ${newRequest.unitsNeeded} unit(s) · ${matches.length} candidate(s) scored`,
      bloodGroup,
      locationLabel: location.label || "Emergency Location",
    });

    if (matches.length > 0) {
      const top = matches[0];
      recordLiveEvent({
        type: "match_found",
        title: `Top Match: ${top.sourceName}`,
        description: `${top.bloodGroup} (${top.sourceType === "donor" ? "Volunteer Donor" : "Bank Stock"}) · ${top.distanceKm} km away · Score: ${Math.round(top.score * 100)}/100`,
        bloodGroup: top.bloodGroup,
        locationLabel: top.location?.label || location.label,
      });
    }

    return NextResponse.json({
      request: newRequest,
      matches,
      escalated,
    });
  } catch (err) {
    return NextResponse.json(
      { error: "Something went wrong processing the matching request." },
      { status: 500 }
    );
  }
}
