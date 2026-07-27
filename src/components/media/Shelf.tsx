"use client";

import PosterCard from "@/components/media/PosterCard";
import PosterCardSkeleton from "@/components/ui/other/PosterCardSkeleton";
import { useCustomCarousel } from "@/hooks/useCustomCarousel";
import type { MediaSummary } from "@/types/media";
import { cn } from "@/utils/helpers";
import { ChevronLeft, ChevronRight } from "@/utils/icons";
import { Button, Link, Skeleton } from "@heroui/react";

/**
 * The one horizontal media row.
 *
 * Replaces {Movie,TV,Anime}/HomeList.tsx. Purely presentational — fetching
 * lives in <MediaRow>, which keeps the row-config `query` closures inside the
 * client boundary (passing them through a Server Component fails the build
 * with "Functions cannot be passed directly to Client Components").
 *
 * What changed (§2.3 / §11):
 *
 * - Snap is on. The rows were `{ dragFree: true }`, so a drag came to rest
 *   wherever momentum died — usually with a half-poster dangling at the edge.
 *   `containScroll: "trimSnaps"` also stops the row over-scrolling past the
 *   last full page.
 * - The loading state is per-card, not one grey slab spanning the row, and it
 *   reserves the same widths and gaps as the loaded state so the header no
 *   longer jumps when data lands (skeleton used gap-5, loaded used gap-2).
 * - Arrows cross-fade instead of mounting/unmounting, over a gradient scrim so
 *   they aren't sitting naked on top of artwork.
 * - There is an error state. A failing TMDB proxy used to leave the row on an
 *   eternal skeleton, which reads as "very slow" rather than "broken".
 * - The header is plain type. SectionTitle renders a left accent bar (a
 *   dashboard motif) and emits <h1> regardless of its size prop, so every
 *   shelf title on the home page was an h1 (§11.6).
 */

export interface ShelfProps {
  title: string;
  items: MediaSummary[];
  isLoading: boolean;
  /** Renders the failure notice instead of an eternal skeleton. */
  isError?: boolean;
  onRetry?: () => void;
  seeAllHref?: string;
  priority?: boolean;
}

const SKELETON_COUNT = 6;

/**
 * One slide width, shared by the skeleton and loaded states so nothing
 * reflows between them. The horizontal padding is what gives the hovered
 * card's scale(1.04) somewhere to grow into without being clipped.
 */
const SLIDE = "w-[132px] shrink-0 grow-0 px-1 pt-1 pb-3 sm:w-[146px] md:w-[162px] lg:w-[172px]";

const EMBLA_OPTIONS = {
  align: "start",
  slidesToScroll: "auto",
  containScroll: "trimSnaps",
} as const;

const Shelf: React.FC<ShelfProps> = ({
  title,
  items,
  isLoading,
  isError,
  onRetry,
  seeAllHref,
  priority,
}) => {
  const { emblaRef, scrollPrev, scrollNext, canScrollPrev, canScrollNext } =
    useCustomCarousel(EMBLA_OPTIONS);

  // Nothing to show and nothing on the way — don't leave an orphan header.
  if (!isLoading && !isError && items.length === 0) return null;

  return (
    <section className="flex w-full flex-col gap-3">
      <div className="flex h-7 items-center justify-between gap-4 md:h-8">
        {isLoading ? (
          <Skeleton className="h-5 w-44 rounded-full md:h-6" />
        ) : (
          <h2 className="text-lg font-semibold tracking-tight md:text-xl">{title}</h2>
        )}
        {seeAllHref &&
          (isLoading ? (
            <Skeleton className="h-4 w-16 shrink-0 rounded-full" />
          ) : (
            <Link
              href={seeAllHref}
              size="sm"
              color="foreground"
              className="text-default-500 hover:text-foreground shrink-0 rounded-full text-sm transition-colors duration-(--duration-fast)"
            >
              See All &gt;
            </Link>
          ))}
      </div>

      {isError ? (
        <div className="glass-panel flex flex-col items-start gap-3 rounded-(--radius-panel) border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">Unable to load this row</p>
            <p className="text-default-500 text-xs">
              The service did not respond. Nothing is still loading behind this.
            </p>
          </div>
          {onRetry && (
            <Button size="sm" variant="flat" radius="full" onPress={onRetry} className="shrink-0">
              Try again
            </Button>
          )}
        </div>
      ) : isLoading ? (
        <div className="flex overflow-hidden" aria-hidden="true">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <div key={`shelf-skeleton-${i}`} className={SLIDE}>
              <PosterCardSkeleton />
            </div>
          ))}
        </div>
      ) : (
        <div className="relative">
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex touch-pan-y">
              {items.map((media, i) => (
                <div key={`${media.kind}-${media.id}`} className={SLIDE}>
                  <PosterCard
                    media={media}
                    variant="rail"
                    index={i}
                    priority={priority && i < 4}
                  />
                </div>
              ))}
            </div>
          </div>

          <ShelfArrow side="left" visible={canScrollPrev} onPress={scrollPrev} title={title} />
          <ShelfArrow side="right" visible={canScrollNext} onPress={scrollNext} title={title} />
        </div>
      )}
    </section>
  );
};

interface ShelfArrowProps {
  side: "left" | "right";
  visible: boolean;
  onPress: () => void;
  title: string;
}

const ShelfArrow: React.FC<ShelfArrowProps> = ({ side, visible, onPress, title }) => (
  <div
    className={cn(
      "absolute inset-y-0 z-10 hidden w-16 items-center transition-opacity md:flex",
      "duration-(--duration-base) ease-(--ease-out-quint)",
      side === "left" ? "left-0 justify-start" : "right-0 justify-end",
      // Fade rather than mount/unmount, and stay out of the way of pointer
      // events on the posters underneath while hidden.
      visible ? "opacity-100" : "pointer-events-none opacity-0",
    )}
  >
    <div
      aria-hidden="true"
      className={cn(
        "from-background/95 pointer-events-none absolute inset-0 to-transparent",
        side === "left" ? "bg-linear-to-r" : "bg-linear-to-l",
      )}
    />
    <button
      type="button"
      onClick={onPress}
      tabIndex={visible ? 0 : -1}
      aria-label={`Scroll ${title} ${side === "left" ? "left" : "right"}`}
      className={cn(
        "glass-control relative flex size-9 items-center justify-center rounded-full border",
        "transition-transform duration-(--duration-fast) ease-(--ease-out-quint)",
        "hover:scale-105 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-hidden",
        side === "left" ? "ml-1" : "mr-1",
      )}
    >
      {side === "left" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
    </button>
  </div>
);

export default Shelf;
