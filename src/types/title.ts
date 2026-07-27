export type MediaType = "movie" | "tv" | "anime";

export interface Genre {
  id: number;
  name: string;
}

/**
 * The single shape every data source normalizes into. Keeping TMDB, AniList,
 * and any local library behind one type is what lets a card, a row, and a
 * detail page stay source-agnostic.
 */
export interface Title {
  key: string;
  mediaType: MediaType;

  tmdbId?: number;
  anilistId?: number;
  imdbId?: string;

  title: string;
  originalTitle?: string;
  overview: string;
  posterUrl?: string;
  backdropUrl?: string;
  year?: number;
  runtimeMin?: number;
  rating?: number;
  genres: Genre[];

  seasonCount?: number;
  episodeCount?: number;
}

export interface Season {
  seasonNumber: number;
  name: string;
  episodeCount: number;
  posterUrl?: string;
}

export interface Episode {
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview: string;
  stillUrl?: string;
  runtimeMin?: number;
  airDate?: string;
}
