"use client";

import PlayerShell, {
  type PlayerShellControlsContext,
} from "@/components/player/PlayerShell";
import { siteConfig } from "@/config/site";
import type { SourceRequest } from "@/lib/sources/types";
import { useDisclosure, useDocumentTitle, useMediaQuery } from "@mantine/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Episode, TvShowDetails } from "tmdb-ts";
import type { AdjacentEpisode } from "@/lib/tv/adjacentEpisode";
import TvShowPlayerEpisodeSelection from "./EpisodeSelection";
import TvShowPlayerControls from "./TvShowPlayerControls";
import TvShowPlayerHeader from "./Header";
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";

export interface TvShowPlayerProps {
  tv: TvShowDetails;
  id: number;
  seriesName: string;
  seasonName: string;
  episode: Episode;
  episodes: Episode[];
  nextEpisode: AdjacentEpisode | null;
  prevEpisode: AdjacentEpisode | null;
  startAt?: number;
}

/**
 * The "Up next" countdown dialog. Portalled to `document.body` — inside the
 * inline (non-portaled) `PlayerShell` tree it would inherit `AppRouteMotion`'s
 * transformed containing block and its `fixed` pin would anchor to the page
 * wrapper instead of the viewport (the same bug `DetailModal.tsx` documents).
 * Focus moves here on mount, Escape cancels, and the countdown never traps
 * focus — the page stays interactive underneath while it counts down.
 */
const NextEpisodeCountdownDialog: React.FC<{
  nextEpisode: AdjacentEpisode;
  countdown: number;
  onPlayNow: () => void;
  onCancel: () => void;
}> = ({ nextEpisode, countdown, onPlayNow, onCancel }) => {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const buttonBase =
    "min-h-11 rounded-full text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-black";

  return createPortal(
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-live="assertive"
      aria-atomic="true"
      aria-label="Next episode"
      className="fixed inset-x-4 bottom-6 z-95 mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-white/15 bg-black/85 p-4 text-white shadow-2xl backdrop-blur-xl outline-none"
    >
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-white/70 uppercase">
          Up next
        </p>
        <p className="mt-1 text-sm font-medium">
          Season {nextEpisode.season} · Episode {nextEpisode.episode} starts in {countdown}s
        </p>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          className={`${buttonBase} flex-1 bg-white px-4 text-black hover:bg-white/90`}
          onClick={onPlayNow}
        >
          Play now
        </button>
        <button
          type="button"
          className={`${buttonBase} border border-white/20 px-4 text-white hover:bg-white/10`}
          onClick={onCancel}
        >
          Cancel
        </button>
      </div>
    </div>,
    document.body,
  );
};

/**
 * TV playback on the shared `PlayerShell` (Phase 6, §10 — promoted from
 * Phase 0's TV-only direct-mount controller, which is why TV is the first
 * media type moved onto the shared shell: it is the already-proven
 * reference implementation, not a new one).
 *
 * Layout matches Movie/Anime (web, not fullscreen):
 *   ┌─────────────────────────────────────┬────────────────┐
 *   │  16:9 video player (PlayerShell)    │ Episode list   │
 *   ├─────────────────────────────────────┤ sidebar        │
 *   │  Controls bar (below, not overlay)  │ (≥ 1024px)     │
 *   └─────────────────────────────────────┴────────────────┘
 */
const TvShowPlayer: React.FC<TvShowPlayerProps> = ({
  tv,
  id,
  episode,
  episodes,
  nextEpisode,
  prevEpisode,
  startAt,
  ...headerProps
}) => {
  const router = useRouter();
  const [episodeOpened, episodeHandlers] = useDisclosure(false);
  const [nextEpisodeCountdown, setNextEpisodeCountdown] = useState<number | null>(null);
  const selectedSourceRef = useRef<string>("");
  const season = episode.season_number;
  const episodeNumber = episode.episode_number;

  useDocumentTitle(
    `Play ${headerProps.seriesName} - ${headerProps.seasonName} - ${episode.name} | ${siteConfig.name}`,
  );

  const request = useMemo<SourceRequest>(
    () => ({
      mediaType: "tv",
      tmdbId: tv.id,
      season,
      episode: episodeNumber,
      startAt,
      preferredSubtitle: "en",
    }),
    [episodeNumber, season, startAt, tv.id],
  );

  const identity = useMemo(
    () => ({ mediaId: tv.id, mediaType: "tv" as const, season, episode: episodeNumber }),
    [tv.id, season, episodeNumber],
  );

  const playNextEpisode = useCallback(() => {
    if (!nextEpisode) return;
    const query = selectedSourceRef.current
      ? `?src=${encodeURIComponent(selectedSourceRef.current)}`
      : "";
    router.replace(`/tv/${id}/${nextEpisode.season}/${nextEpisode.episode}/player${query}`);
  }, [id, nextEpisode, router]);

  const advanceToNextEpisode = useCallback(() => {
    if (!nextEpisode) return;
    setNextEpisodeCountdown(10);
  }, [nextEpisode]);

  useEffect(() => {
    if (nextEpisodeCountdown === null) return;
    if (nextEpisodeCountdown <= 0) {
      playNextEpisode();
      return;
    }
    const timer = window.setTimeout(
      () => setNextEpisodeCountdown((current) => (current === null ? null : current - 1)),
      1000,
    );
    return () => window.clearTimeout(timer);
  }, [nextEpisodeCountdown, playNextEpisode]);

  const isDesktopSidebar = useMediaQuery("(min-width: 1024px)", false, {
    getInitialValueInEffect: false,
  });

  return (
    <div className="mx-auto flex w-full max-w-[min(100vw,1600px)] flex-col">
      <div className="flex w-full gap-4">
        <div className="min-w-0 flex-1">
          <PlayerShell
            request={request}
            identity={identity}
            inlineLayout
            historyMetadata={{ season, episode: episodeNumber }}
            onEnded={advanceToNextEpisode}
            renderHeader={({ selectedSourceId, onOpenSource, chromeHidden }) => {
              selectedSourceRef.current = selectedSourceId;
              return (
                <TvShowPlayerHeader
                  id={id}
                  episode={episode}
                  selectedSource={selectedSourceId}
                  onOpenSource={onOpenSource}
                  onOpenEpisode={episodeHandlers.open}
                  nextEpisode={nextEpisode}
                  prevEpisode={prevEpisode}
                  hidden={chromeHidden}
                  {...headerProps}
                />
              );
            }}
            renderControls={(controls: PlayerShellControlsContext) => (
              <TvShowPlayerControls
                {...controls}
                seriesName={headerProps.seriesName}
                episode={episode}
              />
            )}
            renderExtras={({ selectedSourceId }) => (
              <TvShowPlayerEpisodeSelection
                id={id}
                opened={episodeOpened}
                onClose={episodeHandlers.close}
                episodes={episodes}
                selectedSourceId={selectedSourceId}
              />
            )}
          />

          {!isDesktopSidebar && (
            <TvShowPlayerEpisodeSelection
              id={id}
              opened
              onClose={() => undefined}
              episodes={episodes}
              selectedSourceId={undefined}
              inline
            />
          )}
        </div>

        {isDesktopSidebar && (
          <div className="w-[300px] shrink-0 xl:w-[340px]">
            <TvShowPlayerEpisodeSelection
              id={id}
              opened
              onClose={() => undefined}
              episodes={episodes}
              selectedSourceId={undefined}
              variant="sidebar"
            />
          </div>
        )}
      </div>

      {nextEpisode && nextEpisodeCountdown !== null && (
        <NextEpisodeCountdownDialog
          nextEpisode={nextEpisode}
          countdown={nextEpisodeCountdown}
          onPlayNow={playNextEpisode}
          onCancel={() => setNextEpisodeCountdown(null)}
        />
      )}
    </div>
  );
};

export default TvShowPlayer;
