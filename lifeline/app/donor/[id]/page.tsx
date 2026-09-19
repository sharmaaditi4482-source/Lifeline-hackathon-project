"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Donor, BloodGroup } from "@/lib/types";
import { calculateDonorBadge } from "@/lib/services/donorService";
import LanguageToggle from "@/components/LanguageToggle";

interface SimulatedRequest {
  bloodGroup: BloodGroup;
  urgency: "critical" | "high" | "medium";
  hospital: string;
  distanceKm: number;
  units: number;
}

export default function DonorPortal() {
  const params = useParams();
  const router = useRouter();
  const donorId = params.id as string;

  const [donor, setDonor] = useState<Donor | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [flowState, setFlowState] = useState<"pending" | "accepted" | "declining" | "declined">("pending");
  const [nextRouteInfo, setNextRouteInfo] = useState<string>("");
  const [simulatedRequest, setSimulatedRequest] = useState<SimulatedRequest | null>(null);

  const fetchDonor = () => {
    fetch(`/api/donors/${donorId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.donor) {
          const found = data.donor;
          setDonor(found);

          let recipientGroup: BloodGroup = "O-";
          let hospital = "AIIMS Trauma Centre, New Delhi";
          let distance = 1.8;
          let units = 2;

          if (found.bloodGroup === "A+") {
            recipientGroup = "A+";
            hospital = "Fortis Hospital, Noida";
            distance = 3.8;
          } else if (found.bloodGroup === "B+") {
            recipientGroup = "B+";
            hospital = "Max Super Speciality Hospital, Saket";
            distance = 4.2;
          } else if (found.bloodGroup === "O+") {
            recipientGroup = "O+";
            hospital = "Indraprastha Apollo Blood Centre";
            distance = 2.4;
          } else if (found.bloodGroup === "AB+") {
            recipientGroup = "AB+";
            hospital = "Safdarjung Emergency Desk";
            distance = 1.5;
          }

          setSimulatedRequest({
            bloodGroup: recipientGroup,
            urgency: "critical",
            hospital,
            distanceKm: distance,
            units,
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDonor();
  }, [donorId]);

  // Toggle availability from profile
  const handleToggle = async () => {
    if (!donor) return;
    setToggling(true);
    try {
      const res = await fetch(`/api/donors/${donor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !donor.available }),
      });
      if (res.ok) {
        const data = await res.json();
        setDonor(data.donor);
      }
    } finally {
      setToggling(false);
    }
  };

  const handleAccept = () => setFlowState("accepted");

  const handleDecline = () => {
    setFlowState("declining");
    setTimeout(() => {
      setNextRouteInfo(`Request safely rerouted to next ranked compatible candidate in the regional pool.`);
      setFlowState("declined");
    }, 1500);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="skeleton-block w-full h-[380px] rounded-2xl" />
      </div>
    );
  }

  if (!donor) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16 page-enter text-center">
        <Link href="/donor" className="font-mono text-xs uppercase tracking-widest text-ink-40 hover:text-ink transition-colors">
          ← Back to Donors
        </Link>
        <div className="mt-8 card-2xl p-8 bg-white border-ink-10">
          <p className="font-display text-xl font-medium text-ink">Donor Profile Not Found</p>
          <p className="mt-2 text-sm text-ink-60">This donor ID does not exist or has been removed.</p>
        </div>
      </main>
    );
  }

  const isEligible = donor.eligibility?.isEligible ?? true;

  return (
    <main className="mx-auto max-w-xl px-5 py-10 sm:px-6 sm:py-14 page-enter">
      <div className="flex items-center justify-between w-full">
        <Link href="/donor" className="font-mono text-xs uppercase tracking-widest text-ink-40 hover:text-ink transition-colors">
          ← Back to Donors
        </Link>
        <LanguageToggle />
      </div>

      {/* ── Donor Profile Card ── */}
      <div className="mt-6 card-2xl p-6 sm:p-7 bg-white border border-ink-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-[10px] uppercase tracking-widest text-ink-40">Donor ID</span>
              <span className="font-mono text-[10px] font-bold text-ink-60 bg-ink-5 px-2 py-0.5 rounded">{donor.id}</span>
              {donor.isVerified && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  <span>✅</span> Verified Donor
                </span>
              )}
            </div>
            <h1 className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold text-ink flex items-center gap-2">
              {donor.name}
            </h1>
            <p className="mt-1 text-sm text-ink-60">
              📞 {donor.phone} · 📍 {donor.location.label}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            {/* Blood Group Badge */}
            <div className="h-12 w-12 rounded-2xl bg-blood-50 border border-blood/20 flex items-center justify-center shadow-sm">
              <span className="font-display text-xl font-bold text-blood">{donor.bloodGroup}</span>
            </div>
            <span className="font-mono text-[10px] text-ink-40">
              Reliability: {Math.round(donor.reliabilityScore * 100)}%
            </span>
          </div>
        </div>

        {/* ── Prominent Impact & Lives Saved Counter ── */}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-blood-50/70 border border-blood/20 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-blood/30 flex items-center justify-center text-xl shadow-xs text-blood">
              🩸
            </div>
            <div>
              <span className="font-display text-lg sm:text-xl font-bold text-blood block leading-tight">
                {donor.totalDonations ?? 0} Lives Saved
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-blood/70">
                Verified Direct Transfusions
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white border border-emerald-300 flex items-center justify-center text-xl shadow-xs text-emerald-600">
              {donor.isVerified ? "🛡️" : "👤"}
            </div>
            <div>
              <span className="font-display text-sm sm:text-base font-bold text-emerald-950 block leading-tight">
                {donor.isVerified ? "Certified Reliable" : "Standard Pool"}
              </span>
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700">
                {donor.isVerified ? "Hospital Verified ✅" : "Unverified"}
              </span>
            </div>
          </div>
        </div>

        {/* ── Medical Cooldown & Eligibility Banner ── */}
        <div className={`mt-4 rounded-2xl p-4 border ${
          isEligible ? "bg-green-50/70 border-green-200" : "bg-amber-50/80 border-amber-200"
        }`}>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-base">{isEligible ? "✅" : "⏳"}</span>
              <div>
                <p className={`font-mono text-xs font-bold uppercase tracking-wider ${
                  isEligible ? "text-green-800" : "text-amber-800"
                }`}>
                  {donor.eligibility?.statusText}
                </p>
                <p className="mt-0.5 text-xs text-ink-60">
                  Last Donation: <span className="font-medium text-ink">{donor.lastDonationDate}</span>
                  {donor.eligibility && (
                    <span> ({donor.eligibility.daysSinceLastDonation} days ago)</span>
                  )}
                </p>
              </div>
            </div>

            <span className="font-mono text-[10px] uppercase tracking-widest text-ink-40 hidden sm:inline">
              90-Day Standard
            </span>
          </div>
        </div>

        {/* ── Donor LifeSaver Milestone Badge (Gamification Innovation) ── */}
        {(() => {
          const count = donor.totalDonations ?? (donor.id === "d1" ? 6 : donor.id === "d6" ? 8 : 2);
          const badge = calculateDonorBadge(count);
          return (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-white border border-amber-200 flex items-center justify-center text-xl shadow-xs">
                  {badge.badgeIcon}
                </div>
                <div>
                  <span className="font-display font-bold text-sm text-amber-950 block">
                    {badge.badgeName}
                  </span>
                  <span className="font-mono text-[10px] text-amber-800">
                    {count} Recorded Donations · <strong className="text-blood">~{count * 3} Hospital Units Impacted</strong>
                  </span>
                </div>
              </div>
              <span className="font-mono text-[9px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                Verified Hero
              </span>
            </div>
          );
        })()}

        {/* ── Availability Toggle ── */}
        <div className="mt-5 flex items-center justify-between border-t border-ink-10 pt-4">
          <div>
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink">
              Available to Donate
            </p>
            <p className="text-xs text-ink-60">
              {donor.available
                ? "Active in real-time matching queue"
                : "Paused — matching engine will skip during emergencies"}
            </p>
          </div>

          <button
            type="button"
            onClick={handleToggle}
            disabled={toggling}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              donor.available ? "bg-green-600" : "bg-ink-20"
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                donor.available ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </button>
        </div>
      </div>

      {/* ── Simulated Live Dispatch Simulator ── */}
      {simulatedRequest && isEligible && donor.available && (
        <div className="mt-8">
          <div className="flex items-center gap-2 mb-3">
            <span className="h-2 w-2 rounded-full bg-blood animate-pulse" />
            <span className="font-mono text-xs uppercase tracking-widest text-ink-60">Live Dispatch Simulation</span>
          </div>

          {flowState === "pending" && (
            <div className="card-2xl p-6 border-blood/20 bg-white shadow-sm">
              <div className="flex items-center justify-between">
                <span className="rounded-lg bg-blood px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-widest text-white animate-pulse">
                  CRITICAL DISPATCH
                </span>
                <span className="font-mono text-xs text-ink-40">Just now</span>
              </div>

              <h2 className="mt-4 font-display text-xl font-semibold text-ink leading-snug">
                Emergency blood request matching your profile.
              </h2>

              <div className="mt-5 border-t border-ink-10 pt-4 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-mono text-xs uppercase tracking-wider text-ink-40">Destination</span>
                  <span className="font-medium text-ink text-right">{simulatedRequest.hospital}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-mono text-xs uppercase tracking-wider text-ink-40">Distance</span>
                  <span className="font-mono font-medium text-ink">{simulatedRequest.distanceKm} km away</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-mono text-xs uppercase tracking-wider text-ink-40">Demand</span>
                  <span className="font-medium text-ink">{simulatedRequest.units} Units</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={handleDecline}
                  className="rounded-xl border border-ink-10 bg-white py-3 font-mono text-xs font-semibold uppercase tracking-wider text-ink-60 hover:bg-clay"
                >
                  Decline
                </button>
                <button
                  onClick={handleAccept}
                  className="rounded-xl bg-blood py-3 font-display text-sm font-semibold text-white hover:bg-blood-light"
                >
                  Accept Request →
                </button>
              </div>
            </div>
          )}

          {flowState === "accepted" && (
            <div className="card-2xl p-6 border-green-200 bg-white text-center animate-fade-in">
              <div className="h-12 w-12 rounded-full bg-green-50 border border-green-200 flex items-center justify-center mx-auto text-green-700 text-lg font-bold">
                ✓
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold text-ink">Request Accepted</h3>
              <p className="mt-2 text-sm text-ink-60">
                Hospital notified. Please report to <span className="font-semibold text-ink">{simulatedRequest.hospital}</span>.
              </p>
            </div>
          )}

          {flowState === "declined" && (
            <div className="card-2xl p-6 border-ink-10 bg-white animate-fade-in text-center">
              <p className="font-display text-lg font-semibold text-ink">Request Rerouted</p>
              <p className="mt-2 text-sm text-ink-60">{nextRouteInfo}</p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
