"use client";

import { tmdbBrowser } from "@/api/tmdb-browser";
import MediaRow, { type MediaRowProps } from "@/components/media/MediaRow";
import Recommended from "@/components/sections/Home/Recommended";
import RegionalDiscoveryRows from "@/components/sections/Home/RegionalDiscoveryRows";
import { cn } from "@/utils/helpers";
import Link from "next/link";
import type { Movie, TV } from "tmdb-ts/dist/types";

interface PagedResult<T> {
  page: number;
  results: T[];
  total_results: number;
  total_pages: number;
}

const ROWS = [
  {
    kind: "movie",
    name: "Trending now",
    param: "todayTrending",
    query: () => tmdbBrowser.trending.trending<PagedResult<Movie>>("movie", "day"),
  },
  {
    kind: "movie",
    name: "Popular on StreamFree",
    param: "popular",
    query: () => tmdbBrowser.movies.popular<PagedResult<Movie>>(),
  },
  {
    kind: "tv",
    name: "Binge-worthy series",
    param: "popular",
    query: () => tmdbBrowser.tvShows.popular<PagedResult<TV>>(),
  },
  {
    kind: "movie",
    name: "Fresh movie releases",
    param: "nowPlaying",
    query: () => tmdbBrowser.movies.nowPlaying<PagedResult<Movie>>(),
  },
  {
    kind: "tv",
    name: "Top-rated shows",
    param: "topRated",
    query: () => tmdbBrowser.tvShows.topRated<PagedResult<TV>>(),
  },
] satisfies MediaRowProps[];

interface HomeDiscoveryFeedProps {
  idPrefix: "phone" | "desktop";
  variant: "phone" | "desktop";
}

export default function HomeDiscoveryFeed({ idPrefix, variant }: HomeDiscoveryFeedProps) {
  const topId = `${idPrefix}-home-top`;

  return (
    <section
      aria-labelledby={`${idPrefix}-discovery-heading`}
      className={cn("flex flex-col gap-8", variant === "phone" ? "px-5" : "px-12")}
    >
      <div className="flex flex-col gap-4 rounded-[22px] border border-white/9 bg-white/[0.035] p-5 sm:flex-row sm:items-end sm:justify-between md:p-6">
        <div className="max-w-xl">
          <p className="text-[10px] font-semibold tracking-[0.2em] text-violet-200 uppercase">
            Explore more
          </p>
          <h2
            id={`${idPrefix}-discovery-heading`}
            className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-white md:text-3xl"
          >
            Find something worth pressing play on.
          </h2>
          <p className="mt-2 text-sm leading-6 text-white/70">
            Fresh regional lists for movies and series, with personal picks that improve as you
            watch when you sign in.
          </p>
        </div>
        <Link
          href="/discover"
          className="inline-flex w-fit items-center rounded-full border border-white/14 bg-white/8 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-white/14 focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
        >
          Browse everything
        </Link>
      </div>

      <nav aria-label="Jump to a home section" className="-mt-3 flex gap-2 overflow-x-auto pb-1">
        {[
          ["For you / trending", `#${idPrefix}-recommendations`],
          ["Trending", `#${idPrefix}-trending-now-movie-row`],
          ["Movies", `#${idPrefix}-popular-on-streamfree-movie-row`],
          ["Series", `#${idPrefix}-binge-worthy-series-tv-row`],
        ].map(([label, href]) => (
          <a
            key={href}
            href={href}
            className="shrink-0 rounded-full border border-white/10 bg-black/25 px-3.5 py-2 text-xs font-medium text-white/75 transition-colors hover:border-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
          >
            {label}
          </a>
        ))}
      </nav>

      <div className="flex flex-col gap-8 md:gap-10">
        <Recommended id={`${idPrefix}-recommendations`} title="Picked for you" />
        <RegionalDiscoveryRows idPrefix={idPrefix} />
        {ROWS.map((row) => (
          <MediaRow key={`${row.kind}-${row.param}`} {...row} idPrefix={idPrefix} />
        ))}
      </div>

      <a
        href={`#${topId}`}
        className="ml-auto inline-flex w-fit items-center gap-2 rounded-full px-3 py-2 text-xs font-medium text-white/70 transition-colors hover:text-white focus-visible:ring-2 focus-visible:ring-violet-300/70 focus-visible:outline-none"
      >
        Back to top <span aria-hidden="true">&uarr;</span>
      </a>
    </section>
  );
}
