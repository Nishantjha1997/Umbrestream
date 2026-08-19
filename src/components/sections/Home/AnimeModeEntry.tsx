"use client";

import Link from "next/link";
import { Anime, ArrowUpLeft } from "@/utils/icons";

/** Intentional mode switch for Anime's distinct source/audio experience. */
export default function AnimeModeEntry() {
  return (
    <section className="px-5 md:px-12" aria-labelledby="anime-mode-title">
      <div className="relative overflow-hidden rounded-[24px] border border-fuchsia-200/16 bg-[radial-gradient(circle_at_86%_10%,rgba(217,70,239,.28),transparent_34%),linear-gradient(120deg,rgba(41,24,58,.95),rgba(14,11,24,.96))] px-5 py-5 shadow-[0_20px_60px_-40px_rgba(217,70,239,.8)] md:flex md:items-center md:justify-between md:px-7 md:py-6">
        <div className="pointer-events-none absolute -right-8 -bottom-16 size-48 rounded-full bg-fuchsia-400/10 blur-3xl" aria-hidden="true" />
        <div className="relative min-w-0">
          <p className="mb-2 flex items-center gap-2 text-[10px] font-semibold tracking-[0.24em] text-fuchsia-200/65 uppercase">
            <Anime size={13} aria-hidden="true" />
            A dedicated anime space
          </p>
          <h2 id="anime-mode-title" className="font-serif text-[30px] leading-none tracking-[-0.02em] text-white md:text-[38px]">
            Enter Anime Mode
          </h2>
          <p className="mt-2 max-w-[620px] text-[12.5px] leading-6 text-white/58 md:text-[13.5px]">
            Discover seasonal releases, keep Sub and Dub servers separate, and continue episodes from one focused home.
          </p>
        </div>
        <Link
          href="/anime"
          prefetch={false}
          className="relative mt-5 inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-full border border-fuchsia-100/25 bg-fuchsia-200/14 px-5 text-[13px] font-semibold text-fuchsia-50 transition-colors hover:bg-fuchsia-200/24 focus-visible:ring-2 focus-visible:ring-fuchsia-200/80 focus-visible:outline-none md:mt-0"
        >
          Open Anime Mode
          <ArrowUpLeft size={14} aria-hidden="true" className="rotate-90" />
        </Link>
      </div>
    </section>
  );
}
