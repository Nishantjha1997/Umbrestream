"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Anime, ArrowLeft, Server } from "@/utils/icons";

interface AnimeModeShellProps {
  children: ReactNode;
}

/** Shared visual frame for the focused Anime Mode route. */
export default function AnimeModeShell({ children }: AnimeModeShellProps) {
  return (
    <div className="relative -mx-3 min-h-[calc(100dvh-4rem)] overflow-hidden bg-[radial-gradient(circle_at_78%_0%,rgba(217,70,239,.13),transparent_30%),#0d0a12] sm:-mx-5 md:-mx-0">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-linear-to-b from-fuchsia-300/8 to-transparent" aria-hidden="true" />
      <header className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-white/8 px-5 py-5 md:px-10 md:py-7">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-2xl border border-fuchsia-100/20 bg-fuchsia-200/12 text-fuchsia-100">
            <Anime size={19} aria-hidden="true" />
          </div>
          <div>
            <p className="text-[10px] font-semibold tracking-[0.25em] text-fuchsia-200/65 uppercase">StreamFree</p>
            <h1 className="font-serif text-[28px] leading-none tracking-[-0.02em] text-white md:text-[34px]">Anime Mode</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/anime/discover" prefetch={false} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 text-[12px] font-medium text-white/75 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-fuchsia-200/75 focus-visible:outline-none">
            <Server size={14} aria-hidden="true" />
            Discover
          </Link>
          <Link href="/" prefetch={false} aria-label="Back to StreamFree home" className="inline-flex size-11 items-center justify-center rounded-full border border-white/12 bg-white/6 text-white/75 hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-fuchsia-200/75 focus-visible:outline-none">
            <ArrowLeft size={16} aria-hidden="true" />
          </Link>
        </div>
      </header>
      <div className="relative z-10 px-5 py-7 md:px-10 md:py-10">{children}</div>
    </div>
  );
}
