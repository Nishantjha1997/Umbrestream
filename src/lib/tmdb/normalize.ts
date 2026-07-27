import type { MediaType, Title } from "@/types/title";
import { backdropUrl, posterUrl } from "./client";

export interface TmdbListItem {
  id: number;
  media_type?: string;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  vote_average?: number;
  genre_ids?: number[];
}

export interface TmdbPage<T = TmdbListItem> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

function yearOf(item: TmdbListItem): number | undefined {
  const raw = item.release_date || item.first_air_date;
  const y = raw ? Number.parseInt(raw.slice(0, 4), 10) : NaN;
  return Number.isFinite(y) ? y : undefined;
}

export function normalizeListItem(
  item: TmdbListItem,
  fallbackType: MediaType = "movie",
  genreLookup?: Map<number, string>,
): Title {
  const mediaType: MediaType =
    item.media_type === "tv" ? "tv" : item.media_type === "movie" ? "movie" : fallbackType;

  return {
    key: `tmdb:${mediaType}:${item.id}`,
    mediaType,
    tmdbId: item.id,
    title: item.title ?? item.name ?? "Untitled",
    originalTitle: item.original_title ?? item.original_name,
    overview: item.overview ?? "",
    posterUrl: posterUrl(item.poster_path),
    backdropUrl: backdropUrl(item.backdrop_path),
    year: yearOf(item),
    rating: item.vote_average,
    genres: (item.genre_ids ?? []).map((id) => ({
      id,
      name: genreLookup?.get(id) ?? "",
    })),
  };
}

/** `trending/all` mixes in `person` results, which have no poster and break rows. */
export function normalizeList(
  page: TmdbPage,
  fallbackType: MediaType = "movie",
  genreLookup?: Map<number, string>,
): Title[] {
  return page.results
    .filter((r) => r.media_type !== "person")
    .map((r) => normalizeListItem(r, fallbackType, genreLookup));
}
