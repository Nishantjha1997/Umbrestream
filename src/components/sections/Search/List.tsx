"use client";

import { tmdbBrowser } from "@/api/tmdb-browser";
import { useQueryClient } from "@tanstack/react-query";
import TvShowHomeCard from "@/components/sections/TV/Cards/Poster";
import BackToTopButton from "@/components/ui/button/BackToTopButton";
import useDiscoverFilters from "@/hooks/useDiscoverFilters";
import { ContentType } from "@/types";
import { cn, isEmpty } from "@/utils/helpers";
import { getLoadingLabel } from "@/utils/movies";
import { Spinner } from "@heroui/react";
import { useInViewport } from "@mantine/hooks";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import { Movie, Search, TV } from "tmdb-ts/dist/types";
import MoviePosterCard from "../Movie/Cards/Poster";
import AnimePosterCard from "../Anime/Cards/Poster";
import SearchFilter from "./Filter";
import { anilistApi } from "@/api/anilist";

type FetchType = {
  page: number;
  type: ContentType;
  query: string;
};

const fetchData = async ({
  page,
  type = "movie",
  query,
}: FetchType): Promise<any> => {
  if (type === "movie") return tmdbBrowser.search.movies({ query, page });
  if (type === "tv") return tmdbBrowser.search.tvShows({ query, page });
  return anilistApi.search(query, page);
};

const SearchList = () => {
  const q = useQueryClient();
  const { content } = useDiscoverFilters();
  const { ref, inViewport } = useInViewport();
  const [submittedSearchQuery, setSubmittedSearchQuery] = useState("");
  const triggered = !isEmpty(submittedSearchQuery);
  const { data, isFetching, isPending, fetchNextPage, isFetchingNextPage, hasNextPage } =
    useInfiniteQuery({
      enabled: triggered,
      queryKey: ["search-list", content, submittedSearchQuery],
      queryFn: ({ pageParam: page }) =>
        fetchData({ page, type: content, query: submittedSearchQuery }),
      initialPageParam: 1,
      getNextPageParam: (lastPage: any) => {
        if (content === "anime") {
          return lastPage.pageInfo.hasNextPage ? lastPage.pageInfo.currentPage + 1 : undefined;
        }
        return lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined;
      },
    });

  useEffect(() => {
    if (inViewport) {
      fetchNextPage();
    }
  }, [inViewport]);

  useEffect(() => {
    q.removeQueries({ queryKey: ["search-list"] });
  }, [content, q]);

  // Hoisted to component scope: the "reached the end of the list" branch in the
  // JSX below also needs this, and reading it only inside the useMemo callback
  // put it out of scope there (ReferenceError at runtime, not just a type error
  // — and ignoreBuildErrors means the build won't catch it).
  const results = useMemo(
    () => (content === "anime" ? data?.pages[0]?.media : data?.pages[0]?.results),
    [content, data?.pages],
  );

  const renderSearchResults = useMemo(() => {
    return () => {
      const totalCount = content === "anime" ? data?.pages[0]?.pageInfo?.total : data?.pages[0]?.total_results;

      if (isEmpty(results)) {
        let label = "movies";
        if (content === "tv") label = "TV series";
        if (content === "anime") label = "anime";
        return (
          <h5 className="mt-56 text-center text-xl">
            No {label} found with query{" "}
            <span className="text-warning font-semibold">"{submittedSearchQuery}"</span>
          </h5>
        );
      }

      let label = "movies";
      if (content === "tv") label = "TV series";
      if (content === "anime") label = "anime";

      const color = content === "movie" ? "text-success" : content === "tv" ? "text-warning" : "text-secondary";

      return (
        <>
          <h5 className="text-center text-xl">
            <span className="motion-preset-focus">
              Found{" "}
              <span className={cn("font-semibold", color)}>{totalCount}</span>{" "}
              {label} with query{" "}
              <span className="text-warning font-semibold">"{submittedSearchQuery}"</span>
            </span>
          </h5>
          <div className="movie-grid">
            {content === "movie" &&
              data?.pages.map((page) =>
                (page as any).results.map((movie: any) => (
                  <MoviePosterCard key={movie.id} movie={movie as Movie} variant="bordered" />
                ))
              )}
            {content === "tv" &&
              data?.pages.map((page) =>
                (page as any).results.map((tv: any) => (
                  <TvShowHomeCard key={tv.id} tv={tv as TV} variant="bordered" />
                ))
              )}
            {content === "anime" &&
              data?.pages.map((page) =>
                (page as any).media.map((anime: any) => (
                  <AnimePosterCard key={anime.id} anime={anime} variant="bordered" />
                ))
              )}
          </div>
        </>
      );
    };
  }, [content, data?.pages, results, submittedSearchQuery]);

  const getColor = () => {
    if (content === "movie") return "primary";
    if (content === "tv") return "warning";
    return "secondary";
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
            {isPending ? (
              <Spinner
                size="lg"
                className="absolute-center mt-56"
                color={getColor()}
                variant="simple"
              />
            ) : (
              renderSearchResults()
            )}
          </div>
          <div ref={ref} className="flex h-24 items-center justify-center">
            {isFetchingNextPage && (
              <Spinner
                color={getColor()}
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

