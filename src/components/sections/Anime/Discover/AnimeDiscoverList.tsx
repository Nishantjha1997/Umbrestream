"use client";

import BackToTopButton from "@/components/ui/button/BackToTopButton";
import { Spinner } from "@heroui/react";
import { useInViewport } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { notFound, useSearchParams } from "next/navigation";
import { memo, useEffect } from "react";
import AnimePosterCard from "../Cards/Poster";
import { anilistApi, currentAniListSeason } from "@/api/anilist";
import Loop from "@/components/ui/other/Loop";
import PosterCardSkeleton from "@/components/ui/other/PosterCardSkeleton";
import { getLoadingLabel } from "@/utils/movies";
import SectionTitle from "@/components/ui/other/SectionTitle";
import type { AniListSort } from "@/types/anilist";

const CATEGORY_NAMES: Record<string, string> = {
  trending: "Trending Anime Now",
  popular: "Most Popular Anime",
  topRated: "Top Rated Anime",
  thisSeason: "This Season's Anime",
};

const AnimeDiscoverList = () => {
  const { ref, inViewport } = useInViewport();
  const searchParams = useSearchParams();
  const category = searchParams.get("category") || "trending";

  const { data, isPending, status, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["discover-anime", category],
      queryFn: ({ pageParam }) => {
        const { seasonYear, season } = currentAniListSeason();
        const vars: any = { page: pageParam, perPage: 24 };

        if (category === "trending") {
          vars.sort = ["TRENDING_DESC" as AniListSort];
        } else if (category === "popular") {
          vars.sort = ["POPULARITY_DESC" as AniListSort];
        } else if (category === "topRated") {
          vars.sort = ["SCORE_DESC" as AniListSort];
        } else if (category === "thisSeason") {
          vars.sort = ["POPULARITY_DESC" as AniListSort];
          vars.season = season;
          vars.seasonYear = seasonYear;
        } else {
          vars.sort = ["TRENDING_DESC" as AniListSort];
        }

        return anilistApi.discover(vars);
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.currentPage + 1 : undefined,
    });

  useEffect(() => {
    if (inViewport && !isPending) {
      fetchNextPage();
    }
  }, [inViewport, isPending, fetchNextPage]);

  if (status === "error") return notFound();

  const title = CATEGORY_NAMES[category] || "Discover Anime";

  if (isPending) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <SectionTitle color="secondary">{title}</SectionTitle>
        <div className="movie-grid">
          <Loop count={24} prefix="SkeletonDiscoverAnimePosterCard">
            <PosterCardSkeleton variant="bordered" />
          </Loop>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <SectionTitle color="secondary">{title}</SectionTitle>
      <div className="movie-grid">
        {data.pages.map((page) => {
          return page.media.map((anime) => {
            return <AnimePosterCard key={anime.id} anime={anime} variant="bordered" />;
          });
        })}
      </div>
      <div ref={ref} className="flex h-24 items-center justify-center">
        {isFetchingNextPage && <Spinner size="lg" variant="wave" color="secondary" label={getLoadingLabel()} />}
        {!hasNextPage && !isPending && (
          <p className="text-muted-foreground text-center text-base">
            You have reached the end of the list.
          </p>
        )}
      </div>
      <BackToTopButton />
    </div>
  );
};

export default memo(AnimeDiscoverList);
