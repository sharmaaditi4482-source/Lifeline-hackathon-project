"use client";

import { useState } from "react";
import { BloodGroup } from "@/lib/types";

const COMPATIBILITY_MAP: Record<BloodGroup, BloodGroup[]> = {
  "O-": ["O-"],
  "O+": ["O-", "O+"],
  "A-": ["O-", "A-"],
  "A+": ["O-", "O+", "A-", "A+"],
  "B-": ["O-", "B-"],
  "B+": ["O-", "O+", "B-", "B+"],
  "AB-": ["O-", "A-", "B-", "AB-"],
  "AB+": ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"],
};

const ANTIGEN_EXPLANATION: Record<BloodGroup, { title: string; desc: string }> = {
  "O-": {
    title: "Universal Donor Blood",
    desc: "Contains no A, B, or Rh antigens on red blood cells. Can safely donate to all 8 blood groups without triggering antibody agglutination.",
  },
  "O+": {
    title: "Rh-Positive Universal Red Cells",
    desc: "Contains Rh(D) antigen but no A or B antigens. Safe for any Rh-positive recipient (O+, A+, B+, AB+).",
  },
  "A-": {
    title: "A Antigen Only (Rh Negative)",
    desc: "Can receive blood only from O- and A- donors to prevent anti-A and anti-D immune reactions.",
  },
  "A+": {
    title: "A and Rh(D) Antigens Present",
    desc: "Can safely accept blood units from O-, O+, A-, and A+ donors.",
  },
  "B-": {
    title: "B Antigen Only (Rh Negative)",
    desc: "Can receive blood only from O- and B- donors to avoid hemolytic transfusion reactions.",
  },
  "B+": {
    title: "B and Rh(D) Antigens Present",
    desc: "Can safely accept transfusions from O-, O+, B-, and B+ donors.",
  },
  "AB-": {
    title: "A and B Antigens (Rh Negative)",
    desc: "Can receive red cells from all Rh-negative types (O-, A-, B-, AB-).",
  },
  "AB+": {
    title: "Universal Recipient Blood",
    desc: "Expresses A, B, and Rh antigens. Has no plasma antibodies against A, B, or Rh, making it safe to receive from all 8 blood types.",
  },
};

const GROUPS: BloodGroup[] = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"];

export default function SafetyMatrix() {
  const [selectedRecipient, setSelectedRecipient] = useState<BloodGroup>("AB+");
  const [hoveredDonor, setHoveredDonor] = useState<BloodGroup | null>(null);

  const compatibleList = COMPATIBILITY_MAP[selectedRecipient] || [];
  const explanation = ANTIGEN_EXPLANATION[selectedRecipient];

  return (
    <div className="w-full card-2xl border-ink-10 bg-white p-5 md:p-6 shadow-sm overflow-hidden select-none">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-blood animate-pulse" />
            <h4 className="font-display text-sm font-semibold text-ink">
              Interactive ABO / Rh Safety Matrix
            </h4>
          </div>
          <p className="mt-1 text-xs text-ink-60 leading-relaxed">
            Click any patient recipient blood group below to inspect compatible donor pathways.
          </p>
        </div>

        <div className="flex items-center gap-1 bg-ink-5 p-1 rounded-xl">
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-40 px-1">
            Select Patient:
          </span>
          {GROUPS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedRecipient(g)}
              className={`px-2 py-1 rounded-lg font-mono text-[10px] font-bold transition-all ${
                selectedRecipient === g
                  ? "bg-blood text-white shadow-sm scale-105"
                  : "text-ink-60 hover:text-ink hover:bg-white"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Matrix */}
      <div className="overflow-x-auto">
        <div className="min-w-[400px]">
          {/* Header Row: Donor Group */}
          <div className="grid grid-cols-[70px_repeat(8,1fr)] items-center border-b border-ink-10 pb-2 text-center">
            <div className="text-left font-mono text-[9px] uppercase tracking-wider text-ink-40">Recipient</div>
            {GROUPS.map((g) => (
              <div 
                key={g} 
                className={`font-mono text-[10px] font-semibold transition-colors ${
                  hoveredDonor === g ? "text-blood" : "text-ink-60"
                }`}
              >
                {g}
              </div>
            ))}
          </div>

          {/* Matrix Rows */}
          <div className="space-y-1.5 pt-2">
            {GROUPS.map((recipient) => {
              const compatibleDonors = COMPATIBILITY_MAP[recipient];
              const isSelected = selectedRecipient === recipient;

              return (
                <div
                  key={recipient}
                  onClick={() => setSelectedRecipient(recipient)}
                  className={`grid grid-cols-[70px_repeat(8,1fr)] items-center py-1.5 rounded-lg text-center transition-all cursor-pointer ${
                    isSelected 
                      ? "bg-blood-50/80 border border-blood/20 shadow-sm" 
                      : "hover:bg-ink-5"
                  }`}
                >
                  {/* Left row header: Recipient */}
                  <div className="text-left font-mono text-[10px] font-bold text-ink pl-2 flex items-center gap-1.5">
                    {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blood" />}
                    {recipient}
                  </div>

                  {/* Donor Columns cells */}
                  {GROUPS.map((donor) => {
                    const isCompatible = compatibleDonors.includes(donor);

                    return (
                      <div
                        key={donor}
                        className="flex items-center justify-center h-5 transition-all"
                        onMouseEnter={() => setHoveredDonor(donor)}
                        onMouseLeave={() => setHoveredDonor(null)}
                      >
                        {isCompatible ? (
                          <div 
                            className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold transition-all ${
                              isSelected 
                                ? "bg-blood text-white scale-110 shadow-sm" 
                                : "bg-blood-10 text-blood"
                            }`}
                          >
                            ✓
                          </div>
                        ) : (
                          <div className="w-1.5 h-1.5 rounded-full bg-ink-10 opacity-30" />
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Explanation Banner */}
      <div className="mt-4 rounded-xl bg-ink-5 p-3.5 border border-ink-10 text-xs">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-blood">
            Selected: {selectedRecipient} Recipient ({explanation.title})
          </span>
          <span className="font-mono text-[10px] text-ink-60">
            {compatibleList.length} of 8 Compatible Groups
          </span>
        </div>
        <p className="mt-1 text-ink-70 leading-relaxed text-[11px]">
          {explanation.desc}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-wider text-ink-40">Safe Donors:</span>
          {compatibleList.map((bg) => (
            <span key={bg} className="rounded bg-blood text-white px-2 py-0.5 font-mono text-[9px] font-bold shadow-xs">
              {bg}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
