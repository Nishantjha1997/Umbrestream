import type {
  AppendToResponse,
  AppendToResponseMovieKey,
  AppendToResponseTvKey,
  MovieDetails,
  TvShowDetails,
  SeasonDetails,
} from "tmdb-ts";

/**
 * Browser-safe TMDB access.
 *
 * Client Components must not import `@/api/tmdb` — that module is
 * `server-only` and holds the access token. Everything here goes through the
 * /api/tmdb proxy, which injects the token server-side and allowlists the
 * endpoints it will forward.
 */

async function proxy<T>(endpoint: string, params: Record<string, string | number | undefined> = {}) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") qs.set(k, String(v));
  }
  const query = qs.toString();
  const res = await fetch(`/api/tmdb/${endpoint}${query ? `?${query}` : ""}`);

  if (!res.ok) {
    throw new Error(`TMDB proxy ${endpoint} failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

/** Minimal shape shared by every paginated TMDB list response. */
export interface TrendingResult {
  page: number;
  total_pages: number;
  total_results: number;
  results: {
    id: number;
    poster_path: string | null;
    backdrop_path: string | null;
    title?: string;
    name?: string;
    vote_average?: number;
  }[];
}

export const tmdbBrowser = {
  discover: {
    movie: <T>(p: {
      page?: number;
      with_genres?: string;
      region?: string;
      watch_region?: string;
      with_origin_country?: string;
      with_original_language?: string;
      with_watch_monetization_types?: string;
      sort_by?: string;
    }) => proxy<T>("discover/movie", p),
    tv: <T>(p: {
      page?: number;
      with_genres?: string;
      region?: string;
      watch_region?: string;
      with_origin_country?: string;
      with_original_language?: string;
      with_watch_monetization_types?: string;
      sort_by?: string;
    }) => proxy<T>("discover/tv", p),
  },
  trending: {
    trending: <T>(
      media: "movie" | "tv" | "all",
      window: "day" | "week",
      p: { page?: number } = {},
    ) => proxy<T>(`trending/${media}/${window}`, p),
  },
  movies: {
    popular: <T>(p: { page?: number } = {}) => proxy<T>("movie/popular", p),
    topRated: <T>(p: { page?: number } = {}) => proxy<T>("movie/top_rated", p),
    nowPlaying: <T>(p: { page?: number } = {}) => proxy<T>("movie/now_playing", p),
    upcoming: <T>(p: { page?: number } = {}) => proxy<T>("movie/upcoming", p),
    /** Mirrors tmdb-ts's `tmdb.movies.details(id, appendToResponse)`. */
    details: <T extends AppendToResponseMovieKey[] | undefined = undefined>(
      id: number,
      appendToResponse?: T,
    ) =>
      proxy<AppendToResponse<MovieDetails, T, "movie">>(`movie/${id}`, {
        append_to_response: appendToResponse?.join(","),
      }),
    recommendations: <T = TrendingResult>(id: number, p: { page?: number } = {}) =>
      proxy<T>(`movie/${id}/recommendations`, p),
    similar: <T = TrendingResult>(id: number, p: { page?: number } = {}) =>
      proxy<T>(`movie/${id}/similar`, p),
  },
  tvShows: {
    popular: <T>(p: { page?: number } = {}) => proxy<T>("tv/popular", p),
    topRated: <T>(p: { page?: number } = {}) => proxy<T>("tv/top_rated", p),
    airingToday: <T>(p: { page?: number } = {}) => proxy<T>("tv/airing_today", p),
    onTheAir: <T>(p: { page?: number } = {}) => proxy<T>("tv/on_the_air", p),
    /** Mirrors tmdb-ts's `tmdb.tvShows.details(id, appendToResponse)`. */
    details: <T extends AppendToResponseTvKey[] | undefined = undefined>(
      id: number,
      appendToResponse?: T,
    ) =>
      proxy<AppendToResponse<TvShowDetails, T, "tvShow">>(`tv/${id}`, {
        append_to_response: appendToResponse?.join(","),
      }),
    season: (tvId: number, seasonNumber: number) =>
      proxy<SeasonDetails>(`tv/${tvId}/season/${seasonNumber}`),
    recommendations: <T = TrendingResult>(id: number, p: { page?: number } = {}) =>
      proxy<T>(`tv/${id}/recommendations`, p),
    similar: <T = TrendingResult>(id: number, p: { page?: number } = {}) =>
      proxy<T>(`tv/${id}/similar`, p),
  },
  search: {
    multi: <T>(p: { query: string; page?: number }) => proxy<T>("search/multi", p),
    movies: <T>(p: { query: string; page?: number }) => proxy<T>("search/movie", p),
    tvShows: <T>(p: { query: string; page?: number }) => proxy<T>("search/tv", p),
  },
  genres: {
    movies: <T>() => proxy<T>("genre/movie/list"),
    tvShows: <T>() => proxy<T>("genre/tv/list"),
  },
};
