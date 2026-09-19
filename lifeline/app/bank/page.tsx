"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { BankInventoryUnit, BloodGroup } from "@/lib/types";
import LanguageToggle from "@/components/LanguageToggle";

export default function BankPage() {
  const router = useRouter();
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login?role=bank");
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

  const [units, setUnits] = useState<BankInventoryUnit[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterGroup, setFilterGroup] = useState<BloodGroup | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);
  const [bankNameInput, setBankNameInput] = useState("Apollo Hospital Blood Bank");
  const [bloodGroupInput, setBloodGroupInput] = useState<BloodGroup>("O+");
  const [unitsInput, setUnitsInput] = useState(5);
  const [expiryDaysInput, setExpiryDaysInput] = useState(25);
  const [locationLabelInput, setLocationLabelInput] = useState("South Extension, Delhi");
  const [bankLocation, setBankLocation] = useState<{ lat: number; lng: number; label: string }>({
    lat: 28.5672,
    lng: 77.2100,
    label: "South Extension, Delhi",
  });
  const [gpsDetecting, setGpsDetecting] = useState(false);
  const [gpsStatus, setGpsStatus] = useState("");
  const [addLoading, setAddLoading] = useState(false);
  const [addSuccess, setAddSuccess] = useState(false);

  const fetchUnits = () => {
    setLoading(true);
    fetch("/api/banks")
      .then((r) => r.json())
      .then((d) => {
        setUnits(d?.bankUnits || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const handleDetectGPS = () => {
    if (!navigator.geolocation) {
      setGpsStatus("GPS not supported by browser");
      return;
    }
    setGpsDetecting(true);
    setGpsStatus("Detecting live GPS...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const label = `Current Device GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
        setBankLocation({ lat, lng, label });
        setLocationLabelInput(label);
        setGpsStatus(`✓ Live Device GPS Locked: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        setGpsDetecting(false);
      },
      () => {
        setGpsStatus("GPS permission denied. Enter location manually.");
        setGpsDetecting(false);
      },
      { timeout: 8000 }
    );
  };

  useEffect(() => {
    fetchUnits();
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const label = `Current Device GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;
          setBankLocation({ lat, lng, label });
          setLocationLabelInput(label);
          setGpsStatus(`✓ Live Device GPS Auto-Detected: ${lat.toFixed(4)}, ${lng.toFixed(4)}`);
        },
        () => {},
        { timeout: 6000 }
      );
    }
  }, []);

  async function handleAddStock(e: React.FormEvent) {
    e.preventDefault();
    setAddLoading(true);
    try {
      const res = await fetch("/api/banks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bankName: bankNameInput,
          bloodGroup: bloodGroupInput,
          unitsAvailable: unitsInput,
          expiryDays: expiryDaysInput,
          location: {
            lat: bankLocation.lat,
            lng: bankLocation.lng,
            label: locationLabelInput,
          },
        }),
      });
      if (res.ok) {
        setAddSuccess(true);
        fetchUnits();
        setTimeout(() => {
          setShowAddModal(false);
          setAddSuccess(false);
        }, 1500);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddLoading(false);
    }
  }

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      if (filterGroup !== "ALL" && u.bloodGroup !== filterGroup) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = u.bankName.toLowerCase().includes(q);
        const matchesLoc = u.location.label.toLowerCase().includes(q);
        const matchesId = u.id.toLowerCase().includes(q);
        if (!matchesName && !matchesLoc && !matchesId) return false;
      }
      return true;
    });
  }, [units, filterGroup, searchQuery]);

  const BLOOD_GROUPS: BloodGroup[] = [
    "A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-",
  ];

  // Compute summary stats
  const totalUnits = units.reduce((sum, u) => sum + u.unitsAvailable, 0);
  const nearExpiryCount = units.filter((u) => {
    const daysLeft = Math.round(
      (new Date(u.expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );
    return daysLeft <= 10 && daysLeft > 0;
  }).length;
  const uniqueBanks = new Set(units.map((u) => u.bankId)).size;

  if (authChecking) {
    return (
      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-14 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-ink-60">Authenticating Access...</p>
      </main>
    );
  }

  return (
    <>
      {/* Add Stock Modal - Root Level Overlay */}
      {showAddModal && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowAddModal(false);
              setAddSuccess(false);
            }
          }}
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
        >
          <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-ink-10 relative z-[10000] my-auto">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="font-mono text-xs font-bold uppercase tracking-widest text-blood">
                  ⚡ Blood Bank Command Desk
                </p>
                <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-ink">
                  Register Blood Stock Batch
                </h2>
              </div>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); setAddSuccess(false); }}
                className="h-8 w-8 rounded-full bg-ink-5 hover:bg-ink-10 flex items-center justify-center font-mono text-sm text-ink-60 hover:text-ink transition-colors"
              >
                ✕
              </button>
            </div>

            {addSuccess ? (
              <div className="text-center py-8 space-y-3">
                <div className="h-14 w-14 rounded-full bg-green-100 border border-green-200 flex items-center justify-center mx-auto font-bold text-green-700 text-xl">
                  ✓
                </div>
                <p className="font-display text-xl font-bold text-ink">
                  Blood Batch Added to Live Network!
                </p>
                <p className="text-xs text-ink-60 font-mono">
                  {unitsInput} units of {bloodGroupInput} are now discoverable by nearby trauma centers.
                </p>
              </div>
            ) : (
              <form onSubmit={handleAddStock} className="space-y-4">
                <div>
                  <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">
                    Blood Bank / Hospital Facility Name *
                  </label>
                  <input
                    required
                    list="bank-facility-suggestions"
                    value={bankNameInput}
                    onChange={(e) => setBankNameInput(e.target.value)}
                    placeholder="e.g. Red Cross Central Blood Bank"
                    className="mt-1.5 w-full rounded-xl border border-ink-10 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition focus:border-blood shadow-xs"
                  />
                  <datalist id="bank-facility-suggestions">
                    <option value="Red Cross Central Blood Bank" />
                    <option value="AIIMS Blood Transfusion Center" />
                    <option value="Apollo Hospital Blood Bank" />
                    <option value="Max Super Speciality Blood Desk" />
                    <option value="Jaipur Civil Hospital Blood Centre" />
                    <option value="Rotary Blood Bank" />
                  </datalist>
                </div>

                {/* 1-Click Blood Group Selection */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">
                      Blood Group *
                    </label>
                    <span className="font-mono text-xs text-blood font-bold">
                      Selected: {bloodGroupInput}
                    </span>
                  </div>
                  <div className="mt-1.5 grid grid-cols-4 sm:grid-cols-8 gap-1.5">
                    {BLOOD_GROUPS.map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setBloodGroupInput(bg)}
                        className={`py-2 rounded-xl font-mono text-xs font-bold border transition-all ${
                          bloodGroupInput === bg
                            ? "bg-blood text-white border-blood shadow-sm scale-105"
                            : "bg-white text-ink-60 border-ink-10 hover:border-blood/40 hover:text-blood"
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">
                      Units Available *
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      max={100}
                      value={unitsInput}
                      onChange={(e) => setUnitsInput(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-ink-10 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition focus:border-blood shadow-xs"
                    />
                  </div>

                  <div>
                    <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">
                      Days to Expiry (Shelf Life) *
                    </label>
                    <input
                      required
                      type="number"
                      min={1}
                      max={45}
                      value={expiryDaysInput}
                      onChange={(e) => setExpiryDaysInput(Number(e.target.value))}
                      className="mt-1.5 w-full rounded-xl border border-ink-10 bg-white px-4 py-2.5 text-sm font-semibold text-ink transition focus:border-blood shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">
                      City / Facility Location *
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectGPS}
                      disabled={gpsDetecting}
                      className="font-mono text-xs text-blood hover:underline font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      {gpsDetecting ? "⏳ Locating..." : "📍 Use Live GPS"}
                    </button>
                  </div>
                  <input
                    required
                    value={locationLabelInput}
                    onChange={(e) => setLocationLabelInput(e.target.value)}
                    placeholder="e.g. Connaught Place, Central Delhi"
                    className="mt-1.5 w-full rounded-xl border border-ink-10 bg-white px-4 py-2.5 text-sm text-ink transition focus:border-blood shadow-xs"
                  />
                  {gpsStatus && (
                    <p className="mt-1 font-mono text-xs text-green-700 font-medium">
                      {gpsStatus}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={addLoading}
                  className="w-full rounded-xl bg-blood px-6 py-3.5 font-display text-sm font-bold text-white transition hover:bg-blood-light disabled:opacity-50 mt-3 shadow-sm hover:shadow-md cursor-pointer"
                >
                  {addLoading ? "Registering Batch..." : "+ Confirm & Add to Live Network"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      <main className="mx-auto max-w-4xl px-5 py-10 sm:px-6 sm:py-14 page-enter">
        <div className="flex justify-between items-center w-full relative z-20">
          <Link
            href="/"
            className="inline-block font-mono text-xs uppercase tracking-widest text-ink-60 transition-colors hover:text-ink"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <button
              onClick={() => {
                setAddSuccess(false);
                setShowAddModal(true);
              }}
              type="button"
              className="rounded-xl border border-blood bg-blood hover:bg-blood-light px-4 py-2 font-mono text-xs font-bold uppercase tracking-wider text-white transition-all shadow-sm active:scale-95 cursor-pointer"
            >
              + Add Blood Stock
            </button>
            <button
              onClick={handleLogout}
              type="button"
              className="font-mono text-xs uppercase tracking-widest text-blood hover:underline font-semibold"
            >
              Logout ✕
            </button>
          </div>
        </div>

      <div className="mt-5 flex flex-col justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Blood Bank Stock
          </h1>
          <p className="mt-2 max-w-xl text-ink-60">
            Live reserve stock units across regional partner blood banks. Inventory is tracked and matched automatically.
          </p>
        </div>

        {/* Search Bar & Blood Group Filters */}
        <div className="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-ink-10 shadow-xs">
          <div className="relative flex-1 max-w-sm">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-ink-40 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by hospital name or city..."
              className="w-full pl-8 pr-8 py-2 rounded-xl border border-ink-10 bg-clay/50 text-xs font-mono text-ink placeholder:text-ink-40 focus:border-blood/40 shadow-xs transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-40 hover:text-ink text-xs font-mono"
              >
                ✕
              </button>
            )}
          </div>

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
        </div>
      </div>

      {/* ── Inventory Health Stats Bar ── */}
      {!loading && (
        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="card-2xl p-4 bg-white border-ink-10 text-center">
            <p className="font-display text-2xl font-semibold text-ink">{totalUnits}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-60">Total Units</p>
          </div>
          <div className={`card-2xl p-4 text-center ${nearExpiryCount > 0 ? "bg-blood-50 border-blood/20" : "bg-white border-ink-10"}`}>
            <p className={`font-display text-2xl font-semibold ${nearExpiryCount > 0 ? "text-blood" : "text-ink"}`}>
              {nearExpiryCount}
            </p>
            <p className={`mt-1 font-mono text-xs uppercase tracking-widest ${nearExpiryCount > 0 ? "text-blood/70" : "text-ink-40"}`}>
              Near Expiry
            </p>
          </div>
          <div className="card-2xl p-4 bg-white border-ink-10 text-center">
            <p className="font-display text-2xl font-semibold text-ink">{uniqueBanks}</p>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-ink-60">Partner Banks</p>
          </div>
        </div>
      )}

      {/* Near-expiry alert banner */}
      {!loading && nearExpiryCount > 0 && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-blood/20 bg-blood-50 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-blood animate-pulse flex-shrink-0" />
          <p className="font-mono text-xs text-blood font-medium">
            <span className="font-bold">{nearExpiryCount} unit{nearExpiryCount > 1 ? "s" : ""}</span> near expiry — the matching engine is already prioritizing these for outgoing requests.
          </p>
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton-block w-full h-[76px] rounded-2xl" />
          ))}
        </div>
      ) : filteredUnits.length === 0 ? (
        <div className="mt-12 text-center card-2xl p-10 border-ink-10 bg-white">
          <p className="font-mono text-xs uppercase tracking-widest text-ink-60">Out of Stock</p>
          <p className="mt-2 font-display text-lg text-ink font-medium">No units matching this blood group are available.</p>
          <p className="mt-1 text-sm text-ink-60 max-w-sm mx-auto">
            Try checking general donor registries or scaling matching alerts.
          </p>
        </div>
      ) : (
        <div className="mt-8 space-y-3">
          {filteredUnits.map((u, i) => {
            const daysLeft = Math.round(
              (new Date(u.expiryDate).getTime() - Date.now()) /
                (1000 * 60 * 60 * 24)
            );
            const nearExpiry = daysLeft <= 10;

            return (
              <div
                key={u.id}
                className={`card-2xl p-5 transition-all duration-300 ${nearExpiry ? "bg-blood-50 border-blood/15" : "bg-white border border-ink-10"}`}
                style={{
                  animation: "fadeSlideUp 0.4s ease-out both",
                  animationDelay: `${i * 80}ms`,
                }}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-display text-lg font-semibold text-ink">
                        {u.bankName}
                      </h3>
                      <span className="font-mono text-xs text-ink-40 uppercase tracking-wider">
                        ID: {u.id}
                      </span>
                    </div>
                    <p className="mt-1 font-mono text-xs text-ink-60">
                      <span className="font-semibold text-blood">{u.bloodGroup}</span> ·{" "}
                      <span className="font-medium text-ink">{u.unitsAvailable} units available</span> · {u.location.label}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    {nearExpiry && (
                      <span className="font-mono text-xs uppercase tracking-wider text-blood font-bold">
                        ↑ Engine priority
                      </span>
                    )}
                    <span
                      className={`inline-block rounded-full px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider ${
                        nearExpiry
                          ? "bg-blood text-white animate-pulse"
                          : "bg-ink-5 text-ink-60 border border-ink-10"
                      }`}
                    >
                      {daysLeft <= 0 ? "Expired" : `${daysLeft} days left`}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Info footer box */}
      <div className="mt-12 card-2xl border-ink-10 bg-white p-6">
        <p className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60">System note</p>
        <p className="mt-2 text-xs text-ink-60 leading-relaxed">
          Inventory expiration tracking runs as a cron schedule. Low shelf-life units are automatically prioritized by the scoring algorithm to prevent precious resources from going to waste.
        </p>
      </div>
    </main>
  </>
  );
}
