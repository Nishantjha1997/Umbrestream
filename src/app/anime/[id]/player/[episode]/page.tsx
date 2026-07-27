"use client";

import { anilistApi } from "@/api/anilist";
import AnimePlayer from "@/components/sections/Anime/Player/Player";
import { Params } from "@/types";
import type { AniListMediaDetail } from "@/types/anilist";
import { Button, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { use } from "react";
import { NextPage } from "next";
import Link from "next/link";

const AnimePlayerPage: NextPage<Params<{ id: number; episode: number }>> = ({ params }) => {
  const { id, episode } = use(params);

  const {
    data: anime,
    isPending,
    error,
    refetch,
    isFetching,
  } = useQuery<AniListMediaDetail | null>({
    queryFn: () => anilistApi.details(id),
    queryKey: ["anime-player-details", id],
  });

  if (isPending) {
    return <Spinner size="lg" className="absolute-center" variant="simple" />;
  }

  // A failed request is not a missing page. AniList rate-limits fairly
  // aggressively, and this used to 404 on any transient error — offer a retry
  // instead of destroying the route.
  if (error) {
    return (
      <div className="absolute-center flex max-w-sm flex-col items-center gap-4 text-center">
        <h4 className="text-lg font-semibold">Couldn&apos;t reach AniList</h4>
        <p className="text-default-500 text-sm">
          The episode data didn&apos;t load. This is usually temporary.
        </p>
        <div className="flex gap-2">
          <Button color="secondary" isLoading={isFetching} onPress={() => refetch()}>
            Try again
          </Button>
          <Button as={Link} href={`/anime/${id}`} variant="flat">
            Back to details
          </Button>
        </div>
      </div>
    );
  }

  // Only a genuine "no such anime" reaches notFound() now.
  if (!anime) notFound();

  const episodeNumber = Number(episode);
  if (!Number.isFinite(episodeNumber) || episodeNumber < 1) notFound();

  const episodeCount = anime.episodes;
  if (episodeCount && episodeNumber > episodeCount) notFound();

  return <AnimePlayer anime={anime} episode={episodeNumber} />;
};

export default AnimePlayerPage;
