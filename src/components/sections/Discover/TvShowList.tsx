"use client";

import BackToTopButton from "@/components/ui/button/BackToTopButton";
import Loop from "@/components/ui/other/Loop";
import PosterCardSkeleton from "@/components/ui/other/PosterCardSkeleton";
import useDiscoverFilters from "@/hooks/useDiscoverFilters";
import fetchDiscoverTvShows from "@/hooks/fetchDiscoverTvShow";
import { DiscoverTvShowsFetchQueryType } from "@/types/movie";
import { getLoadingLabel } from "@/utils/movies";
import { Button, Spinner } from "@heroui/react";
import { useInViewport } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import PosterCard from "@/components/media/PosterCard";
import { fromTvShow } from "@/utils/normalize-media";
import DiscoverLoadState from "./LoadState";

const TvShowDiscoverList = () => {
  const { ref, inViewport } = useInViewport();
  const { genresString, queryType, resetFilters } = useDiscoverFilters();
  const { data, isPending, isError, refetch, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      queryKey: ["discover-tv-shows", queryType, genresString],
      queryFn: ({ pageParam }) =>
        fetchDiscoverTvShows({
          page: pageParam,
          type: queryType as DiscoverTvShowsFetchQueryType,
          genres: genresString,
        }),
      initialPageParam: 1,
      getNextPageParam: (lastPage) =>
        lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined,
    });

  useEffect(() => {
    if (inViewport && hasNextPage && !isFetchingNextPage && !isPending) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inViewport, isFetchingNextPage, isPending]);

  if (isError) {
    return (
      <DiscoverLoadState
        title="Series are taking a break"
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

  // A filter combination can legitimately return nothing — say "no matches"
  // instead of "end of the list", which describes exhaustion, not emptiness.
  const totalResults = data.pages.reduce((count, page) => count + page.results.length, 0);
  if (totalResults === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-10">
        <div
          role="status"
          className="glass-panel flex min-h-48 w-full max-w-md flex-col items-center justify-center gap-3 rounded-(--radius-panel) border px-6 py-10 text-center"
        >
          <h2 className="text-lg font-semibold">No series match your filters</h2>
          <p className="text-default-500 max-w-sm text-sm">
            Try removing a genre or switching the list — or reset your filters and start over.
          </p>
          <Button size="sm" radius="full" variant="flat" onPress={resetFilters}>
            Clear filters
          </Button>
        </div>
        <BackToTopButton />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center gap-10">
      <div className="movie-grid">
        {data.pages.map((page) => {
          return page.results.map((tv) => {
            return <PosterCard key={tv.id} media={fromTvShow(tv)} variant="grid" />;
          });
        })}
      </div>
      <div ref={ref} className="flex h-24 items-center justify-center">
        {/* One accent (Phase 1/3, §1.1.3 / §5.2): was color="warning" — TV no
            longer gets its own media-type hue, matching MovieDiscoverList's
            spinner (no explicit color, so both now inherit the same default). */}
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

export default TvShowDiscoverList;
