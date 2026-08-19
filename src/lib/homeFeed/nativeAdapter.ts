import type { HomeFeedResponseV1 } from "./types";

export interface NativeMediaItem {
  id: number;
  media_id: number;
  media_type: "movie" | "tv" | "anime";
  type: "movie" | "tv" | "anime";
  title: string;
  name: string;
  poster_path: string;
  backdrop_path: string;
  release_date: string;
  first_air_date: string;
  vote_average: number;
  adult: boolean;
  overview: string;
  [key: string]: unknown;
}

function toNativeMedia(item: HomeFeedResponseV1["rows"][number]["items"][number]): NativeMediaItem {
  const year = item.year ? `${item.year}-01-01` : "";
  return {
    ...item,
    id: item.id,
    media_id: item.id,
    media_type: item.kind,
    type: item.kind,
    title: item.title,
    name: item.title,
    poster_path: item.posterUrl,
    backdrop_path: item.backdropUrl ?? item.posterUrl,
    release_date: year,
    first_air_date: item.kind === "tv" ? year : "",
    vote_average: item.rating ?? 0,
    adult: item.isAdult,
    overview: "",
  };
}

export interface NativeHomeFeed {
  hero: NativeMediaItem | null;
  heroIsResume: boolean;
  history: NativeMediaItem[];
  personalized: NativeMediaItem[];
  regionalMovies: NativeMediaItem[];
  regionalSeries: NativeMediaItem[];
  anime: NativeMediaItem[];
  trending: NativeMediaItem[];
}

export function toNativeHomeFeed(feed: HomeFeedResponseV1): NativeHomeFeed {
  const findRow = (kind: HomeFeedResponseV1["rows"][number]["kind"]) =>
    feed.rows.find((row) => row.kind === kind)?.items.map(toNativeMedia) ?? [];
  const history = findRow("continue");
  const heroMedia = feed.hero ? toNativeMedia(feed.hero.media) : null;
  const heroIsResume = feed.hero?.intent === "resume";
  if (heroMedia && heroIsResume && feed.hero?.progress) {
    heroMedia.last_position = feed.hero.progress.lastPosition;
    heroMedia.duration = feed.hero.progress.duration;
    heroMedia.season = feed.hero.progress.season;
    heroMedia.episode = feed.hero.progress.episode;
    heroMedia.completed = false;
  }
  return {
    hero: heroMedia,
    heroIsResume,
    history,
    personalized: findRow("personalized"),
    regionalMovies: findRow("regional_movie"),
    regionalSeries: findRow("regional_tv"),
    anime: findRow("anime"),
    trending: findRow("trending"),
  };
}
