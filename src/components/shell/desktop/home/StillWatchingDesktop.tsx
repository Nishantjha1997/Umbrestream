"use client";

/**
 * Section 01, "Still watching" (DESKTOP_SPEC.md §G) — completed titles
 * filtered out, then the title (if any) that `useHomeHero` promoted to the
 * hero above is removed by identity. Same query key as
 * `useHomeHero`, so this is a cache hit rather than a second network round
 * trip.
 *
 * Built bespoke rather than on top of `<PosterCard>`/`<Shelf>`: this card
 * carries a corner progress ring sitting on the art (§G's "01" table), which
 * neither of those renders, and the fixed 172px/48px-gutter geometry here is
 * this build's own, not Shelf's responsive 132-172px rail.
 */

import EclipseRing from "@/components/media/EclipseRing";
import HistoryItemActions from "@/components/ui/button/HistoryItemActions";
import InlineRetry from "@/components/ui/feedback/InlineRetry";
import useContinueWatching from "@/hooks/useContinueWatching";
import { useHomeHero } from "@/hooks/useHomeHero";
import { useCustomCarousel } from "@/hooks/useCustomCarousel";
import type { HistoryDetail } from "@/types/movie";
import type { MediaKind } from "@/types/media";
import { cn } from "@/utils/helpers";
import { formatTimeLeft, getImageUrl } from "@/utils/movies";
import Link from "next/link";
import { useInViewport } from "@mantine/hooks";
import { useEffect } from "react";
import SectionHeader from "./SectionHeader";
import ShelfArrows from "./ShelfArrows";

/** Mirrors `ResumeCard.tsx`'s own redirect convention — resuming plays
 *  straight back in, at the saved position. */
function playHrefFor(item: HistoryDetail): string {
  if (item.type === "movie") return `/movie/${item.media_id}/player`;
  if (item.type === "tv") return `/tv/${item.media_id}/${item.season}/${item.episode}/player`;
  return `/anime/${item.media_id}/player/${item.episode || 1}`;
}

export default function StillWatchingDesktop() {
  const { ref, inViewport } = useInViewport<HTMLDivElement>();
  const {
    items: histories,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isError,
    refetch,
  } = useContinueWatching();
  const { pick } = useHomeHero();

  useEffect(() => {
    if (inViewport && hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, inViewport, isFetchingNextPage]);
  // Completed titles aren't "still watching". Remove the hero by identity, not
  // by position, so a trending hero cannot hide a real active title.
  const active = histories.filter((h) => !h.completed);
  const uniqueTitles = active.filter(
    (item, index, rows) =>
      rows.findIndex(
        (candidate) => candidate.type === item.type && candidate.media_id === item.media_id,
      ) === index,
  );
  const resumeKey = pick?.source === "resume" ? `${pick.media.kind}:${pick.media.id}` : null;
  const items = uniqueTitles.filter((item) => `${item.type}:${item.media_id}` !== resumeKey);

  const { emblaRef, scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCustomCarousel({
    align: "start",
    slidesToScroll: "auto",
    containScroll: "trimSnaps",
  });

  // Hide the rail only when the resume hero is the sole active title. If the
  // hero is trending/recommended, the first active title still belongs here.
  if (items.length === 0) {
    if (isError) {
      return (
        <div className="px-12">
          <InlineRetry
            message="Couldn't load continue watching."
            onRetry={() => void refetch()}
          />
        </div>
      );
    }
    return null;
  }

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader number="01" label="Continue watching" />
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 px-12 pb-1.5">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative flex w-[172px] flex-none flex-col gap-2.5"
              >
                <Link
                  href={playHrefFor(item)}
                  prefetch={false}
                  aria-label={`Resume ${item.title}`}
                  className="block rounded-[11px] focus:outline-hidden"
                >
                  <div
                    className={cn(
                      "relative aspect-2/3 w-full overflow-hidden rounded-[11px] shadow-[0_16px_34px_-16px_rgba(0,0,0,.9)]",
                      "ring-1 ring-white/0 transition-transform duration-200 ease-(--ease-out-quint) will-change-transform",
                      "group-hover:-translate-y-1.5 group-focus-visible:-translate-y-1.5 group-focus-visible:ring-2 group-focus-visible:ring-white/70",
                      "motion-reduce:transition-none motion-reduce:group-hover:translate-y-0",
                    )}
                  >
                    {/* Decorative: the title renders as real text below. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getImageUrl(item.poster_path || item.backdrop_path || "", "poster")}
                      alt=""
                      aria-hidden="true"
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      className="size-full object-cover object-center"
                    />
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%] bg-linear-to-t from-black/65 to-transparent"
                    />
                    <div className="absolute right-2 bottom-2">
                      <EclipseRing
                        size={30}
                        percent={item.duration > 0 ? (item.last_position / item.duration) * 100 : 0}
                        withBacking
                      />
                    </div>
                  </div>
                  <div className="flex flex-col gap-0.5 pt-2.5">
                    <p className="truncate text-[13px] leading-[1.3] font-medium text-white">
                      {item.title}
                    </p>
                    <p className="truncate text-[11px] text-white/70">
                      {formatTimeLeft(item.last_position, item.duration)}
                    </p>
                  </div>
                </Link>
                <HistoryItemActions
                  mediaId={item.media_id}
                  type={item.type as MediaKind}
                  season={item.season}
                  episode={item.episode}
                  title={item.title}
                  scope="title"
                  className="absolute top-2 right-2 z-30 flex gap-1"
                />
              </div>
            ))}
            <div ref={ref} className="h-1 w-1 flex-none" aria-hidden="true" />
          </div>
        </div>
        <ShelfArrows
          canScrollPrev={canScrollPrev}
          canScrollNext={canScrollNext}
          onPrev={scrollPrev}
          onNext={scrollNext}
          label="Still watching"
        />
      </div>
    </section>
  );
}
