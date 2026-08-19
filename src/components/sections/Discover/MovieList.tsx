"use client";

import BackToTopButton from "@/components/ui/button/BackToTopButton";
import { Spinner } from "@heroui/react";
import { useInViewport } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { memo, useEffect } from "react";
import PosterCard from "@/components/media/PosterCard";
import { fromMovie } from "@/utils/normalize-media";
import useDiscoverFilters from "@/hooks/useDiscoverFilters";
import fetchDiscoverMovies from "@/hooks/fetchDiscoverMovies";
import { DiscoverMoviesFetchQueryType } from "@/types/movie";
import Loop from "@/components/ui/other/Loop";
import PosterCardSkeleton from "@/components/ui/other/PosterCardSkeleton";
import { getLoadingLabel } from "@/utils/movies";
import DiscoverLoadState from "./LoadState";

const MovieDiscoverList = () => {
  const { ref, inViewport } = useInViewport();
  const { genresString, queryType } = useDiscoverFilters();

  const { data, isPending, isError, refetch, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["discover-movies", queryType, genresString],
      queryFn: ({ pageParam }) =>
        fetchDiscoverMovies({
          page: pageParam,
          type: queryType as DiscoverMoviesFetchQueryType,
          genres: genresString,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    });

  useEffect(() => {
    if (inViewport && !isPending && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inViewport, isFetchingNextPage, isPending]);

  if (isError) {
    return (
      <DiscoverLoadState
        title="Movies are taking a break"
        description="The catalogue service did not respond. Your filters are still here; try again when you are ready."
        onRetry={() => void refetch()}
      />
    );
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center gap-10">
        <div className="movie-grid">
          <Loop count={20} prefix="SkeletonDiscoverPosterCard">
            <PosterCardSkeleton />
          </Loop>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-10">
      <div className="movie-grid">
        {data.pages.map((page) => {
          return page.results.map((movie) => {
            return <PosterCard key={movie.id} media={fromMovie(movie)} variant="grid" />;
          });
        })}
      </div>
      <div ref={ref} className="flex h-24 items-center justify-center">
        {isFetchingNextPage && <Spinner size="lg" variant="wave" label={getLoadingLabel()} />}
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

export default memo(MovieDiscoverList);
