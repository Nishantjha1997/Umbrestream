"use client";

/**
 * Compact "about this movie" panel rendered below the movie player's controls
 * bar. Movies have no episode rail to fill the space under the stage (the way
 * TV/anime pages do), so this panel gives the blank area purpose: poster,
 * metadata, synopsis, and the actions that matter mid-playback (back to
 * details, share, bookmark). It reuses the detail page's design language
 * (`Overview.tsx`) but stays deliberately quieter than the detail page.
 */

import BookmarkButton from "@/components/ui/button/BookmarkButton";
import ShareButton from "@/components/ui/button/ShareButton";
import Genres from "@/components/ui/other/Genres";
import Rating from "@/components/ui/other/Rating";
import { SavedMovieDetails } from "@/types/movie";
import { cn } from "@/utils/helpers";
import { ArrowLeft } from "@/utils/icons";
import { getImageUrl, movieDurationString, mutateMovieTitle } from "@/utils/movies";
import { Image } from "@heroui/react";
import Link from "next/link";
import { useState } from "react";
import type { MovieDetails } from "tmdb-ts/dist/types/movies";

/** Past this many characters the synopsis is clamped behind a More/Less toggle. */
const SYNOPSIS_CLAMP_THRESHOLD = 320;

const GENRE_CHIP_PROPS = {
  size: "sm",
  variant: "bordered",
  radius: "full",
  classNames: {
    base: "border-white/15 h-6 data-[hover=true]:border-white/40 transition-colors",
    content: "text-white/60 text-xs px-2",
  },
} as const;

interface MoviePlayerInfoProps {
  movie: MovieDetails;
}

const MoviePlayerInfo: React.FC<MoviePlayerInfoProps> = ({ movie }) => {
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

  const facts: string[] = [];
  if (releaseYear) facts.push(`${releaseYear}`);
  if (movie.runtime) facts.push(movieDurationString(movie.runtime));
  if (movie.status && movie.status !== "Released") facts.push(movie.status);

  const synopsis = movie.overview?.trim() ?? "";
  const isLongSynopsis = synopsis.length > SYNOPSIS_CLAMP_THRESHOLD;

  const backBtn =
    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

  return (
    <section className="mx-auto mt-3 w-full max-w-[min(100vw,1600px)] rounded-3xl border border-white/10 bg-white/[0.025] p-4 shadow-2xl shadow-black/20 sm:mt-5 sm:p-6">
      <div className="flex gap-4 sm:gap-6">
        <Image
          radius="lg"
          alt={title}
          classNames={{
            wrapper:
              "w-20 shrink-0 self-start overflow-hidden rounded-xl border border-white/10 shadow-lg sm:w-28 md:w-36",
          }}
          className="aspect-2/3 object-cover object-center"
          src={posterImage}
        />

        <div className="flex min-w-0 flex-col gap-2.5 sm:gap-3">
          <header className="flex flex-col gap-1">
            <p className="text-[11px] font-semibold tracking-[0.16em] text-primary uppercase">
              Now playing
            </p>
            <h2 className="truncate text-lg font-semibold tracking-tight text-white sm:text-2xl">
              {title}
            </h2>
            {facts.length > 0 && (
              <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-white/50 sm:text-sm">
                {facts.map((fact) => (
                  <li
                    key={fact}
                    className="flex items-center before:mr-2 before:text-white/40 before:content-['•'] first:before:content-none"
                  >
                    {fact}
                  </li>
                ))}
                {movie.vote_average > 0 && (
                  <li className="flex items-center before:mr-2 before:text-white/40 before:content-['•']">
                    <Rating rate={movie.vote_average} count={movie.vote_count} />
                  </li>
                )}
              </ul>
            )}
          </header>

          {synopsis && (
            <div className="flex flex-col gap-2">
              <p
                className={cn(
                  "max-w-[68ch] text-sm leading-relaxed whitespace-pre-line text-white/60",
                  isLongSynopsis && !expanded && "line-clamp-4",
                )}
              >
                {synopsis}
              </p>
              {isLongSynopsis && (
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setExpanded((value) => !value)}
                  className="w-fit rounded-full text-xs font-semibold tracking-wide text-white/50 uppercase transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {expanded ? "Show less" : "Show more"}
                </button>
              )}
            </div>
          )}

          <Genres genres={movie.genres} chipProps={GENRE_CHIP_PROPS} />

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Link href={`/movie/${movie.id}`} className={backBtn} aria-label="Back to movie details">
              <ArrowLeft size={14} />
              Details
            </Link>
            <ShareButton id={movie.id} title={title} />
            <BookmarkButton data={bookmarkData} />
          </div>
        </div>
      </div>
    </section>
  );
};

MoviePlayerInfo.displayName = "MoviePlayerInfo";
export default MoviePlayerInfo;
