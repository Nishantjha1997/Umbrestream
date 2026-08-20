"use client";

/**
 * `PHONE_SPEC.md` §G "04 — Next episode drops" — edge-to-edge divider list.
 * Reads the tv rows out of the same `["continue-watching", user?.id]` list
 * every other personal section uses, then asks TMDB for each show's
 * `next_episode_to_air` (a base field on tv details — no `append_to_response`
 * needed).
 *
 * TMDB only carries a calendar date, no time of day — the mock's "Fri
 * 23:30" is fabricated. The countdown here is day-granularity ("in 3 days" /
 * "tomorrow" / "today") and the date shown is real, parsed as a plain
 * calendar date rather than through `new Date(isoString)` so a viewer west
 * of UTC doesn't see the day before TMDB's own listing.
 */

import Link from "next/link";
import { useMemo } from "react";
import { differenceInCalendarDays, format } from "date-fns";
import { tmdbBrowser } from "@/api/tmdb-browser";
import useContinueWatching from "@/hooks/useContinueWatching";
import type { HistoryDetail } from "@/types/movie";
import { useQueries } from "@tanstack/react-query";
import SectionHeader from "./SectionHeader";

const MAX_TV_ROWS = 5;
const MAX_UPCOMING = 3;

function parseCalendarDate(isoDate: string): Date | undefined {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoDate);
  if (!match) return undefined;
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

function countdownLabel(days: number): string {
  if (days <= 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days} days`;
}

interface Upcoming {
  mediaId: number;
  title: string;
  season: number;
  episode: number;
  airDate: Date;
  days: number;
}

function DropsSkeleton() {
  return (
    <div className="flex flex-col gap-[15px]" aria-hidden="true">
      <SectionHeader number="04" label="Next episode drops" />
      <div className="flex flex-col">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between border-t border-white/7 px-5 py-[14px]"
          >
            <div className="flex flex-col gap-2">
              <div className="h-4 w-36 animate-pulse rounded-md bg-white/8" />
              <div className="h-3 w-24 animate-pulse rounded-md bg-white/8" />
            </div>
            <div className="h-6 w-12 animate-pulse rounded-md bg-white/8" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NextEpisodeDrops() {
  const { items: histories, isLoading } = useContinueWatching();

  const tvRows = useMemo<HistoryDetail[]>(
    () => histories.filter((h) => h.type === "tv").slice(0, MAX_TV_ROWS),
    [histories],
  );

  const detailQueries = useQueries({
    queries: tvRows.map((h) => ({
      queryKey: ["next-episode", h.media_id],
      queryFn: () => tmdbBrowser.tvShows.details<undefined>(h.media_id),
      staleTime: 60 * 60 * 1000,
    })),
  });

  const isQueriesLoading = tvRows.length > 0 && detailQueries.some((q) => q.isPending);

  const upcoming = useMemo<Upcoming[]>(() => {
    const now = new Date();
    const rows: Upcoming[] = [];

    tvRows.forEach((history, index) => {
      const next = detailQueries[index]?.data?.next_episode_to_air;
      if (!next?.air_date) return;

      const airDate = parseCalendarDate(next.air_date);
      if (!airDate) return;

      const days = differenceInCalendarDays(airDate, now);
      if (days < 0) return;

      rows.push({
        mediaId: history.media_id,
        title: history.title,
        season: next.season_number,
        episode: next.episode_number,
        airDate,
        days,
      });
    });

    return rows.sort((a, b) => a.days - b.days).slice(0, MAX_UPCOMING);
  }, [tvRows, detailQueries]);

  if (isLoading || isQueriesLoading) return <DropsSkeleton />;

  if (upcoming.length === 0) return null;

  return (
    <div className="flex flex-col gap-[15px]">
      <SectionHeader number="04" label="Next episode drops" />
      <div className="flex flex-col">
        {upcoming.map((row) => (
          <Link
            key={row.mediaId}
            href={`/tv/${row.mediaId}`}
            className="grid grid-cols-[1fr_auto] items-center gap-[14px] border-t border-white/7 px-5 py-[14px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/70"
          >
            <span className="flex min-w-0 flex-col gap-[3px]">
              <span className="truncate text-[14.5px] font-medium tracking-[-0.015em] text-white">
                {row.title}
              </span>
              <span className="text-[11px] text-white/70">
                Season {row.season} · Episode {row.episode}
              </span>
            </span>
            <span className="flex flex-col items-end gap-px">
              <span className="font-serif text-[22px] leading-none text-accent tabular-nums">
                {countdownLabel(row.days)}
              </span>
              <span className="font-mono text-[9px] tracking-[0.14em] text-white/60">
                {format(row.airDate, "EEE, MMM d")}
              </span>
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
