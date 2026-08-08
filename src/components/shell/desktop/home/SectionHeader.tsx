/**
 * Home's section header (DESKTOP_SPEC.md §E1) — mono index + uppercase H2,
 * baseline-aligned, always at the 48px gutter regardless of which section
 * carries it. §J's density table gives desktop's exact ramp (11px H2 / 10.5px
 * index), one notch up from the phone build's (10.5px / 10px) — reused here
 * rather than re-derived per call site.
 */

import Link from "next/link";

export interface SectionHeaderProps {
  number: string;
  label: string;
  /** Section 05 only — the trailing "All" text button. */
  action?: { label: string; href: string };
}

export default function SectionHeader({ number, label, action }: SectionHeaderProps) {
  return (
    <div className={`flex items-baseline gap-3 px-12 ${action ? "justify-between" : ""}`}>
      <div className="flex items-baseline gap-3">
        <span className="font-mono text-[10.5px] font-semibold tracking-[.14em] text-accent">
          {number}
        </span>
        <h2 className="text-[11px] font-semibold tracking-[.24em] text-white/48 uppercase">
          {label}
        </h2>
      </div>
      {action && (
        <Link
          href={action.href}
          prefetch={false}
          className="rounded-xs border-0 bg-transparent p-0 text-[12px] text-white/42 transition-colors duration-(--duration-fast) ease-(--ease-out-quint) hover:text-white/75 focus-visible:text-white/75 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/70 motion-reduce:transition-none"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}
