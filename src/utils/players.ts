import { PlayersProps } from "@/types";

/**
 * Generates a list of movie players with their respective titles and source URLs.
 * Priority order matches ARISE top-performing servers: VidLink -> VidKing -> Embed.su -> AutoEmbed -> VidSrc.
 *
 * @param {string | number} id - The ID of the movie to be embedded in the player URLs.
 * @param {number} [startAt] - The start position in seconds to be embedded in the player URLs. Optional.
 * @returns {PlayersProps[]} - An array of player objects.
 */
export const getMoviePlayers = (id: string | number, startAt?: number): PlayersProps[] => {
  return [
    {
      title: "VidLink",
      source: `https://vidlink.pro/movie/${id}?player=jw&primaryColor=006fee&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false&startAt=${startAt || ""}`,
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "VidLink 2",
      source: `https://vidlink.pro/movie/${id}?primaryColor=006fee&autoplay=false&startAt=${startAt || ""}`,
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "VidKing",
      source: `https://www.vidking.net/embed/movie/${id}?color=006fee&autoplay=false`,
      recommended: true,
      fast: true,
      resumable: true,
    },
    {
      title: "<Embed> (Embed.su)",
      source: `https://embed.su/embed/movie/${id}`,
      recommended: true,
      fast: true,
      ads: true,
    },
    {
      title: "AutoEmbed 1",
      source: `https://autoembed.co/movie/tmdb/${id}`,
      fast: true,
      ads: true,
    },
    {
      title: "AutoEmbed 2",
      source: `https://player.autoembed.cc/embed/movie/${id}`,
      fast: true,
      ads: true,
    },
    {
      title: "VidSrc v3",
      source: `https://vidsrc.cc/v3/embed/movie/${id}?autoPlay=false`,
      recommended: true,
      fast: true,
      ads: true,
    },
    {
      title: "VidSrc ICU",
      source: `https://vidsrc.icu/embed/movie/${id}`,
      ads: true,
    },
    {
      title: "VidSrc TO",
      source: `https://vidsrc.to/embed/movie/${id}`,
      ads: true,
    },
    {
      title: "VidSrc XYZ",
      source: `https://vidsrc.xyz/embed/movie/${id}`,
      ads: true,
    },
    {
      title: "SuperEmbed",
      source: `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`,
      fast: true,
      ads: true,
    },
    {
      title: "FilmKu",
      source: `https://filmku.stream/embed/${id}`,
      ads: true,
    },
    {
      title: "NontonGo",
      source: `https://www.nontongo.win/embed/movie/${id}`,
      ads: true,
    },
    {
      title: "2Embed",
      source: `https://www.2embed.cc/embed/${id}`,
      ads: true,
    },
    {
      title: "MoviesAPI",
      source: `https://moviesapi.club/movie/${id}`,
      ads: true,
    },
  ];
};

/**
 * Generates a list of TV show players with their respective titles and source URLs.
 * Priority order matches ARISE top-performing servers: VidLink -> VidKing -> Embed.su -> AutoEmbed -> VidSrc.
 *
 * @param {string | number} id - The ID of the TV show.
 * @param {number} season - The season number.
 * @param {number} episode - The episode number.
 * @param {number} [startAt] - Optional start position in seconds.
 * @returns {PlayersProps[]} - Array of player sources.
 */
export const getTvShowPlayers = (
  id: string | number,
  season: number,
  episode: number,
  startAt?: number,
): PlayersProps[] => {
  return [
    {
      title: "VidLink",
      source: `https://vidlink.pro/tv/${id}/${season}/${episode}?player=jw&primaryColor=f5a524&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false&startAt=${startAt || ""}`,
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "VidLink 2",
      source: `https://vidlink.pro/tv/${id}/${season}/${episode}?primaryColor=f5a524&autoplay=false&startAt=${startAt || ""}`,
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "VidKing",
      source: `https://www.vidking.net/embed/tv/${id}/${season}/${episode}?color=f5a524&autoplay=false`,
      recommended: true,
      fast: true,
      resumable: true,
    },
    {
      title: "<Embed> (Embed.su)",
      source: `https://embed.su/embed/tv/${id}/${season}/${episode}`,
      recommended: true,
      fast: true,
      ads: true,
    },
    {
      title: "AutoEmbed 1",
      source: `https://autoembed.co/tv/tmdb/${id}-${season}-${episode}`,
      fast: true,
      ads: true,
    },
    {
      title: "AutoEmbed 2",
      source: `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`,
      fast: true,
      ads: true,
    },
    {
      title: "VidSrc v3",
      source: `https://vidsrc.cc/v3/embed/tv/${id}/${season}/${episode}?autoPlay=false`,
      recommended: true,
      fast: true,
      ads: true,
    },
    {
      title: "VidSrc ICU",
      source: `https://vidsrc.icu/embed/tv/${id}/${season}/${episode}`,
      ads: true,
    },
    {
      title: "VidSrc TO",
      source: `https://vidsrc.to/embed/tv/${id}/${season}/${episode}`,
      ads: true,
    },
    {
      title: "VidSrc XYZ",
      source: `https://vidsrc.xyz/embed/tv/${id}/${season}/${episode}`,
      ads: true,
    },
    {
      title: "SuperEmbed",
      source: `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}`,
      fast: true,
      ads: true,
    },
    {
      title: "FilmKu",
      source: `https://filmku.stream/embed/series?tmdb=${id}&sea=${season}&epi=${episode}`,
      ads: true,
    },
    {
      title: "NontonGo",
      source: `https://www.nontongo.win/embed/tv/${id}/${season}/${episode}`,
      ads: true,
    },
    {
      title: "2Embed",
      source: `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`,
      ads: true,
    },
    {
      title: "MoviesAPI",
      source: `https://moviesapi.club/tv/${id}-${season}-${episode}`,
      ads: true,
    },
  ];
};

/**
 * Generates a list of anime players with their respective titles and source URLs.
 * Priority order matches ARISE top-performing servers: VidLink -> VidKing -> Embed.su -> AutoEmbed -> VidSrc.
 *
 * @param {string | number} id - The AniList ID of the anime.
 * @param {number} episode - The episode number.
 * @param {number} [startAt] - Optional start position in seconds.
 * @returns {PlayersProps[]} - Array of player sources.
 */
export const getAnimePlayers = (
  id: string | number,
  episode: number,
  startAt?: number,
): PlayersProps[] => {
  return [
    {
      title: "VidLink Anime",
      source: `https://vidlink.pro/anime/${id}/${episode}?primaryColor=8b5cf6&secondaryColor=a2a2a2&iconColor=eefdec&autoplay=false&startAt=${startAt || ""}`,
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "VidLink Anime 2",
      source: `https://vidlink.pro/anime/${id}/${episode}?primaryColor=8b5cf6&autoplay=false`,
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
    },
    {
      title: "VidKing Anime",
      source: `https://www.vidking.net/embed/anime/${id}/${episode}?color=8b5cf6&autoplay=false`,
      recommended: true,
      fast: true,
      resumable: true,
    },
    {
      title: "<Embed> Anime",
      source: `https://embed.su/embed/anime/${id}/${episode}`,
      recommended: true,
      fast: true,
      ads: true,
    },
    {
      title: "AutoEmbed Anime 1",
      source: `https://player.autoembed.cc/embed/anime/${id}/${episode}`,
      fast: true,
      ads: true,
    },
    {
      title: "AutoEmbed Anime 2",
      source: `https://autoembed.co/anime/anilist/${id}-${episode}`,
      fast: true,
      ads: true,
    },
    {
      title: "VidSrc Anime v3",
      source: `https://vidsrc.cc/v3/embed/anime/${id}/${episode}?autoPlay=false`,
      fast: true,
      ads: true,
    },
    {
      title: "VidSrc Anime ICU",
      source: `https://vidsrc.icu/embed/anime/${id}/${episode}`,
      recommended: true,
      fast: true,
      ads: true,
    },
    {
      title: "SuperEmbed Anime",
      source: `https://multiembed.mov/directstream.php?video_id=${id}&anilist=1&e=${episode}`,
      fast: true,
      ads: true,
    },
    {
      title: "2Embed Anime",
      source: `https://www.2embed.cc/embedanime/${id}&e=${episode}`,
      ads: true,
    },
  ];
};
