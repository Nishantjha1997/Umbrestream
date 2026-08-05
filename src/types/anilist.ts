// Trimmed to the fields this app actually queries — not the full AniList schema.

export type AniListFormat = "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA" | "MUSIC";

export type AniListStatus = "FINISHED" | "RELEASING" | "NOT_YET_RELEASED" | "CANCELLED" | "HIATUS";

export type AniListSeason = "WINTER" | "SPRING" | "SUMMER" | "FALL";

export interface AniListTitle {
  romaji: string | null;
  english: string | null;
  native: string | null;
}

export interface AniListDate {
  year: number | null;
  month: number | null;
  day: number | null;
}

export interface AniListCoverImage {
  extraLarge: string | null;
  large: string | null;
  medium: string | null;
  color: string | null;
}

export interface AniListStudio {
  id: number;
  name: string;
}

export interface AniListNextAiring {
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
}

export interface AniListTrailer {
  id: string;
  site: string;
  thumbnail: string | null;
}

/** Minimal shape used in list rows and recommendation cards. */
export interface AniListMediaSummary {
  id: number;
  idMal: number | null;
  title: AniListTitle;
  coverImage: AniListCoverImage;
  format: AniListFormat | null;
  episodes: number | null;
  averageScore: number | null;
  seasonYear: number | null;
  isAdult: boolean;
}

/** Full shape used on the detail page. */
export interface AniListMediaDetail extends AniListMediaSummary {
  bannerImage: string | null;
  description: string | null;
  status: AniListStatus | null;
  duration: number | null;
  season: AniListSeason | null;
  genres: string[];
  popularity: number | null;
  studios: AniListStudio[];
  startDate: AniListDate;
  endDate: AniListDate;
  nextAiringEpisode: AniListNextAiring | null;
  trailer: AniListTrailer | null;
  recommendations: AniListMediaSummary[];
}

export interface AniListPageInfo {
  total: number;
  currentPage: number;
  lastPage: number;
  hasNextPage: boolean;
}

export interface AniListPage<T> {
  pageInfo: AniListPageInfo;
  media: T[];
}

export type AniListSort = "TRENDING_DESC" | "POPULARITY_DESC" | "SCORE_DESC" | "START_DATE_DESC";
