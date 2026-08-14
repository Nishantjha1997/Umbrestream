"use client";

import { tmdbBrowser } from "@/api/tmdb-browser";
import { getPersonalizedRecommendations } from "@/actions/recommendations";
import useContinueWatching from "@/hooks/useContinueWatching";
import type { HistoryDetail } from "@/types/movie";
import type { MediaKind, MediaSummary } from "@/types/media";
import { formatTimeLeft, getImageUrl } from "@/utils/movies";
import { isEmpty } from "@/utils/helpers";
import { fromAnime, fromMovie, fromTvShow } from "@/utils/normalize-media";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import type { Movie, TV } from "tmdb-ts/dist/types";

/**
 * The single "what goes big at the top of Home" decision, shared by the
 * phone resume-hero (`PHONE_SPEC.md` §C.1) and the desktop hero (`DESKTOP_SPEC.md`
 * §F) — both turned out to be the same content slot in two different shapes,
 * not two different features. Neither spec's hero is a trending carousel:
 * the mock's desktop ring caption ("Season 1, Episode 7 · 38 minutes left")
 * and its "Resume" button are continue-watching data. The old rotating
 * `Hero.tsx` billboard has no equivalent slot in either spec — it is
 * superseded, not reused, by this hook plus the dedicated "05 Trending
 * today" rail further down the page.
 *
 * Priority, each a real signal, nothing fabricated:
 * 1. Continue watching (most recent) — a real in-progress title, "Resume".
 * 2. Top personalized recommendation — signed-in with no history yet.
 * 3. Top trending title with a backdrop — signed-out, or recommendations
 *    engine came back empty.
 * 4. Nothing — callers render their own sign-in / start-watching prompt,
 *    same as `ContinueWatching.tsx`'s empty state.
 */

export type HomeHeroSource = "resume" | "recommended" | "trending";

export interface HomeHeroPick {
  source: HomeHeroSource;
  media: MediaSummary;
  /** Resume only. */
  progressPercent?: number;
  /** Resume only, e.g. "38m left". */
  remainingLabel?: string;
  /** Resume only, tv/anime, e.g. "Season 1, Episode 7". */
  episodeLabel?: string;
  /** Resume only — the raw history row's identity, needed by
   *  `HistoryItemActions` (mark-complete/remove) since it isn't derivable
   *  from `playHref`'s string. */
  season?: number;
  episode?: number;
  /** Where the primary button goes — resumes at the saved position for a
   *  resume pick, starts from the top otherwise. */
  playHref: string;
}

/** Mirrors `Hero.tsx`'s own `TrendingEntry` — `trending/all/day` discriminates
 *  movies, shows and people by `media_type` in one list. */
type TrendingEntry =
  | (Movie & { media_type: "movie" })
  | (TV & { media_type: "tv" })
  | { media_type: "person"; id: number };

interface TrendingPage {
  results: TrendingEntry[];
}

function playHrefFor(kind: MediaKind, id: number, season?: number, episode?: number): string {
  if (kind === "movie") return `/movie/${id}/player`;
  if (kind === "tv") return `/tv/${id}/${season ?? 1}/${episode ?? 1}/player`;
  return `/anime/${id}/player/${episode ?? 1}`;
}

function fromHistory(h: HistoryDetail): HomeHeroPick {
  const kind = h.type as MediaKind;
  const percent = h.duration > 0 ? Math.min(100, (h.last_position / h.duration) * 100) : 0;

  return {
    source: "resume",
    media: {
      kind,
      id: h.media_id,
      href: kind === "movie" ? `/movie/${h.media_id}` : `/${kind}/${h.media_id}`,
      title: h.title,
      posterUrl: getImageUrl(h.poster_path || h.backdrop_path || "", "poster"),
      backdropUrl: h.backdrop_path ? getImageUrl(h.backdrop_path, "backdrop") : undefined,
      year: h.release_date ? new Date(h.release_date).getFullYear() : undefined,
      rating: h.vote_average > 0 ? h.vote_average : undefined,
      isAdult: h.adult,
    },
    progressPercent: percent,
    remainingLabel: formatTimeLeft(h.last_position, h.duration),
    episodeLabel: kind === "tv" || kind === "anime" ? `Season ${h.season} · Episode ${h.episode}` : undefined,
    season: h.season,
    episode: h.episode,
    playHref: playHrefFor(kind, h.media_id, h.season, h.episode),
  };
}

function fromMediaSummary(source: HomeHeroSource, media: MediaSummary): HomeHeroPick {
  return { source, media, playHref: playHrefFor(media.kind, media.id) };
}

export function useHomeHero() {
  const {
    user,
    items: histories,
    isUserLoading,
    isLoading: isHistoriesLoading,
    isSignedOut,
  } = useContinueWatching();

  // Fetched unconditionally rather than only after histories comes back
  // empty — waterfalling three sequential queries would triple the time to
  // first paint for the one section every visitor sees immediately. Sharing
  // `Recommended.tsx`'s query key means this only costs a cache read on
  // whichever of the two mounts second.
  const recsQuery = useQuery({
    queryKey: ["personalized-recommendations", user?.id],
    queryFn: () => getPersonalizedRecommendations(),
    enabled: !isUserLoading,
    staleTime: 30 * 60 * 1000,
  });

  const trendingQuery = useQuery({
    queryKey: ["hero-trending"],
    queryFn: () => tmdbBrowser.trending.trending<TrendingPage>("all", "day"),
    staleTime: 30 * 60 * 1000,
  });

  const pick = useMemo<HomeHeroPick | undefined>(() => {
    // A completed title isn't "in progress" — `StillWatching`/
    // `StillWatchingDesktop` apply the same filter so the rail always skips
    // exactly whichever entry lands here, not just positional index 0.
    const active = histories.find((h) => !h.completed);
    if (active) return fromHistory(active);

    const rec = (recsQuery.data ?? [])[0];
    if (rec) {
      const media =
        rec.type === "movie"
          ? fromMovie(rec.media as Movie)
          : rec.type === "tv"
            ? fromTvShow(rec.media as TV)
            : fromAnime(rec.media);
      if (!isEmpty(media.posterUrl)) return fromMediaSummary("recommended", media);
    }

    for (const entry of trendingQuery.data?.results ?? []) {
      if (entry.media_type === "person") continue;
      const media = entry.media_type === "movie" ? fromMovie(entry) : fromTvShow(entry);
      if (!isEmpty(media.backdropUrl) && !media.isAdult) return fromMediaSummary("trending", media);
    }

    return undefined;
  }, [histories, recsQuery.data, trendingQuery.data]);

  const isLoading =
    isUserLoading ||
    isHistoriesLoading ||
    // Only worth waiting on these two while they're still the only hope of a
    // pick — once histories has something, recs/trending resolving later
    // must not bounce the hero from "resume" back to a loading state.
    (histories.length === 0 && (recsQuery.isPending || trendingQuery.isPending));

  return { pick, isLoading, isSignedOut };
}
