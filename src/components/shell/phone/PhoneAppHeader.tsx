"use client";

import BrandLogo from "@/components/ui/other/BrandLogo";
import { cn } from "@/utils/helpers";
import Link from "next/link";

function SearchGlyph() {
  return (
    <svg viewBox="0 0 22 22" aria-hidden="true" className="size-[18px]" fill="none">
      <circle cx="9.7" cy="9.7" r="5.8" stroke="currentColor" strokeWidth="1.7" />
      <path d="m14.1 14.1 4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

interface PhoneAppHeaderProps {
  pathname: string;
}

/** Compact, persistent chrome for the five phone tabs. */
export default function PhoneAppHeader({ pathname }: PhoneAppHeaderProps) {
  const searchActive = pathname === "/search";
  const profileActive = pathname === "/space" || pathname.startsWith("/space/");

  return (
    <header className="relative z-30 flex h-[58px] items-center justify-between md:hidden">
      <BrandLogo className="-ml-1 h-11 px-1.5" textClassName="text-[15px] tracking-[0.1em]" />

      <div className="flex items-center gap-2">
        <Link
          href="/search"
          aria-label="Search StreamFree"
          aria-current={searchActive ? "page" : undefined}
          className={cn(
            "glass-control flex size-9 items-center justify-center rounded-full transition-transform duration-(--duration-fast) ease-(--ease-out-quint) focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none active:scale-90 motion-reduce:transition-none",
            searchActive && "border-violet-200/35 bg-violet-300/16 text-violet-100",
          )}
        >
          <SearchGlyph />
        </Link>

        <Link
          href="/space"
          aria-label="Open your StreamFree space"
          aria-current={profileActive ? "page" : undefined}
          className={cn(
            "flex size-9 items-center justify-center rounded-full border text-[11px] font-semibold tracking-[0.04em] text-violet-50 transition-transform duration-(--duration-fast) ease-(--ease-out-quint) focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none active:scale-90 motion-reduce:transition-none",
            profileActive
              ? "border-violet-100/55 bg-linear-to-br from-violet-200 to-violet-600 shadow-[0_0_0_4px_rgba(196,181,253,.1)]"
              : "border-violet-200/30 bg-linear-to-br from-violet-200/35 to-violet-700/45",
          )}
        >
          SF
        </Link>
      </div>
    </header>
  );
}
