/**
 * The eclipse progress ring — the brand signature (Phase 1,
 * `docs/design/PHONE_SPEC.md` §D). Progress is a filling ring everywhere it
 * appears, not a bar: continue-watching art, countdown timers, season
 * trackers. The logomark is the same geometry — two overlapping circles with
 * a filled crescent — so the ring reads as the brand mark repeated.
 *
 * SVG two-circle `stroke-dasharray`/`stroke-dashoffset`, not a conic-gradient
 * and not canvas: a full-circumference track circle, then an identical
 * circle carrying the accent stroke, `stroke-linecap="round"`, rotated -90deg
 * about its own center so 0% starts at 12 o'clock and fills clockwise.
 *
 * Three sizes are used in the design (50 / 26 / 64px) but this component
 * takes `size` directly rather than a named variant — the derived rule below
 * holds at any size, and a fourth size will exist eventually.
 *
 * Three linear progress forms coexist elsewhere and are correct to keep: the
 * episode-thumbnail bar, the anime tick strip, and the player scrubber. This
 * ring is not a universal replacement for progress UI — it is the one used
 * for continue-watching art, countdown timers, and season trackers
 * specifically.
 */

import { cn } from "@/utils/helpers";

export interface EclipseRingProps {
  /** Outer diameter in px. The design uses 50 (hero), 26 (poster corner), and 64 (countdown). */
  size: number;
  /** 0–100. Values outside that range are clamped. */
  percent: number;
  /** Centered label inside the ring, e.g. a "31%" text or a two-line day/hour countdown. Omit for no label (the 26px poster-corner ring has none). */
  label?: React.ReactNode;
  /** Opaque backing disc behind the track, so the ring reads over busy art (the 26px poster-corner usage). Omit elsewhere. */
  withBacking?: boolean;
  className?: string;
}

/**
 * `r = size/2 − strokeWidth/2 − 0.5`, `strokeWidth` scaling gently with size.
 * Verified against the three design sizes: 50→r22/sw2.5, 26→r11/sw2, 64→r28/sw3.
 */
function strokeWidthFor(size: number): number {
  if (size <= 30) return 2;
  if (size <= 56) return 2.5;
  return 3;
}

export default function EclipseRing({
  size,
  percent,
  label,
  withBacking,
  className,
}: EclipseRingProps) {
  const clamped = Math.min(100, Math.max(0, percent));
  const strokeWidth = strokeWidthFor(size);
  const radius = size / 2 - strokeWidth / 2 - 0.5;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div className={cn("relative flex-none", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
        {withBacking && <circle cx={center} cy={center} r={radius} fill="rgba(0,0,0,.55)" />}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,.15)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          className="stroke-accent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
        />
      </svg>
      {label !== undefined && (
        <div className="absolute inset-0 flex items-center justify-center text-white">{label}</div>
      )}
    </div>
  );
}
