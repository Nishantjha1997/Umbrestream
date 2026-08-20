"use client";

/**
 * The mono-number + uppercase-eyebrow header shared by every numbered
 * section on phone Home, 01 through 06 (`PHONE_SPEC.md` §C.1/§G). Section
 * 05 is the one exception with a trailing "All" link, which is why `action`
 * exists here rather than being special-cased in `TrendingToday.tsx` — the
 * number+label pairing itself is identical either way.
 */

import Link from "next/link";
import { cn } from "@/utils/helpers";

export interface SectionHeaderProps {
  /** "01".."06" — rendered verbatim, zero-padded by the caller. */
  number: string;
  label: string;
  /** Section 05's trailing "All" link. Omit for every other section. */
  action?: { label: string; href: string };
  className?: string;
}

export default function SectionHeader({ number, label, action, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-baseline justify-between gap-[11px] px-5", className)}>
      <div className="flex items-baseline gap-[11px]">
        <span className="font-mono text-[10px] font-semibold tracking-[0.14em] text-accent">
          {number}
        </span>
        <h2 className="m-0 text-[10.5px] font-semibold tracking-[0.24em] text-white/70 uppercase">
          {label}
        </h2>
      </div>
      {action && (
        <Link
          href={action.href}
          className={cn(
            "shrink-0 rounded-sm text-[11.5px] text-white/70",
            "transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:transition-none",
            "hover:text-white focus-visible:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70",
          )}
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
