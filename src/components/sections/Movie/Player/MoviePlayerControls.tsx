"use client";

/**
 * Controls bar rendered below the movie player video stage — not overlaying
 * it. Mirrors `AnimePlayerControls` (Phase 6, §10): every handler arrives via
 * the `PlayerShellControlsContext` render-prop, which also suppresses the
 * built-in Source/Fit/Fill/Fullscreen row inside the viewport. Keeping these
 * buttons outside the iframe means they can never sit on top of the embedded
 * provider's own playback controls on phones.
 */

import type { PlayerShellControlsContext } from "@/components/player/PlayerShell";
import PlayerDisplayModeToggle from "@/components/player/PlayerDisplayModeToggle";
import { isSourceActivationKey } from "@/lib/player/sourceInteraction";
import { cn } from "@/utils/helpers";
import { ArrowLeft } from "@/utils/icons";
import { movieDurationString, mutateMovieTitle } from "@/utils/movies";
import Link from "next/link";
import type { MovieDetails } from "tmdb-ts/dist/types/movies";

interface MoviePlayerControlsProps extends PlayerShellControlsContext {
  movie: MovieDetails;
}

const MoviePlayerControls: React.FC<MoviePlayerControlsProps> = ({
  movie,
  displayMode,
  canUseFillMode,
  isFullscreen,
  onChooseDisplayMode,
  onToggleFullscreen,
  onOpenSource,
}) => {
  const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : undefined;
  const title = mutateMovieTitle(movie);

  const btnBase =
    "inline-flex min-h-11 min-w-11 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:px-4";

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[min(100vw,1600px)] flex-wrap items-center justify-between gap-2 px-3 py-3 sm:px-3 sm:py-2.5",
        // Hide this bar in native fullscreen — it lives outside the fullscreen
        // element, so it would be invisible yet still consume layout space.
        isFullscreen && "hidden",
      )}
    >
      {/* Left cluster: title + compact meta */}
      <div className="flex min-w-0 flex-1 items-center gap-2 max-sm:basis-full">
        <Link
          href={`/movie/${movie.id}`}
          aria-label="Back to movie details"
          className={cn(btnBase, "shrink-0 px-0 sm:hidden")}
        >
          <ArrowLeft className="size-5" aria-hidden />
        </Link>
        <p className="truncate text-sm font-semibold text-white/90">{title}</p>
        {releaseYear && <span className="shrink-0 text-xs font-medium text-white/70">{releaseYear}</span>}
        {movie.runtime ? (
          <span className="hidden shrink-0 text-xs font-medium text-white/70 sm:inline">
            {movieDurationString(movie.runtime)}
          </span>
        ) : null}
      </div>

      {/* Right cluster: source, fit/fill, fullscreen */}
      <div className="flex w-full items-center justify-between gap-2 sm:w-auto sm:justify-start">
        <button
          type="button"
          onClick={onOpenSource}
          onKeyDown={(event) => {
            if (!isSourceActivationKey(event.key)) return;
            event.preventDefault();
            event.stopPropagation();
            onOpenSource();
          }}
          className={btnBase}
          aria-label="Choose playback source"
        >
          Source
        </button>

        <PlayerDisplayModeToggle
          displayMode={displayMode}
          canUseFillMode={canUseFillMode}
          onChooseDisplayMode={onChooseDisplayMode}
        />

        <button
          type="button"
          onClick={() => void onToggleFullscreen()}
          aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
          className={btnBase}
        >
          {isFullscreen ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M5 16h3v3h2v-5H5v2zm3-8H5v2h5V5H8v3zm6 11h2v-3h3v-2h-5v5zm2-11V5h-2v5h5V8h-3z" />
              </svg>
              <span className="hidden sm:inline">Exit</span>
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
              </svg>
              <span className="hidden sm:inline">Full screen</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

MoviePlayerControls.displayName = "MoviePlayerControls";
export default MoviePlayerControls;
