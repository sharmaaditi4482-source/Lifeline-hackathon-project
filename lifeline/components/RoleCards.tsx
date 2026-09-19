"use client";

import Link from "next/link";

export default function RoleCards() {
  return (
    <section className="grid gap-6 sm:grid-cols-3 reveal-item">
      <Link
        href="/hospital"
        className="group block card-2xl premium-card p-6 bg-white hover:bg-white/95 active:scale-[0.99] relative overflow-hidden"
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-blood draw-underline">
          EMERGENCY DESK
        </p>
        <h3 className="mt-3 font-display text-xl font-semibold text-ink group-hover:text-blood transition-colors flex items-center justify-between">
          <span>Hospital Request</span>
          <span className="font-mono font-normal opacity-50 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all text-xs">→</span>
        </h3>
        <p className="mt-2 text-xs text-ink-60 leading-relaxed">
          Raise a critical blood request and instantly find compatible nearby supply.
        </p>
        <div className="mt-5 pt-3 border-t border-ink-10/40 opacity-30 group-hover:opacity-100 transition-opacity flex gap-2 items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-blood" />
          <span className="font-mono text-[8px] uppercase tracking-widest text-ink-40">Direct Alert Trigger</span>
        </div>
      </Link>

      <Link
        href="/donor"
        className="group block card-2xl premium-card p-6 bg-white hover:bg-white/95 active:scale-[0.99] relative overflow-hidden"
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-40 draw-underline">
          VOLUNTEER NETWORK
        </p>
        <h3 className="mt-3 font-display text-xl font-semibold text-ink group-hover:text-blood transition-colors flex items-center justify-between">
          <span>Donor Portal</span>
          <span className="font-mono font-normal opacity-50 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all text-xs">→</span>
        </h3>
        <p className="mt-2 text-xs text-ink-60 leading-relaxed">
          View volunteer availability, respond to requests, and help patients faster.
        </p>
        <div className="mt-5 pt-3 border-t border-ink-10/40 opacity-30 group-hover:opacity-100 transition-opacity flex gap-2 items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
          <span className="font-mono text-[8px] uppercase tracking-widest text-ink-40">Real-Time Registry</span>
        </div>
      </Link>

      <Link
        href="/bank"
        className="group block card-2xl premium-card p-6 bg-white hover:bg-white/95 active:scale-[0.99] relative overflow-hidden"
      >
        <p className="font-mono text-[10px] font-semibold uppercase tracking-widest text-ink-40 draw-underline">
          SUPPLY CHAIN
        </p>
        <h3 className="mt-3 font-display text-xl font-semibold text-ink group-hover:text-blood transition-colors flex items-center justify-between">
          <span>Inventory Stock</span>
          <span className="font-mono font-normal opacity-50 group-hover:opacity-100 group-hover:translate-x-1.5 transition-all text-xs">→</span>
        </h3>
        <p className="mt-2 text-xs text-ink-60 leading-relaxed">
          Monitor blood-bank stock, expiry, and real-time demand.
        </p>
        <div className="mt-5 pt-3 border-t border-ink-10/40 opacity-30 group-hover:opacity-100 transition-opacity flex gap-2 items-center">
          <span className="h-1.5 w-1.5 rounded-full bg-blood" />
          <span className="font-mono text-[8px] uppercase tracking-widest text-ink-40">Expiration Monitor</span>
        </div>
      </Link>
    </section>
  );
}
