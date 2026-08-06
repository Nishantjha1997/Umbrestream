"use client";

import ReliablePlayer from "@/components/player/ReliablePlayer";
import { siteConfig } from "@/config/site";
import type { AniListMediaDetail } from "@/types/anilist";
import { getAnimePlayers } from "@/utils/players";
import { useDisclosure, useDocumentTitle } from "@mantine/hooks";
import AnimePlayerEpisodeSelection from "./EpisodeSelection";
import AnimePlayerHeader from "./Header";

interface AnimePlayerProps {
  anime: AniListMediaDetail;
  episode: number;
  startAt?: number;
}

const AnimePlayer: React.FC<AnimePlayerProps> = ({ anime, episode, startAt }) => {
  const [episodeOpened, episodeHandlers] = useDisclosure(false);
  const animeTitle = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";

  useDocumentTitle(`Play ${animeTitle} - Ep ${episode} | ${siteConfig.name}`);

  return (
    <ReliablePlayer
      request={{
        mediaType: "anime",
        title: animeTitle,
        anilistId: anime.id,
        malId: anime.idMal ?? undefined,
        episode,
        startAt,
        preferredAudio: "sub",
        preferredSubtitle: "en",
      }}
      legacyPlayers={getAnimePlayers(anime.id, episode, startAt, anime.idMal, animeTitle)}
      color="secondary"
      renderHeader={({ hidden, selectedSourceId, onOpenSource }) => (
        <AnimePlayerHeader
          id={anime.id}
          animeTitle={animeTitle}
          episode={episode}
          totalEpisodes={anime.episodes}
          selectedSource={selectedSourceId}
          onOpenSource={onOpenSource}
          onOpenEpisode={episodeHandlers.open}
          hidden={hidden}
        />
      )}
      renderExtras={({ selectedSourceId }) => (
        <AnimePlayerEpisodeSelection
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
