"use client";

import ReliablePlayer from "@/components/player/ReliablePlayer";
import { siteConfig } from "@/config/site";
import { getTvShowPlayers } from "@/utils/players";
import { useDisclosure, useDocumentTitle } from "@mantine/hooks";
import { memo } from "react";
import type { Episode, TvShowDetails } from "tmdb-ts";
import TvShowPlayerEpisodeSelection from "./EpisodeSelection";
import TvShowPlayerHeader from "./Header";

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

const TvShowPlayer: React.FC<TvShowPlayerProps> = ({
  tv,
  id,
  episode,
  episodes,
  startAt,
  ...headerProps
}) => {
  const [episodeOpened, episodeHandlers] = useDisclosure(false);
  const season = episode.season_number;
  const episodeNumber = episode.episode_number;

  useDocumentTitle(
    `Play ${headerProps.seriesName} - ${headerProps.seasonName} - ${episode.name} | ${siteConfig.name}`,
  );

  return (
    <ReliablePlayer
      request={{
        mediaType: "tv",
        tmdbId: tv.id,
        season,
        episode: episodeNumber,
        startAt,
        preferredSubtitle: "en",
      }}
      legacyPlayers={getTvShowPlayers(id, season, episodeNumber, startAt)}
      color="warning"
      historyMetadata={{ season, episode: episodeNumber }}
      renderHeader={({ hidden, selectedSourceId, onOpenSource }) => (
        <TvShowPlayerHeader
          id={id}
          episode={episode}
          hidden={hidden}
          selectedSource={selectedSourceId}
          onOpenSource={onOpenSource}
          onOpenEpisode={episodeHandlers.open}
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

export default memo(TvShowPlayer);
