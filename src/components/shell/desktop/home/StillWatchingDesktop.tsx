"use client";

/**
 * Section 01, "Still watching" (DESKTOP_SPEC.md §G) — continue-watching items
 * *after* whichever one `useHomeHero` already promoted to the hero above.
 * Same query key as `useHomeHero`/`ContinueWatching.tsx`, so this is a cache
 * hit rather than a second network round trip.
 *
 * Built bespoke rather than on top of `<PosterCard>`/`<Shelf>`: this card
 * carries a corner progress ring sitting on the art (§G's "01" table), which
 * neither of those renders, and the fixed 172px/48px-gutter geometry here is
 * this build's own, not Shelf's responsive 132-172px rail.
 */

import EclipseRing from "@/components/media/EclipseRing";
import { getUserHistories } from "@/actions/histories";
import { useCustomCarousel } from "@/hooks/useCustomCarousel";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import type { HistoryDetail } from "@/types/movie";
import { cn } from "@/utils/helpers";
import { formatTimeLeft, getImageUrl } from "@/utils/movies";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import SectionHeader from "./SectionHeader";
import ShelfArrows from "./ShelfArrows";

const MAX_ITEMS = 5;

/** Mirrors `ResumeCard.tsx`'s own redirect convention — resuming plays
 *  straight back in, at the saved position. */
function playHrefFor(item: HistoryDetail): string {
  if (item.type === "movie") return `/movie/${item.media_id}/player`;
  if (item.type === "tv") return `/tv/${item.media_id}/${item.season}/${item.episode}/player`;
  return `/anime/${item.media_id}/player/${item.episode || 1}`;
}

export default function StillWatchingDesktop() {
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();

  const { data } = useQuery({
    queryKey: ["continue-watching", user?.id],
    queryFn: () => getUserHistories(),
    enabled: !isUserLoading,
  });

  const histories = data?.success ? data.data ?? [] : [];
  // Index 0 is already the hero above — this rail picks up where it leaves off.
  const items = histories.slice(1, 1 + MAX_ITEMS);

  const { emblaRef, scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCustomCarousel({
    align: "start",
    slidesToScroll: "auto",
    containScroll: "trimSnaps",
  });

  // Fewer than two items total means the hero already shows the only one —
  // an orphan header with nothing under it is worse than no section at all.
  if (histories.length < 2) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader number="01" label="Still watching" />
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-4 px-12 pb-1.5">
            {items.map((item) => (
              <Link
                key={item.id}
                href={playHrefFor(item)}
                prefetch={false}
                className="group flex w-[172px] flex-none flex-col gap-2.5 focus:outline-hidden"
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
                <div className="flex flex-col gap-0.5">
                  <p className="truncate text-[13px] leading-[1.3] font-medium text-white">
                    {item.title}
                  </p>
                  <p className="truncate text-[11px] text-white/40">
                    {formatTimeLeft(item.last_position, item.duration)}
                  </p>
                </div>
              </Link>
            ))}
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
