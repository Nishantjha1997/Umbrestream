"use client";

import { tmdbBrowser } from "@/api/tmdb-browser";
import type { MediaSummary } from "@/types/media";
import { cn, isEmpty } from "@/utils/helpers";
import { Info, PlayFilled, Star } from "@/utils/icons";
import { getEnglishLogoUrl } from "@/utils/movies";
import { fromMovie, fromTvShow } from "@/utils/normalize-media";
import { Skeleton } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { Movie, TV } from "tmdb-ts/dist/types";

/**
 * The home billboard.
 *
 * The home page previously opened straight onto a horizontal rail — no hero,
 * billboard, or featured area existed anywhere in the app (§3). This is the
 * first thing a visitor sees, so it carries three hard rules:
 *
 * 1. **Never render a black slab.** Only items that actually resolved a
 *    backdrop are eligible; if none of today's trending has artwork the whole
 *    section returns null and the page just starts at the rows. Falling back
 *    blind to `trending[0]` is what produces an empty rectangle.
 * 2. **Everything over artwork is dark, in both themes.** Same reasoning as the
 *    `glass-control` tier in globals.css: a scrim that flips to white in light
 *    mode makes white overlay text unreadable, and tinting the text per theme
 *    makes it unreadable over the other half of the image. Dark scrim + white
 *    text is the one combination that holds over an arbitrary photograph.
 * 3. **All motion is gated on `prefers-reduced-motion`** through a single
 *    `useReducedMotion()` call — including the auto-rotation, which stops
 *    entirely rather than merely losing its crossfade.
 *
 * The rotation also pauses on hover, on focus anywhere inside (so tabbing to
 * Play can't have the button yanked out from under the caret), and whenever the
 * tab is hidden.
 */

/** Dwell time per featured title before crossfading to the next. */
const ROTATE_MS = 8000;
/** How many of today's trending items with artwork enter the rotation. */
const MAX_FEATURED = 5;

/** `--duration-cinematic` (800ms) expressed in seconds for framer-motion. */
const CINEMATIC = 0.8;
/** `--duration-slow` / `--duration-base`, for the copy swap. */
const TEXT_IN = 0.45;
const TEXT_OUT = 0.28;
/** `--ease-out-quint`. Declared mutable because framer-motion's cubic-bezier
 *  tuple type is not readonly. */
const EASE_OUT_QUINT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Cancels the `main` element's padding so the billboard reaches the viewport
 *  edge and tucks up against the sticky nav. Mirrors `SpacingClasses.reset`. */
const BLEED = "-mx-3 -mt-8 sm:-mx-5";
/** 4:3 on phones, 16:9 from `sm` up, capped so a 2560px display doesn't get a
 *  1440px-tall billboard. `object-cover` absorbs the difference. */
const FRAME =
  "relative w-full overflow-hidden aspect-[4/3] max-h-[68vh] sm:aspect-video sm:max-h-[78vh]";

const KIND_LABEL: Record<MediaSummary["kind"], string> = {
  movie: "Movie",
  tv: "Series",
  anime: "Anime",
};

/**
 * `trending/all/day` returns movies, shows and people in one list, discriminated
 * by `media_type`. Declaring it as a union here means the normalizer calls below
 * narrow without a cast.
 */
type TrendingEntry =
  | (Movie & { media_type: "movie" })
  | (TV & { media_type: "tv" })
  | { media_type: "person"; id: number };

interface TrendingAllPage {
  page: number;
  results: TrendingEntry[];
  total_pages: number;
  total_results: number;
}

function toFeatured(page?: TrendingAllPage): MediaSummary[] {
  if (!page?.results) return [];

  const summaries: MediaSummary[] = [];
  for (const entry of page.results) {
    if (entry.media_type === "movie") summaries.push(fromMovie(entry));
    else if (entry.media_type === "tv") summaries.push(fromTvShow(entry));
  }

  return summaries
    .filter((media) => !isEmpty(media.backdropUrl) && !media.isAdult)
    .slice(0, MAX_FEATURED);
}

/**
 * `MediaSummary.backdropUrl` is normalized at w500 — right for a hover preview,
 * visibly soft blown up to full width. TMDB serves the same asset at any size
 * off the same path, so the hero asks for a larger rendition of the URL it
 * already has rather than reaching back into `backdrop_path` (which would mean
 * branching on TMDB field names outside the normalizer).
 */
function heroArt(url: string): string {
  return url.replace("/t/p/w500/", "/t/p/w1280/");
}

/** Matches the convention in HoverPreview: shows open on their episode list,
 *  since "play" has no unambiguous target for a series. */
function playHrefFor(media: MediaSummary): string {
  if (media.kind === "movie") return `/movie/${media.id}/player`;
  if (media.kind === "anime") return `/anime/${media.id}/player/1`;
  return `/tv/${media.id}#seasons-episodes`;
}

function playLabelFor(media: MediaSummary): string {
  return media.kind === "tv" ? "View Episodes" : "Play";
}

/**
 * TMDB wordmark art for one title, or null when it has none.
 *
 * Called twice by the hero — once for the active item and once for the one
 * after it — so that a rotation lands on a cached logo instead of showing the
 * plain-text title for a beat and then popping into artwork.
 */
function useLogoArt(media?: MediaSummary) {
  return useQuery<string | null>({
    queryKey: ["hero-logo", media?.kind, media?.id],
    enabled: media !== undefined && media.kind !== "anime",
    // Wordmark art never changes; refetching it is pure waste.
    staleTime: Infinity,
    retry: false,
    queryFn: async () => {
      if (!media) return null;
      if (media.kind === "tv") {
        const detail = await tmdbBrowser.tvShows.details(media.id, ["images"]);
        return getEnglishLogoUrl(detail.images.logos) ?? null;
      }
      const detail = await tmdbBrowser.movies.details(media.id, ["images"]);
      return getEnglishLogoUrl(detail.images.logos) ?? null;
    },
  });
}

const Hero: React.FC = () => {
  // The single reduced-motion gate for this component (§4).
  const reduce = Boolean(useReducedMotion());

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [tabVisible, setTabVisible] = useState(true);

  const { data, isPending, isError } = useQuery({
    queryKey: ["hero-trending"],
    queryFn: () => tmdbBrowser.trending.trending<TrendingAllPage>("all", "day"),
    staleTime: 1000 * 60 * 30,
  });

  const featured = useMemo(() => toFeatured(data), [data]);
  const count = featured.length;
  // Guarded rather than clamped in state: the list length can change under us
  // when the query refetches.
  const safeIndex = count > 0 ? index % count : 0;
  const active = featured[safeIndex] as MediaSummary | undefined;
  const upcoming = count > 1 ? featured[(safeIndex + 1) % count] : undefined;

  const { data: logoUrl } = useLogoArt(active);
  // Warms the cache for the next crossfade. The result is deliberately unused.
  useLogoArt(upcoming);

  useEffect(() => {
    const sync = () => setTabVisible(document.visibilityState === "visible");
    sync();
    document.addEventListener("visibilitychange", sync);
    return () => document.removeEventListener("visibilitychange", sync);
  }, []);

  const canRotate = count > 1 && !paused && tabVisible && !reduce;

  useEffect(() => {
    if (!canRotate) return;
    const timer = window.setInterval(() => setIndex((i) => i + 1), ROTATE_MS);
    return () => window.clearInterval(timer);
  }, [canRotate]);

  // Rule 1: no artwork, no billboard. Also covers a missing TMDB token, which
  // makes the proxy answer 503 and lands here rather than on a grey rectangle.
  if (isError || (!isPending && !active)) return null;

  if (!active) {
    return (
      <div className={cn(BLEED, FRAME)} aria-hidden="true">
        <Skeleton className="size-full rounded-none" />
      </div>
    );
  }

  return (
    <section
      aria-label="Featured"
      className={cn(BLEED, FRAME, "isolate bg-black")}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      // React's onFocus/onBlur bubble, so this covers focus landing on any
      // control inside the billboard.
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <AnimatePresence>
        {/* Decorative: the title is rendered as real text (or as wordmark art
            with an alt) in the content block below. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          key={`${active.kind}-${active.id}`}
          src={heroArt(active.backdropUrl as string)}
          alt=""
          aria-hidden="true"
          draggable={false}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 size-full object-cover object-center"
          // Entrance: a slow settle from 1.06 rather than a hard cut. Outgoing
          // art holds full opacity as it leaves so the crossfade never dips to
          // the black underneath.
          initial={{ opacity: 0, scale: reduce ? 1 : 1.06 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, transition: { duration: reduce ? 0 : CINEMATIC, ease: "linear" } }}
          transition={{ duration: reduce ? 0 : CINEMATIC, ease: EASE_OUT_QUINT }}
        />
      </AnimatePresence>

      {/* Scrims, painted bottom-up. Left-to-right first so the bottom fade wins
          at the very edge and the billboard dissolves into the page. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-linear-to-r from-black/80 via-black/35 via-45% to-transparent to-80%"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-linear-to-t from-black/95 via-black/45 via-32% to-transparent to-72%"
      />
      {/* Top veil: the nav above is translucent glass, so art scrolling under it
          would otherwise wash out the wordmark and controls. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-linear-to-b from-black/60 to-transparent sm:h-28"
      />

      <div className="absolute inset-x-0 bottom-0 z-20 px-4 pb-6 text-white sm:px-8 sm:pb-10 lg:px-12 lg:pb-14">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${active.kind}-${active.id}`}
            className="flex max-w-2xl flex-col items-start gap-3 sm:gap-4"
            initial={{ opacity: 0, y: reduce ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: reduce ? 0 : TEXT_OUT } }}
            transition={{ duration: reduce ? 0 : TEXT_IN, ease: EASE_OUT_QUINT }}
          >
            {/* The <h1> is present either way — when wordmark art wins, the alt
                text supplies the accessible name. */}
            <h1 className="text-3xl leading-tight font-semibold tracking-tight text-balance drop-shadow-lg sm:text-4xl lg:text-5xl">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoUrl}
                  alt={active.title}
                  draggable={false}
                  className="max-h-20 w-auto max-w-[min(100%,22rem)] object-contain object-left drop-shadow-xl sm:max-h-28 sm:max-w-md"
                />
              ) : (
                active.title
              )}
            </h1>

            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-white/75 drop-shadow-md">
              <span>{KIND_LABEL[active.kind]}</span>
              {active.year !== undefined && (
                <>
                  <span aria-hidden="true">&#8226;</span>
                  <span>{active.year}</span>
                </>
              )}
              {active.rating !== undefined && active.rating > 0 && (
                <>
                  <span aria-hidden="true">&#8226;</span>
                  <span
                    className="flex items-center gap-1"
                    aria-label={`Rated ${active.rating.toFixed(1)} out of 10`}
                  >
                    <Star className="text-warning-400 size-3" aria-hidden="true" />
                    {active.rating.toFixed(1)}
                  </span>
                </>
              )}
            </p>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {/* Flat pill, hand-rolled rather than a HeroUI variant: solid
                  emits `bg-primary` and shadow emits a coloured glow, both of
                  which read distinctly non-Apple over artwork (§9). */}
              <Link
                href={playHrefFor(active)}
                prefetch={false}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-black",
                  "transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:transition-none",
                  "hover:bg-white/85 focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black/50 focus-visible:outline-hidden",
                )}
              >
                <PlayFilled size={13} aria-hidden="true" />
                {playLabelFor(active)}
              </Link>
              <Link
                href={active.href}
                prefetch={false}
                className={cn(
                  "glass-control inline-flex items-center gap-2 rounded-full border px-6 py-2.5 text-sm font-medium",
                  "transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:transition-none",
                  "hover:bg-black/55 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-hidden",
                )}
              >
                <Info size={13} aria-hidden="true" />
                Details
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {count > 1 && (
        <div className="absolute right-4 bottom-6 z-20 hidden items-center gap-1 sm:right-8 sm:bottom-10 sm:flex lg:right-12 lg:bottom-14">
          {featured.map((media, i) => (
            <button
              key={`${media.kind}-${media.id}`}
              type="button"
              // The dot is 6px; the button around it is a real tap target.
              className="flex size-6 items-center justify-center rounded-full focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-hidden"
              aria-label={`Show ${media.title}`}
              aria-current={i === safeIndex}
              onClick={() => setIndex(i)}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "size-1.5 rounded-full transition duration-(--duration-base) ease-(--ease-out-quint) motion-reduce:transition-none",
                  i === safeIndex ? "scale-150 bg-white" : "bg-white/40 hover:bg-white/70",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </section>
  );
};

export default Hero;
