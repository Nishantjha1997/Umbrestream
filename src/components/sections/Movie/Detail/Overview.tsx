"use client";

import BookmarkButton from "@/components/ui/button/BookmarkButton";
import ShareButton from "@/components/ui/button/ShareButton";
import Genres from "@/components/ui/other/Genres";
import Rating from "@/components/ui/other/Rating";
import WatchProvidersSection from "@/components/ui/other/WatchProviders";
import Trailer from "@/components/ui/overlay/Trailer";
import { siteConfig } from "@/config/site";
import { SavedMovieDetails } from "@/types/movie";
import { cn } from "@/utils/helpers";
import { PlayFilled } from "@/utils/icons";
import { getImageUrl, movieDurationString, mutateMovieTitle } from "@/utils/movies";
import { Button, Image } from "@heroui/react";
import { useDocumentTitle } from "@mantine/hooks";
import Link from "next/link";
import { useState } from "react";
import { MovieDetails } from "tmdb-ts/dist/types/movies";
import { AppendToResponse } from "tmdb-ts/dist/types/options";

/** Past this many characters the synopsis is clamped behind a More/Less toggle. */
const SYNOPSIS_CLAMP_THRESHOLD = 420;

/**
 * Quiet, borderless genre chips. Genre is tertiary metadata sitting under the
 * synopsis, not a row of coloured buttons competing with Play (§1.1.3/§1.1.5).
 * Matches the anime detail page's treatment exactly.
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
 * own the moment the row runs out of width. Bullets can no longer wrap, and the
 * row degrades to a plain list if `::before` content is unavailable.
 */
const MetaItem: React.FC<React.PropsWithChildren> = ({ children }) => (
  <li className="flex items-center before:mr-2 before:text-default-600 before:content-['•'] first:before:content-none">
    {children}
  </li>
);

/**
 * Only the appends this component actually reads. The page requests a much
 * larger set; a superset stays assignable, and narrowing here keeps the
 * dependency honest.
 */
type MovieOverviewData = AppendToResponse<MovieDetails, ("videos" | "watch/providers")[], "movie">;

interface OverviewSectionProps {
  movie: MovieOverviewData;
}

const OverviewSection: React.FC<OverviewSectionProps> = ({ movie }) => {
  const [expanded, setExpanded] = useState(false);

  const title = mutateMovieTitle(movie);
  const posterImage = getImageUrl(movie.poster_path);
  const releaseDate = movie.release_date ? new Date(movie.release_date) : undefined;
  const releaseYear =
    releaseDate && !Number.isNaN(releaseDate.getTime()) ? releaseDate.getFullYear() : undefined;

  const bookmarkData: SavedMovieDetails = {
    type: "movie",
    adult: movie.adult,
    backdrop_path: movie.backdrop_path,
    id: movie.id,
    poster_path: movie.poster_path,
    release_date: movie.release_date,
    title,
    vote_average: movie.vote_average,
    saved_date: new Date().toISOString(),
  };

  // Deliberately text-only and icon-free: the metadata line is secondary to the
  // artwork and the title, and a clock/calendar pair turns it back into a dense
  // IMDb-style strip.
  const facts: string[] = [];
  if (releaseYear) facts.push(`${releaseYear}`);
  if (movie.runtime) facts.push(movieDurationString(movie.runtime));
  if (movie.status && movie.status !== "Released") facts.push(movie.status);

  const synopsis = movie.overview?.trim() ?? "";
  const isLongSynopsis = synopsis.length > SYNOPSIS_CLAMP_THRESHOLD;

  // NOTE (§8): a presentational child shouldn't own the document title. Moving
  // this to route metadata means editing `src/app/movie/[id]/page.tsx`, which is
  // owned elsewhere, so the call stays here for now — exactly as on the anime
  // detail page.
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
              <span>Movie</span>
              {movie.adult && (
                <span className="rounded-full border border-danger-400/40 px-2 py-0.5 text-danger-400">
                  18+
                </span>
              )}
            </div>

            {/* The page's only h1. Every other heading on it is a SectionTitle,
                which defaults to h2. */}
            <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-5xl">
              {title}
            </h1>

            {movie.tagline && (
              <p className="text-xs text-default-500 md:text-sm">{movie.tagline}</p>
            )}

            <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-default-400 md:text-sm">
              {facts.map((fact) => (
                <MetaItem key={fact}>{fact}</MetaItem>
              ))}
              {movie.vote_average > 0 && (
                <MetaItem>
                  <Rating rate={movie.vote_average} count={movie.vote_count} />
                </MetaItem>
              )}
            </ul>
          </header>

          {/* One dominant action. A flat, high-contrast pill rather than
              `variant="shadow"`, which emits a coloured glow (§9). Share and
              bookmark are icon-only and pushed to the end of the row so they
              never read as peers of Play. */}
          <div id="action" className="flex w-full flex-wrap items-center gap-3">
            <Button
              as={Link}
              size="lg"
              radius="full"
              href={`/movie/${movie.id}/player`}
              className="bg-foreground px-7 font-semibold text-background transition-transform duration-(--duration-fast) ease-(--ease-out-quint) hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100"
              startContent={<PlayFilled size={15} />}
            >
              Play
            </Button>
            <Trailer videos={movie.videos.results} />
            <div className="flex items-center gap-2 sm:ms-auto">
              <ShareButton id={movie.id} title={title} />
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
            <Genres genres={movie.genres} chipProps={GENRE_CHIP_PROPS} />
          </div>

          <WatchProvidersSection providers={movie["watch/providers"]} />
        </div>
      </div>
    </section>
  );
};

export default OverviewSection;
