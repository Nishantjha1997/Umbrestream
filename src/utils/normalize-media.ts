import type { Movie, TV } from "tmdb-ts/dist/types";
import type { AniListFormat, AniListMediaSummary } from "@/types/anilist";
import type { MediaSummary } from "@/types/media";
import { getImageUrl } from "./movies";

const FORMAT_LABELS: Record<AniListFormat, string> = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
};

function yearOf(date?: string | null): number | undefined {
  if (!date) return undefined;
  const year = Number.parseInt(date.slice(0, 4), 10);
  return Number.isFinite(year) ? year : undefined;
}

export function fromMovie(movie: Movie): MediaSummary {
  return {
    kind: "movie",
    id: movie.id,
    href: `/movie/${movie.id}`,
    title: movie.title || movie.original_title || "Untitled",
    posterUrl: getImageUrl(movie.poster_path, "poster"),
    backdropUrl: movie.backdrop_path
      ? getImageUrl(movie.backdrop_path, "backdrop")
      : undefined,
    year: yearOf(movie.release_date),
    rating: movie.vote_average,
    isAdult: Boolean(movie.adult),
  };
}

export function fromTvShow(tv: TV): MediaSummary {
  return {
    kind: "tv",
    id: tv.id,
    href: `/tv/${tv.id}`,
    title: tv.name || tv.original_name || "Untitled",
    posterUrl: getImageUrl(tv.poster_path, "poster"),
    backdropUrl: tv.backdrop_path ? getImageUrl(tv.backdrop_path, "backdrop") : undefined,
    year: yearOf(tv.first_air_date),
    rating: tv.vote_average,
    isAdult: Boolean(tv.adult),
  };
}

export function fromAnime(anime: AniListMediaSummary): MediaSummary {
  const cover =
    anime.coverImage.extraLarge ?? anime.coverImage.large ?? anime.coverImage.medium ?? undefined;

  return {
    kind: "anime",
    id: anime.id,
    href: `/anime/${anime.id}`,
    title: anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled",
    // getImageUrl passes absolute URLs through untouched, so AniList's full
    // https://s4.anilist.co/... links survive while still getting the shared
    // placeholder when a cover is missing.
    posterUrl: getImageUrl(cover, "poster"),
    year: anime.seasonYear ?? undefined,
    // AniList scores 0-100; every consumer expects 0-10.
    rating: anime.averageScore != null ? anime.averageScore / 10 : undefined,
    isAdult: Boolean(anime.isAdult),
    format: anime.format ? FORMAT_LABELS[anime.format] : undefined,
  };
}
