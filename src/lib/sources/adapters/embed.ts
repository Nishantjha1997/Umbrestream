import type {
  AudioVariant,
  SourceAdapter,
  SourceCapabilities,
  SourceRequest,
  StreamCandidate,
} from "../types";
import type { MediaType } from "@/types/title";

type EmbedBuilder = (request: SourceRequest) => string | null;
type IdentifierRequirement = NonNullable<
  SourceAdapter["identifierRequirements"][MediaType]
>[number];

interface EmbedDefinition {
  id: string;
  label: string;
  origin: `https://${string}`;
  priorities: Partial<Record<MediaType, number>>;
  requirements: Partial<Record<MediaType, IdentifierRequirement[]>>;
  build: EmbedBuilder;
  capabilities: SourceCapabilities;
  audioVariant?: AudioVariant;
}

const createUrl = (
  base: string,
  params: Record<string, string | number | boolean | undefined>,
): string => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `${base}?${query}` : base;
};

const seconds = (request: SourceRequest): number | undefined =>
  request.startAt && request.startAt > 0 ? Math.floor(request.startAt) : undefined;

const animeSlug = (title: string): string =>
  title
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const movieAndTvRequirements: EmbedDefinition["requirements"] = {
  movie: ["tmdbId"],
  tv: ["tmdbId", "season", "episode"],
};

const definitions: EmbedDefinition[] = [
  {
    id: "vidking",
    label: "VidKing",
    origin: "https://www.vidking.net",
    priorities: { movie: 10, tv: 10 },
    requirements: movieAndTvRequirements,
    build: (request) => {
      if (request.mediaType === "movie" && request.tmdbId) {
        return createUrl(`https://www.vidking.net/embed/movie/${request.tmdbId}`, {
          color: "006fee",
          autoPlay: false,
          progress: seconds(request),
        });
      }
      if (request.mediaType === "tv" && request.tmdbId && request.season && request.episode) {
        return createUrl(
          `https://www.vidking.net/embed/tv/${request.tmdbId}/${request.season}/${request.episode}`,
          {
            color: "f5a524",
            autoPlay: false,
            nextEpisode: true,
            episodeSelector: true,
            progress: seconds(request),
          },
        );
      }
      return null;
    },
    capabilities: {
      recommended: true,
      fast: true,
      events: true,
      resumable: true,
      resumeParam: "progress",
      subtitles: "none",
    },
  },
  {
    id: "vidlink",
    label: "VidLink JW",
    origin: "https://vidlink.pro",
    priorities: { movie: 20, tv: 20 },
    requirements: movieAndTvRequirements,
    build: (request) => {
      const color = request.mediaType === "tv" ? "f5a524" : "006fee";
      if (request.mediaType === "movie" && request.tmdbId) {
        return createUrl(`https://vidlink.pro/movie/${request.tmdbId}`, {
          player: "jw",
          primaryColor: color,
          secondaryColor: "a2a2a2",
          iconColor: "eefdec",
          autoplay: false,
          startAt: seconds(request),
        });
      }
      if (request.mediaType === "tv" && request.tmdbId && request.season && request.episode) {
        return createUrl(
          `https://vidlink.pro/tv/${request.tmdbId}/${request.season}/${request.episode}`,
          {
            player: "jw",
            primaryColor: color,
            secondaryColor: "a2a2a2",
            iconColor: "eefdec",
            autoplay: false,
            startAt: seconds(request),
          },
        );
      }
      return null;
    },
    capabilities: {
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
      events: true,
      resumeParam: "startAt",
      subtitles: "native",
    },
  },
  {
    id: "vidlink-alt",
    label: "VidLink Native",
    origin: "https://vidlink.pro",
    priorities: { movie: 25, tv: 25 },
    requirements: movieAndTvRequirements,
    build: (request) => {
      const color = request.mediaType === "tv" ? "f5a524" : "006fee";
      if (request.mediaType === "movie" && request.tmdbId) {
        return createUrl(`https://vidlink.pro/movie/${request.tmdbId}`, {
          primaryColor: color,
          autoplay: false,
          startAt: seconds(request),
        });
      }
      if (request.mediaType === "tv" && request.tmdbId && request.season && request.episode) {
        return createUrl(
          `https://vidlink.pro/tv/${request.tmdbId}/${request.season}/${request.episode}`,
          {
            primaryColor: color,
            autoplay: false,
            startAt: seconds(request),
          },
        );
      }
      return null;
    },
    capabilities: {
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
      events: true,
      resumeParam: "startAt",
      subtitles: "native",
    },
  },
  {
    id: "cinesrc",
    label: "CineSrc",
    origin: "https://cinesrc.st",
    priorities: { movie: 30, tv: 30 },
    requirements: movieAndTvRequirements,
    build: (request) => {
      if (request.mediaType === "movie" && request.tmdbId) {
        return createUrl(`https://cinesrc.st/embed/movie/${request.tmdbId}`, {
          autoplay: false,
          autoskip: true,
          color: "#006fee",
          t: seconds(request),
          continueprompt: false,
        });
      }
      if (request.mediaType === "tv" && request.tmdbId && request.season && request.episode) {
        return createUrl(`https://cinesrc.st/embed/tv/${request.tmdbId}`, {
          s: request.season,
          e: request.episode,
          autoplay: false,
          autoskip: true,
          color: "#f5a524",
          t: seconds(request),
          continueprompt: false,
        });
      }
      return null;
    },
    capabilities: {
      recommended: true,
      resumable: true,
      events: true,
      resumeParam: "t",
      subtitles: "native",
    },
  },
  {
    id: "vidsrc-ru",
    label: "VidSrc RU",
    origin: "https://vidsrc.ru",
    priorities: { movie: 40, tv: 40 },
    requirements: movieAndTvRequirements,
    build: (request) => {
      if (request.mediaType === "movie" && request.tmdbId) {
        return createUrl(`https://vidsrc.ru/movie/${request.tmdbId}`, { autoplay: false });
      }
      if (request.mediaType === "tv" && request.tmdbId && request.season && request.episode) {
        return createUrl(
          `https://vidsrc.ru/tv/${request.tmdbId}/${request.season}/${request.episode}`,
          { autoplay: false },
        );
      }
      return null;
    },
    capabilities: { fast: true, ads: true, subtitles: "native" },
  },
  {
    id: "vidsrc-mov",
    label: "VidSrc MOV",
    origin: "https://vidsrc.mov",
    priorities: { movie: 50, tv: 50 },
    requirements: movieAndTvRequirements,
    build: (request) => {
      if (request.mediaType === "movie" && request.tmdbId) {
        return `https://vidsrc.mov/embed/movie/${request.tmdbId}`;
      }
      if (request.mediaType === "tv" && request.tmdbId && request.season && request.episode) {
        return `https://vidsrc.mov/embed/tv/${request.tmdbId}/${request.season}/${request.episode}`;
      }
      return null;
    },
    capabilities: { fast: true, ads: true, subtitles: "native" },
  },
  {
    id: "vidsrc-anime-sub",
    label: "VidSrc Anime",
    origin: "https://vidsrc.cc",
    priorities: { anime: 10 },
    requirements: { anime: ["anilistId", "episode"] },
    build: (request) =>
      request.anilistId && request.episode
        ? createUrl(
            `https://vidsrc.cc/v2/embed/anime/${request.anilistId}/${request.episode}/sub`,
            { autoPlay: false, autoSkipIntro: true },
          )
        : null,
    capabilities: { recommended: true, ads: true, subtitles: "native" },
    audioVariant: "sub",
  },
  {
    id: "vidsrc-anime-dub",
    label: "VidSrc Anime",
    origin: "https://vidsrc.cc",
    priorities: { anime: 11 },
    requirements: { anime: ["anilistId", "episode"] },
    build: (request) =>
      request.anilistId && request.episode
        ? createUrl(
            `https://vidsrc.cc/v2/embed/anime/${request.anilistId}/${request.episode}/dub`,
            { autoPlay: false, autoSkipIntro: true },
          )
        : null,
    capabilities: { ads: true, subtitles: "unverified" },
    audioVariant: "dub",
  },
  {
    id: "megaplay-sub",
    label: "MegaPlay",
    origin: "https://megaplay.buzz",
    priorities: { anime: 20 },
    requirements: { anime: ["episode"] },
    build: (request) => {
      const idType = request.malId ? "mal" : request.anilistId ? "ani" : null;
      const id = request.malId ?? request.anilistId;
      return idType && id && request.episode
        ? `https://megaplay.buzz/stream/${idType}/${id}/${request.episode}/sub`
        : null;
    },
    capabilities: { recommended: true, events: true, ads: true, subtitles: "native" },
    audioVariant: "sub",
  },
  {
    id: "megaplay-dub",
    label: "MegaPlay",
    origin: "https://megaplay.buzz",
    priorities: { anime: 21 },
    requirements: { anime: ["episode"] },
    build: (request) => {
      const idType = request.malId ? "mal" : request.anilistId ? "ani" : null;
      const id = request.malId ?? request.anilistId;
      return idType && id && request.episode
        ? `https://megaplay.buzz/stream/${idType}/${id}/${request.episode}/dub`
        : null;
    },
    capabilities: { events: true, ads: true, subtitles: "unverified" },
    audioVariant: "dub",
  },
  {
    id: "dropfile-sub",
    label: "DropFile",
    origin: "https://dropfile.cc",
    priorities: { anime: 30 },
    requirements: { anime: ["malId", "episode"] },
    build: (request) =>
      request.malId && request.episode
        ? createUrl(`https://dropfile.cc/player/tv/mal-${request.malId}/1/${request.episode}`, {
            audio: "sub",
            lang: request.preferredSubtitle ?? "en",
            autoplay: 0,
          })
        : null,
    capabilities: { ads: true, subtitles: "native" },
    audioVariant: "sub",
  },
  {
    id: "dropfile-dub",
    label: "DropFile",
    origin: "https://dropfile.cc",
    priorities: { anime: 31 },
    requirements: { anime: ["malId", "episode"] },
    build: (request) =>
      request.malId && request.episode
        ? createUrl(`https://dropfile.cc/player/tv/mal-${request.malId}/1/${request.episode}`, {
            audio: "dub",
            lang: request.preferredSubtitle ?? "en",
            autoplay: 0,
          })
        : null,
    capabilities: { ads: true, subtitles: "unverified" },
    audioVariant: "dub",
  },
  {
    id: "anime-autoembed",
    label: "AutoEmbed Anime",
    origin: "https://anime.autoembed.cc",
    priorities: { anime: 40 },
    requirements: { anime: ["title", "episode"] },
    build: (request) => {
      if (!request.title || !request.episode) return null;
      const slug = animeSlug(request.title);
      return slug ? `https://anime.autoembed.cc/embed/${slug}-episode-${request.episode}` : null;
    },
    capabilities: { fast: true, ads: true, subtitles: "native" },
    audioVariant: "sub",
  },
];

export function createEmbedAdapters(): SourceAdapter[] {
  return definitions.map(
    (definition): SourceAdapter => ({
      id: definition.id,
      label: definition.label,
      supportedMediaTypes: Object.keys(definition.priorities) as MediaType[],
      identifierRequirements: definition.requirements,
      priority: (request) => definition.priorities[request.mediaType] ?? Number.MAX_SAFE_INTEGER,
      supports(request) {
        if (definition.priorities[request.mediaType] === undefined) return false;
        const requirements = definition.requirements[request.mediaType] ?? [];
        return (
          requirements.every((key) => request[key] !== undefined && request[key] !== "") &&
          definition.build(request) !== null
        );
      },
      async resolve(request): Promise<StreamCandidate[]> {
        const url = definition.build(request);
        if (!url) return [];
        return [
          {
            id: definition.id,
            providerId: definition.id,
            label: definition.label,
            kind: "iframe",
            url,
            providerOrigin: definition.origin,
            mediaType: request.mediaType,
            priority: definition.priorities[request.mediaType] ?? Number.MAX_SAFE_INTEGER,
            audioVariant: request.mediaType === "anime" ? definition.audioVariant : undefined,
            capabilities: {
              subtitles: "unverified",
              iframe: {
                allow:
                  "autoplay; encrypted-media; picture-in-picture; fullscreen; screen-wake-lock",
                referrerPolicy: "origin-when-cross-origin",
              },
              ...definition.capabilities,
            },
          },
        ];
      },
    }),
  );
}
