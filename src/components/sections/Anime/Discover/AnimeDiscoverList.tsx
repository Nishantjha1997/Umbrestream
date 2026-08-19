"use client";

import BackToTopButton from "@/components/ui/button/BackToTopButton";
import ServiceRetryState from "@/components/ui/feedback/ServiceRetryState";
import { Button, Spinner } from "@heroui/react";
import { useInViewport } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { memo, useEffect } from "react";
import PosterCard from "@/components/media/PosterCard";
import { fromAnime } from "@/utils/normalize-media";
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
  const genre = searchParams.get("genre") || undefined;

  const { data, isPending, status, refetch, isFetching, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["discover-anime", category, genre],
      queryFn: ({ pageParam }) => {
        const { seasonYear, season } = currentAniListSeason();
        const vars: Parameters<typeof anilistApi.discover>[0] = { page: pageParam, perPage: 24 };
        if (genre) vars.genre = genre;

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

  if (status === "error") {
    return (
      <ServiceRetryState
        title="Couldn’t reach AniList"
        description="The anime catalogue didn’t load. It’s usually temporary."
        isRetrying={isFetching}
        onRetry={() => void refetch()}
      />
    );
  }

  const title = genre ? `${genre} Anime` : CATEGORY_NAMES[category] || "Discover Anime";

  if (isPending) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <SectionTitle>{title}</SectionTitle>
        <div className="movie-grid">
          <Loop count={24} prefix="SkeletonDiscoverAnimePosterCard">
            <PosterCardSkeleton />
          </Loop>
        </div>
      </div>
    );
  }

  // A genre can legitimately return nothing — say "no matches" instead of
  // "end of the list", which describes exhaustion, not emptiness.
  const totalResults = data.pages.reduce((count, page) => count + page.media.length, 0);
  if (totalResults === 0) {
    return (
      <div className="flex flex-col gap-6 py-6">
        <SectionTitle>{title}</SectionTitle>
        <div
          role="status"
          className="glass-panel flex min-h-48 w-full flex-col items-center justify-center gap-3 rounded-(--radius-panel) border px-6 py-10 text-center"
        >
          <h2 className="text-lg font-semibold">
            No anime match {genre ? `the “${genre}” genre` : "your filters"}
          </h2>
          <p className="text-default-500 max-w-sm text-sm">
            Try a different genre, or browse the full anime catalogue instead.
          </p>
          <Button as={Link} href="/anime/discover" size="sm" radius="full" variant="flat">
            Clear filters
          </Button>
        </div>
        <BackToTopButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 py-6">
      <SectionTitle>{title}</SectionTitle>
      <div className="movie-grid">
        {data.pages.map((page) => {
          return page.media.map((anime) => {
            return <PosterCard key={anime.id} media={fromAnime(anime)} variant="grid" />;
          });
        })}
      </div>
      <div ref={ref} className="flex h-24 items-center justify-center">
        {isFetchingNextPage && (
          <Spinner size="lg" variant="wave" label={getLoadingLabel()} />
        )}
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
