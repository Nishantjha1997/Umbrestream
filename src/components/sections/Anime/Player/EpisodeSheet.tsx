"use client";

/**
 * Anime's episode picker (renamed from `EpisodeSelection.tsx` — Phase 6,
 * §10 — now that it renders the full sheet, not just the phone half). Same
 * responsive overlay split `PlayerSourceSheet.tsx` established for servers:
 * phone keeps the `VaulDrawer` bottom sheet, while desktop mounts only
 * `PlayerEpisodePanel`'s centred card
 * (`DESKTOP_SPEC.md` §I). The chunked numbered grid — AniList gives no rich
 * per-episode data the way TMDB does for TV — is genuinely different content
 * from TV's `EpisodeListCard` list, but the wrapper pattern is identical, so
 * the chunk tabs and episode cards are built once and rendered into both
 * halves rather than duplicated.
 */

import PlayerEpisodePanel from "@/components/player/PlayerEpisodePanel";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import { HandlerType } from "@/types/component";
import { Button, Card, Chip, ScrollShadow } from "@heroui/react";
import { useMediaQuery } from "@mantine/hooks";
import { PlayOutline } from "@/utils/icons";
import Link from "next/link";
import Image from "next/image";
import type { AniListMediaDetail } from "@/types/anilist";
import type { AudioVariant } from "@/lib/sources/types";
import React, { useMemo, useState } from "react";

interface AnimePlayerEpisodeSheetProps extends HandlerType {
  anime: AniListMediaDetail;
  currentEpisode: number;
  selectedSourceId?: string;
  audioVariant: AudioVariant;
}

const CHUNK_SIZE = 50;

const AnimePlayerEpisodeSheet: React.FC<AnimePlayerEpisodeSheetProps> = ({
  opened,
  onClose,
  anime,
  currentEpisode,
  selectedSourceId,
  audioVariant,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)", false, {
    getInitialValueInEffect: false,
  });
  const totalEpisodes = anime.episodes || 12;
  const totalChunks = Math.ceil(totalEpisodes / CHUNK_SIZE);
  const [selectedChunk, setSelectedChunk] = useState<number>(() =>
    Math.floor((currentEpisode - 1) / CHUNK_SIZE),
  );

  const allEpisodes = useMemo(
    () => Array.from({ length: totalEpisodes }, (_, i) => i + 1),
    [totalEpisodes],
  );

  const displayedEpisodes = useMemo(() => {
    const start = selectedChunk * CHUNK_SIZE;
    return allEpisodes.slice(start, start + CHUNK_SIZE);
  }, [allEpisodes, selectedChunk]);

  const title = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Anime";
  const coverUrl = anime.coverImage.large || anime.coverImage.medium || "";
  const episodeHref = (episodeNumber: number, targetAudio: AudioVariant) => {
    const params = new URLSearchParams({ audio: targetAudio });
    if (selectedSourceId && targetAudio === audioVariant) params.set("src", selectedSourceId);
    return `/anime/${anime.id}/player/${episodeNumber}?${params.toString()}`;
  };

  const chunkTabs = totalChunks > 1 && (
    <div className="border-foreground-100 flex items-center gap-1 overflow-x-auto border-b pb-2">
      {Array.from({ length: totalChunks }, (_, idx) => {
        const startEp = idx * CHUNK_SIZE + 1;
        const endEp = Math.min((idx + 1) * CHUNK_SIZE, totalEpisodes);
        return (
          <Button
            key={idx}
            size="sm"
            variant={selectedChunk === idx ? "solid" : "flat"}
            color={selectedChunk === idx ? "primary" : "default"}
            className="h-7 min-w-0 px-2.5 text-xs"
            onPress={() => setSelectedChunk(idx)}
          >
            {startEp}-{endEp}
          </Button>
        );
      })}
    </div>
  );

  const episodeGrid = (gridClassName: string) => (
    <div className={gridClassName}>
      {displayedEpisodes.map((epNum) => {
        const isCurrent = epNum === currentEpisode;

        return (
          <Card
            key={epNum}
            className={`group relative flex flex-row items-center gap-3 overflow-hidden border p-2 transition-all ${
              isCurrent
                ? "border-primary-500 bg-primary-500/20 font-bold"
                : "border-foreground-100/30 hover:border-primary-400/50 hover:bg-primary-500/10"
            }`}
          >
            <div className="relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg">
              {coverUrl ? (
                <Image
                  src={coverUrl}
                  alt={`Episode ${epNum}`}
                  fill
                  sizes="80px"
                  unoptimized
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="bg-default-100 h-full w-full" />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                <PlayOutline className="text-primary text-xl" />
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <Chip
                  size="sm"
                  color={isCurrent ? "primary" : "default"}
                  variant={isCurrent ? "solid" : "flat"}
                  className="text-xs font-bold"
                >
                  EP {epNum}
                </Chip>
                <h4 className="text-foreground truncate text-xs font-semibold">Episode {epNum}</h4>
              </div>
              <p className="text-default-400 truncate text-[11px]">{title}</p>
              <div
                className="mt-1.5 flex gap-1.5"
                role="group"
                aria-label={`Episode ${epNum} audio`}
              >
                {(["sub", "dub"] as const).map((variant) => (
                  <Button
                    key={variant}
                    as={Link}
                    href={episodeHref(epNum, variant)}
                    onPress={onClose}
                    size="sm"
                    radius="full"
                    variant={isCurrent && audioVariant === variant ? "solid" : "flat"}
                    color={isCurrent && audioVariant === variant ? "primary" : "default"}
                    className="h-8 min-w-14 px-3 text-[11px] font-semibold"
                    aria-label={`Play episode ${epNum} ${variant === "dub" ? "dubbed" : "subtitled"}`}
                  >
                    {variant === "dub" ? "Dub" : "Sub"}
                  </Button>
                ))}
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );

  if (isDesktop) {
    return (
      <PlayerEpisodePanel
        opened={opened}
        onClose={onClose}
        title={`Select Episode (${totalEpisodes})`}
      >
        <div className="flex flex-col gap-3">
          {chunkTabs}
          <ScrollShadow className="max-h-[65vh] pr-1">
            {episodeGrid("grid grid-cols-2 gap-2.5")}
          </ScrollShadow>
        </div>
      </PlayerEpisodePanel>
    );
  }

  return (
    <VaulDrawer
      open={opened}
      onClose={onClose}
      backdrop="blur"
      title={`Select Episode (${totalEpisodes})`}
      direction="right"
      hiddenHandler
      withCloseButton
    >
      <div className="flex flex-col gap-3 p-4">
        {chunkTabs}
        <ScrollShadow className="h-[600px] pr-1">
          {episodeGrid("grid grid-cols-1 gap-2.5")}
        </ScrollShadow>
      </div>
    </VaulDrawer>
  );
};

export default AnimePlayerEpisodeSheet;
