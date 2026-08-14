"use client";

import PlayerShell from "@/components/player/PlayerShell";
import { siteConfig } from "@/config/site";
import type { SourceRequest } from "@/lib/sources/types";
import { useDisclosure, useDocumentTitle } from "@mantine/hooks";
import { useCallback, useMemo } from "react";
import type { Episode, TvShowDetails } from "tmdb-ts";
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
  nextEpisodeNumber: number | null;
  prevEpisodeNumber: number | null;
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
  nextEpisodeNumber,
  startAt,
  ...headerProps
}) => {
  const router = useRouter();
  const [episodeOpened, episodeHandlers] = useDisclosure(false);
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

  const advanceToNextEpisode = useCallback(() => {
    if (nextEpisodeNumber == null) return;
    router.replace(`/tv/${id}/${season}/${nextEpisodeNumber}/player`);
  }, [id, nextEpisodeNumber, router, season]);

  return (
    <PlayerShell
      request={request}
      identity={identity}
      historyMetadata={{ season, episode: episodeNumber }}
      onEnded={advanceToNextEpisode}
      renderHeader={({ selectedSourceId, onOpenSource, chromeHidden }) => (
        <TvShowPlayerHeader
          id={id}
          episode={episode}
          selectedSource={selectedSourceId}
          onOpenSource={onOpenSource}
          onOpenEpisode={episodeHandlers.open}
          nextEpisodeNumber={nextEpisodeNumber}
          hidden={chromeHidden}
          {...headerProps}
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
  );
};

export default TvShowPlayer;
