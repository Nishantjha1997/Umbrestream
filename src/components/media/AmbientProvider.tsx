"use client";

/**
 * Ambient color theming (Phase 1, `docs/design/PHONE_SPEC.md` §A.2 /
 * `docs/design/mockups/Umbra Mobile.dc.html`). Not a bloom behind one card —
 * the whole shell tints to the open title's palette and crossfades between
 * screens. `useExtractColors` (fully implemented, previously imported
 * nowhere) finally does something: a detail or player page calls
 * {@link useSetAmbient} with its backdrop's `dominantColor`, and every mount
 * of `<AmbientLayers>` tints and crossfades in response.
 *
 * This file only builds the plumbing. No page calls {@link useSetAmbient} yet
 * — that lands in Phase 5, when detail pages wire `useExtractColors` to their
 * resolved backdrop URL. Until then every screen shows the neutral default
 * (no wash, vignette only).
 *
 * Two layers, painted before content, both `pointer-events-none`:
 *   1. the ambient wash — a radial gradient derived from the current color,
 *      transitioning over `--duration-cinematic` (800ms).
 *   2. a static vignette — always present, independent of ambient color.
 *
 * `<AmbientProvider>` is context-only (mounted in `providers.tsx`, no DOM of
 * its own — see the note there about why). `<AmbientLayers>` is the visual
 * piece and must be mounted inside a `position: relative` ancestor that
 * bounds the whole app surface (`ImmersiveAppShell`'s root), not inside
 * `AmbientProvider` itself, or the `inset-0` layers have nothing to size
 * against.
 */

import { useReducedMotionSafe } from "@/utils/motion";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface AmbientContextValue {
  ambient: string | null;
  setAmbient: (color: string | null) => void;
}

const AmbientContext = createContext<AmbientContextValue | null>(null);

export function AmbientProvider({ children }: { children: React.ReactNode }) {
  const [ambient, setAmbient] = useState<string | null>(null);
  const value = useMemo(() => ({ ambient, setAmbient }), [ambient]);
  return <AmbientContext.Provider value={value}>{children}</AmbientContext.Provider>;
}

function useAmbientContext(): AmbientContextValue {
  const context = useContext(AmbientContext);
  if (!context) throw new Error("useSetAmbient/AmbientLayers must be used within <AmbientProvider>");
  return context;
}

/**
 * Parses `rgba(r,g,b,a)` (the default `useExtractColors` output format) or
 * `#rrggbb`/`#rgb` and re-emits it at a fixed low alpha, so callers pass a
 * plain dominant color and never hand-tune an opacity themselves.
 */
function washFrom(color: string, alpha: number): string | null {
  const rgbaMatch = /^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*[\d.]+\s*)?\)$/.exec(color);
  if (rgbaMatch) {
    const [, r, g, b] = rgbaMatch;
    return `rgba(${r},${g},${b},${alpha})`;
  }
  const hexMatch = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color);
  if (hexMatch) {
    const hex = hexMatch[1];
    const full =
      hex.length === 3
        ? hex
            .split("")
            .map((c) => c + c)
            .join("")
        : hex;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  return null;
}

/**
 * Ambient wash gradient, matching the design's formula
 * (`radial-gradient(ellipse 120% 70% at 30% 0%, <color>, transparent 62%)`).
 * Kept subtle on purpose (§5.3 of the plan) — this is ambient tinting, not a
 * full accent-color takeover; the app still has exactly one fixed accent.
 */
function gradientFor(color: string): string | null {
  const washed = washFrom(color, 0.32);
  if (!washed) return null;
  return `radial-gradient(ellipse 120% 70% at 30% 0%, ${washed}, transparent 62%)`;
}

/**
 * Call from a detail or player page with the resolved backdrop's
 * `dominantColor`. Pass `null`/`undefined` (or don't call it at all) to leave
 * the neutral default in place — e.g. while `useExtractColors` is loading or
 * has errored; never let a broken extraction paint a broken style.
 *
 * Resets to the neutral default on unmount, so navigating away from a
 * tinted page doesn't leave a stale wash behind.
 */
export function useSetAmbient(color: string | null | undefined): void {
  const { setAmbient } = useAmbientContext();

  useEffect(() => {
    if (!color) {
      setAmbient(null);
      return;
    }
    const gradient = gradientFor(color);
    setAmbient(gradient);
  }, [color, setAmbient]);

  useEffect(() => () => setAmbient(null), [setAmbient]);
}

/**
 * The visual pair. Mount once, high in the tree, inside the app shell's
 * `position: relative` root — see the file header for why placement matters.
 */
export function AmbientLayers() {
  const { ambient } = useAmbientContext();
  const reduceMotion = useReducedMotionSafe();

  return (
    <>
      {/* `-z-10` is load-bearing, not decorative: `<main>` and the nav rail/
          dock are plain static-flow boxes, and per CSS2.1 painting order a
          `position: absolute` box with `z-index: auto` paints ABOVE
          non-positioned in-flow content regardless of DOM order. Without an
          explicit negative z-index these layers would cover real UI instead
          of sitting behind it. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: ambient ?? "transparent",
          transition: reduceMotion ? "none" : "background 800ms cubic-bezier(0.22,1,0.36,1)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background: "linear-gradient(180deg, rgba(10,9,13,.24), rgba(10,9,13,.88) 58%, #0a090d 88%)",
        }}
      />
    </>
  );
}
