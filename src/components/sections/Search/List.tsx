"use client";

import { tmdbBrowser } from "@/api/tmdb-browser";
import { useQueryClient } from "@tanstack/react-query";
import PosterCard from "@/components/media/PosterCard";
import { fromAnime, fromMovie, fromTvShow } from "@/utils/normalize-media";
import BackToTopButton from "@/components/ui/button/BackToTopButton";
import useDiscoverFilters from "@/hooks/useDiscoverFilters";
import { ContentType } from "@/types";
import type { AniListMediaSummary, AniListPage } from "@/types/anilist";
import { isEmpty } from "@/utils/helpers";
import { getLoadingLabel } from "@/utils/movies";
import { Spinner } from "@heroui/react";
import { useInViewport } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import type { Movie, TV } from "tmdb-ts/dist/types";
import SearchFilter from "./Filter";
import { anilistApi } from "@/api/anilist";
import DiscoverLoadState from "@/components/sections/Discover/LoadState";

type FetchType = {
  page: number;
  type: ContentType;
  query: string;
};

type TmdbSearchPage<T> = {
  page: number;
  total_pages: number;
  total_results: number;
  results: T[];
};

type SearchResponse =
  | TmdbSearchPage<Movie>
  | TmdbSearchPage<TV>
  | AniListPage<AniListMediaSummary>;

const fetchData = async ({
  page,
  type = "movie",
  query,
}: FetchType): Promise<SearchResponse> => {
  if (type === "movie") return tmdbBrowser.search.movies<TmdbSearchPage<Movie>>({ query, page });
  if (type === "tv") return tmdbBrowser.search.tvShows<TmdbSearchPage<TV>>({ query, page });
  return anilistApi.search(query, page);
};

const SearchList = () => {
  const q = useQueryClient();
  const { content } = useDiscoverFilters();
  const { ref, inViewport } = useInViewport();
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");
  const triggered = !isEmpty(submittedSearchQuery);
  const { data, isFetching, isPending, isError, refetch, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      enabled: triggered,
      queryKey: ["search-list", content, submittedSearchQuery],
      queryFn: ({ pageParam: page }) =>
        fetchData({ page, type: content, query: submittedSearchQuery }),
      initialPageParam: 1,
      getNextPageParam: (lastPage: SearchResponse) => {
        if (content === "anime") {
          const page = lastPage as AniListPage<AniListMediaSummary>;
          return page.pageInfo.hasNextPage ? page.pageInfo.currentPage + 1 : undefined;
        }
        const page = lastPage as TmdbSearchPage<Movie | TV>;
        return page.page < page.total_pages ? page.page + 1 : undefined;
      },
    });

  useEffect(() => {
    if (inViewport && hasNextPage && !isFetchingNextPage && !isPending) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inViewport, isFetchingNextPage, isPending]);

  useEffect(() => {
    q.removeQueries({ queryKey: ["search-list"] });
  }, [content, q]);

  const firstPage = data?.pages[0];
  const results =
    content === "anime"
      ? (firstPage as AniListPage<AniListMediaSummary> | undefined)?.media
      : (firstPage as TmdbSearchPage<Movie | TV> | undefined)?.results;

  const renderSearchResults = () => {
    const totalCount =
      content === "anime"
        ? (firstPage as AniListPage<AniListMediaSummary> | undefined)?.pageInfo.total
        : (firstPage as TmdbSearchPage<Movie | TV> | undefined)?.total_results;

    if (isEmpty(results)) {
      const label = content === "tv" ? "TV series" : content === "anime" ? "anime" : "movies";
      return (
        <div
          role="status"
          className="glass-panel flex min-h-48 w-full max-w-md flex-col items-center justify-center gap-3 rounded-(--radius-panel) border px-6 py-10 text-center"
        >
          <h2 className="text-lg font-semibold">
            No {label} found for <span className="font-semibold text-primary">&quot;{submittedSearchQuery}&quot;</span>
          </h2>
          <p className="text-default-500 max-w-sm text-sm">
            Check the spelling or try a broader term — short, simple queries usually find the
            most.
          </p>
        </div>
      );
    }

    const label = content === "tv" ? "TV series" : content === "anime" ? "anime" : "movies";
    const moviePages = (data?.pages ?? []) as TmdbSearchPage<Movie>[];
    const tvPages = (data?.pages ?? []) as TmdbSearchPage<TV>[];
    const animePages = (data?.pages ?? []) as AniListPage<AniListMediaSummary>[];

    return (
      <>
        <h5 className="text-center text-xl">
          <span className="motion-preset-focus">
            Found <span className="font-semibold">{totalCount}</span> {label} with query{" "}
            <span className="text-primary font-semibold">&quot;{submittedSearchQuery}&quot;</span>
          </span>
        </h5>
        <div className="movie-grid">
          {content === "movie" &&
            moviePages.flatMap((page) =>
              page.results.map((movie) => (
                <PosterCard key={movie.id} media={fromMovie(movie)} variant="grid" />
              )),
            )}
          {content === "tv" &&
            tvPages.flatMap((page) =>
              page.results.map((tv) => (
                <PosterCard key={tv.id} media={fromTvShow(tv)} variant="grid" />
              )),
            )}
          {content === "anime" &&
            animePages.flatMap((page) =>
              page.media.map((anime) => (
                <PosterCard key={anime.id} media={fromAnime(anime)} variant="grid" />
              )),
            )}
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col items-center gap-8">
      <SearchFilter
        isLoading={isFetching}
        onSearchSubmit={(value) => setSubmittedSearchQuery(value.trim())}
      />
      {triggered && (
        <>
          <div className="relative flex flex-col items-center gap-8">
            {isError ? (
              <DiscoverLoadState
                title="Search is unavailable"
                description="The catalogue service did not respond. Keep your search and try again in a moment."
                onRetry={() => void refetch()}
                isRetrying={isFetching}
              />
            ) : isPending ? (
              <Spinner
                size="lg"
                className="absolute-center mt-56"
                variant="simple"
              />
            ) : (
              renderSearchResults()
            )}
          </div>
          <div ref={ref} className="flex h-24 items-center justify-center">
            {isFetchingNextPage && (
              <Spinner
                size="lg"
                variant="wave"
                label={getLoadingLabel()}
              />
            )}
            {!isEmpty(results) && !hasNextPage && !isPending && (
              <p className="text-muted-foreground text-center text-base">
                You have reached the end of the list.
              </p>
            )}
          </div>
        </>
      )}

      <BackToTopButton />
    </div>
  );
};

export default SearchList;

