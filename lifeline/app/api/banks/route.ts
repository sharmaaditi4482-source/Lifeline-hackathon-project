import { NextRequest, NextResponse } from "next/server";
import { getBankUnits, addBankUnit, getHospitals, updateHospitalInventory, getRequestHistory } from "@/lib/store";
import { BankInventoryUnit, BloodGroup } from "@/lib/types";
import { recordLiveEvent } from "@/lib/services/eventService";
import { compute7DayShortageAlerts } from "@/lib/services/inventoryService";

/**
 * GET /api/banks
 * Returns granular bank inventory units, hospital profiles, request history, and predictive shortage alerts.
 */
export async function GET() {
  try {
    const bankUnitsList = await getBankUnits();
    const hospitalsList = await getHospitals();
    const requestHistory = getRequestHistory();
    
    // Compute shortage alerts for default hospital
    const primaryHospital = hospitalsList[0];
    const shortageAlerts = primaryHospital
      ? compute7DayShortageAlerts(primaryHospital.inventory, requestHistory)
      : [];

    return NextResponse.json({ 
      bankUnits: bankUnitsList, 
      hospitals: hospitalsList, 
      requestHistory,
      shortageAlerts,
    });
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch bank stock." }, { status: 500 });
  }
}

/**
 * POST /api/banks
 * Registers a new blood stock batch.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bankName, bloodGroup, unitsAvailable, expiryDays, location } = body;

    if (!bankName || !bloodGroup || unitsAvailable === undefined) {
      return NextResponse.json({ error: "Missing required stock fields." }, { status: 400 });
    }

    const expDate = new Date();
    expDate.setDate(expDate.getDate() + (Number(expiryDays) || 30));

    const newUnit: BankInventoryUnit = {
      id: `unit_${Date.now()}`,
      bankId: `bank_${bankName.toLowerCase().replace(/[^a-z0-9]/g, "_")}`,
      bankName,
      location: location || { lat: 28.6139, lng: 77.2090, label: "Regional Blood Center, Delhi" },
      bloodGroup,
      unitsAvailable: Number(unitsAvailable),
      expiryDate: expDate.toISOString(),
    };

    await addBankUnit(newUnit);

    recordLiveEvent({
      type: "stock_updated",
      title: `Blood Reserve Added: ${bloodGroup}`,
      description: `${unitsAvailable} unit(s) added at ${bankName}`,
      bloodGroup,
      locationLabel: newUnit.location.label,
    });

    return NextResponse.json({ success: true, unit: newUnit }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Failed to add bank stock." }, { status: 500 });
  }
}

/**
 * PATCH /api/banks
 * Update hospital inventory units for specific blood groups.
 * Body: { hospitalId: string, bloodGroup: BloodGroup, units: number }
 */
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { hospitalId, bloodGroup, units } = body;

    if (!hospitalId || !bloodGroup || units === undefined) {
      return NextResponse.json({ error: "Missing required fields: hospitalId, bloodGroup, units." }, { status: 400 });
    }

    const updatedHospital = await updateHospitalInventory(hospitalId, {
      [bloodGroup as BloodGroup]: Number(units),
    });

    if (!updatedHospital) {
      return NextResponse.json({ error: "Hospital not found." }, { status: 404 });
    }

    recordLiveEvent({
      type: "stock_updated",
      title: `${bloodGroup} Stock Updated at ${updatedHospital.name}`,
      description: `Stock adjusted to ${units} units (Alert: ${units < 5 ? "LOW STOCK" : "Optimal"})`,
      bloodGroup: bloodGroup as BloodGroup,
      locationLabel: updatedHospital.location.label,
    });

    return NextResponse.json({ success: true, hospital: updatedHospital });
  } catch (err) {
    return NextResponse.json({ error: "Failed to update hospital inventory." }, { status: 500 });
  }
}
