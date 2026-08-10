"use client";

/**
 * The phone shell (Phase 3, §7 — restyled to `docs/design/PHONE_SPEC.md` §E).
 *
 * Phase 2 built this file as a floating dock with a macOS-style magnetic
 * hover/focus size effect. `UI Analysis` finding 05 called that out
 * explicitly: "macOS-dock magnification has no meaning on a touchscreen
 * where there is no cursor to be near." That whole effect — `useMotionValue`
 * / `useTransform` / `useSpring` distance-to-pointer sizing, the scroll-hide
 * `useFloatingDock()` behaviour, the pill/dot active indicator — is gone.
 * This is now the design's tab bar: a static 5-column grid, color+weight is
 * the only active-state signal, and the five icons are the mockup's exact
 * hand-drawn glyphs rather than react-icons library equivalents (the
 * glyphs are this design's signature, not a generic icon set).
 *
 * Two deliberate departures from the spec's literal CSS, both because the
 * spec was extracted from a fixed-size device-frame mockup and this is a
 * real, normally-scrolling web page:
 *
 * 1. Spec says `position:absolute` (relative to the mockup's viewport-sized
 *    frame, which never scrolls itself). Our shell root
 *    (`ImmersiveAppShell.tsx`) is a normal `position:relative` block that
 *    grows with page content under window scroll, so `absolute` here would
 *    pin the bar to the bottom of the *document*, not the *viewport* — it
 *    would scroll away. `fixed` is the real-DOM equivalent of what the
 *    mockup's frame gave the spec for free.
 * 2. Spec's `padding: 12px 12px 28px` is a magic-number home-indicator
 *    inset with no `env(safe-area-inset-bottom)` (spec explicitly flags
 *    this as a mockup bug to fix, not a decision to port). Bottom padding
 *    is `max(28px, env(safe-area-inset-bottom))` so notched devices get
 *    more than 28px instead of losing the tap targets under the home
 *    indicator. This replaces the old `safe-floating-dock` class (built for
 *    a rounded pill dock with margin *from* the screen edge) — this bar
 *    sits flush against the edges and absorbs the safe area as internal
 *    padding instead, so that global class no longer applies.
 *
 * Open call from the spec (PHONE_SPEC.md §E): the mockup's own markup
 * carries a comment — "tab bar: eclipse crescent marks the active tab" —
 * that was never implemented; the mockup ships color+weight only. Shipped
 * here as color+weight only too, matching what the design actually shipped
 * rather than what one stale comment proposed, and because this file is
 * one of several landing at once (lower risk than adding a new glyph
 * component this pass). See the exported report for the reasoning.
 */

import { cn } from "@/utils/helpers";
import Link from "next/link";
import { itemIsActive, type NavigationItem } from "../itemIsActive";
import { siteConfig } from "@/config/site";

/**
 * Exact glyphs from PHONE_SPEC.md §E, keyed by nav label. All five are
 * hand-drawn for this design (not react-icons) — 22x22 viewBox, stroke-only,
 * rendered by the shared `<TabGlyph>` below which applies the common stroke
 * attributes once. Keep these paths byte-for-byte; a single wrong
 * coordinate renders a silently-broken icon.
 */
const TAB_ICON_PATHS: Record<string, React.ReactNode> = {
  Home: <path d="M3.4 9.2 11 3.2l7.6 6v9.2a.9.9 0 0 1-.9.9h-4.2v-5.6H8.5v5.6H4.3a.9.9 0 0 1-.9-.9V9.2Z" />,
  Search: (
    <>
      <circle cx="10" cy="10" r="6.4" />
      <path d="M14.8 14.8 18.6 18.6" />
    </>
  ),
  Browse: <path d="M3 5.6h16M3 11h16M3 16.4h10" />,
  Anime: (
    <>
      <path d="M11 3.4c2.2 2.6 2.2 5.6 0 8.2-2.2-2.6-2.2-5.6 0-8.2Z" />
      <path d="M11 11.6c2.9-1.3 5.6-.5 7.4 2-3.1.9-5.7.2-7.4-2Zm0 0c-2.9-1.3-5.6-.5-7.4 2 3.1.9 5.7.2 7.4-2Z" />
      <path d="M11 13.6v5" />
    </>
  ),
  You: (
    <>
      <circle cx="11" cy="8" r="3.4" />
      <path d="M4.6 18.4c.6-3.2 3.2-5 6.4-5s5.8 1.8 6.4 5" />
    </>
  ),
};

function TabGlyph({ label }: { label: string }) {
  const paths = TAB_ICON_PATHS[label];
  if (!paths) return null;
  return (
    <svg
      viewBox="0 0 22 22"
      aria-hidden="true"
      className="h-full w-full"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {paths}
    </svg>
  );
}

function TabBarItem({ item, active }: { item: NavigationItem; active: boolean }) {
  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        // PHONE_SPEC.md §E "each button": no border/background/padding of
        // its own, a centred column, 44px minimum touch target.
        "flex min-h-11 flex-col items-center justify-center gap-[7px] border-0 bg-transparent p-0",
        "rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-violet-300/70",
        // Active state is colour + weight only (§E "Indicator behaviour
        // (v2)") — no pill, no dot, no underline, no background change.
        // `text-white/40` renders rgba(255,255,255,.4) exactly, matching
        // the spec's inactive colour value.
        active ? "text-white" : "text-white/40",
      )}
    >
      <span className="flex h-5 w-6 items-center justify-center">
        <TabGlyph label={item.label} />
      </span>
      <span className={cn("text-[9.5px] tracking-[.06em]", active ? "font-semibold" : "font-medium")}>
        {item.label}
      </span>
    </Link>
  );
}

export default function TabBar({ pathname }: { pathname: string }) {
  const items = siteConfig.navItems
    .filter((item) => !item.desktopOnly)
    .sort((a, b) => (a.dockOrder ?? 99) - (b.dockOrder ?? 99));

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 md:hidden"
      style={{
        // §E container. Three-value shorthand: 12px top, 12px left/right,
        // and a safe-area-aware bottom (see file header note 2 above).
        padding: "12px 12px max(28px, env(safe-area-inset-bottom))",
        background: "linear-gradient(180deg, rgba(10,9,13,0), rgba(10,9,13,.82) 34%, rgba(10,9,13,.96))",
        backdropFilter: "blur(24px) saturate(180%)",
        WebkitBackdropFilter: "blur(24px) saturate(180%)",
        boxShadow: "0 -14px 32px rgba(0, 0, 0, .24)",
      }}
    >
      <div className="grid grid-cols-5">
        {items.map((item) => (
          <TabBarItem key={item.href} item={item} active={itemIsActive(pathname, item)} />
        ))}
      </div>
    </nav>
  );
}
