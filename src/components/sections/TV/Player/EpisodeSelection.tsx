"use client";

import { tmdbBrowser } from "@/api/tmdb-browser";
import PlayerEpisodePanel from "@/components/player/PlayerEpisodePanel";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import { HandlerType } from "@/types/component";
import { useMediaQuery } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import type { Episode, Season } from "tmdb-ts";
import { EpisodeListCard } from "../Details/Episodes";

interface TvShowPlayerEpisodeSelectionProps extends HandlerType {
  id: number;
  episodes: Episode[];
  seasons: Season[];
  currentSeason: number;
  currentEpisode: number;
  selectedSourceId?: string;
  inline?: boolean;
  variant?: "sidebar";
}

const TvShowPlayerEpisodeSelection: React.FC<TvShowPlayerEpisodeSelectionProps> = ({
  opened,
  onClose,
  id,
  episodes,
  seasons,
  currentSeason,
  currentEpisode,
  selectedSourceId,
  inline,
  variant,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)", false, {
    getInitialValueInEffect: false,
  });

  const displaySeasons = useMemo(
    () =>
      seasons
        .filter((season) => season.season_number > 0 && season.episode_count > 0)
        .sort((a, b) => a.season_number - b.season_number),
    [seasons],
  );
  const [selectedSeason, setSelectedSeason] = useState(currentSeason);

  useEffect(() => {
    setSelectedSeason(currentSeason);
  }, [currentSeason]);

  const {
    data: selectedSeasonDetail,
    isFetching: isSeasonLoading,
    isError: isSeasonError,
    refetch: refetchSeason,
  } = useQuery({
    queryKey: ["tv-player-season", id, selectedSeason],
    queryFn: () => tmdbBrowser.tvShows.season(id, selectedSeason),
    enabled: selectedSeason !== currentSeason,
    staleTime: 1000 * 60 * 30,
  });

  const displayedEpisodes =
    selectedSeason === currentSeason ? episodes : (selectedSeasonDetail?.episodes ?? []);
  const selectedSeasonName =
    displaySeasons.find((season) => season.season_number === selectedSeason)?.name ??
    `Season ${selectedSeason}`;

  const episodeCards = displayedEpisodes.map((episode, index) => (
    <EpisodeListCard
      id={id}
      key={episode.id}
      episode={episode}
      order={index + 1}
      withAnimation={false}
      sourceId={selectedSourceId}
      compact
      isCurrent={selectedSeason === currentSeason && episode.episode_number === currentEpisode}
    />
  ));

  const seasonSelector = displaySeasons.length > 0 && (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[10px] font-semibold tracking-[.12em] text-white/55 uppercase">
        Season
      </span>
      <select
        value={selectedSeason}
        onChange={(event) => setSelectedSeason(Number(event.target.value))}
        className="focus-visible:ring-primary/70 min-h-11 w-full min-w-0 rounded-xl border border-white/12 bg-[#17151c] px-3 text-xs font-semibold text-white outline-none focus-visible:ring-2"
        aria-label="Choose TV season"
      >
        {displaySeasons.map((season) => (
          <option key={season.id} value={season.season_number}>
            {season.name || `Season ${season.season_number}`} · {season.episode_count} episodes
          </option>
        ))}
      </select>
    </label>
  );

  const episodeList = (
    <>
      {isSeasonLoading ? (
        <div
          aria-live="polite"
          className="flex min-h-32 items-center justify-center rounded-xl border border-white/8 bg-white/[0.025] px-4 text-center text-sm text-white/60"
        >
          Loading {selectedSeasonName}…
        </div>
      ) : isSeasonError ? (
        <div className="flex min-h-32 flex-col items-center justify-center gap-3 rounded-xl border border-white/8 bg-white/[0.025] px-4 text-center text-sm text-white/60">
          <p>Couldn&apos;t load {selectedSeasonName}.</p>
          <button
            type="button"
            onClick={() => void refetchSeason()}
            className="min-h-11 rounded-full border border-white/15 px-4 font-semibold text-white hover:bg-white/8 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
          >
            Retry
          </button>
        </div>
      ) : episodeCards.length > 0 ? (
        <div className="grid grid-cols-1 gap-2">{episodeCards}</div>
      ) : (
        <div className="flex min-h-32 items-center justify-center rounded-xl border border-white/8 bg-white/[0.025] px-4 text-center text-sm text-white/60">
          No episodes are available for {selectedSeasonName} yet.
        </div>
      )}
    </>
  );

  if (variant === "sidebar") {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs font-semibold tracking-[.12em] text-primary uppercase">Episodes</p>
          <h2 className="mt-0.5 text-sm font-semibold text-white">{selectedSeasonName}</h2>
          <div className="mt-3">{seasonSelector}</div>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto p-3">
          {episodeList}
        </div>
      </div>
    );
  }

  if (inline) {
    return (
      <section className="mx-auto mt-5 w-full max-w-[min(100vw,1600px)] rounded-3xl border border-white/10 bg-white/[0.025] p-4 shadow-2xl shadow-black/20 sm:mt-7 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[.12em] text-primary uppercase">Episodes</p>
            <h2 className="mt-1 text-lg font-semibold text-white">{selectedSeasonName}</h2>
            <div className="mt-3 max-w-md">{seasonSelector}</div>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="max-h-[min(62vh,38rem)] overflow-y-auto pr-1">
            {isSeasonLoading || isSeasonError || episodeCards.length === 0 ? (
              episodeList
            ) : (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">{episodeCards}</div>
            )}
          </div>
        </div>
      </section>
    );
  }

  if (isDesktop) {
    return (
      <PlayerEpisodePanel opened={opened} onClose={onClose} title="Select Episode">
        <div className="mb-3">{seasonSelector}</div>
        {isSeasonLoading || isSeasonError || episodeCards.length === 0 ? (
          episodeList
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">{episodeCards}</div>
        )}
      </PlayerEpisodePanel>
    );
  }

  return (
    <VaulDrawer
      open={opened}
      onClose={onClose}
      backdrop="blur"
      title="Select Episode"
      direction="right"
      hiddenHandler
      withCloseButton
    >
      <div className="flex flex-col gap-3 p-2 sm:p-4">
        {seasonSelector}
        {episodeList}
      </div>
    </VaulDrawer>
  );
};

export default TvShowPlayerEpisodeSelection;
