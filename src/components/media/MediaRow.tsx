"use client";

import Shelf from "@/components/media/Shelf";
import type { AniListMediaSummary, AniListPage } from "@/types/anilist";
import type { MediaKind, MediaSummary } from "@/types/media";
import { fromAnime, fromMovie, fromTvShow } from "@/utils/normalize-media";
import { useInViewport } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { kebabCase } from "string-ts";
import type { Movie, TV } from "tmdb-ts/dist/types";

/**
 * A <Shelf> plus the query that fills it.
 *
 * This is the client-side half of the three deleted HomeList components. Row
 * configs carry a `query` *closure*, and functions cannot cross the server ->
 * client boundary as props — so the config has to be imported and mapped from
 * inside a Client Component (see Home/List.tsx and Anime/List.tsx). Mapping
 * them in a Server Component fails the build with "Functions cannot be passed
 * directly to Client Components".
 *
 * The normalizer runs here, at the edge, so <Shelf> and <PosterCard> below it
 * only ever see MediaSummary.
 */

interface PagedResult<T> {
  page: number;
  results: T[];
  total_results: number;
  total_pages: number;
}

interface BaseRowProps {
  name: string;
  param: string;
  priority?: boolean;
}

type RowPayload = PagedResult<Movie> | PagedResult<TV> | AniListPage<AniListMediaSummary>;

export type MediaRowProps = BaseRowProps &
  (
    | { kind: "movie"; query: () => Promise<PagedResult<Movie>> }
    | { kind: "tv"; query: () => Promise<PagedResult<TV>> }
    | { kind: "anime"; query: () => Promise<AniListPage<AniListMediaSummary>> }
  );

function seeAllHref(kind: MediaKind, param: string): string {
  if (kind === "anime") return `/anime/discover?category=${param}`;
  if (kind === "tv") return `/discover?type=${param}&content=tv`;
  return `/discover?type=${param}`;
}

const MediaRow: React.FC<MediaRowProps> = (props) => {
  const { kind, name, param, priority } = props;
  const key = `${kebabCase(name)}-${kind}-row`;
  const { ref, inViewport } = useInViewport<HTMLDivElement>();

  const { data, isPending, isError, refetch } = useQuery<RowPayload>({
    queryKey: [key],
    queryFn: (): Promise<RowPayload> => props.query(),
    // Rows below the fold don't fetch until they scroll into view.
    enabled: inViewport,
    retry: 1,
  });

  const items = useMemo<MediaSummary[]>(() => {
    if (!data) return [];
    if (kind === "anime") return (data as AniListPage<AniListMediaSummary>).media.map(fromAnime);
    if (kind === "tv") return (data as PagedResult<TV>).results.map(fromTvShow);
    return (data as PagedResult<Movie>).results.map(fromMovie);
  }, [data, kind]);

  return (
    // The min-height keeps the page from collapsing while an off-screen row is
    // still waiting for its turn to fetch.
    <div id={key} ref={ref} className="min-h-[260px] md:min-h-[310px]">
      <Shelf
        title={name}
        items={items}
        // react-query reports `pending` while `enabled: false`, which is
        // exactly the state we want to show a skeleton for.
        isLoading={isPending && !isError}
        isError={isError}
        onRetry={() => void refetch()}
        seeAllHref={seeAllHref(kind, param)}
        priority={priority}
      />
    </div>
  );
};

export default MediaRow;
