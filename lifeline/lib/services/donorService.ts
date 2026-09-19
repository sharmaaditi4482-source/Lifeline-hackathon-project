import { Donor, DonorEligibility, DonorBadge } from "../types";

/**
 * Standard medical cooldown period between whole blood donations (in days).
 * As recommended by WHO, Red Cross, and National Blood Transfusion Council.
 */
export const DONATION_COOLDOWN_DAYS = 90;

/**
 * Calculate medical donation eligibility for a donor based on their last donation date.
 * 
 * Rules:
 * - A donor is eligible ONLY if at least 90 days have elapsed since their last donation.
 * - If lastDonationDate is missing or invalid, defaults safely to eligible.
 * 
 * @param lastDonationDateStr - ISO date string of last donation (YYYY-MM-DD)
 * @returns Complete DonorEligibility status object with cooldown countdown
 */
export function calculateDonorEligibility(lastDonationDateStr?: string | null): DonorEligibility {
  if (!lastDonationDateStr) {
    return {
      isEligible: true,
      daysSinceLastDonation: 999,
      cooldownDaysRemaining: 0,
      cooldownPeriodDays: DONATION_COOLDOWN_DAYS,
      statusText: "Eligible to donate now",
    };
  }

  const lastDonation = new Date(lastDonationDateStr);
  const now = new Date();
  
  // Validate date parsing
  if (isNaN(lastDonation.getTime())) {
    return {
      isEligible: true,
      daysSinceLastDonation: 999,
      cooldownDaysRemaining: 0,
      cooldownPeriodDays: DONATION_COOLDOWN_DAYS,
      statusText: "Eligible to donate now",
    };
  }

  // Calculate elapsed time in full days
  const diffMs = now.getTime() - lastDonation.getTime();
  const daysSince = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (daysSince >= DONATION_COOLDOWN_DAYS) {
    return {
      isEligible: true,
      daysSinceLastDonation: daysSince,
      cooldownDaysRemaining: 0,
      cooldownPeriodDays: DONATION_COOLDOWN_DAYS,
      statusText: "Eligible to donate now",
    };
  } else {
    const daysRemaining = DONATION_COOLDOWN_DAYS - daysSince;
    return {
      isEligible: false,
      daysSinceLastDonation: Math.max(0, daysSince),
      cooldownDaysRemaining: daysRemaining,
      cooldownPeriodDays: DONATION_COOLDOWN_DAYS,
      statusText: `Eligible in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} (90-day cooldown)`,
    };
  }
}

/**
 * Calculate donor gamification badge tier and estimated lives saved.
 * 1 whole blood donation can be split into RBCs, Platelets, and Plasma to save up to 3 lives.
 * 
 * @param donationCount - Total historical donations recorded for this donor
 * @returns DonorBadge metadata object
 */
export function calculateDonorBadge(donationCount: number = 1): DonorBadge {
  const count = Math.max(1, donationCount);
  const estimatedLivesSaved = count * 3;

  if (count >= 10) {
    return {
      tier: "diamond",
      badgeName: "💎 Diamond Guardian",
      badgeIcon: "💎",
      donationCount: count,
      estimatedLivesSaved,
    };
  } else if (count >= 5) {
    return {
      tier: "gold",
      badgeName: "🥇 Gold Vanguard",
      badgeIcon: "🥇",
      donationCount: count,
      estimatedLivesSaved,
    };
  } else if (count >= 3) {
    return {
      tier: "silver",
      badgeName: "🥈 Silver Lifesaver",
      badgeIcon: "🥈",
      donationCount: count,
      estimatedLivesSaved,
    };
  } else {
    return {
      tier: "bronze",
      badgeName: "🥉 Bronze Sentinel",
      badgeIcon: "🥉",
      donationCount: count,
      estimatedLivesSaved,
    };
  }
}

/**
 * Enrich a donor object with live calculated medical eligibility metadata.
 * 
 * @param donor - Raw Donor object
 * @returns Donor enriched with eligibility
 */
export function enrichDonorWithEligibility(donor: Donor): Donor {
  const eligibility = calculateDonorEligibility(donor.lastDonationDate);
  return {
    ...donor,
    eligibility,
  };
}
