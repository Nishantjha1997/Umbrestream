"use client";

/**
 * Section 04, "Next episode drops" (DESKTOP_SPEC.md §G) — a hairline 3-up
 * grid built from the TV titles already in continue-watching. TMDB's
 * `next_episode_to_air` carries a date only, no time of day, so — unlike the
 * mock's invented "Fri 23:30" — the countdown here stays at day granularity
 * and shows the real air date instead of a fabricated clock time.
 */

import { getUserHistories } from "@/actions/histories";
import { tmdbBrowser } from "@/api/tmdb-browser";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import type { HistoryDetail } from "@/types/movie";
import { cn } from "@/utils/helpers";
import { useQueries, useQuery } from "@tanstack/react-query";
import { differenceInCalendarDays, format, parseISO } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import type { TvShowDetails } from "tmdb-ts";
import SectionHeader from "./SectionHeader";

/** How many continue-watching TV titles get a detail lookup at all. */
const MAX_CANDIDATES = 5;
/** How many tiles the grid actually shows. */
const MAX_TILES = 3;

type NextEpisode = NonNullable<TvShowDetails["next_episode_to_air"]>;

interface Drop {
  mediaId: number;
  title: string;
  episode: NextEpisode;
  daysUntil: number;
}

function countdownLabel(days: number): string {
  if (days <= 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `${days}d`;
}

// Keep TanStack's variadic `useQueries` inference from expanding the generic
// append-to-response helper into a union too large for TypeScript to represent.
async function getTvDetails(id: number): Promise<TvShowDetails> {
  return tmdbBrowser.tvShows.details(id);
}

export default function NextEpisodeDropsDesktop() {
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();

  const { data: historiesRes } = useQuery({
    queryKey: ["continue-watching", user?.id],
    queryFn: () => getUserHistories(),
    enabled: !isUserLoading,
  });

  const tvItems: HistoryDetail[] = (historiesRes?.success ? historiesRes.data ?? [] : [])
    .filter((item) => item.type === "tv")
    .slice(0, MAX_CANDIDATES);

  const detailQueries = useQueries({
    queries: tvItems.map((item) => ({
      queryKey: ["next-episode", item.media_id],
      queryFn: () => getTvDetails(item.media_id),
      staleTime: 10 * 60 * 1000,
    })),
  });

  // Day-granularity countdown never needs to be more fresh than "once per
  // mount" — reading the clock in a lazy `useState` initializer (rather than
  // inline in the render body) keeps this component pure per React's rules
  // of components (https://react.dev/reference/rules/components-and-hooks-must-be-pure).
  const [now] = useState(() => Date.now());
  const drops: Drop[] = tvItems
    .map((item, i): Drop | null => {
      const next = detailQueries[i]?.data?.next_episode_to_air;
      if (!next?.air_date) return null;
      const airTime = parseISO(next.air_date).getTime();
      if (Number.isNaN(airTime) || airTime <= now) return null;
      return {
        mediaId: item.media_id,
        title: item.title,
        episode: next,
        daysUntil: differenceInCalendarDays(airTime, now),
      };
    })
    .filter((drop): drop is Drop => drop !== null)
    .sort((a, b) => a.daysUntil - b.daysUntil)
    .slice(0, MAX_TILES);

  if (drops.length === 0) return null;

  return (
    <section className="flex flex-col gap-4">
      <SectionHeader number="04" label="Next episode drops" />
      <div className="px-12">
        <div
          className="grid gap-px overflow-hidden rounded-[14px] bg-white/7"
          style={{ gridTemplateColumns: `repeat(${drops.length}, 1fr)` }}
        >
          {drops.map((drop) => (
            <Link
              key={drop.mediaId}
              href={`/tv/${drop.mediaId}`}
              prefetch={false}
              className={cn(
                "flex flex-col gap-2.5 bg-[#100f14] p-5",
                "transition-colors duration-(--duration-base) ease-(--ease-out-quint) motion-reduce:transition-none",
                "hover:bg-[#17151d] focus-visible:bg-[#17151d] focus-visible:outline-hidden",
                "focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:ring-inset",
              )}
            >
              <p className="truncate text-sm font-medium tracking-[-.01em] text-white">
                {drop.title}
              </p>
              <p className="truncate text-[11px] text-white/40">
                Season {drop.episode.season_number} · Episode {drop.episode.episode_number}
              </p>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-serif text-[26px] leading-none text-accent">
                  {countdownLabel(drop.daysUntil)}
                </span>
                <span className="font-mono text-[9px] tracking-[.1em] text-white/34 uppercase">
                  {format(parseISO(drop.episode.air_date), "MMM d")}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
