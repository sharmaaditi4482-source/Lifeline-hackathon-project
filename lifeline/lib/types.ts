export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";

export type UrgencyLevel = "critical" | "high" | "medium";

export interface Location {
  lat: number;
  lng: number;
  label: string;
}

export interface DonorEligibility {
  isEligible: boolean;
  daysSinceLastDonation: number;
  cooldownDaysRemaining: number;
  cooldownPeriodDays: number; // standard 90 days
  statusText: string;
}

export interface Donor {
  id: string;
  name: string;
  phone: string;
  bloodGroup: BloodGroup;
  location: Location;
  available: boolean;
  reliabilityScore: number; // 0 to 1, based on past show-up rate
  lastDonationDate: string; // ISO date string (YYYY-MM-DD)
  totalDonations?: number;
  isVerified?: boolean;
  eligibility?: DonorEligibility;
}

export interface BankInventoryUnit {
  id: string;
  bankId: string;
  bankName: string;
  location: Location;
  bloodGroup: BloodGroup;
  unitsAvailable: number;
  expiryDate: string; // ISO date string
}

export interface HospitalInventoryItem {
  bloodGroup: BloodGroup;
  unitsAvailable: number;
  isLowStock: boolean; // true if units < 5
  lastUpdated: string;
}

export interface HospitalProfile {
  id: string;
  name: string;
  location: Location;
  phone: string;
  inventory: Record<BloodGroup, number>;
}

export interface BloodRequest {
  id: string;
  hospitalName: string;
  location: Location;
  bloodGroup: BloodGroup;
  unitsNeeded: number;
  urgency: UrgencyLevel;
  status: "open" | "matched" | "confirmed" | "escalated";
  createdAt: string;
}

export type MatchSourceType = "donor" | "bank";

export interface MatchScoreBreakdown {
  urgency: number;     // 0.35 weight
  proximity: number;   // 0.30 weight
  expiry: number;      // 0.20 weight
  reliability: number; // 0.15 weight
}

export interface MatchResult {
  sourceType: MatchSourceType;
  sourceId: string;
  sourceName: string;
  bloodGroup: BloodGroup;
  distanceKm: number;
  score: number;
  breakdown: MatchScoreBreakdown;
  eligibilityNote?: string;
  location?: Location;
  phone?: string;
  totalDonations?: number;
  isVerified?: boolean;
}

export interface DonorBadge {
  tier: "bronze" | "silver" | "gold" | "diamond";
  badgeName: string;
  badgeIcon: string;
  donationCount: number;
  estimatedLivesSaved: number;
}

export interface PredictiveShortageRisk {
  bloodGroup: BloodGroup;
  currentUnits: number;
  riskLevel: "CRITICAL" | "MODERATE" | "STABLE";
  estimatedRunoutHours: number;
  recommendation: string;
}

export interface LiveEvent {
  id: string;
  type: "request_created" | "match_found" | "match_confirmed" | "stock_updated" | "donor_registered" | "alert_sent" | "donor_verified" | "donation_completed" | "delivery_dispatched" | "delivery_pickup" | "delivery_enroute" | "delivery_delivered";
  title: string;
  description: string;
  bloodGroup: BloodGroup;
  locationLabel: string;
  timestamp: string; // ISO string
}

export type DeliveryStatus = "dispatch" | "pickup" | "en_route" | "delivered";

export interface Delivery {
  id: string;
  requestId: string;
  hospitalName: string;
  bloodGroup: BloodGroup;
  sourceType: string;
  sourceName: string;
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
  distanceKm: number;
  etaSecondsReal: number;
  riderName: string;
  status: DeliveryStatus;
  currentLat: number;
  currentLng: number;
  progress: number;
  createdAt: string;
  deliveredAt?: string;
}

export type PassportEventType = "collected" | "tested" | "stored" | "dispatched" | "in_transit" | "delivered" | "transfused";
export interface PassportEvent {
  type: PassportEventType;
  title: string;
  at: string;
  by: string;
  tempC?: number;
  hash: string;
}
export interface UnitPassport {
  id: string;
  unitId: string;
  bloodGroup: BloodGroup;
  donorName: string;
  donorId: string;
  sourceName: string;
  hospitalName: string;
  collectedAt: string;
  expiryAt: string;
  coldChain: number[];
  events: PassportEvent[];
  impactLives: number;
  qr: string;
  status: "in_stock" | "in_transit" | "delivered" | "transfused";
}
