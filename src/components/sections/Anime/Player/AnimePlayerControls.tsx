"use client";

/**
 * Controls bar rendered below the anime player video stage — not overlaying it.
 * Receives all action handlers from `Player.tsx` via the `PlayerShellControlsContext`
 * render-prop pattern so the iframe viewport stays clear.
 */

import type { PlayerShellControlsContext } from "@/components/player/PlayerShell";
import type { AudioVariant } from "@/lib/sources/types";
import { cn } from "@/utils/helpers";
import Link from "next/link";

interface AnimePlayerControlsProps extends PlayerShellControlsContext {
  animeId: number;
  episode: number;
  totalEpisodes?: number | null;
  audioVariant: AudioVariant;
  onChangeAudio: (audio: AudioVariant) => void;
}

const AnimePlayerControls: React.FC<AnimePlayerControlsProps> = ({
  animeId,
  episode,
  totalEpisodes,
  audioVariant,
  selectedSourceId,
  onChangeAudio,
  displayMode,
  isFullscreen,
  onChooseDisplayMode,
  onToggleFullscreen,
  onOpenSource,
}) => {
  const hasPrev = episode > 1;
  const hasNext = totalEpisodes ? episode < totalEpisodes : true;

  const sourceParams = (audio: AudioVariant) => {
    const params = new URLSearchParams({ audio });
    if (selectedSourceId) params.set("src", selectedSourceId);
    return `?${params.toString()}`;
  };

  const btnBase =
    "inline-flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 disabled:pointer-events-none disabled:opacity-40";

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[min(100vw,1600px)] flex-wrap items-center justify-between gap-2 px-2 py-2.5 sm:px-3",
        // Hide this bar when in native fullscreen — it is outside the fullscreen
        // element so it would be invisible but still consume layout space.
        isFullscreen && "hidden",
      )}
    >
      {/* Left cluster: episode navigation */}
      <div className="flex items-center gap-2">
        {hasPrev ? (
          <Link
            href={`/anime/${animeId}/player/${episode - 1}${sourceParams(audioVariant)}`}
            className={btnBase}
            aria-label="Previous episode"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
            <span className="hidden sm:inline">Prev</span>
          </Link>
        ) : (
          <span
            className={cn(btnBase, "pointer-events-none opacity-40")}
            aria-disabled="true"
            aria-label="Previous episode"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
            <span className="hidden sm:inline">Prev</span>
            <span className="sr-only sm:hidden">Previous episode</span>
          </span>
        )}

        <span className="text-xs font-medium text-white/70">
          EP {episode}
          {totalEpisodes ? ` / ${totalEpisodes}` : ""}
        </span>

        {hasNext ? (
          <Link
            href={`/anime/${animeId}/player/${episode + 1}${sourceParams(audioVariant)}`}
            className={btnBase}
            aria-label="Next episode"
          >
            <span className="hidden sm:inline">Next</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 18 14.5 12 6 6v12zm8.5-6v0zM16 6h2v12h-2z" />
            </svg>
          </Link>
        ) : (
          <span
            className={cn(btnBase, "pointer-events-none opacity-40")}
            aria-disabled="true"
            aria-label="Next episode"
          >
            <span className="hidden sm:inline">Next</span>
            <span className="sr-only sm:hidden">Next episode</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 18 14.5 12 6 6v12zm8.5-6v0zM16 6h2v12h-2z" />
            </svg>
          </span>
        )}
      </div>

      {/* Right cluster: sub/dub, source, fit/fill, fullscreen */}
      <div className="flex items-center gap-2">
        {/* Sub / Dub toggle */}
        <div
          className="flex overflow-hidden rounded-full border border-white/10 bg-white/5"
          role="group"
          aria-label="Audio variant"
        >
          {(["sub", "dub"] as const).map((variant) => (
            <button
              key={variant}
              type="button"
              onClick={() => onChangeAudio(variant)}
              aria-pressed={audioVariant === variant}
              className={cn(
                "px-3.5 py-2 text-xs font-semibold transition focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none",
                audioVariant === variant
                  ? "bg-primary text-white"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              {variant === "sub" ? "Sub" : "Dub"}
            </button>
          ))}
        </div>

        {/* Source picker */}
        <button
          type="button"
          onClick={onOpenSource}
          className={btnBase}
          aria-label="Choose playback source"
        >
          Source
        </button>

        {/* Fit / Fill display mode */}
        <div
          className="flex overflow-hidden rounded-full border border-white/10 bg-white/5"
          role="group"
          aria-label="Video framing"
        >
          {(["fit", "fill"] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => onChooseDisplayMode(mode)}
              aria-pressed={displayMode === mode}
              className={cn(
                "px-3.5 py-2 text-xs font-semibold transition focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none",
                displayMode === mode
                  ? "bg-white text-black"
                  : "text-white/70 hover:bg-white/10 hover:text-white",
              )}
            >
              {mode === "fit" ? "Fit" : "Fill"}
            </button>
          ))}
        </div>

        {/* Fullscreen */}
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

AnimePlayerControls.displayName = "AnimePlayerControls";
export default AnimePlayerControls;
