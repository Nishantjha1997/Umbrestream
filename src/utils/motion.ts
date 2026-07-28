import { useReducedMotion, type Transition } from "motion/react";

/**
 * The shared motion vocabulary (§4).
 *
 * ── Why this file duplicates values that already exist in CSS ──────────────
 *
 * `src/styles/globals.css` defines `--duration-*` and `--ease-*` inside
 * `@theme`, and those tokens are the source of truth for anything animated by
 * CSS (Tailwind `duration-(--duration-base)`, `@utility shelf-reveal`, plain
 * `transition`).
 *
 * JavaScript animation cannot read them. A CSS custom property is a *string*
 * resolved by the style engine at paint time; Motion needs a `number` of
 * seconds and a numeric bezier tuple before the first frame, and it writes
 * values straight to the compositor without going through the cascade at all.
 * Reading them back with `getComputedStyle()` would cost a synchronous layout
 * on mount, per component, to recover constants we already know.
 *
 * So the values are mirrored here — *mirrored*, not re-invented. Every export
 * below names the CSS token it corresponds to.
 *
 * **If you change a duration or easing token in `globals.css`, change it here
 * too, and vice versa.** They are one design decision expressed twice because
 * two engines need it, and a drift between them shows up as a hover that
 * settles at a different moment than the element next to it.
 *
 * ── Scope ──────────────────────────────────────────────────────────────────
 *
 * This module has no `"use client"` directive on purpose: the constants are
 * plain data and must stay importable from Server Components (a `"use client"`
 * module hands back client references, not values). Only
 * {@link useReducedMotionSafe} is client-only, and hooks can only be called
 * from Client Components anyway.
 */

/* ───────────────────────────────────────────────────────────────────────────
   Durations.

   Motion takes seconds; CSS takes milliseconds. Same scale, converted.
   Pick by intent, not by feel: anything responding to direct input should be
   `fast` or quicker.
   ─────────────────────────────────────────────────────────────────────────── */

/** Seconds. Mirrors the `--duration-*` tokens in `globals.css`. */
export const duration = {
  /** 100ms — `--duration-instant`. State flips that should read as immediate. */
  instant: 0.1,
  /** 180ms — `--duration-fast`. Hover and press feedback. */
  fast: 0.18,
  /** 280ms — `--duration-base`. Most transitions. */
  base: 0.28,
  /** 450ms — `--duration-slow`. Panels, drawers, shelf reveals. */
  slow: 0.45,
  /** 800ms — `--duration-cinematic`. Hero art, page-level entrances. */
  cinematic: 0.8,
} as const;

/**
 * The same scale in milliseconds, for the rare JS caller that needs a
 * `setTimeout` or a Web Animations delay to line up with a CSS transition.
 */
export const durationMs = {
  instant: 100,
  fast: 180,
  base: 280,
  slow: 450,
  cinematic: 800,
} as const;

/* ───────────────────────────────────────────────────────────────────────────
   Easing.

   Bezier tuples, mirroring the `cubic-bezier()` values of the `--ease-*`
   tokens. Motion types these as `readonly [number, number, number, number]`,
   so `as const` is what it wants — not a mutable array.
   ─────────────────────────────────────────────────────────────────────────── */

/** `--ease-out-quint`. Decelerate. The default for anything entering or responding to input. */
export const easeOut = [0.22, 1, 0.36, 1] as const;

/** `--ease-in-quint`. Accelerate. Exits only — an element leaving should get out of the way. */
export const easeIn = [0.64, 0, 0.78, 0] as const;

/** `--ease-in-out-quint`. For a move that both starts and ends on screen. */
export const easeInOut = [0.83, 0, 0.17, 1] as const;

/**
 * `--ease-spring`. Slight overshoot, for press releases and card lifts.
 * Used broadly it reads bouncy rather than precise — prefer {@link spring}
 * for anything interruptible.
 */
export const easeOvershoot = [0.34, 1.56, 0.64, 1] as const;

/* ───────────────────────────────────────────────────────────────────────────
   Springs.

   Springs have no CSS equivalent, so these live here alone. Prefer them over
   a fixed duration for anything the user can interrupt mid-flight (hover in,
   hover out before it settles, drag): a spring re-targets from its current
   velocity, a tween restarts.
   ─────────────────────────────────────────────────────────────────────────── */

/** Crisp and quick. Card hover lifts, button presses, active-indicator slides. */
export const spring = { type: "spring", stiffness: 380, damping: 30 } as const;

/** Looser and heavier. Larger surfaces — panels, drawers, hero elements. */
export const springSoft = { type: "spring", stiffness: 220, damping: 28 } as const;

/* ───────────────────────────────────────────────────────────────────────────
   Ready-made transitions.

   Reach for these before writing an inline `{ duration, ease }` object. If a
   component needs something not in this list, add it here rather than inlining
   it — the point of the module is that there is exactly one place to look.
   ─────────────────────────────────────────────────────────────────────────── */
export const transition = {
  instant: { duration: duration.instant, ease: easeOut },
  fast: { duration: duration.fast, ease: easeOut },
  base: { duration: duration.base, ease: easeOut },
  slow: { duration: duration.slow, ease: easeOut },
  cinematic: { duration: duration.cinematic, ease: easeOut },
  /** Exits accelerate out. Shorter than the matching entrance on purpose. */
  exit: { duration: duration.fast, ease: easeIn },
} as const satisfies Record<string, Transition>;

/**
 * A transition that completes in one frame.
 *
 * This is the reduced-motion escape hatch. It is deliberately *not*
 * `{ duration: 0 }` on the animation being removed — the element still travels
 * to its final state, it just gets there instantly, so nothing ends up stuck
 * at its `initial` values when motion is off.
 */
export const noTransition: Transition = { duration: 0 };

/* ───────────────────────────────────────────────────────────────────────────
   Reduced motion.
   ─────────────────────────────────────────────────────────────────────────── */

/**
 * `prefers-reduced-motion` as a plain boolean.
 *
 * Motion's own `useReducedMotion()` returns `boolean | null` — `null` before
 * the media query has been read, which is easy to mishandle: `null` is falsy,
 * so a naive `if (prefersReduced)` silently animates for one render. This
 * collapses the unknown state to `false` in one place so callers can branch on
 * a real boolean, and gives every component a single import to reach for
 * instead of re-deriving the gate.
 *
 * Client Components only.
 *
 * @example
 * const reduceMotion = useReducedMotionSafe();
 * <motion.div transition={reduceMotion ? noTransition : transition.base} />
 */
export function useReducedMotionSafe(): boolean {
  return useReducedMotion() ?? false;
}
