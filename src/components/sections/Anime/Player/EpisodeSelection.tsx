"use client";

import React, { useState, useMemo } from "react";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import { HandlerType } from "@/types/component";
import { Button, Card, Chip, ScrollShadow } from "@heroui/react";
import { PlayOutline } from "@/utils/icons";
import Link from "next/link";
import Image from "next/image";
import type { AniListMediaDetail } from "@/types/anilist";

interface AnimePlayerEpisodeSelectionProps extends HandlerType {
  anime: AniListMediaDetail;
  currentEpisode: number;
  selectedSourceId?: string;
}

const AnimePlayerEpisodeSelection: React.FC<AnimePlayerEpisodeSelectionProps> = ({
  opened,
  onClose,
  anime,
  currentEpisode,
  selectedSourceId,
}) => {
  const totalEpisodes = anime.episodes || 12;
  const CHUNK_SIZE = 50;
  const totalChunks = Math.ceil(totalEpisodes / CHUNK_SIZE);
  const [selectedChunk, setSelectedChunk] = useState<number>(() => {
    return Math.floor((currentEpisode - 1) / CHUNK_SIZE);
  });

  const allEpisodes = useMemo(() => {
    return Array.from({ length: totalEpisodes }, (_, i) => i + 1);
  }, [totalEpisodes]);

  const displayedEpisodes = useMemo(() => {
    const start = selectedChunk * CHUNK_SIZE;
    return allEpisodes.slice(start, start + CHUNK_SIZE);
  }, [allEpisodes, selectedChunk, CHUNK_SIZE]);

  const title = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Anime";
  const coverUrl = anime.coverImage.large || anime.coverImage.medium || "";
  const sourceQuery = selectedSourceId ? `?src=${encodeURIComponent(selectedSourceId)}` : "";

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
        {totalChunks > 1 && (
          <div className="border-foreground-100 flex items-center gap-1 overflow-x-auto border-b pb-2">
            {Array.from({ length: totalChunks }, (_, idx) => {
              const startEp = idx * CHUNK_SIZE + 1;
              const endEp = Math.min((idx + 1) * CHUNK_SIZE, totalEpisodes);
              return (
                <Button
                  key={idx}
                  size="sm"
                  variant={selectedChunk === idx ? "solid" : "flat"}
                  color={selectedChunk === idx ? "secondary" : "default"}
                  className="h-7 min-w-0 px-2.5 text-xs"
                  onPress={() => setSelectedChunk(idx)}
                >
                  {startEp}-{endEp}
                </Button>
              );
            })}
          </div>
        )}

        <ScrollShadow className="h-[600px] pr-1">
          <div className="grid grid-cols-1 gap-2.5">
            {displayedEpisodes.map((epNum) => {
              const isCurrent = epNum === currentEpisode;

              return (
                <Card
                  key={epNum}
                  isPressable
                  as={Link}
                  href={`/anime/${anime.id}/player/${epNum}${sourceQuery}`}
                  onClick={onClose}
                  className={`group relative flex flex-row items-center gap-3 overflow-hidden border p-2 transition-all ${
                    isCurrent
                      ? "border-secondary-500 bg-secondary-500/20 font-bold"
                      : "border-foreground-100/30 hover:border-secondary-400/50 hover:bg-secondary-500/10"
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
                      <PlayOutline className="text-secondary text-xl" />
                    </div>
                  </div>

                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <Chip
                        size="sm"
                        color={isCurrent ? "secondary" : "default"}
                        variant={isCurrent ? "solid" : "flat"}
                        className="text-xs font-bold"
                      >
                        EP {epNum}
                      </Chip>
                      <h4 className="text-foreground truncate text-xs font-semibold">
                        Episode {epNum}
                      </h4>
                    </div>
                    <p className="text-default-400 truncate text-[11px]">{title}</p>
                  </div>
                </Card>
              );
            })}
          </div>
        </ScrollShadow>
      </div>
    </VaulDrawer>
  );
};

export default AnimePlayerEpisodeSelection;
