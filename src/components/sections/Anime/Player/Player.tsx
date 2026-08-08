"use client";

import PlayerShell from "@/components/player/PlayerShell";
import { siteConfig } from "@/config/site";
import type { SourceRequest } from "@/lib/sources/types";
import type { AniListMediaDetail } from "@/types/anilist";
import { useDisclosure, useDocumentTitle } from "@mantine/hooks";
import { useMemo } from "react";
import AnimePlayerEpisodeSheet from "./EpisodeSheet";
import AnimePlayerHeader from "./Header";

interface AnimePlayerProps {
  anime: AniListMediaDetail;
  episode: number;
  startAt?: number;
}

/**
 * Anime playback on the shared `PlayerShell` (Phase 6, §10 — mirrors TV's
 * `Player.tsx`, the proven reference implementation for wiring onto the
 * shared shell).
 */
const AnimePlayer: React.FC<AnimePlayerProps> = ({ anime, episode, startAt }) => {
  const [episodeOpened, episodeHandlers] = useDisclosure(false);
  const animeTitle = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";

  useDocumentTitle(`Play ${animeTitle} - Ep ${episode} | ${siteConfig.name}`);

  const request = useMemo<SourceRequest>(
    () => ({
      mediaType: "anime",
      title: animeTitle,
      anilistId: anime.id,
      malId: anime.idMal ?? undefined,
      episode,
      startAt,
      preferredAudio: "sub",
      preferredSubtitle: "en",
    }),
    [animeTitle, anime.id, anime.idMal, episode, startAt],
  );

  const identity = useMemo(
    () => ({ mediaId: anime.id, mediaType: "anime" as const, episode }),
    [anime.id, episode],
  );

  return (
    <PlayerShell
      request={request}
      identity={identity}
      historyMetadata={{ episode }}
      renderHeader={({ selectedSourceId, onOpenSource }) => (
        <AnimePlayerHeader
          id={anime.id}
          animeTitle={animeTitle}
          episode={episode}
          totalEpisodes={anime.episodes}
          selectedSource={selectedSourceId}
          onOpenSource={onOpenSource}
          onOpenEpisode={episodeHandlers.open}
        />
      )}
      renderExtras={({ selectedSourceId }) => (
        <AnimePlayerEpisodeSheet
          opened={episodeOpened}
          onClose={episodeHandlers.close}
          anime={anime}
          currentEpisode={episode}
          selectedSourceId={selectedSourceId}
        />
      )}
    />
  );
};

AnimePlayer.displayName = "AnimePlayer";

export default AnimePlayer;
