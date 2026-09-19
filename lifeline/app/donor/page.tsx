"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Donor, BloodGroup, Location } from "@/lib/types";
import LanguageToggle from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/languageContext";

const BLOOD_GROUPS: BloodGroup[] = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function DonorPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?role=donor");
      } else {
        setAuthChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  const [donors, setDonors] = useState<Donor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState<BloodGroup | "ALL">("ALL");
  const [filterEligibility, setFilterEligibility] = useState<"ALL" | "ELIGIBLE" | "COOLDOWN">("ALL");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Registration modal state
  const [showModal, setShowModal] = useState(false);
  const [regName, setRegName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regBloodGroup, setRegBloodGroup] = useState<BloodGroup>("O+");
  const [regAreaInput, setRegAreaInput] = useState("Saket, Delhi");
  const [regLastDonationDate, setRegLastDonationDate] = useState("2026-05-01");
  const [regLocation, setRegLocation] = useState<{ lat: number; lng: number; label: string }>({
    lat: 28.5244,
    lng: 77.2173,
    label: "Saket, Delhi",
  });
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState(false);
  const [regError, setRegError] = useState("");

  const [userGpsLocation, setUserGpsLocation] = useState<Location | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);

  const fetchDonors = () => {
    setLoading(true);
    fetch("/api/donors")
      .then((r) => r.json())
      .then((d) => {
        setDonors(d?.donors || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchDonors();
    // Auto-detect user live device GPS on mount
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const label = `Current Device GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
          setUserGpsLocation({ lat, lng, label });
          setRegLocation({ lat, lng, label });
          setRegAreaInput(label);
          setGpsStatus(`✓ Live Device GPS Auto-Detected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        },
        () => {},
        { timeout: 6000 }
      );
    }
  }, []);

  function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const EARTH_RADIUS_KM = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    const d = EARTH_RADIUS_KM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(d * 10) / 10;
  }

  // Handle GPS detection in modal
  function handleDetectGPS() {
    if (!navigator.geolocation) {
      setGpsStatus("GPS not supported by browser");
      return;
    }
    setGpsDetecting(true);
    setGpsStatus("Detecting location…");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const label = `Current Device GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
        setRegLocation({ lat, lng, label });
        setRegAreaInput(label);
        setGpsStatus(`✓ GPS Locked: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setUserGpsLocation({ lat, lng, label });
        setGpsDetecting(false);
      },
      () => {
        setGpsStatus("GPS permission denied. Enter area manually.");
        setGpsDetecting(false);
      },
      { timeout: 8000 }
    );
  }

  // Toggle donor availability
  async function handleToggleAvailability(e: React.MouseEvent, donorId: string, currentAvailable: boolean) {
    e.preventDefault();
    e.stopPropagation();
    setTogglingId(donorId);

    try {
      const res = await fetch(`/api/donors/${donorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ available: !currentAvailable }),
      });
      if (res.ok) {
        const data = await res.json();
        setDonors((prev) =>
          prev.map((d) => (d.id === donorId ? data.donor : d))
        );
      }
    } catch {
      // Toggle failed
    } finally {
      setTogglingId(null);
    }
  }

  const filteredDonors = useMemo(() => {
    let list = donors.filter((d) => {
      if (filterGroup !== "ALL" && d.bloodGroup !== filterGroup) return false;
      if (filterEligibility === "ELIGIBLE" && !d.eligibility?.isEligible) return false;
      if (filterEligibility === "COOLDOWN" && d.eligibility?.isEligible) return false;
      return true;
    });

    if (sortByDistance && userGpsLocation) {
      list = [...list].sort((a, b) => {
        const distA = getDistanceKm(userGpsLocation.lat, userGpsLocation.lng, a.location.lat, a.location.lng);
        const distB = getDistanceKm(userGpsLocation.lat, userGpsLocation.lng, b.location.lat, b.location.lng);
        return distA - distB;
      });
    }

    return list;
  }, [donors, filterGroup, filterEligibility, sortByDistance, userGpsLocation]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setRegError("");
    setRegLoading(true);
    try {
      const res = await fetch("/api/donors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          phone: regPhone,
          bloodGroup: regBloodGroup,
          location: {
            ...regLocation,
            label: regAreaInput || regLocation.label,
          },
          lastDonationDate: regLastDonationDate,
          available: true,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Registration failed.");
      }
      setRegSuccess(true);
      fetchDonors();
      setTimeout(() => {
        setShowModal(false);
        setRegSuccess(false);
        setRegName("");
        setRegPhone("");
        setRegBloodGroup("O+");
      }, 1500);
    } catch (err: unknown) {
      setRegError(err instanceof Error ? err.message : "Registration failed.");
    } finally {
      setRegLoading(false);
    }
  }

  const eligibleCount = donors.filter((d) => d.eligibility?.isEligible).length;
  const inCooldownCount = donors.length - eligibleCount;
  const availableCount = donors.filter((d) => d.available && d.eligibility?.isEligible).length;

  if (authChecking) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-14 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-60">Authenticating Access…</p>
      </main>
    );
  }

  return (
    <>
      {/* Registration Modal - outside page-enter to avoid transform clipping */}
      {showModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setShowModal(false); setRegSuccess(false); setRegError(""); } }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-ink-10 my-auto relative z-[10000]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-mono text-xs font-semibold uppercase tracking-widest text-blood">
                  Volunteer Registry
                </p>
                <h2 className="mt-1 font-display text-xl font-semibold text-ink">
                  Register as a Donor
                </h2>
              </div>
              <button
                onClick={() => { setShowModal(false); setRegSuccess(false); setRegError(""); }}
                className="font-mono text-sm text-ink-40 hover:text-ink transition-colors"
              >
                ✕
              </button>
            </div>

            {regSuccess ? (
              <div className="text-center py-6 space-y-3 animate-fade-in">
                <div className="h-12 w-12 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mx-auto font-bold text-green-700 text-lg">
                  ✓
                </div>
                <p className="font-display text-lg font-semibold text-ink">
                  Registered successfully!
                </p>
                <p className="text-sm text-ink-60">
                  You're now in the live donor registry. The 90-day medical cooldown eligibility has been evaluated.
                </p>
              </div>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4">
                {regError && (
                  <div className="rounded-xl border border-blood/20 bg-blood-50 px-4 py-3 font-mono text-xs text-blood">
                    {regError}
                  </div>
                )}

                <div>
                  <label className="font-mono text-xs font-medium uppercase tracking-widest text-ink-60">
                    Full Name *
                  </label>
                  <input
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Riya Sharma"
                    className="mt-1.5 w-full rounded-xl border border-ink-10 bg-white px-4 py-2.5 text-sm text-ink transition placeholder:text-ink-40"
                  />
                </div>

                {/* Blood Group with Quick 1-Click Buttons */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs font-medium uppercase tracking-widest text-ink-60">
                      Blood Group *
                    </label>
                    <span className="font-mono text-xs text-blood font-bold">
                      {regBloodGroup}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {BLOOD_GROUPS.map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setRegBloodGroup(bg)}
                        className={`px-2.5 py-1 rounded-lg font-mono text-xs font-bold border transition-all ${
                          regBloodGroup === bg
                            ? "bg-blood text-white border-blood shadow-sm scale-105"
                            : "bg-white text-ink-60 border-ink-10 hover:border-blood/40 hover:text-blood"
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-mono text-xs font-medium uppercase tracking-widest text-ink-60">
                    Phone *
                  </label>
                  <input
                    required
                    type="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="+91 98765 00000"
                    className="mt-1.5 w-full rounded-xl border border-ink-10 bg-white px-4 py-2.5 text-sm text-ink transition placeholder:text-ink-40"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center">
                    <label className="font-mono text-xs font-medium uppercase tracking-widest text-ink-60">
                      Location / City *
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      className="font-mono text-xs text-blood hover:underline font-semibold"
                    >
                      📍 Auto-Detect GPS
                    </button>
                  </div>
                  <input
                    required
                    list="donor-locations"
                    type="text"
                    value={regAreaInput}
                    onChange={(e) => setRegAreaInput(e.target.value)}
                    placeholder="Type or select area (e.g. Saket, Noida, Dwarka)..."
                    className="mt-1.5 w-full rounded-xl border border-ink-10 bg-white px-4 py-2.5 text-sm text-ink transition placeholder:text-ink-40 shadow-sm"
                  />
                  <datalist id="donor-locations">
                    <option value="Saket, South Delhi" />
                    <option value="AIIMS, Ansari Nagar, New Delhi" />
                    <option value="Safdarjung Enclave, New Delhi" />
                    <option value="Rohini Sector 9, North West Delhi" />
                    <option value="Dwarka Sector 12, South West Delhi" />
                    <option value="Connaught Place, Central Delhi" />
                    <option value="Lajpat Nagar, South Delhi" />
                    <option value="Noida Sector 62, Uttar Pradesh" />
                    <option value="Gurugram Cyber City, Haryana" />
                    <option value="Faridabad Sector 16, Haryana" />
                    <option value="Vasant Kunj, South Delhi" />
                    <option value="Karol Bagh, Central Delhi" />
                    <option value="Janakpuri, West Delhi" />
                  </datalist>
                  {gpsStatus && (
                    <p className="mt-1 font-mono text-xs text-green-700">{gpsStatus}</p>
                  )}
                </div>

                <div>
                  <label className="font-mono text-xs font-medium uppercase tracking-widest text-ink-60">
                    Last Blood Donation Date (90-day Cooldown)
                  </label>
                  <input
                    type="date"
                    value={regLastDonationDate}
                    onChange={(e) => setRegLastDonationDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-ink-10 bg-white px-4 py-2.5 text-sm text-ink transition"
                  />
                  <p className="mt-1 font-mono text-xs text-ink-40">
                    Used to determine medical safety eligibility (minimum 90-day interval).
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={regLoading || gpsDetecting}
                  className="w-full rounded-xl bg-blood px-6 py-3 font-display text-sm font-semibold text-white transition hover:bg-blood-light disabled:opacity-50"
                >
                  {regLoading ? "Registering…" : "Join Donor Registry →"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-14 page-enter">
      {/* Top Bar */}
      <div className="flex justify-between items-center w-full">
        <Link
          href="/"
          className="inline-block font-mono text-xs uppercase tracking-widest text-ink-60 transition-colors hover:text-ink"
        >
          ← Back
        </Link>
        <div className="flex items-center gap-3">
          <LanguageToggle />
          <button
            onClick={handleLogout}
            type="button"
            className="font-mono text-xs uppercase tracking-widest text-blood hover:underline font-semibold"
          >
            {t("logout_btn")} ✕
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            {t("donor_portal_title")}
          </h1>
          <p className="mt-2 max-w-xl text-ink-60 text-sm">
            {t("donor_portal_sub")}
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex-shrink-0 rounded-xl bg-blood border border-blood px-5 py-2.5 font-display text-sm font-semibold text-white transition hover:bg-blood-light shadow-sm"
        >
          + Register as Donor
        </button>
      </div>

      {/* ── Stats Bar with Cooldown Health ── */}
      {!loading && (
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="card-2xl p-4 bg-white border-ink-10 text-center">
            <p className="font-display text-2xl font-semibold text-ink">{donors.length}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-60">Total Registered</p>
          </div>
          <div className="card-2xl p-4 bg-white border-ink-10 text-center">
            <p className="font-display text-2xl font-semibold text-green-700">{availableCount}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-60">Ready to Donate</p>
          </div>
          <div className="card-2xl p-4 bg-white border-ink-10 text-center">
            <p className="font-display text-2xl font-semibold text-ink">{eligibleCount}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-60">Medical Safe (&gt;90d)</p>
          </div>
          <div className="card-2xl p-4 bg-amber-50/70 border-amber-200 text-center">
            <p className="font-display text-2xl font-semibold text-amber-800">{inCooldownCount}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-amber-700">In 90-day Cooldown</p>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterGroup("ALL")}
            className={`rounded-lg px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-all border ${
              filterGroup === "ALL"
                ? "bg-ink text-white border-ink"
                : "bg-white text-ink-60 border-ink-10 hover:border-ink-40"
            }`}
          >
            All
          </button>
          {BLOOD_GROUPS.map((bg) => (
            <button
              key={bg}
              onClick={() => setFilterGroup(bg)}
              className={`rounded-lg px-2.5 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider transition-all border ${
                filterGroup === bg
                  ? "bg-blood text-white border-blood"
                  : "bg-white text-ink-60 border-ink-10 hover:border-blood/40"
              }`}
            >
              {bg}
            </button>
          ))}
        </div>

        {/* Eligibility Filter */}
        <div className="flex rounded-xl border border-ink-10 bg-white p-1 text-xs font-mono">
          <button
            onClick={() => setFilterEligibility("ALL")}
            className={`px-2.5 py-1 rounded-lg transition-all font-semibold ${
              filterEligibility === "ALL" ? "bg-ink text-white" : "text-ink-60 hover:text-ink"
            }`}
          >
            All Status
          </button>
          <button
            onClick={() => setFilterEligibility("ELIGIBLE")}
            className={`px-2.5 py-1 rounded-lg transition-all font-semibold ${
              filterEligibility === "ELIGIBLE" ? "bg-green-700 text-white" : "text-ink-60 hover:text-ink"
            }`}
          >
            Eligible Only
          </button>
          <button
            onClick={() => setFilterEligibility("COOLDOWN")}
            className={`px-2.5 py-1 rounded-lg transition-all font-semibold ${
              filterEligibility === "COOLDOWN" ? "bg-amber-700 text-white" : "text-ink-60 hover:text-ink"
            }`}
          >
            In Cooldown
          </button>
        </div>

        {/* Live GPS Proximity Sort Toggle */}
        <button
          type="button"
          onClick={() => setSortByDistance(!sortByDistance)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-mono text-xs font-bold uppercase tracking-wider border transition-all ${
            sortByDistance
              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
              : "bg-white text-ink-60 border-ink-10 hover:border-emerald-500 hover:text-emerald-700"
          }`}
        >
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>{sortByDistance ? "✓ Sorted by Nearest to My GPS" : "📍 Sort by Nearest to Me"}</span>
        </button>
      </div>

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton-block w-full h-[88px] rounded-2xl" />
          ))}
        </div>
      ) : filteredDonors.length === 0 ? (
        <div className="mt-12 text-center card-2xl p-10 border-ink-10 bg-white">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-60">No Matches</p>
          <p className="mt-2 font-display text-lg text-ink font-medium">No donors match this criteria right now.</p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {filteredDonors.map((d, i) => {
            const isEligible = d.eligibility?.isEligible ?? true;
            const distFromUser = userGpsLocation
              ? getDistanceKm(userGpsLocation.lat, userGpsLocation.lng, d.location.lat, d.location.lng)
              : null;

            return (
              <div
                key={d.id}
                className="group card-2xl p-5 transition-all bg-white border border-ink-10 hover:border-blood/30 shadow-sm"
                style={{
                  animation: "fadeSlideUp 0.4s ease-out both",
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <Link
                        href={`/donor/${d.id}`}
                        className="font-display text-lg font-semibold text-ink group-hover:text-blood transition-colors"
                      >
                        {d.name}
                      </Link>
                      <span className="font-mono text-xs text-ink-40 uppercase">
                        ID: {d.id}
                      </span>
                      {/* Verified Donor Badge */}
                      {d.isVerified && (
                        <span className="rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 font-mono text-xs font-bold">
                          ✅ Verified
                        </span>
                      )}
                      {/* Lives Saved Badge */}
                      <span className="rounded-full bg-blood-50 text-blood border border-blood/20 px-2 py-0.5 font-mono text-xs font-bold">
                        🩸 {d.totalDonations ?? (d.id === "d1" ? 6 : d.id === "d6" ? 8 : 3)} Lives Saved
                      </span>
                      {/* Medical Eligibility Badge */}
                      <span
                        className={`rounded-full px-2.5 py-0.5 font-mono text-xs font-bold uppercase tracking-wider ${
                          isEligible
                            ? "bg-green-50 text-green-700 border border-green-200"
                            : "bg-amber-50 text-amber-800 border border-amber-200"
                        }`}
                      >
                        {d.eligibility?.statusText || (isEligible ? "Eligible" : "Cooldown Active")}
                      </span>
                      {/* Live GPS Distance Badge */}
                      {distFromUser !== null && (
                        <span className="rounded-full bg-sky-50 text-sky-700 border border-sky-200 px-2.5 py-0.5 font-mono text-xs font-bold">
                          📍 {distFromUser} km from you
                        </span>
                      )}
                    </div>

                    <p className="mt-1.5 font-mono text-xs text-ink-60">
                      <span className="font-bold text-blood text-sm">{d.bloodGroup}</span> · {d.location.label} · Last Donated:{" "}
                      <span className="font-medium text-ink">{d.lastDonationDate}</span>
                    </p>
                  </div>

                  {/* Toggle & Action Buttons */}
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {/* Live Availability Toggle */}
                    <button
                      onClick={(e) => handleToggleAvailability(e, d.id, d.available)}
                      disabled={togglingId === d.id}
                      className={`flex items-center gap-2 rounded-xl px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-wider border transition-all ${
                        d.available
                          ? "bg-green-50 text-green-700 border-green-300 hover:bg-green-100"
                          : "bg-ink-5 text-ink-40 border-ink-10 hover:bg-ink-10"
                      }`}
                      title="Click to toggle availability"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${
                          d.available ? "bg-green-500 animate-pulse" : "bg-ink-30"
                        }`}
                      />
                      <span>{togglingId === d.id ? "Updating…" : d.available ? "Available" : "Unavailable"}</span>
                    </button>

                    <Link
                      href={`/donor/${d.id}`}
                      className="rounded-xl border border-ink-10 bg-white px-3 py-1.5 font-mono text-xs uppercase font-semibold text-ink-60 hover:text-blood hover:border-blood transition-all"
                    >
                      View Profile →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
    </>
  );
}
