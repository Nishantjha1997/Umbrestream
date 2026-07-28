"use client";

import BookmarkButton from "@/components/ui/button/BookmarkButton";
import ShareButton from "@/components/ui/button/ShareButton";
import Genres from "@/components/ui/other/Genres";
import Rating from "@/components/ui/other/Rating";
import WatchProvidersSection from "@/components/ui/other/WatchProviders";
import Trailer from "@/components/ui/overlay/Trailer";
import { siteConfig } from "@/config/site";
import { SavedMovieDetails } from "@/types/movie";
import { cn, formatDate } from "@/utils/helpers";
import { List, PlayFilled } from "@/utils/icons";
import { getImageUrl, mutateTvShowTitle } from "@/utils/movies";
import { Button, Image } from "@heroui/react";
import { useDocumentTitle } from "@mantine/hooks";
import Link from "next/link";
import { useState } from "react";
import { AppendToResponse } from "tmdb-ts/dist/types/options";
import { TvShowDetails } from "tmdb-ts/dist/types/tv-shows";

/** Past this many characters the synopsis is clamped behind a More/Less toggle. */
const SYNOPSIS_CLAMP_THRESHOLD = 420;

/**
 * Quiet, borderless genre chips — identical to the movie and anime detail
 * pages. Genre is tertiary metadata, not a row of coloured buttons (§1.1.3).
 */
const GENRE_CHIP_PROPS = {
  size: "sm",
  variant: "bordered",
  radius: "full",
  classNames: {
    base: "border-default-200/60 h-6 data-[hover=true]:border-default-400 transition-colors duration-(--duration-fast) ease-(--ease-out-quint) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground motion-reduce:transition-none",
    content: "text-default-500 text-xs px-2",
  },
} as const;

/**
 * One metadata line, rendered as a real list so the separators are CSS
 * pseudo-elements rather than flex children. The page previously emitted
 * literal `&#8226;` paragraphs between `div`s, which wrap onto lines of their
 * own the moment the row runs out of width.
 */
const MetaItem: React.FC<React.PropsWithChildren> = ({ children }) => (
  <li className="flex items-center before:mr-2 before:text-default-600 before:content-['•'] first:before:content-none">
    {children}
  </li>
);

const year = (date?: string): number | undefined => {
  if (!date) return undefined;
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.getFullYear();
};

/** TMDB air dates are `YYYY-MM-DD`; anything unparseable is simply not shown. */
const airDateLabel = (date?: string): string | undefined => {
  if (!date) return undefined;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return undefined;
  return formatDate(parsed, "en-US", { year: "numeric", month: "long", day: "numeric" });
};

/**
 * Only the appends this component actually reads. The page requests a much
 * larger set; a superset stays assignable.
 */
type TvOverviewData = AppendToResponse<TvShowDetails, ("videos" | "watch/providers")[], "tvShow">;

export interface TvShowOverviewSectionProps {
  tv: TvOverviewData;
  onViewEpisodesClick: () => void;
}

export const TvShowOverviewSection: React.FC<TvShowOverviewSectionProps> = ({
  tv,
  onViewEpisodesClick,
}) => {
  const [expanded, setExpanded] = useState(false);

  const title = mutateTvShowTitle(tv);
  const posterImage = getImageUrl(tv.poster_path);

  const firstYear = year(tv.first_air_date);
  const lastYear = year(tv.last_air_date);
  const stillRunning = tv.in_production || tv.status === "Returning Series";
  const yearLabel = firstYear
    ? stillRunning
      ? `${firstYear}–`
      : lastYear && lastYear !== firstYear
        ? `${firstYear}–${lastYear}`
        : `${firstYear}`
    : undefined;

  const bookmarkData: SavedMovieDetails = {
    type: "tv",
    adult: "adult" in tv ? (tv.adult as boolean) : false,
    backdrop_path: tv.backdrop_path,
    id: tv.id,
    poster_path: tv.poster_path,
    release_date: tv.first_air_date,
    title,
    vote_average: tv.vote_average,
    saved_date: new Date().toISOString(),
  };

  // Deliberately text-only and icon-free — see the movie/anime overviews.
  const facts: string[] = [];
  if (yearLabel) facts.push(yearLabel);
  if (tv.number_of_seasons > 0) {
    facts.push(`${tv.number_of_seasons} season${tv.number_of_seasons === 1 ? "" : "s"}`);
  }
  if (tv.number_of_episodes > 0) {
    facts.push(`${tv.number_of_episodes} episode${tv.number_of_episodes === 1 ? "" : "s"}`);
  }
  if (tv.status && tv.status !== "Returning Series") facts.push(tv.status);

  // Season 0 is TMDB's specials bucket, so the Play button aims at the first
  // *regular* season that actually has episodes. When a show has none (rare, but
  // it happens for unaired listings) there is nothing to play and the episode
  // browser becomes the primary action instead of shipping a dead link.
  const firstSeason = tv.seasons
    ?.filter((season) => season.season_number > 0 && season.episode_count > 0)
    .sort((a, b) => a.season_number - b.season_number)[0];
  const playHref = firstSeason
    ? `/tv/${tv.id}/${firstSeason.season_number}/1/player`
    : undefined;

  const nextAirDate = airDateLabel(tv.next_episode_to_air?.air_date);
  const nextAir =
    nextAirDate && tv.next_episode_to_air
      ? { date: nextAirDate, episode: tv.next_episode_to_air.episode_number }
      : undefined;

  const synopsis = tv.overview?.trim() ?? "";
  const isLongSynopsis = synopsis.length > SYNOPSIS_CLAMP_THRESHOLD;

  // NOTE (§8): a presentational child shouldn't own the document title. Moving
  // this to route metadata means editing `src/app/tv/[id]/page.tsx`, which is
  // owned elsewhere, so the call stays here for now.
  useDocumentTitle(`${title} | ${siteConfig.name}`);

  return (
    <section id="overview" className="relative z-3 flex flex-col gap-8 pt-[20vh] md:pt-[40vh]">
      <div className="flex flex-col gap-6 md:grid md:grid-cols-[auto_1fr] md:gap-8">
        <Image
          radius="none"
          alt={title}
          classNames={{
            wrapper:
              "hidden aspect-2/3 max-h-min w-52 overflow-hidden rounded-(--radius-card) shadow-(--elevation-lift) md:block",
          }}
          className="object-cover object-center"
          src={posterImage}
        />

        <div className="flex flex-col gap-6 md:gap-7">
          <header id="title" className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-default-500 uppercase">
              <span>TV Series</span>
            </div>

            {/* The page's only h1. Every other heading on it is a SectionTitle,
                which defaults to h2. */}
            <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-5xl">
              {title}
            </h1>

            {tv.tagline && <p className="text-xs text-default-500 md:text-sm">{tv.tagline}</p>}

            <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-default-400 md:text-sm">
              {facts.map((fact) => (
                <MetaItem key={fact}>{fact}</MetaItem>
              ))}
              {tv.vote_average > 0 && (
                <MetaItem>
                  <Rating rate={tv.vote_average} count={tv.vote_count} />
                </MetaItem>
              )}
            </ul>

            {nextAir && (
              <p className="text-xs text-default-500 md:text-sm">
                Episode {nextAir.episode} airs {nextAir.date}
              </p>
            )}
          </header>

          {/* One dominant action, matching the movie and anime pages: a flat,
              high-contrast pill rather than `variant="shadow"`, which emits a
              coloured glow (§9). Browsing episodes is a secondary, bordered
              affordance — it used to be the primary CTA, which put a shelf
              scroll on the same footing as pressing play. */}
          <div id="action" className="flex w-full flex-wrap items-center gap-3">
            {playHref ? (
              <>
                <Button
                  as={Link}
                  size="lg"
                  radius="full"
                  href={playHref}
                  className="bg-foreground px-7 font-semibold text-background transition-transform duration-(--duration-fast) ease-(--ease-out-quint) hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100"
                  startContent={<PlayFilled size={15} />}
                >
                  Play S{firstSeason?.season_number} E1
                </Button>
                <Button
                  size="lg"
                  radius="full"
                  variant="bordered"
                  onPress={onViewEpisodesClick}
                  className="border-default-300/50 font-medium text-foreground transition-colors duration-(--duration-fast) ease-(--ease-out-quint) hover:border-default-400 motion-reduce:transition-none"
                  startContent={<List size={18} />}
                >
                  Episodes
                </Button>
              </>
            ) : (
              <Button
                size="lg"
                radius="full"
                onPress={onViewEpisodesClick}
                className="bg-foreground px-7 font-semibold text-background transition-transform duration-(--duration-fast) ease-(--ease-out-quint) hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100"
                startContent={<List size={18} />}
              >
                Episodes
              </Button>
            )}
            <Trailer videos={tv.videos.results} />
            <div className="flex items-center gap-2 sm:ms-auto">
              <ShareButton id={tv.id} title={title} type="tv" />
              <BookmarkButton data={bookmarkData} />
            </div>
          </div>

          <div id="story" className="flex flex-col gap-3">
            <p
              className={cn(
                "max-w-[68ch] text-sm leading-relaxed whitespace-pre-line text-default-500 md:text-base",
                isLongSynopsis && !expanded && "line-clamp-4",
              )}
            >
              {synopsis || "No synopsis available."}
            </p>
            {isLongSynopsis && (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
                className="w-fit rounded-full text-xs font-semibold tracking-wide text-default-400 uppercase transition-colors duration-(--duration-fast) ease-(--ease-out-quint) hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
            <Genres genres={tv.genres} type="tv" chipProps={GENRE_CHIP_PROPS} />
          </div>

          <WatchProvidersSection providers={tv["watch/providers"]} />
        </div>
      </div>
    </section>
  );
};

export default TvShowOverviewSection;
