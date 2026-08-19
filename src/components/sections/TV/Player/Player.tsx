"use client";

import PlayerShell from "@/components/player/PlayerShell";
import { siteConfig } from "@/config/site";
import type { SourceRequest } from "@/lib/sources/types";
import { useDisclosure, useDocumentTitle, useMediaQuery } from "@mantine/hooks";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Episode, TvShowDetails } from "tmdb-ts";
import type { AdjacentEpisode } from "@/lib/tv/adjacentEpisode";
import TvShowPlayerEpisodeSelection from "./EpisodeSelection";
import TvShowPlayerHeader from "./Header";
import { useRouter } from "next/navigation";

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
 * TV playback on the shared `PlayerShell` (Phase 6, §10 — promoted from
 * Phase 0's TV-only direct-mount controller, which is why TV is the first
 * media type moved onto the shared shell: it is the already-proven
 * reference implementation, not a new one).
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
            renderExtras={({ selectedSourceId }) => (
              <>
                <TvShowPlayerEpisodeSelection
                  id={id}
                  opened={episodeOpened}
                  onClose={episodeHandlers.close}
                  episodes={episodes}
                  selectedSourceId={selectedSourceId}
                />
                {nextEpisode && nextEpisodeCountdown !== null && (
                  <div
                    className="pointer-events-auto fixed inset-x-4 bottom-6 z-95 mx-auto flex max-w-md flex-col gap-3 rounded-2xl border border-white/15 bg-black/85 p-4 text-white shadow-2xl backdrop-blur-xl"
                    role="dialog"
                    aria-live="assertive"
                    aria-atomic="true"
                    aria-label="Next episode"
                  >
                    <div>
                      <p className="text-xs font-semibold tracking-[0.14em] text-white/55 uppercase">
                        Up next
                      </p>
                      <p className="mt-1 text-sm font-medium">
                        Season {nextEpisode.season} · Episode {nextEpisode.episode} starts in {nextEpisodeCountdown}s
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="min-h-11 flex-1 rounded-full bg-white px-4 text-sm font-semibold text-black"
                        onClick={playNextEpisode}
                      >
                        Play now
                      </button>
                      <button
                        type="button"
                        className="min-h-11 rounded-full border border-white/20 px-4 text-sm font-semibold text-white"
                        onClick={() => setNextEpisodeCountdown(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </>
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
    </div>
  );
};

export default TvShowPlayer;
