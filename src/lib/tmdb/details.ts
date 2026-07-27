import type { Genre, Season, Title } from "@/types/title";
import { backdropUrl, posterUrl, tmdb, TmdbHttpError } from "./client";
import { normalizeList, type TmdbListItem, type TmdbPage } from "./normalize";

/** Only movie and tv are TMDB-backed. Anime routes through AniList (Phase 7). */
export type DetailMediaType = "movie" | "tv";

export function isDetailMediaType(value: string): value is DetailMediaType {
  return value === "movie" || value === "tv";
}

interface TmdbCastMember {
  id: number;
  name: string;
  character?: string;
  profile_path?: string | null;
  order?: number;
}

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official?: boolean;
}

interface TmdbSeason {
  season_number: number;
  name: string;
  episode_count: number;
  poster_path?: string | null;
}

interface TmdbDetailResponse {
  id: number;
  title?: string;
  name?: string;
  original_title?: string;
  original_name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  runtime?: number;
  episode_run_time?: number[];
  vote_average?: number;
  genres?: Genre[];
  imdb_id?: string;
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: TmdbSeason[];
  external_ids?: { imdb_id?: string | null };
  credits?: { cast?: TmdbCastMember[] };
  videos?: { results?: TmdbVideo[] };
  similar?: TmdbPage<TmdbListItem>;
}

export interface CastMember {
  id: number;
  name: string;
  character?: string;
  profileUrl?: string;
}

export interface TitleDetail extends Title {
  cast: CastMember[];
  trailerKey?: string;
  seasons: Season[];
  similar: Title[];
}

/** Prefer an official YouTube trailer, then any trailer, then any teaser. */
function pickTrailer(videos: TmdbVideo[] = []): string | undefined {
  const youtube = videos.filter((v) => v.site === "YouTube");
  return (
    youtube.find((v) => v.type === "Trailer" && v.official)?.key ??
    youtube.find((v) => v.type === "Trailer")?.key ??
    youtube.find((v) => v.type === "Teaser")?.key
  );
}

export async function fetchTitleDetail(
  mediaType: DetailMediaType,
  id: number,
): Promise<TitleDetail | null> {
  let data: TmdbDetailResponse;
  try {
    data = await tmdb<TmdbDetailResponse>(`${mediaType}/${id}`, {
      append_to_response: "credits,videos,similar,external_ids",
    });
  } catch (err) {
    // Only a real 404 means "no such title" — return null so the caller
    // renders not-found. Anything else (network blip, 429, 5xx) must
    // propagate: swallowing it renders a permanent-looking "doesn't exist"
    // for what is actually a retryable failure.
    if (err instanceof TmdbHttpError && err.status === 404) return null;
    throw err;
  }

  const year = (data.release_date || data.first_air_date)?.slice(0, 4);

  return {
    key: `tmdb:${mediaType}:${data.id}`,
    mediaType,
    tmdbId: data.id,
    imdbId: data.imdb_id ?? data.external_ids?.imdb_id ?? undefined,
    title: data.title ?? data.name ?? "Untitled",
    originalTitle: data.original_title ?? data.original_name,
    overview: data.overview ?? "",
    posterUrl: posterUrl(data.poster_path),
    backdropUrl: backdropUrl(data.backdrop_path, "original"),
    year: year ? Number.parseInt(year, 10) : undefined,
    runtimeMin: data.runtime ?? data.episode_run_time?.[0],
    rating: data.vote_average,
    genres: data.genres ?? [],
    seasonCount: data.number_of_seasons,
    episodeCount: data.number_of_episodes,

    cast: (data.credits?.cast ?? []).slice(0, 20).map((c) => ({
      id: c.id,
      name: c.name,
      character: c.character,
      profileUrl: posterUrl(c.profile_path, "w342"),
    })),

    trailerKey: pickTrailer(data.videos?.results),

    // Season 0 is "Specials"; it clutters the picker and rarely has metadata.
    seasons: (data.seasons ?? [])
      .filter((s) => s.season_number > 0)
      .map((s) => ({
        seasonNumber: s.season_number,
        name: s.name,
        episodeCount: s.episode_count,
        posterUrl: posterUrl(s.poster_path, "w342"),
      })),

    similar: data.similar ? normalizeList(data.similar, mediaType) : [],
  };
}
