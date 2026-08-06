import type { PlayersProps } from "@/types";

const wholeSeconds = (startAt?: number): number | undefined =>
  startAt && startAt > 0 ? Math.floor(startAt) : undefined;

const createUrl = (
  base: `https://${string}`,
  params: Record<string, string | number | boolean | undefined>,
): `https://${string}` => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  return `${base}?${search.toString()}`;
};

const slugifyAnime = (title: string): string =>
  title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/** Rollback generator retained for one deployment while Player Engine V2 stabilizes. */
export const getMoviePlayers = (id: string | number, startAt?: number): PlayersProps[] => [
  {
    title: "Filmu",
    source: `https://embed.filmu.in/movie/${id}`,
    recommended: true,
    resumable: true,
  },
  {
    title: "VidKing",
    source: createUrl(`https://www.vidking.net/embed/movie/${id}`, {
      color: "006fee",
      autoPlay: false,
      progress: wholeSeconds(startAt),
    }),
    recommended: true,
    fast: true,
    resumable: true,
  },
  {
    title: "VidLink JW",
    source: createUrl(`https://vidlink.pro/movie/${id}`, {
      player: "jw",
      primaryColor: "006fee",
      secondaryColor: "a2a2a2",
      iconColor: "eefdec",
      autoplay: false,
      startAt: wholeSeconds(startAt),
    }),
    recommended: true,
    fast: true,
    ads: true,
    resumable: true,
  },
  {
    title: "VidLink Native",
    source: createUrl(`https://vidlink.pro/movie/${id}`, {
      primaryColor: "006fee",
      autoplay: false,
      startAt: wholeSeconds(startAt),
    }),
    recommended: true,
    fast: true,
    ads: true,
    resumable: true,
  },
  {
    title: "CineSrc",
    source: createUrl(`https://cinesrc.st/embed/movie/${id}`, {
      autoplay: false,
      autoskip: true,
      color: "#006fee",
      t: wholeSeconds(startAt),
      continueprompt: false,
    }),
    recommended: true,
    resumable: true,
  },
  {
    title: "VidSrc RU",
    source: createUrl(`https://vidsrc.ru/movie/${id}`, { autoplay: false }),
    fast: true,
    ads: true,
  },
  {
    title: "VidSrc MOV",
    source: `https://vidsrc.mov/embed/movie/${id}`,
    fast: true,
    ads: true,
  },
];

/** Rollback generator retained for one deployment while Player Engine V2 stabilizes. */
export const getTvShowPlayers = (
  id: string | number,
  season: number,
  episode: number,
  startAt?: number,
): PlayersProps[] => [
  {
    title: "Filmu",
    source: `https://embed.filmu.in/tv/${id}/${season}/${episode}`,
    recommended: true,
    resumable: true,
  },
  {
    title: "VidKing",
    source: createUrl(`https://www.vidking.net/embed/tv/${id}/${season}/${episode}`, {
      color: "f5a524",
      autoPlay: false,
      nextEpisode: true,
      episodeSelector: true,
      progress: wholeSeconds(startAt),
    }),
    recommended: true,
    fast: true,
    resumable: true,
  },
  {
    title: "VidLink JW",
    source: createUrl(`https://vidlink.pro/tv/${id}/${season}/${episode}`, {
      player: "jw",
      primaryColor: "f5a524",
      secondaryColor: "a2a2a2",
      iconColor: "eefdec",
      autoplay: false,
      startAt: wholeSeconds(startAt),
    }),
    recommended: true,
    fast: true,
    ads: true,
    resumable: true,
  },
  {
    title: "VidLink Native",
    source: createUrl(`https://vidlink.pro/tv/${id}/${season}/${episode}`, {
      primaryColor: "f5a524",
      autoplay: false,
      startAt: wholeSeconds(startAt),
    }),
    recommended: true,
    fast: true,
    ads: true,
    resumable: true,
  },
  {
    title: "CineSrc",
    source: createUrl(`https://cinesrc.st/embed/tv/${id}`, {
      s: season,
      e: episode,
      autoplay: false,
      autoskip: true,
      color: "#f5a524",
      t: wholeSeconds(startAt),
      continueprompt: false,
    }),
    recommended: true,
    resumable: true,
  },
  {
    title: "VidSrc RU",
    source: createUrl(`https://vidsrc.ru/tv/${id}/${season}/${episode}`, {
      autoplay: false,
    }),
    fast: true,
    ads: true,
  },
  {
    title: "VidSrc MOV",
    source: `https://vidsrc.mov/embed/tv/${id}/${season}/${episode}`,
    fast: true,
    ads: true,
  },
];

/**
 * Anime providers are intentionally limited to documented contracts. Player V2 preflights the
 * exact episode, so temporarily unhealthy hosts remain visible as Failed instead of being loaded.
 */
export const getAnimePlayers = (
  anilistId: string | number,
  episode: number,
  _startAt?: number,
  malId?: number | null,
  title?: string,
): PlayersProps[] => {
  const players: PlayersProps[] = [
    {
      title: "VidSrc Anime Sub",
      source: createUrl(`https://vidsrc.cc/v2/embed/anime/${anilistId}/${episode}/sub`, {
        autoPlay: false,
        autoSkipIntro: true,
      }),
      recommended: true,
      ads: true,
    },
    {
      title: "VidSrc Anime Dub",
      source: createUrl(`https://vidsrc.cc/v2/embed/anime/${anilistId}/${episode}/dub`, {
        autoPlay: false,
        autoSkipIntro: true,
      }),
      ads: true,
    },
  ];

  const megaType = malId ? "mal" : "ani";
  const megaId = malId ?? anilistId;
  players.push(
    {
      title: "MegaPlay Sub",
      source: `https://megaplay.buzz/stream/${megaType}/${megaId}/${episode}/sub`,
      recommended: true,
      ads: true,
    },
    {
      title: "MegaPlay Dub",
      source: `https://megaplay.buzz/stream/${megaType}/${megaId}/${episode}/dub`,
      ads: true,
    },
  );

  if (malId) {
    players.push(
      {
        title: "DropFile Sub",
        source: createUrl(`https://dropfile.cc/player/tv/mal-${malId}/1/${episode}`, {
          audio: "sub",
          lang: "en",
          autoplay: 0,
        }),
        ads: true,
      },
      {
        title: "DropFile Dub",
        source: createUrl(`https://dropfile.cc/player/tv/mal-${malId}/1/${episode}`, {
          audio: "dub",
          lang: "en",
          autoplay: 0,
        }),
        ads: true,
      },
    );
  }

  if (title) {
    const slug = slugifyAnime(title);
    if (slug) {
      players.push({
        title: "AutoEmbed Anime",
        source: `https://anime.autoembed.cc/embed/${slug}-episode-${episode}`,
        fast: true,
        ads: true,
      });
    }
  }

  return players;
};
