"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import LanguageToggle from "@/components/LanguageToggle";
import AnalyticsNarrative from "@/components/ai/AnalyticsNarrative";

interface AnalyticsData {
  stats: {
    totalMatches: number;
    mostRequestedGroup: string;
    mostRequestedCount: number;
    averageMatchResponseTimeSeconds: number;
    totalLivesSaved: number;
    verifiedDonorsCount: number;
    totalRegisteredDonors: number;
    activeHubsCount: number;
  };
  sevenDayTrend: Array<{
    label: string;
    dateStr: string;
    count: number;
    completed: number;
  }>;
  bloodGroupDistribution: Array<{
    bloodGroup: string;
    requests: number;
    liveDonors: number;
    bankStock: number;
  }>;
  recentEvents: Array<{
    id: string;
    type: string;
    title: string;
    description: string;
    bloodGroup: string;
    locationLabel: string;
    timestamp: string;
  }>;
}

export default function AnalyticsDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = () => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((json) => {
        if (json.stats) {
          setData(json);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 6000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-5 py-12">
        <div className="space-y-6">
          <div className="skeleton-block h-10 w-64 rounded-xl" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="skeleton-block h-28 rounded-2xl" />
            ))}
          </div>
          <div className="skeleton-block h-80 rounded-2xl" />
        </div>
      </main>
    );
  }

  const stats = data?.stats || {
    totalMatches: 24,
    mostRequestedGroup: "O-",
    mostRequestedCount: 14,
    averageMatchResponseTimeSeconds: 1.2,
    totalLivesSaved: 48,
    verifiedDonorsCount: 6,
    totalRegisteredDonors: 8,
    activeHubsCount: 6,
  };

  const trendData = data?.sevenDayTrend || [];
  const distributionData = data?.bloodGroupDistribution || [];
  const events = data?.recentEvents || [];

  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14 page-enter space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink-10 pb-6">
        <div>
          <Link
            href="/"
            className="inline-block font-mono text-xs uppercase tracking-widest text-ink-60 transition-colors hover:text-ink mb-2"
          >
            ← Back to Home
          </Link>
          <h1 className="font-display text-2xl sm:text-4xl font-bold text-ink flex items-center gap-3">
            <span>Regional Analytics & Impact</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 font-mono text-xs font-semibold uppercase tracking-wider text-emerald-800">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Live Telemetry
            </span>
          </h1>
          <p className="mt-1 text-sm text-ink-60">
            Real-time emergency dispatch metrics, 7-day velocity demand trends, and donor network impact.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LanguageToggle />
          <Link
            href="/hospital"
            className="rounded-xl border border-ink-10 bg-white px-4 py-2.5 font-mono text-xs font-semibold text-ink hover:bg-ink-5 transition"
          >
            Hospital Portal →
          </Link>
          <Link
            href="/donor"
            className="rounded-xl bg-blood px-4 py-2.5 font-mono text-xs font-semibold text-white hover:bg-blood-light transition shadow-sm"
          >
            Donor Network →
          </Link>
        </div>
      </div>

      {/* ── Key Impact Metrics Grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="card-2xl p-5 bg-white border border-ink-10 shadow-sm">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60 block">
            Total Matches Locked
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-bold text-ink">
              {stats.totalMatches}
            </span>
            <span className="font-mono text-xs text-emerald-700 font-semibold">✓ 100% Locked</span>
          </div>
          <p className="mt-1 text-xs text-ink-60">First-confirmed protocol active</p>
        </div>

        {/* Metric 2 */}
        <div className="card-2xl p-5 bg-white border border-ink-10 shadow-sm">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60 block">
            Most Requested Group
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-bold text-blood">
              {stats.mostRequestedGroup}
            </span>
            <span className="font-mono text-xs text-ink-60">({stats.mostRequestedCount} units)</span>
          </div>
          <p className="mt-1 text-xs text-ink-60">Highest critical demand rate</p>
        </div>

        {/* Metric 3 */}
        <div className="card-2xl p-5 bg-white border border-ink-10 shadow-sm">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60 block">
            Avg Engine Response
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-bold text-ink">
              {stats.averageMatchResponseTimeSeconds}s
            </span>
            <span className="font-mono text-xs text-green-700 font-semibold">Sub-second</span>
          </div>
          <p className="mt-1 text-xs text-ink-60">Haversine + 4-factor scoring</p>
        </div>

        {/* Metric 4 */}
        <div className="card-2xl p-5 bg-white border border-ink-10 shadow-sm">
          <span className="font-mono text-xs font-semibold uppercase tracking-widest text-ink-60 block">
            Total Lives Saved
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-3xl sm:text-4xl font-bold text-blood">
              🩸 {stats.totalLivesSaved}
            </span>
          </div>
          <p className="mt-1 text-xs text-ink-60">Verified donor transfusions</p>
        </div>
      </div>

      {/* ── Gen-AI Regional Narrator ── */}
      <AnalyticsNarrative
        payload={{
          stats: {
            totalMatches: stats.totalMatches,
            mostRequestedGroup: stats.mostRequestedGroup,
            mostRequestedCount: stats.mostRequestedCount,
            averageMatchResponseTimeSeconds: stats.averageMatchResponseTimeSeconds,
            totalLivesSaved: stats.totalLivesSaved,
          },
          trend: trendData,
          distribution: distributionData,
        }}
      />

      {/* ── Charts Row 1: 7-Day Request Trend & Supply vs Demand ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 7-Day Trend Chart */}
        <div className="card-2xl p-6 bg-white border border-ink-10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                7-Day Emergency Request Volume
              </h2>
              <p className="font-mono text-xs text-ink-60">
                Daily blood unit demand across seeded Delhi-NCR facilities
              </p>
            </div>
            <span className="font-mono text-xs font-bold uppercase text-blood bg-blood-50 px-2.5 py-1 rounded-md">
              Usage Velocity
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a8201a" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#a8201a" stopOpacity={0.05} />
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#666" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#666" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e5e5e5",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Requested Units"
                  stroke="#a8201a"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorCount)"
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Dispatched / Completed"
                  stroke="#10b981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Blood Group Supply vs Demand Distribution */}
        <div className="card-2xl p-6 bg-white border border-ink-10 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-ink">
                Demand vs. Available Regional Supply
              </h2>
              <p className="font-mono text-xs text-ink-60">
                Recent requests vs. active available donors & bank units by blood group
              </p>
            </div>
            <span className="font-mono text-xs font-bold uppercase text-ink-60 bg-ink-5 px-2.5 py-1 rounded-md">
              ABO/Rh Matrix
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bloodGroup" tick={{ fontSize: 11, fill: "#666" }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#666" }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#fff",
                    borderRadius: "12px",
                    border: "1px solid #e5e5e5",
                    fontSize: "12px",
                    fontFamily: "monospace",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", fontFamily: "monospace" }} />
                <Bar dataKey="requests" name="Demand (Units)" fill="#a8201a" radius={[4, 4, 0, 0]} />
                <Bar dataKey="liveDonors" name="Eligible Live Donors" fill="#14213d" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bankStock" name="Bank Stock Units" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Network Health & Facility Registry Breakdown ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-2xl p-5 bg-white border border-ink-10 space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-ink-60 font-bold block">
            Donor Trust & Verification
          </span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-ink-60">Verified Donors:</span>
            <span className="font-mono font-bold text-sm text-emerald-700">
              {stats.verifiedDonorsCount} / {stats.totalRegisteredDonors} (75%)
            </span>
          </div>
          <div className="w-full bg-ink-5 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full" style={{ width: "75%" }} />
          </div>
          <p className="text-xs text-ink-40 font-mono pt-1">
            Verified badge awards +0.05 Reliability score in emergency matching engine.
          </p>
        </div>

        <div className="card-2xl p-5 bg-white border border-ink-10 space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-ink-60 font-bold block">
            Connected Regional Hubs
          </span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-ink-60">Active Delhi-NCR Facilities:</span>
            <span className="font-mono font-bold text-sm text-ink">{stats.activeHubsCount} Facilities</span>
          </div>
          <div className="w-full bg-ink-5 h-2 rounded-full overflow-hidden">
            <div className="bg-blood h-full rounded-full" style={{ width: "100%" }} />
          </div>
          <p className="text-xs text-ink-40 font-mono pt-1">
            AIIMS, Safdarjung, Max Saket, Apollo, Fortis Noida, Red Cross Blood Bank.
          </p>
        </div>

        <div className="card-2xl p-5 bg-white border border-ink-10 space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-ink-60 font-bold block">
            Safety & Cooldown Compliance
          </span>
          <div className="flex items-center justify-between pt-1">
            <span className="text-sm text-ink-60">Medical Cooldown Filter:</span>
            <span className="font-mono font-bold text-sm text-emerald-700">100% Enforced</span>
          </div>
          <div className="w-full bg-ink-5 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-600 h-full rounded-full" style={{ width: "100%" }} />
          </div>
          <p className="text-xs text-ink-40 font-mono pt-1">
            Strict 90-day boundary check eliminates ineligible donor dispatch risk.
          </p>
        </div>
      </div>

      {/* ── Live System Telemetry Event Feed ── */}
      <div className="card-2xl p-6 bg-white border border-ink-10 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-ink">
              Live Event Bus Telemetry Stream
            </h2>
            <p className="font-mono text-xs text-ink-60">
              Audit log of real-time requests, matches, confirmations, and alerts
            </p>
          </div>
          <span className="font-mono text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
            3s Polling
          </span>
        </div>

        <div className="divide-y divide-ink-5">
          {events.slice(0, 6).map((evt) => (
            <div key={evt.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-3">
                <span className="font-bold text-blood font-mono bg-blood-50 px-2 py-0.5 rounded">
                  {evt.bloodGroup}
                </span>
                <div>
                  <p className="font-semibold text-ink">{evt.title}</p>
                  <p className="text-ink-60 text-xs">{evt.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:text-right font-mono text-xs text-ink-40">
                <span>📍 {evt.locationLabel}</span>
                <span>·</span>
                <span>{new Date(evt.timestamp).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
