"use client";

/**
 * The 560px cinematic hero (DESKTOP_SPEC.md §F) — a left-anchored landscape
 * panel, not a resized version of anything else. Bound to the single pick
 * `useHomeHero` resolves (continue-watching, then a personalized rec, then
 * trending-with-backdrop) and never rotates: §F is explicit that there is no
 * carousel, dot indicator, or timer here, and that desktop's
 * rotation-equivalent lives further down the page in "02 Tonight".
 */

import EclipseRing from "@/components/media/EclipseRing";
import HomeEmptyState from "@/components/sections/Home/EmptyState";
import HistoryItemActions from "@/components/ui/button/HistoryItemActions";
import { tmdbBrowser } from "@/api/tmdb-browser";
import { useHomeHero, type HomeHeroPick } from "@/hooks/useHomeHero";
import { cn } from "@/utils/helpers";
import { Info, PlayFilled } from "@/utils/icons";
import { getCinematicBackdropUrl, getHighResolutionImageUrl } from "@/utils/movies";
import { Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

/** Loading/fallback art, kept behind the `<img>` so a slow or broken backdrop
 *  never resolves to a black slab. */
const FALLBACK_ART = "linear-gradient(155deg,#7f2d3a 0%,#1d1116 100%)";

/**
 * The synopsis is the one hero field `MediaSummary` doesn't carry — it's a
 * normalized card shape, not a full detail fetch. Owned here rather than
 * inside `useHomeHero` so that hook stays a single lean decision and this one
 * extra per-title round trip is visible at its only call site. Anime has no
 * TMDB id space, so it's skipped rather than guessed at.
 */
function useHeroPresentation(media: HomeHeroPick["media"] | undefined) {
  return useQuery<{ synopsis: string | null; artwork?: string }>({
    queryKey: ["hero-presentation", media?.kind, media?.id],
    enabled: media !== undefined && media.kind !== "anime",
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      if (!media || media.kind === "anime") {
        return { synopsis: null, artwork: getHighResolutionImageUrl(media?.backdropUrl) };
      }
      const detail =
        media.kind === "tv"
          ? await tmdbBrowser.tvShows.details(media.id, ["images"])
          : await tmdbBrowser.movies.details(media.id, ["images"]);
      return {
        synopsis: detail.overview?.trim() || null,
        artwork: getCinematicBackdropUrl(detail.images.backdrops, media.backdropUrl),
      };
    },
  });
}

/** Honest, never-fabricated caption line. Resume gets the real episode/time
 *  left; a cold-start pick gets whatever real signal it actually has. */
function captionFor(pick: HomeHeroPick): string | undefined {
  if (pick.source === "resume") {
    return [pick.episodeLabel, pick.remainingLabel].filter(Boolean).join(" · ") || undefined;
  }
  if (pick.source === "trending") return "Trending today";
  const { year, rating } = pick.media;
  if (year || rating) {
    return [year, rating ? rating.toFixed(1) : undefined].filter(Boolean).join(" · ");
  }
  return "Recommended for you";
}

export default function DesktopHero() {
  const { pick, isLoading } = useHomeHero();
  const { data: presentation } = useHeroPresentation(pick?.media);

  if (isLoading) {
    return (
      <div className="relative h-[560px] flex-none overflow-hidden" aria-hidden="true">
        <Skeleton className="size-full rounded-none" />
      </div>
    );
  }

  if (!pick) {
    return (
      <div className="px-12 pt-8">
        <HomeEmptyState
          title="StreamFree"
          headline="Nothing to feature yet"
          description="Sign in and StreamFree builds this space around what you actually watch."
          action={{ label: "Sign in", href: "/auth" }}
        />
      </div>
    );
  }

  const art =
    presentation?.artwork ??
    getHighResolutionImageUrl(pick.media.backdropUrl) ??
    getHighResolutionImageUrl(pick.media.posterUrl) ??
    pick.media.backdropUrl ??
    pick.media.posterUrl;
  const caption = captionFor(pick);
  const showRing = pick.source === "resume" && pick.progressPercent !== undefined;
  const heroLabel =
    pick.source === "resume"
      ? "Continue where you left off"
      : pick.source === "trending"
        ? "Trending today"
        : "Recommended for you";

  return (
    <section
      aria-label={heroLabel}
      className="relative h-[560px] flex-none overflow-hidden bg-black"
    >
      <div className="absolute inset-0" style={{ backgroundImage: FALLBACK_ART }}>
        {/* Decorative: the title renders as real text below. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={art}
          alt=""
          aria-hidden="true"
          draggable={false}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="size-full object-cover object-center"
        />
      </div>

      {/* Horizontal scrim — heavy on the left, clear by 78%. What makes this a
          left-anchored editorial panel rather than a bottom-caption image. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(90deg,rgba(10,9,13,.94) 0%,rgba(10,9,13,.6) 42%,rgba(10,9,13,.05) 78%)",
        }}
      />
      {/* Vertical scrim, terminating in the app's literal base background
          (not a transparent rgba) so the hero welds into the page with no
          visible seam. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: "linear-gradient(0deg,#0a090d 2%,rgba(10,9,13,.1) 46%,transparent 74%)",
        }}
      />

      <div className="absolute right-12 bottom-14 left-12 flex max-w-[640px] flex-col gap-[18px]">
        {(showRing || caption) && (
          <div className="flex items-center gap-[14px]">
            {showRing && (
              <EclipseRing
                size={56}
                percent={pick.progressPercent as number}
                label={
                  <span className="text-[11.5px] font-semibold text-white">
                    {Math.round(pick.progressPercent as number)}%
                  </span>
                }
              />
            )}
            {caption && <p className="text-[12.5px] text-white/70">{caption}</p>}
          </div>
        )}

        <h1 className="font-serif text-[78px] leading-[0.9] tracking-[-0.02em] text-balance text-white">
          {pick.media.title}
        </h1>

        {presentation?.synopsis && (
          <p className="line-clamp-3 text-[14.5px] leading-[1.6] text-white/75">
            {presentation.synopsis}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1">
          <Link
            href={pick.playHref}
            prefetch={false}
            className={cn(
              "inline-flex h-[50px] items-center gap-[9px] rounded-full bg-white px-[30px] text-[14.5px] font-semibold text-[#0a090d]",
              "transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:transition-none",
              "hover:bg-white/85 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 focus-visible:outline-hidden",
            )}
          >
            <PlayFilled size={13} aria-hidden="true" />
            {pick.source === "resume" ? "Resume" : "Play"}
          </Link>
          <Link
            href={pick.media.href}
            prefetch={false}
            className={cn(
              "inline-flex h-[50px] items-center gap-2 rounded-full border border-white/22 bg-white/8 px-[26px] text-sm font-medium text-white",
              "transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:transition-none",
              "hover:bg-black/55 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-hidden",
            )}
          >
            <Info size={13} aria-hidden="true" />
            More info
          </Link>
          {pick.source === "resume" && (
            <HistoryItemActions
              mediaId={pick.media.id}
              type={pick.media.kind}
              season={pick.season}
              episode={pick.episode}
              title={pick.media.title}
              scope="title"
              className="flex gap-1"
            />
          )}
        </div>
      </div>
    </section>
  );
}
