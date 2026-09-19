"use client";

export default function FeatureGrid() {
  const stats = [
    { label: "Clinical Dispatch Time", value: "4.2 mins", sub: "vs 45 mins manual phone calls", icon: "⚡" },
    { label: "Expiry Waste Prevented", value: "142 Units", sub: "via 20% near-shelf-life weight", icon: "⏳" },
    { label: "ABO/Rh Safety Reliability", value: "100.0%", sub: "zero biological mismatches", icon: "🛡️" },
    { label: "Regional Hub Network", value: "6 Hubs", sub: "e-RaktKosh integration ready", icon: "🏥" },
  ];

  const features = [
    { icon: "⚖️", title: "Live Weighted Matching", desc: "Instantly computes candidate rank dynamically based on 4 real-time scoring vectors." },
    { icon: "🛡️", title: "Hard ABO/Rh Safety Filter", desc: "Enforces strict genetic matching circuits before any scoring algorithms run." },
    { icon: "⏳", title: "Expiry-Aware Prioritization", desc: "Prioritizes units nearest to expiration limits (≤10 days) to prevent stock wastage." },
    { icon: "📈", title: "Donor Turnout Scoring", desc: "Tracks historical donor attendance rates to calculate reliability coefficients." },
    { icon: "🔒", title: "First-Confirmed Locking", desc: "Locks the first matching confirmation and automatically releases alternative reserves." },
    { icon: "🚨", title: "Automated Escalation", desc: "Triggers district-level alerts automatically if local resources report no matches." },
    { icon: "👥", title: "Role-Based Dashboards", desc: "Individual secure portals customized for hospitals, donors, and blood bank units." },
    { icon: "📍", title: "GPS Radius GIS Mapping", desc: "Interactive Leaflet geospatial routing and real-time transit distance calculations." },
  ];

  return (
    <section className="reveal-item space-y-10">
      {/* Real-World Impact Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {stats.map((st) => (
          <div
            key={st.label}
            className="rounded-3xl border border-ink-10 bg-white p-4 sm:p-5 shadow-sm text-center flex flex-col items-center justify-between"
          >
            <span className="text-xl sm:text-2xl mb-1">{st.icon}</span>
            <div>
              <span className="font-display text-2xl sm:text-3xl font-bold text-ink block">
                {st.value}
              </span>
              <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-40 block mt-0.5">
                {st.label}
              </span>
            </div>
            <span className="font-mono text-[9px] text-blood mt-2 bg-blood-50 px-2 py-0.5 rounded-full font-medium">
              {st.sub}
            </span>
          </div>
        ))}
      </div>

      <div className="text-center max-w-xl mx-auto space-y-3 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-100/60 border border-red-200">
          <span className="h-1.5 w-1.5 rounded-full bg-blood" />
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-blood">
            CLINICAL CAPABILITIES
          </span>
        </div>
        <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
          Engineered for zero-failure dispatch.
        </h2>
        <p className="text-xs sm:text-sm text-ink-60 max-w-md mx-auto leading-relaxed">
          High-performance bio-logistics platform built for speed, safety, and coordinate alignment during critical dispatches.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => (
          <div
            key={i}
            className="rounded-3xl border border-ink-10 bg-white p-5 space-y-3 transition-all hover:border-blood/30 hover:shadow-md shadow-sm group"
          >
            <div className="w-10 h-10 rounded-2xl bg-[#FAF7F2] border border-ink-10 flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
              {f.icon}
            </div>
            <h4 className="font-display font-semibold text-sm text-ink group-hover:text-blood transition-colors">
              {f.title}
            </h4>
            <p className="text-xs text-ink-60 leading-relaxed">
              {f.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
