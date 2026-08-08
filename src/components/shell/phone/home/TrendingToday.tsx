"use client";

/**
 * `PHONE_SPEC.md` §G "05 — Trending today" — the one rail with "art
 * unveiled": no scrim, no ring, no badge. `PosterCard.tsx` still paints a
 * permanent bottom scrim on every card (removing that is separate, shared
 * work `SONNET_IMPLEMENTATION_PLAN.md` §8 calls out but does not assign
 * here), so this section renders its own minimal card instead of inheriting
 * a treatment the spec explicitly calls wrong for this rail.
 *
 * Shares `Hero.tsx`'s `["hero-trending"]` query key — one fetch serves both.
 */

import Link from "next/link";
import { useMemo } from "react";
import { tmdbBrowser } from "@/api/tmdb-browser";
import type { MediaSummary } from "@/types/media";
import { isEmpty } from "@/utils/helpers";
import { fromMovie, fromTvShow } from "@/utils/normalize-media";
import { useQuery } from "@tanstack/react-query";
import type { Movie, TV } from "tmdb-ts/dist/types";
import SectionHeader from "./SectionHeader";

const MAX_ITEMS = 6;
const SKELETON_COUNT = 4;

type TrendingEntry =
  | (Movie & { media_type: "movie" })
  | (TV & { media_type: "tv" })
  | { media_type: "person"; id: number };

interface TrendingPage {
  results: TrendingEntry[];
}

export default function TrendingToday() {
  const { data, isPending } = useQuery({
    queryKey: ["hero-trending"],
    queryFn: () => tmdbBrowser.trending.trending<TrendingPage>("all", "day"),
    staleTime: 30 * 60 * 1000,
  });

  const items = useMemo<MediaSummary[]>(() => {
    const out: MediaSummary[] = [];
    for (const entry of data?.results ?? []) {
      if (entry.media_type === "person") continue;
      const media = entry.media_type === "movie" ? fromMovie(entry) : fromTvShow(entry);
      if (isEmpty(media.posterUrl) || media.isAdult) continue;
      out.push(media);
      if (out.length >= MAX_ITEMS) break;
    }
    return out;
  }, [data]);

  if (!isPending && items.length === 0) return null;

  return (
    <div className="flex flex-col gap-[15px]">
      <SectionHeader number="05" label="Trending today" action={{ label: "All", href: "/browse" }} />
      <div className="flex gap-[12px] overflow-x-auto px-5 pb-1">
        {isPending
          ? Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <div
                key={`trending-skeleton-${i}`}
                className="flex w-[118px] flex-none flex-col gap-[9px]"
                aria-hidden="true"
              >
                <div className="aspect-2/3 w-[118px] animate-pulse rounded-[11px] bg-white/8" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-white/8" />
                <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/8" />
              </div>
            ))
          : items.map((media) => (
              <Link
                key={`${media.kind}-${media.id}`}
                href={media.href}
                aria-label={media.title}
                className="group flex w-[118px] flex-none flex-col gap-[9px] rounded-[11px] focus-visible:outline-none"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={media.posterUrl}
                  alt=""
                  aria-hidden="true"
                  loading="lazy"
                  decoding="async"
                  className="aspect-2/3 w-[118px] rounded-[11px] object-cover shadow-[0_12px_28px_-14px_rgba(0,0,0,.9)] ring-1 ring-white/0 transition-shadow group-focus-visible:ring-2 group-focus-visible:ring-white/70"
                />
                <div className="flex flex-col gap-0.5">
                  <p className="m-0 line-clamp-2 text-[12px] leading-[1.28] font-medium text-white">
                    {media.title}
                  </p>
                  <p className="m-0 text-[10px] text-white/36">
                    {media.kind === "tv" ? "Series" : "Movie"}
                    {media.year !== undefined ? ` · ${media.year}` : ""}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
