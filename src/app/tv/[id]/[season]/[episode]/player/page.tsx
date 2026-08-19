"use client";

import { tmdbBrowser } from "@/api/tmdb-browser";
import { Params } from "@/types";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { use } from "react";
import dynamic from "next/dynamic";
import { NextPage } from "next";
import { getTvShowLastPosition } from "@/actions/histories";
import { resolveAdjacentEpisode } from "@/lib/tv/adjacentEpisode";
const TvShowPlayer = dynamic(() => import("@/components/sections/TV/Player/Player"));

const TvShowPlayerPage: NextPage<Params<{ id: number; season: number; episode: number }>> = ({
  params,
}) => {
  const { id, season, episode } = use(params);

  const {
    data: tv,
    isPending: isPendingTv,
    error: errorTv,
  } = useQuery({
    queryFn: () => tmdbBrowser.tvShows.details(id),
    queryKey: ["tv-show-player-details", id],
  });

  const {
    data: seasonDetail,
    isPending: isPendingSeason,
    error: errorSeason,
  } = useQuery({
    queryFn: () => tmdbBrowser.tvShows.season(id, season),
    queryKey: ["tv-show-season", id, season],
  });

  const { data: startAt } = useQuery({
    queryFn: () => getTvShowLastPosition(id, season, episode),
    queryKey: ["tv-show-player-start-at", id, season, episode],
  });

  if (isPendingTv || isPendingSeason) {
    return <Spinner size="lg" className="absolute-center" color="warning" variant="simple" />;
  }

  const EPISODE = seasonDetail?.episodes.find(
    (e) => e.episode_number.toString() === episode.toString(),
  );

  if (!EPISODE || errorTv || errorSeason) notFound();

  const nextEpisode = resolveAdjacentEpisode(
    tv.seasons,
    season,
    EPISODE.episode_number,
    seasonDetail.episodes,
    "next",
  );
  const prevEpisode = resolveAdjacentEpisode(
    tv.seasons,
    season,
    EPISODE.episode_number,
    seasonDetail.episodes,
    "previous",
  );

  return (
    <TvShowPlayer
      tv={tv}
      id={id}
      seriesName={tv.name}
      seasonName={seasonDetail.name}
      episode={EPISODE}
      episodes={seasonDetail.episodes}
      nextEpisode={nextEpisode}
      prevEpisode={prevEpisode}
      startAt={startAt}
    />
  );
};

export default TvShowPlayerPage;
