"use client";

/**
 * The desktop-only persistent header (Phase 3, §7 — "Missing headers on
 * desktop"). `DESKTOP_SPEC.md` §C calls this "the biggest trap": the glass
 * search pill only exists inside the Home hero (`top:26px; right:40px`);
 * Browse, Search, Anime and You have no header at all — no search, no
 * avatar, no logo above the fold beyond the rail. This promotes that pill to
 * a persistent position above every desktop screen's content.
 *
 * It also fixes §12 trap 1: in the mockup this pill is a `<div>` with no
 * `onClick` — a fake control. Here it is a real `<Link>` to `/search`
 * (focusable, navigable, no JS required for the click path) plus a global
 * `⌘K` / `Ctrl+K` shortcut the mockup never had.
 *
 * Deliberately does *not* render an account menu — `Rail.tsx`'s footer owns
 * that (§7, "the desktop account footer is a `<div>` with no handler").
 *
 * Phone has its own persistent top bar elsewhere (`PHONE_SPEC.md` §E context);
 * this renders nothing below the `md` breakpoint.
 */

import { cn } from "@/utils/helpers";
import { useRouter } from "@bprogress/next";
import { useHotkeys } from "@mantine/hooks";
import Link from "next/link";

interface DesktopHeaderProps {
  /** Escape hatch for whoever mounts this at the top of `<main>`
      (`ImmersiveAppShell.tsx`) — not read internally. */
  className?: string;
}

export default function DesktopHeader({ className }: DesktopHeaderProps) {
  const router = useRouter();

  // ⌘K (Mac) / Ctrl+K (Windows/Linux) opens Search from any desktop screen —
  // `DESKTOP_SPEC.md` §C flags this as missing entirely from the mockup's
  // search pill. `"mod"` is mantine's cross-platform modifier: `parseHotkey`
  // resolves it to "either metaKey or ctrlKey is down", so one binding covers
  // both platforms (unlike the literal `"ctrl+K"` `SearchInput.tsx` uses
  // elsewhere, which only fires on a physical Ctrl key). `useHotkeys` attaches
  // its listener in an effect scoped to this component's lifetime and calls
  // `event.preventDefault()` for us when a match fires, so the browser's own
  // Ctrl/Cmd+K (focus the address bar) never triggers.
  useHotkeys([["mod+K", () => router.push("/search"), { preventDefault: true }]]);

  return (
    <header
      className={cn(
        "hidden items-center justify-end gap-3 px-3 py-4 sm:px-5 md:flex",
        className,
      )}
    >
      {/* The glass search pill, `DESKTOP_SPEC.md` §C — right-aligned, per the
          mockup's `top:26px; right:40px` hero placement, now persistent
          instead of Home-only. Hand-rolled rather than the `glass-control`
          utility (`globals.css`): the spec's blur (16px) and border/bg alpha
          (.14 / .36) both differ from that utility's tokens (`--glass-blur-sm`
          is 12px; its border/bg are .20 / .35). `--glass-saturate` (180%)
          does match the spec exactly, so that one value is reused rather than
          re-declared. Hover/focus-visible states are additions — the mockup
          declares none anywhere on desktop (§B "Motion"), and turning this
          into a real control means it needs them. */}
      <Link
        href="/search"
        aria-label="Search Umbra. Keyboard shortcut Command K or Control K."
        className="group inline-flex h-[38px] items-center gap-[9px] rounded-full border border-white/14 bg-black/36 px-4 text-white outline-none transition-colors duration-(--duration-fast) ease-(--ease-out-quint) hover:border-white/22 hover:bg-black/45 focus-visible:ring-2 focus-visible:ring-violet-400/60 motion-reduce:transition-none"
        style={{
          backdropFilter: "blur(16px) saturate(var(--glass-saturate))",
          WebkitBackdropFilter: "blur(16px) saturate(var(--glass-saturate))",
        }}
      >
        {/* Magnifying glass, verbatim geometry from `DESKTOP_SPEC.md` §C. */}
        <svg
          width="15"
          height="15"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
          className="shrink-0 text-white/55"
        >
          <circle cx="9" cy="9" r="6.2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M13.6 13.6 17 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span className="text-[12.5px] whitespace-nowrap text-white/40">Search Umbra</span>
        {/* Discoverability for the shortcut above — the mockup has neither
            the handler nor the hint. `font-mono` ties it to the app's
            existing "numerals/data" register (`--font-mono`, §5.1) rather
            than inventing a fourth type treatment for one glyph pair. */}
        <kbd className="ml-0.5 rounded-[5px] border border-white/14 bg-white/7 px-[5px] py-[1px] font-mono text-[10px] leading-none text-white/45 group-hover:text-white/60">
          ⌘K
        </kbd>
      </Link>
    </header>
  );
}
