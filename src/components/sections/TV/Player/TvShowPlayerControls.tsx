"use client";

/**
 * Controls bar rendered below the TV player video stage — not overlaying it.
 * Mirrors `AnimePlayerControls`/`MoviePlayerControls` (Phase 6, §10): every
 * handler arrives via the `PlayerShellControlsContext` render-prop, which also
 * suppresses the built-in Source/Fit/Fill/Fullscreen row inside the viewport.
 * Keeping these buttons outside the iframe means they can never sit on top of
 * the embedded provider's own playback controls on phones.
 */

import type { PlayerShellControlsContext } from "@/components/player/PlayerShell";
import { cn } from "@/utils/helpers";
import type { Episode } from "tmdb-ts/dist/types/tv-episode";

interface TvShowPlayerControlsProps extends PlayerShellControlsContext {
  seriesName: string;
  episode: Episode;
}

const TvShowPlayerControls: React.FC<TvShowPlayerControlsProps> = ({
  seriesName,
  episode,
  displayMode,
  isFullscreen,
  onChooseDisplayMode,
  onToggleFullscreen,
  onOpenSource,
}) => {
  const btnBase =
    "inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50";

  const segmentedBtn = (active: boolean) =>
    cn(
      "px-3.5 py-2 text-xs font-semibold transition focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:outline-none",
      active ? "bg-white text-black" : "text-white/70 hover:bg-white/10 hover:text-white",
    );

  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-[min(100vw,1600px)] flex-wrap items-center justify-between gap-2 px-2 py-2.5 sm:px-3",
        // Hide this bar in native fullscreen — it lives outside the fullscreen
        // element, so it would be invisible yet still consume layout space.
        isFullscreen && "hidden",
      )}
    >
      {/* Left cluster: series + episode identity */}
      <div className="flex min-w-0 items-center gap-2">
        <p className="truncate text-sm font-semibold text-white/90">{seriesName}</p>
        <span className="shrink-0 text-xs font-medium text-white/50">
          S{episode.season_number} · E{episode.episode_number}
          {episode.name ? ` — ${episode.name}` : ""}
        </span>
      </div>

      {/* Right cluster: source, fit/fill, fullscreen */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpenSource}
          className={btnBase}
          aria-label="Choose playback source"
        >
          Source
        </button>

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
              className={segmentedBtn(displayMode === mode)}
            >
              {mode === "fit" ? "Fit" : "Fill"}
            </button>
          ))}
        </div>

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

TvShowPlayerControls.displayName = "TvShowPlayerControls";
export default TvShowPlayerControls;
