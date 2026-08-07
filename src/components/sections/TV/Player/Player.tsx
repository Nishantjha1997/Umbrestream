"use client";

import { siteConfig } from "@/config/site";
import { createPublicEmbedSources } from "@/lib/sources/adapters/embed";
import { legacySourceId } from "@/lib/sources/legacy";
import { selectDefaultSource } from "@/lib/sources/selectDefault";
import type { PlayersProps } from "@/types";
import { SpacingClasses } from "@/utils/constants";
import { cn } from "@/utils/helpers";
import { useDisclosure, useDocumentTitle } from "@mantine/hooks";
import { parseAsString, useQueryState } from "nuqs";
import { memo, useEffect, useMemo } from "react";
import type { Episode, TvShowDetails } from "tmdb-ts";
import TvShowPlayerEpisodeSelection from "./EpisodeSelection";
import TvShowPlayerHeader from "./Header";
import TvShowPlayerSourceSelection from "./SourceSelection";

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
 * TV playback is a direct-mount iframe controller, not `ReliablePlayer` /
 * `usePlayerEngine`. That shared engine produced a real production outage on
 * TV: it defaulted to Filmu, whose outer shell loads while its TV iframe can
 * expose no playable media, and neither the engine nor Umbra is allowed to
 * detect that (the user has explicitly excluded provider redirect/opaque-
 * frame inspection and auto-switching on "slow/opaque/uninspectable").
 * See TV_PLAYER_ROLLBACK_HANDOFF.md for the fixture evidence.
 *
 * This mounts exactly one iframe, synchronously, built from the same adapter
 * registry Movie/Anime use (`createPublicEmbedSources`) — no
 * `/api/player/sources` round trip, no provider preflight/observation before
 * mounting, no automatic fallback switching. The embedded provider owns
 * playback and fullscreen entirely; Umbra never inspects or intercepts it.
 */
const TvShowPlayer: React.FC<TvShowPlayerProps> = ({
  tv,
  id,
  episode,
  episodes,
  startAt,
  ...headerProps
}) => {
  const [episodeOpened, episodeHandlers] = useDisclosure(false);
  const [sourceOpened, sourceHandlers] = useDisclosure(false);
  const season = episode.season_number;
  const episodeNumber = episode.episode_number;

  useDocumentTitle(
    `Play ${headerProps.seriesName} - ${headerProps.seasonName} - ${episode.name} | ${siteConfig.name}`,
  );

  const sources = useMemo(
    () =>
      createPublicEmbedSources({
        mediaType: "tv",
        tmdbId: tv.id,
        season,
        episode: episodeNumber,
        startAt,
        preferredSubtitle: "en",
      }),
    [episodeNumber, season, startAt, tv.id],
  );

  const [sourceParam, setSourceParam] = useQueryState("src", parseAsString);

  const selectedSource = useMemo(() => {
    if (!sources.length) return null;
    return selectDefaultSource(sources, {
      requestedId: legacySourceId("tv", sourceParam),
      defaultId: sources[0]?.id,
      preferredSubtitle: "en",
    });
  }, [sourceParam, sources]);

  // Keep `?src=` a stable provider id, translating a legacy numeric link on
  // first paint. This never blocks the mount below — the iframe renders from
  // `selectedSource` on the same render regardless of whether the URL has
  // caught up yet.
  useEffect(() => {
    if (selectedSource && sourceParam !== selectedSource.id) {
      void setSourceParam(selectedSource.id);
    }
  }, [selectedSource, setSourceParam, sourceParam]);

  // The TV source drawer (`SourceSelection.tsx`) predates the shared player
  // engine and already expects this exact shape — reuse it instead of
  // building a second drawer. `useServerHealth` inside it pings by URL only;
  // it does not depend on `usePlayerEngine`.
  const players: PlayersProps[] = useMemo(
    () =>
      sources.map((source) => ({
        title: source.label,
        source: source.url as `https://${string}`,
        recommended: source.capabilities.recommended,
        fast: source.capabilities.fast,
        ads: source.capabilities.ads,
        resumable: source.capabilities.resumable,
      })),
    [sources],
  );
  const selectedIndex = selectedSource
    ? sources.findIndex((source) => source.id === selectedSource.id)
    : -1;

  return (
    <>
      <div
        className={cn(
          "player-shell relative h-svh min-h-[320px] overflow-hidden bg-black",
          // Cancels the app shell's `<main>` padding (`SpacingClasses.main`) so
          // the player is full-bleed, matching every other player in the app.
          // No explicit width class: this relies on the default block
          // `width: auto` expanding to fill the negative margins below —
          // `w-full` would instead resolve to 100% of `<main>`'s *padded*
          // content box and leave a gap equal to the padding.
          SpacingClasses.reset,
        )}
      >

        <TvShowPlayerHeader
          id={id}
          episode={episode}
          selectedSource={selectedSource?.id ?? ""}
          onOpenSource={sourceHandlers.open}
          onOpenEpisode={episodeHandlers.open}
          {...headerProps}
        />

        {selectedSource ? (
          <iframe
            key={`${selectedSource.id}:${selectedSource.url}`}
            src={selectedSource.url}
            allowFullScreen
            allow={selectedSource.capabilities.iframe?.allow}
            referrerPolicy={selectedSource.capabilities.iframe?.referrerPolicy}
            title={`${selectedSource.label} player`}
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
            <h3 className="text-lg font-semibold">No playable source found</h3>
            <p className="max-w-md text-sm text-white/60">
              This episode has no compatible TV source right now.
            </p>
          </div>
        )}
      </div>

      <TvShowPlayerSourceSelection
        opened={sourceOpened}
        onClose={sourceHandlers.close}
        players={players}
        selectedSource={selectedIndex}
        setSelectedSource={(index) => {
          const source = sources[index];
          if (source) void setSourceParam(source.id);
        }}
      />

      <TvShowPlayerEpisodeSelection
        id={id}
        opened={episodeOpened}
        onClose={episodeHandlers.close}
        episodes={episodes}
        selectedSourceId={selectedSource?.id}
      />
    </>
  );
};

export default memo(TvShowPlayer);
