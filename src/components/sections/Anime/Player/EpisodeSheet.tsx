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
import { getAnimeEpisodeHistories } from "@/actions/histories";
import { anilistApi } from "@/api/anilist";
import { HandlerType } from "@/types/component";
import { Button, Card, Chip, ScrollShadow } from "@heroui/react";
import { useMediaQuery } from "@mantine/hooks";
import { Check, Next, PlayOutline } from "@/utils/icons";
import Link from "next/link";
import Image from "next/image";
import type { AniListMediaDetail } from "@/types/anilist";
import type { AudioVariant } from "@/lib/sources/types";
import {
  animeTitle,
  buildAnimeEpisodeRanges,
  buildAnimeEpisodeProgress,
  buildAnimeSeasonOptions,
  getAnimeEpisodeCount,
} from "@/lib/anime/episodeNavigation";
import { useQuery } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";

interface AnimePlayerEpisodeSheetProps extends HandlerType {
  anime: AniListMediaDetail;
  currentEpisode: number;
  selectedSourceId?: string;
  audioVariant: AudioVariant;
  inline?: boolean;
  /** "sidebar" renders as a sticky always-visible panel beside the player on desktop. */
  variant?: "sidebar";
}

const CHUNK_SIZE = 50;

const AnimePlayerEpisodeSheet: React.FC<AnimePlayerEpisodeSheetProps> = ({
  opened,
  onClose,
  anime,
  currentEpisode,
  selectedSourceId,
  audioVariant,
  inline = false,
  variant,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)", false, {
    getInitialValueInEffect: false,
  });
  const [selectedAnimeId, setSelectedAnimeId] = useState(anime.id);
  const [selectedChunk, setSelectedChunk] = useState<number>(() =>
    Math.floor((currentEpisode - 1) / CHUNK_SIZE),
  );

  useEffect(() => {
    setSelectedAnimeId(anime.id);
    setSelectedChunk(Math.floor((currentEpisode - 1) / CHUNK_SIZE));
  }, [anime.id, currentEpisode]);

  const { data: relatedAnime, isFetching: isSeasonLoading } = useQuery({
    queryKey: ["anime-player-season", selectedAnimeId],
    queryFn: () => anilistApi.details(selectedAnimeId),
    enabled: selectedAnimeId !== anime.id,
    staleTime: 1000 * 60 * 60,
  });

  const listAnime = selectedAnimeId === anime.id ? anime : (relatedAnime ?? null);
  const seasonOptions = useMemo(
    () => buildAnimeSeasonOptions(listAnime ?? anime),
    [listAnime, anime],
  );
  const selectedOption =
    seasonOptions.find((option) => option.id === selectedAnimeId) ??
    buildAnimeSeasonOptions(anime).find((option) => option.id === selectedAnimeId);
  const title = listAnime ? animeTitle(listAnime) : (selectedOption?.label ?? "Anime");
  const totalEpisodes = listAnime ? getAnimeEpisodeCount(listAnime) : 0;
  const episodeRanges = useMemo(
    () => buildAnimeEpisodeRanges(totalEpisodes, CHUNK_SIZE),
    [totalEpisodes],
  );
  const totalChunks = episodeRanges.length;

  const allEpisodes = useMemo(
    () => Array.from({ length: totalEpisodes }, (_, i) => i + 1),
    [totalEpisodes],
  );

  const displayedEpisodes = useMemo(() => {
    const start = selectedChunk * CHUNK_SIZE;
    return allEpisodes.slice(start, start + CHUNK_SIZE);
  }, [allEpisodes, selectedChunk]);

  const coverUrl = listAnime?.coverImage.large || listAnime?.coverImage.medium || "";
  const { data: historyResponse, isPending: isHistoryPending } = useQuery({
    queryKey: ["anime-player-episode-history", listAnime?.id],
    queryFn: () => getAnimeEpisodeHistories(listAnime?.id ?? 0),
    enabled: listAnime !== null,
    staleTime: 1000 * 60 * 2,
    retry: false,
  });
  const progressByEpisode = useMemo(
    () => buildAnimeEpisodeProgress(historyResponse?.data ?? []),
    [historyResponse],
  );
  const watchedCount = Array.from(progressByEpisode.values()).filter(
    (progress) => progress.completed,
  ).length;

  const episodeHref = (episodeNumber: number, targetAudio: AudioVariant) => {
    const params = new URLSearchParams({ audio: targetAudio });
    if (selectedSourceId && targetAudio === audioVariant && listAnime?.id === anime.id) {
      params.set("src", selectedSourceId);
    }
    return `/anime/${listAnime?.id ?? selectedAnimeId}/player/${episodeNumber}?${params.toString()}`;
  };

  const seasonSelector = seasonOptions.length > 1 && (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[.12em] text-white/55 uppercase">
        Season / continuation
      </span>
      <select
        value={selectedAnimeId}
        onChange={(event) => {
          setSelectedAnimeId(Number(event.target.value));
          setSelectedChunk(0);
        }}
        className="focus-visible:ring-primary/70 min-h-11 w-full min-w-0 rounded-xl border border-white/12 bg-[#17151c] px-3 text-xs font-semibold text-white outline-none focus-visible:ring-2"
        aria-label="Choose Anime season or continuation"
      >
        {seasonOptions.map((option) => (
          <option key={option.id} value={option.id}>
            {option.relation === "previous"
              ? "Previous"
              : option.relation === "next"
                ? "Next"
                : "Current"}
            {` · ${option.label}`}
          </option>
        ))}
      </select>
    </label>
  );

  const episodeRangeSelector = totalChunks > 1 && (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[.12em] text-white/55 uppercase">
        Episode range
      </span>
      <select
        value={selectedChunk}
        onChange={(event) => setSelectedChunk(Number(event.target.value))}
        className="focus-visible:ring-primary/70 min-h-11 w-full min-w-0 rounded-xl border border-white/12 bg-[#17151c] px-3 text-xs font-semibold text-white outline-none focus-visible:ring-2"
        aria-label="Choose episode range"
      >
        {episodeRanges.map((range) => (
          <option key={range.index} value={range.index}>
            {range.label}
          </option>
        ))}
      </select>
    </label>
  );

  const episodeGrid = (gridClassName: string) => (
    <div className={gridClassName}>
      {!listAnime ? (
        <div className="col-span-full flex min-h-40 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.025] px-5 text-center text-sm text-white/60">
          {isSeasonLoading ? "Loading this season’s episodes…" : "This season could not be loaded."}
        </div>
      ) : displayedEpisodes.length === 0 ? (
        <div className="col-span-full flex min-h-40 items-center justify-center rounded-2xl border border-white/8 bg-white/[0.025] px-5 text-center text-sm text-white/60">
          AniList has not published an episode count for this entry yet.
        </div>
      ) : (
        displayedEpisodes.map((epNum) => {
          const isCurrent = listAnime.id === anime.id && epNum === currentEpisode;
          const episodeProgress = progressByEpisode.get(epNum);
          const isWatched = episodeProgress?.completed === true;
          const isPartial = !!episodeProgress && !isWatched && episodeProgress.percent > 0;

          return (
            <Card
              key={epNum}
              className={`group relative flex flex-row items-center gap-3 overflow-hidden border p-2 transition-all ${
                isCurrent
                  ? "border-primary-500 bg-primary-500/20 font-bold"
                  : isWatched
                    ? "border-white/8 bg-white/[0.035]"
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
                <div
                  className={`absolute inset-0 flex items-center justify-center bg-black/45 transition-opacity ${
                    isWatched ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                  }`}
                >
                  {isWatched ? (
                    <span className="flex size-7 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white/80">
                      <Check aria-hidden className="text-sm" />
                    </span>
                  ) : (
                    <PlayOutline className="text-primary text-xl" />
                  )}
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
                  <h4 className="text-foreground truncate text-xs font-semibold">
                    Episode {epNum}
                  </h4>
                </div>
                <p className="text-default-400 truncate text-[11px]">
                  {isWatched
                    ? "Watched"
                    : isPartial
                      ? `${episodeProgress.percent}% watched`
                      : title}
                </p>
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
              {isPartial && (
                <span
                  aria-hidden="true"
                  className="absolute inset-x-2 bottom-0 h-0.5 overflow-hidden rounded-full bg-white/10"
                >
                  <span
                    className="bg-primary/70 block h-full rounded-full"
                    style={{ width: `${episodeProgress.percent}%` }}
                  />
                </span>
              )}
            </Card>
          );
        })
      )}
    </div>
  );

  const nextEpisode =
    listAnime?.id === anime.id && currentEpisode < totalEpisodes ? currentEpisode + 1 : null;
  const nextEpisodeHref = nextEpisode ? episodeHref(nextEpisode, audioVariant) : null;
  const isBrowsingRelatedSeason = selectedAnimeId !== anime.id;

  if (variant === "sidebar") {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.025]">
        {/* Sidebar header */}
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-primary text-xs font-semibold tracking-[.12em] uppercase">Episodes</p>
          <h2 className="mt-0.5 text-sm font-semibold text-white">{title}</h2>
          <p className="text-xs text-white/70">
            {listAnime?.id === anime.id ? `EP ${currentEpisode} · ` : "Browse · "}
            {audioVariant === "dub" ? "Dub" : "Sub"}
            {totalEpisodes ? ` · ${totalEpisodes} episodes` : ""}
          </p>
          <div className="mt-3 grid gap-2">
            {seasonSelector}
            {episodeRangeSelector}
          </div>
          <p aria-live="polite" className="mt-2 text-[11px] text-white/45">
            {isHistoryPending
              ? "Checking watch history…"
              : watchedCount > 0
                ? `${watchedCount} watched episode${watchedCount === 1 ? "" : "s"}`
                : "Select Sub or Dub to play"}
          </p>
        </div>
        {/* Episode list */}
        <div className="flex flex-col gap-2 overflow-y-auto p-3">
          {episodeGrid("grid grid-cols-1 gap-2")}
        </div>
      </div>
    );
  }

  if (inline) {
    return (
      <section className="mx-auto mt-5 w-full max-w-[min(100vw,1600px)] rounded-3xl border border-white/10 bg-white/[0.025] p-4 shadow-2xl shadow-black/20 sm:mt-7 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-primary text-xs font-semibold tracking-[.12em] uppercase">
              Anime episodes
            </p>
            <h2 className="mt-1 text-lg font-semibold text-white sm:text-xl">{title}</h2>
            <p className="mt-1 text-sm text-white/70">
              {isBrowsingRelatedSeason
                ? "Choose an episode from this continuation"
                : `Episode ${currentEpisode} · ${audioVariant === "dub" ? "Dub" : "Sub"}`}
            </p>
            <div className="mt-3 grid max-w-md gap-2 sm:grid-cols-2">
              {seasonSelector}
              {episodeRangeSelector}
            </div>
          </div>
          {nextEpisodeHref ? (
            <Button
              as={Link}
              href={nextEpisodeHref}
              onPress={onClose}
              color="primary"
              radius="full"
              className="min-h-11 px-4 font-semibold"
              endContent={<Next aria-hidden size={16} />}
            >
              Next episode
            </Button>
          ) : isBrowsingRelatedSeason ? (
            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
              Choose an episode
            </span>
          ) : (
            <span className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
              Final episode
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          <div className="max-h-[min(62vh,38rem)] overflow-y-auto pr-1">
            {episodeGrid("grid grid-cols-1 gap-2.5 sm:grid-cols-2")}
          </div>
        </div>
      </section>
    );
  }

  if (isDesktop) {
    return (
      <PlayerEpisodePanel
        opened={opened}
        onClose={onClose}
        title={`Select Episode (${totalEpisodes})`}
      >
        <div className="flex flex-col gap-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {seasonSelector}
            {episodeRangeSelector}
          </div>
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
        <div className="grid gap-2 sm:grid-cols-2">
          {seasonSelector}
          {episodeRangeSelector}
        </div>
        <ScrollShadow className="h-[600px] pr-1">
          {episodeGrid("grid grid-cols-1 gap-2.5")}
        </ScrollShadow>
      </div>
    </VaulDrawer>
  );
};

export default AnimePlayerEpisodeSheet;
