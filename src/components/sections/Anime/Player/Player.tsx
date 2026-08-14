"use client";

import PlayerShell from "@/components/player/PlayerShell";
import { siteConfig } from "@/config/site";
import type { SourceRequest } from "@/lib/sources/types";
import { normalizeAudioVariant } from "@/lib/sources/playbackPolicy";
import type { AudioVariant } from "@/lib/sources/types";
import type { AniListMediaDetail } from "@/types/anilist";
import { useDisclosure, useDocumentTitle } from "@mantine/hooks";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [audioParam, setAudioParam] = useQueryState("audio", parseAsString);
  const [rememberedAudio, setRememberedAudio] = useState<AudioVariant>("sub");
  const animeTitle = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";
  const explicitAudio = audioParam === "sub" || audioParam === "dub" ? audioParam : null;
  const audio = normalizeAudioVariant(explicitAudio ?? rememberedAudio);

  useEffect(() => {
    const stored = normalizeAudioVariant(window.localStorage.getItem("streamfree:anime-audio:v1"));
    setRememberedAudio(stored);
    if (!explicitAudio) {
      void setAudioParam(stored, { history: "replace", shallow: true, scroll: false });
    }
  }, [explicitAudio, setAudioParam]);

  const changeAudio = useCallback(
    (nextAudio: AudioVariant) => {
      setRememberedAudio(nextAudio);
      try {
        window.localStorage.setItem("streamfree:anime-audio:v1", nextAudio);
      } catch {
        // Audio selection still works when storage is unavailable.
      }
      void setAudioParam(nextAudio, { history: "replace", shallow: true, scroll: false });
    },
    [setAudioParam],
  );

  useDocumentTitle(`Play ${animeTitle} - Ep ${episode} | ${siteConfig.name}`);

  const request = useMemo<SourceRequest>(
    () => ({
      mediaType: "anime",
      title: animeTitle,
      anilistId: anime.id,
      malId: anime.idMal ?? undefined,
      episode,
      startAt,
      preferredAudio: audio,
      preferredSubtitle: "en",
    }),
    [animeTitle, anime.id, anime.idMal, audio, episode, startAt],
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
      onAudioVariantChange={changeAudio}
      renderHeader={({ selectedSourceId, selectedAudioVariant, onOpenSource, chromeHidden }) => (
        <AnimePlayerHeader
          id={anime.id}
          animeTitle={animeTitle}
          episode={episode}
          totalEpisodes={anime.episodes}
          selectedSource={selectedSourceId}
          audioVariant={selectedAudioVariant ?? audio}
          onOpenSource={onOpenSource}
          onOpenEpisode={episodeHandlers.open}
          hidden={chromeHidden}
        />
      )}
      renderExtras={({ selectedSourceId, selectedAudioVariant }) => (
        <AnimePlayerEpisodeSheet
          opened={episodeOpened}
          onClose={episodeHandlers.close}
          anime={anime}
          currentEpisode={episode}
          selectedSourceId={selectedSourceId}
          audioVariant={selectedAudioVariant ?? audio}
        />
      )}
    />
  );
};

AnimePlayer.displayName = "AnimePlayer";

export default AnimePlayer;
