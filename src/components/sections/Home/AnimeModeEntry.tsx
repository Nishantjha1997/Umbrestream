"use client";

import Link from "next/link";
import { Anime, ArrowUpLeft, Close } from "@/utils/icons";
import { useEffect, useState } from "react";

const STORAGE_KEY = "streamfree:anime-entry-dismissed:v1";

/** Intentional mode switch for Anime's distinct source/audio experience. */
export default function AnimeModeEntry() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      const isDismissed = window.localStorage.getItem(STORAGE_KEY) === "true";
      setDismissed(isDismissed);
    } catch {
      setDismissed(false);
    }
  }, []);

  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      window.localStorage.setItem(STORAGE_KEY, "true");
    } catch {
      // ignore localStorage write errors
    }
  };

  return (
    <section className="px-5 md:px-12" aria-label="Anime Mode announcement">
      <div className="relative flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 text-sm text-white/90">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-violet-400/20 text-accent">
            <Anime size={15} aria-hidden="true" />
          </span>
          <div className="flex min-w-0 flex-col sm:flex-row sm:items-center sm:gap-2">
            <span className="truncate font-semibold text-white">Enter Anime Mode</span>
            <span className="hidden text-white/40 sm:inline">·</span>
            <span className="truncate text-xs text-white/70">
              Seasonal releases, Sub & Dub tracking, and focused playback.
            </span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/anime"
            prefetch={false}
            className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/20 px-3.5 text-xs font-semibold text-violet-200 transition-colors hover:bg-violet-500/30 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
          >
            Open
            <ArrowUpLeft size={12} aria-hidden="true" className="rotate-90" />
          </Link>
          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dismiss Anime Mode banner"
            className="glass-control flex size-8 shrink-0 items-center justify-center rounded-full border focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
          >
            <Close size={13} aria-hidden="true" />
          </button>
        </div>
      </div>
    </section>
  );
}
