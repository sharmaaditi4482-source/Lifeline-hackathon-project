"use client";

import Link from "next/link";

interface HandleSmoothScroll {
  (e: React.MouseEvent<HTMLAnchorElement>, id: string): void;
}

interface HeroSectionProps {
  handleSmoothScroll: HandleSmoothScroll;
}

export default function HeroSection({ handleSmoothScroll }: HeroSectionProps) {
  return (
    <section className="grid gap-10 md:grid-cols-[1fr_360px] items-center pt-4 sm:pt-8 page-enter">
      {/* Hero Left Content */}
      <div className="space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blood-10 border border-blood/10">
          <span className="h-1.5 w-1.5 rounded-full bg-blood animate-pulse" />
          <span className="font-mono text-[9px] font-semibold uppercase tracking-wider text-blood">Bio-Matching Network v1.2</span>
        </div>

        <h1 className="font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl md:text-[56px] leading-[1.08] max-w-2xl">
          Compatible blood exist.
          <br />
          <span className="text-blood font-normal italic">
            Right on time
          </span>
        </h1>

        <p className="max-w-xl text-base text-ink-60 leading-relaxed sm:text-lg">
          LifeLine connects hospitals, donors, and blood banks through live tracking when every second matters.
        </p>

        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            href="/hospital"
            className="rounded-xl bg-blood border border-blood px-6 py-3.5 font-display text-sm font-semibold text-white transition-all hover:bg-blood-light hover:shadow-sm"
          >
            Request Blood
          </Link>
          <a
            href="#how-it-works"
            onClick={(e) => handleSmoothScroll(e, "how-it-works")}
            className="ml-2 font-mono text-[10px] uppercase tracking-wider text-ink-40 hover:text-blood transition-colors"
          >
            Explore how LifeLine works →
          </a>
        </div>
      </div>

      {/* Hero Right — dynamically imported to avoid SSR issues with animation */}
      <div className="w-full flex items-center justify-center">
        {/* HeroNetworkVisual rendered by parent to keep dynamic import at page level */}
      </div>
    </section>
  );
}
