import {
  BloodGroup,
  BloodRequest,
  Donor,
  BankInventoryUnit,
  MatchResult,
  UrgencyLevel,
  Location,
} from "../types";
import { calculateDonorEligibility } from "./donorService";

/**
 * ============================================================
 * LIFELINE REAL MATCHING ENGINE (SCORING SERVICE)
 * ============================================================
 * 
 * Two-stage deterministic evaluation pipeline:
 * 
 * 1. HARD SAFETY & ELIGIBILITY FILTERS (Zero-Tolerance Gates):
 *    - ABO & Rh compatibility: Incompatible blood groups are NEVER surfaced.
 *    - Medical cooldown: Donors with < 90 days cooldown are disqualified.
 *    - Availability: Donors toggled "Unavailable" are disqualified.
 *    - Stock validity: Bank inventory with 0 units or expired dates are disqualified.
 * 
 * 2. MULTI-FACTOR WEIGHTED SCORING:
 *    Formula:
 *      Score = (0.35 * Urgency) + (0.30 * Proximity) + (0.20 * Expiry) + (0.15 * Reliability)
 * 
 *    Weights rationale:
 *      - 35% Urgency: Critical requests prioritize fastest dispatch.
 *      - 30% Proximity: Closer donors/hospitals reduce transport transit time.
 *      - 20% Expiry: Near-expiry blood units are prioritized to eliminate inventory waste.
 *      - 15% Reliability: High donor show-up history prioritized for dependable turnout.
 * ============================================================
 */

/**
 * Complete ABO & Rh D-antigen compatibility matrix.
 * Key: Recipient Blood Group
 * Value: Compatible Donor Blood Groups
 */
export const COMPATIBILITY_MATRIX: Record<BloodGroup, BloodGroup[]> = {
  // O- can only receive from O- (Universal donor)
  "O-": ["O-"],
  
  // O+ can receive from O- and O+
  "O+": ["O-", "O+"],
  
  // A- can receive from O- and A-
  "A-": ["O-", "A-"],
  
  // A+ can receive from O-, O+, A-, A+
  "A+": ["O-", "O+", "A-", "A+"],
  
  // B- can receive from O- and B-
  "B-": ["O-", "B-"],
  
  // B+ can receive from O-, O+, B-, B+
  "B+": ["O-", "O+", "B-", "B+"],
  
  // AB- can receive from all Rh- groups (O-, A-, B-, AB-)
  "AB-": ["O-", "A-", "B-", "AB-"],
  
  // AB+ is the Universal Recipient (can receive from all 8 blood groups)
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

/**
 * Step 1: Hard ABO/Rh compatibility safety filter.
 */
export function isCompatible(
  recipientBloodGroup: BloodGroup,
  donorBloodGroup: BloodGroup
): boolean {
  const allowed = COMPATIBILITY_MATRIX[recipientBloodGroup];
  return allowed ? allowed.includes(donorBloodGroup) : false;
}

/**
 * Calculate great-circle Haversine distance between two GPS coordinates in kilometers.
 * Formula:
 *   a = sin²(Δlat/2) + cos(lat1) * cos(lat2) * sin²(Δlng/2)
 *   c = 2 * atan2(√a, √(1-a))
 *   d = R * c  (where R = 6371 km)
 */
export function calculateHaversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const EARTH_RADIUS_KM = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = EARTH_RADIUS_KM * c;
  
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

/**
 * Compute normalized urgency score (0.0 to 1.0)
 */
export function calculateUrgencyScore(urgency: UrgencyLevel): number {
  switch (urgency) {
    case "critical":
      return 1.0;
    case "high":
      return 0.75;
    case "medium":
      return 0.45;
    default:
      return 0.5;
  }
}

/**
 * Compute normalized proximity score (0.0 to 1.0)
 * Closer distance gets higher score, normalized against 50 km radius.
 */
export function calculateProximityScore(distanceKm: number): number {
  const MAX_RELEVANT_KM = 50;
  const clampedDistance = Math.min(distanceKm, MAX_RELEVANT_KM);
  return Math.max(0, 1 - clampedDistance / MAX_RELEVANT_KM);
}

/**
 * Compute expiry score (0.0 to 1.0)
 * Near-expiry blood units score HIGHER to prioritize usage and prevent waste.
 * Volunteer donors have no expiration, receiving a neutral 0.50 baseline.
 */
export function calculateExpiryScore(expiryDateIso: string | null): number {
  if (!expiryDateIso) {
    return 0.50; // Neutral baseline for live donors
  }

  const nowMs = Date.now();
  const expiryMs = new Date(expiryDateIso).getTime();
  const daysLeft = (expiryMs - nowMs) / (1000 * 60 * 60 * 24);

  if (daysLeft <= 0) {
    return 0; // Expired stock is filtered out
  }

  const MAX_SHELF_DAYS = 35;
  const clampedDays = Math.min(daysLeft, MAX_SHELF_DAYS);
  
  // Sooner to expire = higher score to prevent wastage
  return 1 - clampedDays / MAX_SHELF_DAYS;
}

export interface MatchPoolOptions {
  donors: Donor[];
  bankUnits: BankInventoryUnit[];
}

/**
 * Core Matching Algorithm: Evaluates all candidates and returns a ranked list of safe matches.
 */
export function matchRequest(
  request: BloodRequest,
  { donors, bankUnits }: MatchPoolOptions
): MatchResult[] {
  const results: MatchResult[] = [];
  const reqLat = request.location.lat;
  const reqLng = request.location.lng;

  // ── 1. EVALUATE VOLUNTEER DONORS ──
  for (const donor of donors) {
    // Safety check 1: Donor must have toggled availability active
    if (!donor.available) {
      continue;
    }

    // Safety check 2: 90-day medical cooldown check
    const eligibility = calculateDonorEligibility(donor.lastDonationDate);
    if (!eligibility.isEligible) {
      continue; // Strictly exclude donors within 90-day cooldown
    }

    // Safety check 3: ABO/Rh Compatibility
    if (!isCompatible(request.bloodGroup, donor.bloodGroup)) {
      continue;
    }

    // Proximity calculation
    const distance = calculateHaversineDistanceKm(
      reqLat,
      reqLng,
      donor.location.lat,
      donor.location.lng
    );

    // Multi-factor breakdown with verified donor reliability bonus (+0.05)
    const baseReliability = donor.reliabilityScore ?? 0.85;
    const reliability = donor.isVerified ? Math.min(1.0, baseReliability + 0.05) : baseReliability;

    const breakdown = {
      urgency: calculateUrgencyScore(request.urgency),
      proximity: calculateProximityScore(distance),
      expiry: calculateExpiryScore(null),
      reliability: Math.round(reliability * 100) / 100,
    };

    // Calculate final weighted score
    const score =
      0.35 * breakdown.urgency +
      0.30 * breakdown.proximity +
      0.20 * breakdown.expiry +
      0.15 * breakdown.reliability;

    results.push({
      sourceType: "donor",
      sourceId: donor.id,
      sourceName: donor.name,
      bloodGroup: donor.bloodGroup,
      distanceKm: distance,
      score: Math.round(score * 1000) / 1000,
      breakdown,
      eligibilityNote: eligibility.statusText,
      location: donor.location,
      phone: donor.phone,
      totalDonations: donor.totalDonations ?? 0,
      isVerified: donor.isVerified ?? false,
    });
  }

  // ── 2. EVALUATE HOSPITAL / BLOOD BANK INVENTORY ──
  for (const unit of bankUnits) {
    // Safety check 1: Must have available units
    if (unit.unitsAvailable <= 0) {
      continue;
    }

    // Safety check 2: ABO/Rh Compatibility
    if (!isCompatible(request.bloodGroup, unit.bloodGroup)) {
      continue;
    }

    // Safety check 3: Non-expired stock
    if (new Date(unit.expiryDate).getTime() <= Date.now()) {
      continue;
    }

    // Proximity calculation
    const distance = calculateHaversineDistanceKm(
      reqLat,
      reqLng,
      unit.location.lat,
      unit.location.lng
    );

    // Multi-factor breakdown
    const breakdown = {
      urgency: calculateUrgencyScore(request.urgency),
      proximity: calculateProximityScore(distance),
      expiry: calculateExpiryScore(unit.expiryDate),
      reliability: 1.0, // Verified medical blood bank stock has full reliability
    };

    // Calculate final weighted score
    const score =
      0.35 * breakdown.urgency +
      0.30 * breakdown.proximity +
      0.20 * breakdown.expiry +
      0.15 * breakdown.reliability;

    results.push({
      sourceType: "bank",
      sourceId: unit.id,
      sourceName: unit.bankName,
      bloodGroup: unit.bloodGroup,
      distanceKm: distance,
      score: Math.round(score * 1000) / 1000,
      breakdown,
      eligibilityNote: `${unit.unitsAvailable} units ready for immediate transfer`,
      location: unit.location,
    });
  }

  // Sort descending by final weighted score (best match first)
  return results.sort((a, b) => b.score - a.score);
}
