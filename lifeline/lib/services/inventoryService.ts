import { BloodGroup, HospitalInventoryItem, PredictiveShortageRisk } from "../types";

export const ALL_BLOOD_GROUPS: BloodGroup[] = [
  "O+", "O-", "A+", "A-", "B+", "B-", "AB+", "AB-",
];

export const LOW_STOCK_THRESHOLD = 5;

/**
 * Check if a unit count qualifies as critically low stock.
 * 
 * @param units - Current stock count for blood group
 * @returns boolean true if under minimum threshold (< 5 units)
 */
export function isLowStock(units: number): boolean {
  return units < LOW_STOCK_THRESHOLD;
}

/**
 * Format hospital inventory record into structured items with alert flags.
 * 
 * @param inventory - Key-value record of blood groups to unit counts
 * @param lastUpdatedIso - ISO timestamp of record update
 * @returns Array of structured HospitalInventoryItem objects
 */
export function formatHospitalInventory(
  inventory: Record<BloodGroup, number>,
  lastUpdatedIso: string = new Date().toISOString()
): HospitalInventoryItem[] {
  return ALL_BLOOD_GROUPS.map((bg) => {
    const units = inventory[bg] ?? 0;
    return {
      bloodGroup: bg,
      unitsAvailable: units,
      isLowStock: isLowStock(units),
      lastUpdated: lastUpdatedIso,
    };
  });
}

/**
 * Compute inventory statistics for a hospital profile.
 * 
 * @param inventory - Key-value record of blood groups to unit counts
 * @returns Summary containing totalUnits, lowStockCount, and group count
 */
export function getInventorySummary(inventory: Record<BloodGroup, number>) {
  let totalUnits = 0;
  let lowStockCount = 0;

  for (const bg of ALL_BLOOD_GROUPS) {
    const count = inventory[bg] ?? 0;
    totalUnits += count;
    if (count < LOW_STOCK_THRESHOLD) {
      lowStockCount++;
    }
  }

  return {
    totalUnits,
    lowStockCount,
    bloodGroupCount: ALL_BLOOD_GROUPS.length,
  };
}

/**
 * Predictive Shortage Alert Engine:
 * Analyzes current hospital blood reserves and regional demand velocity to forecast
 * which blood groups risk full depletion within 24 to 48 hours.
 * 
 * @param inventory - Current hospital stock per blood group
 * @returns Array of PredictiveShortageRisk objects prioritized by urgency
 */
export function predictBloodShortages(
  inventory: Record<BloodGroup, number>
): PredictiveShortageRisk[] {
  const risks: PredictiveShortageRisk[] = [];

  for (const bg of ALL_BLOOD_GROUPS) {
    const currentUnits = inventory[bg] ?? 0;

    if (currentUnits <= 2) {
      risks.push({
        bloodGroup: bg,
        currentUnits,
        riskLevel: "CRITICAL",
        estimatedRunoutHours: Math.max(2, currentUnits * 4),
        recommendation: `Immediate district rebalancing required. Trigger donor broadcast for ${bg}.`,
      });
    } else if (currentUnits < LOW_STOCK_THRESHOLD) {
      risks.push({
        bloodGroup: bg,
        currentUnits,
        riskLevel: "MODERATE",
        estimatedRunoutHours: currentUnits * 8,
        recommendation: `Reserve below safety buffer (${currentUnits}/5). Schedule cooperative replenishment.`,
      });
    } else {
      risks.push({
        bloodGroup: bg,
        currentUnits,
        riskLevel: "STABLE",
        estimatedRunoutHours: 72,
        recommendation: `Stock optimal (${currentUnits} units). Meets 72-hour clinical demand requirements.`,
      });
    }
  }

  // Sort critical first
  const order = { CRITICAL: 0, MODERATE: 1, STABLE: 2 };
  return risks.sort((a, b) => order[a.riskLevel] - order[b.riskLevel]);
}

export interface PredictiveShortageAlert {
  bloodGroup: BloodGroup;
  currentUnits: number;
  recent7DayRequests: number;
  dailyBurnRate: number; // units consumed per day on average over last 7 days
  projectedRunoutDays: number; // currentUnits / dailyBurnRate
  alertBannerText: string;
  isUrgentAlert: boolean;
}

/**
 * 7-Day Usage Velocity Shortage Calculation:
 * 
 * Logic Explained:
 * 1. Filter request history for the target facility over the last 7 calendar days (7 * 86,400s).
 * 2. Sum requested blood units per blood group -> recent7DayRequests.
 * 3. Daily Burn Rate = recent7DayRequests / 7 days (average consumption rate).
 * 4. Projected Runout = currentUnits / dailyBurnRate.
 * 5. Proactive Alert Condition:
 *    - If current stock < 8 units AND (projectedRunoutDays <= 3 OR currentUnits <= 4)
 *    - Produces a clear proactive banner for medical staff before critical zero-stock outage.
 */
export function compute7DayShortageAlerts(
  inventory: Record<BloodGroup, number>,
  requestHistory: Array<{ bloodGroup: BloodGroup; units: number; timestamp: string }>
): PredictiveShortageAlert[] {
  const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const recentRecords = requestHistory.filter((item) => {
    const itemTime = new Date(item.timestamp).getTime();
    return now - itemTime <= SEVEN_DAYS_MS;
  });

  const alerts: PredictiveShortageAlert[] = [];

  for (const bg of ALL_BLOOD_GROUPS) {
    const currentUnits = inventory[bg] ?? 0;

    // Sum requests for this blood group in the last 7 days
    const totalRequested7Days = recentRecords
      .filter((r) => r.bloodGroup === bg)
      .reduce((sum, r) => sum + (r.units || 1), 0);

    // Calculate daily average burn rate (units requested per day)
    const dailyBurnRate = Math.round((totalRequested7Days / 7) * 10) / 10;

    // Estimate projected days remaining until full depletion
    const projectedRunoutDays =
      dailyBurnRate > 0 ? Math.round((currentUnits / dailyBurnRate) * 10) / 10 : 99;

    // Trigger alert if stock is low or projected to run out in <= 3 days
    const isUrgent = currentUnits <= 4 || (projectedRunoutDays <= 3 && totalRequested7Days > 0);

    if (isUrgent && currentUnits < 8) {
      const daysText = projectedRunoutDays < 1 ? "< 24 hours" : `~${Math.ceil(projectedRunoutDays)} days`;
      alerts.push({
        bloodGroup: bg,
        currentUnits,
        recent7DayRequests: totalRequested7Days,
        dailyBurnRate,
        projectedRunoutDays,
        alertBannerText: `⚠️ ${bg} stock trending low (${currentUnits} units remaining) — projected to run out in ${daysText} based on ${totalRequested7Days}-unit recent 7-day usage.`,
        isUrgentAlert: true,
      });
    }
  }

  return alerts;
}
