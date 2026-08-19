"use client";

import PlayerShell from "@/components/player/PlayerShell";
import type { PlayerShellControlsContext } from "@/components/player/PlayerShell";
import { siteConfig } from "@/config/site";
import type { SourceRequest } from "@/lib/sources/types";
import { normalizeAudioVariant } from "@/lib/sources/playbackPolicy";
import type { AudioVariant } from "@/lib/sources/types";
import type { AniListMediaDetail } from "@/types/anilist";
import { useDisclosure, useDocumentTitle, useMediaQuery } from "@mantine/hooks";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useState } from "react";
import AnimePlayerEpisodeSheet from "./EpisodeSheet";
import AnimePlayerHeader from "./Header";
import AnimePlayerControls from "./AnimePlayerControls";

interface AnimePlayerProps {
  anime: AniListMediaDetail;
  episode: number;
  startAt?: number;
}

/**
 * Anime playback on the shared `PlayerShell`.
 *
 * Layout (web, not fullscreen):
 *   ┌─────────────────────────────────────┬────────────────┐
 *   │  16:9 video player (PlayerShell)    │ Episode list   │
 *   ├─────────────────────────────────────┤ sidebar        │
 *   │  Controls bar (below, not overlay)  │ (≥ 1024px)     │
 *   └─────────────────────────────────────┴────────────────┘
 *
 * Mobile: player full-width → controls bar → episode list below.
 * Fullscreen: full viewport, controls bar hidden (outside element).
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

  // Whether to show the desktop sidebar (≥ 1024px wide screen).
  const isDesktopSidebar = useMediaQuery("(min-width: 1024px)", false, {
    getInitialValueInEffect: false,
  });

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
    <div className="mx-auto flex w-full max-w-[min(100vw,1600px)] flex-col">
      {/* Two-column wrapper: player column on left + episode sidebar on right */}
      <div className="flex w-full gap-4">
        {/* Player + controls column */}
        <div className="min-w-0 flex-1">
          <PlayerShell
            request={request}
            identity={identity}
            inlineLayout
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
            renderControls={(controlsCtx: PlayerShellControlsContext) => (
              <AnimePlayerControls
                {...controlsCtx}
                animeId={anime.id}
                episode={episode}
                totalEpisodes={anime.episodes}
                audioVariant={audio}
                onChangeAudio={changeAudio}
              />
            )}
          />

          {/* Mobile / non-sidebar: inline episode list below the controls bar */}
          {!isDesktopSidebar && (
            <AnimePlayerEpisodeSheet
              opened
              onClose={() => undefined}
              anime={anime}
              currentEpisode={episode}
              selectedSourceId={undefined}
              audioVariant={audio}
              inline
            />
          )}
        </div>

        {/* Desktop sidebar episode list (visible at ≥ 1024px) */}
        {isDesktopSidebar && (
          <div className="w-[300px] shrink-0 xl:w-[340px]">
            <AnimePlayerEpisodeSheet
              opened
              onClose={() => undefined}
              anime={anime}
              currentEpisode={episode}
              selectedSourceId={undefined}
              audioVariant={audio}
              variant="sidebar"
            />
          </div>
        )}
      </div>
    </div>
  );
};

AnimePlayer.displayName = "AnimePlayer";

export default AnimePlayer;
