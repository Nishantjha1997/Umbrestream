"use client";

import React, { useState, useMemo, forwardRef, memo } from "react";
import {
  Card,
  CardHeader,
  CardBody,
  Input,
  ScrollShadow,
  Tabs,
  Tab,
  Tooltip,
  Chip,
  Button,
} from "@heroui/react";
import { Grid, List, Search, PlayOutline } from "@/utils/icons";
import { useDebouncedValue } from "@mantine/hooks";
import Link from "next/link";
import SectionTitle from "@/components/ui/other/SectionTitle";
import type { AniListMediaDetail } from "@/types/anilist";
import { cn } from "@/utils/helpers";

interface AnimeEpisodesSelectionProps {
  anime: AniListMediaDetail;
}

const AnimeEpisodesSelection = forwardRef<HTMLElement, AnimeEpisodesSelectionProps>(
  ({ anime }, ref) => {
    const totalEpisodes = anime.episodes || 12;
    const [search, setSearch] = useState("");
    const [searchQuery] = useDebouncedValue(search, 300);
    const [layout, setLayout] = useState<"list" | "grid">("list");
    const [selectedChunk, setSelectedChunk] = useState<number>(0);

    // Create episode items array
    const allEpisodes = useMemo(() => {
      return Array.from({ length: totalEpisodes }, (_, i) => i + 1);
    }, [totalEpisodes]);

    // Chunk size for large anime (e.g. 50 episodes per tab)
    const CHUNK_SIZE = 50;
    const totalChunks = Math.ceil(totalEpisodes / CHUNK_SIZE);

    const filteredEpisodes = useMemo(() => {
      let list = allEpisodes;
      if (totalChunks > 1) {
        const start = selectedChunk * CHUNK_SIZE;
        list = list.slice(start, start + CHUNK_SIZE);
      }
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        list = list.filter((epNum) => epNum.toString().includes(q) || `ep ${epNum}`.includes(q));
      }
      return list;
    }, [allEpisodes, selectedChunk, CHUNK_SIZE, totalChunks, searchQuery]);

    const title = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Anime";
    const coverUrl = anime.coverImage.large || anime.coverImage.medium || "";

    return (
      <section ref={ref} id="episodes-section" className="z-3 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <SectionTitle color="secondary">Episodes ({totalEpisodes})</SectionTitle>
        </div>

        <Card className="sm:p-3">
          <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 flex-1 w-full">
              <Input
                isClearable
                aria-label="Search Episodes"
                placeholder="Search episode (e.g. 1, 12)..."
                value={search}
                onValueChange={setSearch}
                startContent={<Search />}
                classNames={{ inputWrapper: "border-2 border-foreground-200" }}
              />
              <Tooltip content={layout === "list" ? "List View" : "Grid View"}>
                <Tabs
                  color="secondary"
                  aria-label="Layout Select"
                  size="sm"
                  classNames={{ tabList: "border-2 border-foreground-200" }}
                  onSelectionChange={(value) => setLayout(value as typeof layout)}
                  selectedKey={layout}
                >
                  <Tab key="list" title={<List />} />
                  <Tab key="grid" title={<Grid />} />
                </Tabs>
              </Tooltip>
            </div>

            {totalChunks > 1 && (
              <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1">
                {Array.from({ length: totalChunks }, (_, idx) => {
                  const startEp = idx * CHUNK_SIZE + 1;
                  const endEp = Math.min((idx + 1) * CHUNK_SIZE, totalEpisodes);
                  return (
                    <Button
                      key={idx}
                      size="sm"
                      variant={selectedChunk === idx ? "solid" : "flat"}
                      color={selectedChunk === idx ? "secondary" : "default"}
                      className="text-xs min-w-0 px-2.5 h-8"
                      onPress={() => setSelectedChunk(idx)}
                    >
                      {startEp}-{endEp}
                    </Button>
                  );
                })}
              </div>
            )}
          </CardHeader>

          <CardBody>
            <ScrollShadow className="h-[550px] py-2 pr-2 sm:pr-3">
              {filteredEpisodes.length === 0 ? (
                <div className="flex h-40 items-center justify-center text-default-400">
                  No episodes found.
                </div>
              ) : layout === "grid" ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                  {filteredEpisodes.map((epNum) => (
                    <AnimeEpisodeGridCard
                      key={epNum}
                      animeId={anime.id}
                      episodeNumber={epNum}
                      animeTitle={title}
                      coverUrl={coverUrl}
                    />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {filteredEpisodes.map((epNum) => (
                    <AnimeEpisodeListCard
                      key={epNum}
                      animeId={anime.id}
                      episodeNumber={epNum}
                      animeTitle={title}
                      coverUrl={coverUrl}
                    />
                  ))}
                </div>
              )}
            </ScrollShadow>
          </CardBody>
        </Card>
      </section>
    );
  },
);

AnimeEpisodesSelection.displayName = "AnimeEpisodesSelection";

export default memo(AnimeEpisodesSelection);

interface AnimeEpisodeCardProps {
  animeId: number;
  episodeNumber: number;
  animeTitle: string;
  coverUrl: string;
}

export const AnimeEpisodeListCard: React.FC<AnimeEpisodeCardProps> = ({
  animeId,
  episodeNumber,
  animeTitle,
  coverUrl,
}) => {
  return (
    <Card
      isPressable
      as={Link}
      href={`/anime/${animeId}/player/${episodeNumber}`}
      className="group relative flex flex-row items-center gap-4 overflow-hidden border border-foreground-100/30 p-2 transition-all hover:border-secondary-400/50 hover:bg-secondary-500/10"
    >
      <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg">
        <img
          src={coverUrl}
          alt={`Episode ${episodeNumber}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayOutline className="text-secondary text-2xl" />
        </div>
      </div>

      <div className="flex flex-col flex-1 gap-1 min-w-0">
        <div className="flex items-center gap-2">
          <Chip size="sm" color="secondary" variant="flat" className="font-semibold text-xs">
            EP {episodeNumber}
          </Chip>
          <h4 className="truncate text-sm font-medium text-foreground">
            {animeTitle} — Episode {episodeNumber}
          </h4>
        </div>
        <p className="text-xs text-default-400">Click to play Episode {episodeNumber}</p>
      </div>

      <Button
        size="sm"
        color="secondary"
        variant="flat"
        className="mr-2 font-medium hidden sm:flex"
        startContent={<PlayOutline size={16} />}
      >
        Play
      </Button>
    </Card>
  );
};

export const AnimeEpisodeGridCard: React.FC<AnimeEpisodeCardProps> = ({
  animeId,
  episodeNumber,
  animeTitle,
  coverUrl,
}) => {
  return (
    <Card
      isPressable
      as={Link}
      href={`/anime/${animeId}/player/${episodeNumber}`}
      className="group relative flex flex-col overflow-hidden border border-foreground-100/30 transition-all hover:border-secondary-400/50 hover:bg-secondary-500/10 p-2 gap-2"
    >
      <div className="relative h-28 w-full overflow-hidden rounded-lg">
        <img
          src={coverUrl}
          alt={`Episode ${episodeNumber}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <PlayOutline className="text-secondary text-3xl" />
        </div>
        <Chip
          size="sm"
          color="secondary"
          className="absolute top-2 left-2 font-bold text-xs shadow-md z-10"
        >
          EP {episodeNumber}
        </Chip>
      </div>
      <div className="flex flex-col gap-0.5 px-1">
        <h4 className="truncate text-xs font-semibold text-foreground">Episode {episodeNumber}</h4>
        <p className="truncate text-[10px] text-default-400">{animeTitle}</p>
      </div>
    </Card>
  );
};
