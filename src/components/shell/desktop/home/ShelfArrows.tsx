"use client";

/**
 * Edge arrow controls, shared by the three full-bleed rails (01/03/05).
 *
 * The mock ships none of these — DESKTOP_SPEC.md §G calls it the single
 * biggest desktop gap: a mouse wheel does not turn into horizontal scroll on
 * an `overflow-x` container by itself, and the only affordance in the mock is
 * a styled webkit scrollbar. `Shelf.tsx` already solved this exact problem
 * with its own unexported `ShelfArrow`, but it isn't exported and its width
 * math targets Shelf's responsive 132-172px card, not this build's fixed
 * 172px — so the recipe is replicated here rather than imported.
 *
 * Visuals match the spec's own pointer: "style them... i.e. the hero
 * search-pill recipe" — `DesktopHeader.tsx`'s `⌘K` pill, verified against
 * this file rather than re-deriving the alpha values by eye.
 */

import { cn } from "@/utils/helpers";
import { ChevronLeft, ChevronRight } from "@/utils/icons";

export interface ShelfArrowsProps {
  canScrollPrev: boolean;
  canScrollNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  /** Rail name, for the accessible label only. */
  label: string;
}

export default function ShelfArrows({
  canScrollPrev,
  canScrollNext,
  onPrev,
  onNext,
  label,
}: ShelfArrowsProps) {
  return (
    <>
      <ShelfArrow side="left" visible={canScrollPrev} onPress={onPrev} label={label} />
      <ShelfArrow side="right" visible={canScrollNext} onPress={onNext} label={label} />
    </>
  );
}

interface ShelfArrowProps {
  side: "left" | "right";
  visible: boolean;
  onPress: () => void;
  label: string;
}

function ShelfArrow({ side, visible, onPress, label }: ShelfArrowProps) {
  return (
    <div
      className={cn(
        "absolute inset-y-0 z-10 flex w-16 items-center transition-opacity",
        "duration-(--duration-base) ease-(--ease-out-quint) motion-reduce:transition-none",
        side === "left" ? "left-0 justify-start pl-2" : "right-0 justify-end pr-2",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0",
          side === "left"
            ? "bg-linear-to-r from-black/45 to-transparent"
            : "bg-linear-to-l from-black/45 to-transparent",
        )}
      />
      <button
        type="button"
        onClick={onPress}
        tabIndex={visible ? 0 : -1}
        aria-label={`Scroll ${label} ${side === "left" ? "left" : "right"}`}
        style={{
          backdropFilter: "blur(16px) saturate(var(--glass-saturate))",
          WebkitBackdropFilter: "blur(16px) saturate(var(--glass-saturate))",
        }}
        className={cn(
          "relative flex size-[38px] items-center justify-center rounded-full border border-white/14 bg-black/36 text-white",
          "transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:transition-none",
          "hover:bg-black/45 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-white/70",
        )}
      >
        {side === "left" ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </div>
  );
}
