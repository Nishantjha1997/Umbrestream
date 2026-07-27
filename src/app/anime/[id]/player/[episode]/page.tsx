"use client";

import { anilistApi } from "@/api/anilist";
import AnimePlayer from "@/components/sections/Anime/Player/Player";
import { Params } from "@/types";
import type { AniListMediaDetail } from "@/types/anilist";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { use } from "react";
import { NextPage } from "next";

const AnimePlayerPage: NextPage<Params<{ id: number; episode: number }>> = ({ params }) => {
  const { id, episode } = use(params);

  const {
    data: anime,
    isPending,
    error,
  } = useQuery<AniListMediaDetail | null>({
    queryFn: () => anilistApi.details(id),
    queryKey: ["anime-player-details", id],
  });

  if (isPending) {
    return <Spinner size="lg" className="absolute-center" variant="simple" />;
  }

  if (error || !anime) notFound();

  const episodeCount = anime.episodes;
  if (episodeCount && (episode < 1 || episode > episodeCount)) notFound();

  return <AnimePlayer anime={anime} episode={Number(episode)} />;
};

export default AnimePlayerPage;
