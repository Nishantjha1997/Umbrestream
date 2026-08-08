"use client";

/**
 * Section 05, "Trending today" (DESKTOP_SPEC.md §G) — same card geometry as
 * 01, minus the progress ring, plus a desktop-only hover play circle.
 *
 * Not built on `<PosterCard>`/`<Shelf>`: §G's shared shelf-pattern rule for
 * Home is "titles sit BELOW the art, always — no title-on-poster anywhere in
 * the build," but `PosterCard` keeps title/year/rating in an overlay on the
 * art itself (by design, for Discover/Search grids). Reusing it here would
 * import that mismatch into the one place the spec is explicit about it, so
 * this rail gets its own bespoke card instead — sharing only the shelf-arrow
 * recipe with 01/03.
 */

import { tmdbBrowser } from "@/api/tmdb-browser";
import type { MediaSummary } from "@/types/media";
import { useCustomCarousel } from "@/hooks/useCustomCarousel";
import { cn, isEmpty } from "@/utils/helpers";
import { PlayFilled } from "@/utils/icons";
import { fromMovie, fromTvShow } from "@/utils/normalize-media";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useMemo } from "react";
import type { Movie, TV } from "tmdb-ts/dist/types";
import SectionHeader from "./SectionHeader";
import ShelfArrows from "./ShelfArrows";

/** Mirrors `Hero.tsx`'s own `TrendingEntry` — `trending/all/day` returns
 *  movies, shows and people in one list, discriminated by `media_type`. */
type TrendingEntry =
  | (Movie & { media_type: "movie" })
  | (TV & { media_type: "tv" })
  | { media_type: "person"; id: number };

interface TrendingPage {
  results: TrendingEntry[];
}

const MAX_ITEMS = 8;

export default function TrendingTodayDesktop() {
  // Same query key `useHomeHero`'s trending leg uses — a cache hit, not a
  // second request, on whichever of the two mounts second.
  const { data } = useQuery({
    queryKey: ["hero-trending"],
    queryFn: () => tmdbBrowser.trending.trending<TrendingPage>("all", "day"),
    staleTime: 30 * 60 * 1000,
  });

  const items = useMemo<MediaSummary[]>(() => {
    const out: MediaSummary[] = [];
    for (const entry of data?.results ?? []) {
      if (entry.media_type === "person") continue;
      const media = entry.media_type === "movie" ? fromMovie(entry) : fromTvShow(entry);
      if (media.isAdult || isEmpty(media.posterUrl)) continue;
      out.push(media);
      if (out.length >= MAX_ITEMS) break;
    }
    return out;
  }, [data]);

  const { emblaRef, scrollPrev, scrollNext, canScrollPrev, canScrollNext } = useCustomCarousel({
    align: "start",
    slidesToScroll: "auto",
    containScroll: "trimSnaps",
  });

  if (items.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader number="05" label="Trending today" action={{ label: "All", href: "/browse" }} />
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex gap-3.5 px-12 pb-1.5">
            {items.map((media) => (
              <Link
                key={`${media.kind}-${media.id}`}
                href={media.href}
                prefetch={false}
                className="group flex w-[172px] flex-none flex-col gap-[9px] focus:outline-hidden"
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
                    src={media.posterUrl}
                    alt=""
                    aria-hidden="true"
                    draggable={false}
                    loading="lazy"
                    decoding="async"
                    className="size-full object-cover object-center"
                  />
                  {/* Desktop-only hover affordance — no touch equivalent, and
                      none needed since a tap navigates directly. */}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "pointer-events-none absolute inset-0 flex items-center justify-center opacity-0",
                      "transition-opacity duration-[180ms] ease-(--ease-out-quint)",
                      "group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none",
                    )}
                  >
                    <span className="flex size-[46px] items-center justify-center rounded-full border border-white/30 bg-black/42 backdrop-blur-md">
                      <PlayFilled size={15} className="ml-0.5 text-white" aria-hidden="true" />
                    </span>
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="truncate text-[13px] leading-[1.3] font-medium text-white">
                    {media.title}
                  </p>
                  {(media.year !== undefined || (media.rating !== undefined && media.rating > 0)) && (
                    <p className="flex items-center gap-1.5 text-[11px] text-white/38">
                      {media.year !== undefined && <span>{media.year}</span>}
                      {media.year !== undefined && media.rating !== undefined && media.rating > 0 && (
                        <span aria-hidden="true">&#8226;</span>
                      )}
                      {media.rating !== undefined && media.rating > 0 && (
                        <span>{media.rating.toFixed(1)}</span>
                      )}
                    </p>
                  )}
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
          label="Trending today"
        />
      </div>
    </section>
  );
}
