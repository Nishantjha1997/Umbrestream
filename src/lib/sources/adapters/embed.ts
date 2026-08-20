import type { MediaType } from "@/types/title";
import type {
  AudioVariant,
  PlayerSource,
  ProviderTier,
  SourceAdapter,
  SourceCapabilities,
  SourceRequest,
  StreamCandidate,
} from "../types";

type EmbedBuilder = (request: SourceRequest) => string | null;
type IdentifierRequirement = NonNullable<
  SourceAdapter["identifierRequirements"][MediaType]
>[number];

interface EmbedDefinition {
  id: string;
  providerId?: string;
  label: string;
  origin: `https://${string}`;
  tier: ProviderTier;
  variant?: string;
  priorities: Partial<Record<MediaType, number>>;
  requirements: Partial<Record<MediaType, IdentifierRequirement[]>>;
  build: EmbedBuilder;
  capabilities: SourceCapabilities;
  audioVariant?: AudioVariant;
}

/**
 * Every origin framed below is untrusted — third-party embed hosts, several of
 * them explicitly `tier: "experimental"`. Provider capabilities are kept
 * explicit because each player may require its own controls and navigation.
 *
 * The iframe permissions cover common player controls such as autoplay,
 * encrypted media, picture-in-picture, fullscreen, and screen wake lock.
 *
 * Providers retain the permissions needed for their own player controls,
 * including server pickers, captions, and fullscreen presentation.
 *
 * Provider-specific requirements should be added to that provider definition
 * only after an exact playback fixture confirms the need.
 */
const IFRAME_CAPABILITIES: NonNullable<SourceCapabilities["iframe"]> = {
  allow: "autoplay; encrypted-media; picture-in-picture; fullscreen; screen-wake-lock",
  referrerPolicy: "origin-when-cross-origin",
};

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

const movieAndTvRequirements: EmbedDefinition["requirements"] = {
  movie: ["tmdbId"],
  tv: ["tmdbId", "season", "episode"],
};

const ANIME_SOURCES_V2_ENABLED = process.env.NEXT_PUBLIC_ANIME_SOURCES_V2 !== "false";

const movieOrTv = (
  request: SourceRequest,
  movieBase: (id: number) => string,
  tvBase: (id: number, season: number, episode: number) => string,
): string | null => {
  if (request.mediaType === "movie" && request.tmdbId) return movieBase(request.tmdbId);
  if (
    request.mediaType === "tv" &&
    request.tmdbId &&
    request.season !== undefined &&
    request.episode !== undefined
  ) {
    return tvBase(request.tmdbId, request.season, request.episode);
  }
  return null;
};

const definitions: EmbedDefinition[] = [
  {
    id: "vidsrc",
    label: "VidSrc",
    origin: "https://vidsrc.rip",
    // Keep this user-selectable as an experimental fallback. It has no
    // verified playback event contract and must not outrank stable providers.
    tier: "experimental",
    priorities: { movie: 70, tv: 70 },
    requirements: movieAndTvRequirements,
    build: (request) =>
      movieOrTv(
        request,
        (id) => `https://vidsrc.rip/embed/movie/${id}`,
        (id, season, episode) => `https://vidsrc.rip/embed/tv/${id}/${season}/${episode}`,
      ),
    capabilities: {
      ads: true,
      subtitles: "unverified",
    },
  },
  {
    id: "cinezo",
    label: "Cinezo",
    origin: "https://player.cinezo.live",
    tier: "stable",
    // Cinezo is the verified movie default and a stable TV fallback.
    priorities: { movie: 2, tv: 2 },
    requirements: movieAndTvRequirements,
    build: (request) => {
      const base = movieOrTv(
        request,
        (id) => `https://player.cinezo.live/embed/movie/${id}`,
        (id, season, episode) => `https://player.cinezo.live/embed/tv/${id}/${season}/${episode}`,
      );
      if (!base) return null;
      return createUrl(base, {
        autoplay: false,
        poster: true,
        servericon: true,
        setting: true,
        pip: true,
        primarycolor: request.mediaType === "tv" ? "f5a524" : "006fee",
        secondarycolor: "0a0a12",
        iconcolor: "ffffff",
      });
    },
    capabilities: {
      recommended: true,
      events: true,
      eventProtocol: "cinezo",
      resumable: true,
      resumeParam: "startAt",
      subtitles: "native",
    },
  },
  {
    id: "vidlink",
    label: "VidLink",
    origin: "https://vidlink.pro",
    tier: "stable",
    variant: "jw",
    // VidLink remains a stable fallback for both movies and TV.
    priorities: { movie: 3, tv: 3 },
    requirements: movieAndTvRequirements,
    build: (request) => {
      const base = movieOrTv(
        request,
        (id) => `https://vidlink.pro/movie/${id}`,
        (id, season, episode) => `https://vidlink.pro/tv/${id}/${season}/${episode}`,
      );
      if (!base) return null;
      return createUrl(base, {
        player: "jw",
        primaryColor: request.mediaType === "tv" ? "f5a524" : "006fee",
        secondaryColor: "a2a2a2",
        iconColor: "eefdec",
        autoplay: false,
        startAt: seconds(request),
      });
    },
    capabilities: {
      recommended: true,
      fast: true,
      ads: true,
      resumable: true,
      events: true,
      eventProtocol: "vidlink",
      resumeParam: "startAt",
      subtitles: "native",
    },
  },
  {
    id: "vidlink-native",
    providerId: "vidlink",
    label: "VidLink Classic",
    origin: "https://vidlink.pro",
    tier: "stable",
    variant: "native",
    // The native VidLink variant is a second stable fallback.
    priorities: { movie: 4, tv: 4 },
    requirements: movieAndTvRequirements,
    build: (request) => {
      const base = movieOrTv(
        request,
        (id) => `https://vidlink.pro/movie/${id}`,
        (id, season, episode) => `https://vidlink.pro/tv/${id}/${season}/${episode}`,
      );
      return base
        ? createUrl(base, {
            primaryColor: request.mediaType === "tv" ? "f5a524" : "006fee",
            autoplay: false,
            startAt: seconds(request),
          })
        : null;
    },
    capabilities: {
      fast: true,
      ads: true,
      resumable: true,
      events: true,
      eventProtocol: "vidlink",
      resumeParam: "startAt",
      subtitles: "native",
    },
  },
  {
    id: "vidking",
    label: "VidKing",
    origin: "https://www.vidking.net",
    tier: "stable",
    // TV: 1st — the only checked TV fixture that reached a playable media
    // state after the Filmu-first outage (TV_PLAYER_ROLLBACK_HANDOFF.md).
    // Movies use the stable providers above before reaching experimental fallbacks.
    priorities: { movie: 5, tv: 1 },
    requirements: movieAndTvRequirements,
    build: (request) => {
      const base = movieOrTv(
        request,
        (id) => `https://www.vidking.net/embed/movie/${id}`,
        (id, season, episode) => `https://www.vidking.net/embed/tv/${id}/${season}/${episode}`,
      );
      if (!base) return null;
      return createUrl(base, {
        color: request.mediaType === "tv" ? "f5a524" : "006fee",
        autoPlay: false,
        nextEpisode: request.mediaType === "tv" ? true : undefined,
        episodeSelector: request.mediaType === "tv" ? true : undefined,
        progress: seconds(request),
      });
    },
    capabilities: {
      fast: true,
      events: true,
      eventProtocol: "vidking",
      resumable: true,
      resumeParam: "progress",
      subtitles: "none",
    },
  },
  {
    id: "vidrift",
    label: "Vidrift",
    origin: "https://embed.vidrift.in",
    tier: "experimental",
    priorities: { movie: 40, tv: 40 },
    requirements: movieAndTvRequirements,
    build: (request) =>
      movieOrTv(
        request,
        (id) => `https://embed.vidrift.in/embed/movie/${id}`,
        (id, season, episode) => `https://embed.vidrift.in/embed/tv/${id}/${season}/${episode}`,
      ),
    capabilities: { ads: true, subtitles: "unverified" },
  },
  {
    id: "vidbolt",
    label: "Vidbolt",
    origin: "https://vidbolt.xyz",
    tier: "experimental",
    priorities: { movie: 50, tv: 50 },
    requirements: movieAndTvRequirements,
    build: (request) =>
      movieOrTv(
        request,
        (id) => `https://vidbolt.xyz/movie/${id}`,
        (id, season, episode) => `https://vidbolt.xyz/tv/${id}/${season}/${episode}`,
      ),
    capabilities: { ads: true, subtitles: "unverified" },
  },
  {
    id: "videasy",
    label: "Videasy",
    origin: "https://player.videasy.to",
    tier: "experimental",
    priorities: { movie: 60, tv: 60 },
    requirements: movieAndTvRequirements,
    build: (request) =>
      movieOrTv(
        request,
        (id) => `https://player.videasy.to/movie/${id}`,
        (id, season, episode) => `https://player.videasy.to/tv/${id}/${season}/${episode}`,
      ),
    capabilities: {
      events: true,
      eventProtocol: "videasy",
      resumable: true,
      subtitles: "unverified",
      ads: true,
    },
  },
  {
    id: "filmu",
    label: "Filmu",
    origin: "https://embed.filmu.in",
    tier: "stable",
    // TV: 2nd. Filmu's outer HTML loads but its TV iframe has been observed
    // to expose no playable media on some titles — never default TV to it
    // again without VidKing checked first (TV_PLAYER_ROLLBACK_HANDOFF.md).
    // Filmu remains available for manual recovery, but is not the automatic default.
    priorities: { movie: 1, tv: 90 },
    requirements: movieAndTvRequirements,
    build: (request) =>
      movieOrTv(
        request,
        (id) => `https://embed.filmu.in/movie/${id}`,
        (id, season, episode) => `https://embed.filmu.in/tv/${id}/${season}/${episode}`,
      ),
    capabilities: {
      recommended: true,
      events: true,
      eventProtocol: "filmu",
      resumable: true,
      subtitles: "unverified",
      ads: true,
    },
  },
];

const legacyAnimeDefinitions: EmbedDefinition[] = [
  {
    id: "vidlink-anime-sub",
    providerId: "vidlink",
    label: "VidLink Sub",
    origin: "https://vidlink.pro",
    tier: "stable",
    variant: "anime-sub",
    priorities: { anime: 10 },
    requirements: { anime: ["malId", "episode"] },
    build: (request) =>
      request.malId && request.episode
        ? createUrl(`https://vidlink.pro/anime/${request.malId}/${request.episode}/sub`, {
            fallback: true,
            autoplay: false,
          })
        : null,
    capabilities: {
      recommended: true,
      fast: true,
      events: true,
      eventProtocol: "vidlink",
      resumable: true,
      resumeParam: "startAt",
      subtitles: "native",
      ads: true,
    },
    audioVariant: "sub",
  },
  {
    id: "vidlink-anime-dub",
    providerId: "vidlink",
    label: "VidLink Dub",
    origin: "https://vidlink.pro",
    tier: "stable",
    variant: "anime-dub",
    priorities: { anime: 11 },
    requirements: { anime: ["malId", "episode"] },
    build: (request) =>
      request.malId && request.episode
        ? createUrl(`https://vidlink.pro/anime/${request.malId}/${request.episode}/dub`, {
            fallback: true,
            autoplay: false,
          })
        : null,
    capabilities: {
      fast: true,
      events: true,
      eventProtocol: "vidlink",
      resumable: true,
      resumeParam: "startAt",
      subtitles: "native",
      ads: true,
    },
    audioVariant: "dub",
  },
  {
    id: "cinezo-anime-sub",
    providerId: "cinezo",
    label: "Cinezo Sub",
    origin: "https://player.cinezo.live",
    tier: "stable",
    variant: "anime-sub",
    priorities: { anime: 20 },
    requirements: { anime: ["anilistId", "episode"] },
    build: (request) =>
      request.anilistId && request.episode
        ? createUrl(
            `https://player.cinezo.live/embed/anime/${request.anilistId}/${request.episode}`,
            { dub: false, autoplay: false, servericon: true, setting: true, pip: true },
          )
        : null,
    capabilities: {
      recommended: true,
      events: true,
      eventProtocol: "cinezo",
      subtitles: "native",
    },
    audioVariant: "sub",
  },
  {
    id: "cinezo-anime-dub",
    providerId: "cinezo",
    label: "Cinezo Dub",
    origin: "https://player.cinezo.live",
    tier: "stable",
    variant: "anime-dub",
    priorities: { anime: 21 },
    requirements: { anime: ["anilistId", "episode"] },
    build: (request) =>
      request.anilistId && request.episode
        ? createUrl(
            `https://player.cinezo.live/embed/anime/${request.anilistId}/${request.episode}`,
            { dub: true, autoplay: false, servericon: true, setting: true, pip: true },
          )
        : null,
    capabilities: {
      events: true,
      eventProtocol: "cinezo",
      subtitles: "native",
    },
    audioVariant: "dub",
  },
];

const recoveredAnimeDefinitions: EmbedDefinition[] = [
  {
    id: "vidsrc-anime-sub",
    label: "VidSrc Sub",
    origin: "https://vidsrc.me",
    tier: "stable",
    variant: "anime-sub",
    priorities: { anime: 35 },
    requirements: { anime: ["malId", "episode"] },
    build: (request) =>
      request.malId && request.episode
        ? `https://vidsrc.me/embed/anime/${request.malId}/${request.episode}`
        : null,
    capabilities: {
      subtitles: "unverified",
      ads: true,
    },
    audioVariant: "sub",
  },
  {
    id: "anilink-sub",
    label: "AniLink Sub",
    origin: "https://anilink.cc",
    tier: "stable",
    variant: "anime-sub",
    priorities: { anime: 30 },
    requirements: { anime: ["anilistId", "episode"] },
    build: (request) =>
      request.anilistId && request.episode
        ? createUrl(`https://anilink.cc/watch/${request.anilistId}/${request.episode}`, {
            variant: "sub",
            autoplay: false,
            autoNext: true,
            startAt: seconds(request),
            primaryColor: "a855f7",
            secondaryColor: "0f1014",
            iconColor: "ffffff",
          })
        : null,
    capabilities: {
      recommended: true,
      fast: true,
      resumable: true,
      resumeParam: "startAt",
      subtitles: "unverified",
    },
    audioVariant: "sub",
  },
  {
    id: "anilink-dub",
    label: "AniLink Dub",
    origin: "https://anilink.cc",
    tier: "stable",
    variant: "anime-dub",
    priorities: { anime: 31 },
    requirements: { anime: ["anilistId", "episode"] },
    build: (request) =>
      request.anilistId && request.episode
        ? createUrl(`https://anilink.cc/watch/${request.anilistId}/${request.episode}`, {
            variant: "dub",
            autoplay: false,
            autoNext: true,
            startAt: seconds(request),
            primaryColor: "a855f7",
            secondaryColor: "0f1014",
            iconColor: "ffffff",
          })
        : null,
    capabilities: {
      fast: true,
      resumable: true,
      resumeParam: "startAt",
      subtitles: "unverified",
    },
    audioVariant: "dub",
  },
  {
    id: "vidnest-animepahe-sub",
    label: "VidNest AnimePahe Sub",
    origin: "https://vidnest.fun",
    tier: "stable",
    variant: "animepahe-sub",
    priorities: { anime: 10 },
    requirements: { anime: ["anilistId", "episode"] },
    build: (request) =>
      request.anilistId && request.episode
        ? createUrl(`https://vidnest.fun/animepahe/${request.anilistId}/${request.episode}/sub`, {
            startAt: seconds(request),
          })
        : null,
    capabilities: {
      recommended: true,
      resumable: true,
      resumeParam: "startAt",
      subtitles: "unverified",
    },
    audioVariant: "sub",
  },
  {
    id: "vidnest-animepahe-dub",
    label: "VidNest AnimePahe Dub",
    origin: "https://vidnest.fun",
    tier: "stable",
    variant: "animepahe-dub",
    priorities: { anime: 11 },
    requirements: { anime: ["anilistId", "episode"] },
    build: (request) =>
      request.anilistId && request.episode
        ? createUrl(`https://vidnest.fun/animepahe/${request.anilistId}/${request.episode}/dub`, {
            startAt: seconds(request),
          })
        : null,
    capabilities: {
      resumable: true,
      resumeParam: "startAt",
      subtitles: "unverified",
    },
    audioVariant: "dub",
  },
];

const quarantinedAnimeDefinitions: EmbedDefinition[] = [
  {
    id: "vidrift-anime",
    providerId: "vidrift",
    label: "Vidrift Anime",
    origin: "https://embed.vidrift.in",
    tier: "experimental",
    priorities: { anime: 40 },
    requirements: { anime: ["animeTmdbId", "episode"] },
    build: (request) =>
      request.animeTmdbId && request.episode
        ? `https://embed.vidrift.in/embed/tv/${request.animeTmdbId}/1/${request.episode}`
        : null,
    capabilities: { ads: true, subtitles: "unverified" },
    audioVariant: "sub",
  },
  {
    id: "vidbolt-anime",
    providerId: "vidbolt",
    label: "Vidbolt Anime",
    origin: "https://vidbolt.xyz",
    tier: "experimental",
    priorities: { anime: 50 },
    requirements: { anime: ["animeTmdbId", "episode"] },
    build: (request) =>
      request.animeTmdbId && request.episode
        ? `https://vidbolt.xyz/anime/${request.animeTmdbId}/${request.episode}`
        : null,
    capabilities: { ads: true, subtitles: "unverified" },
    audioVariant: "sub",
  },
  {
    id: "videasy-anime",
    providerId: "videasy",
    label: "Videasy Anime",
    origin: "https://player.videasy.to",
    tier: "experimental",
    priorities: { anime: 60 },
    requirements: { anime: ["animeTmdbId", "episode"] },
    build: (request) =>
      request.animeTmdbId && request.episode
        ? `https://player.videasy.to/anime/${request.animeTmdbId}/${request.episode}`
        : null,
    capabilities: {
      events: true,
      eventProtocol: "videasy",
      ads: true,
      subtitles: "unverified",
    },
    audioVariant: "sub",
  },
  {
    id: "filmu-anime",
    providerId: "filmu",
    label: "Filmu Anime",
    origin: "https://embed.filmu.in",
    tier: "experimental",
    priorities: { anime: 70 },
    requirements: { anime: ["animeTmdbId", "episode"] },
    build: (request) =>
      request.animeTmdbId && request.episode
        ? `https://embed.filmu.in/anime/${request.animeTmdbId}/${request.episode}`
        : null,
    capabilities: {
      events: true,
      eventProtocol: "filmu",
      ads: true,
      subtitles: "unverified",
    },
    audioVariant: "sub",
  },
];

const allDefinitions = [
  ...definitions,
  ...(ANIME_SOURCES_V2_ENABLED
    ? [
        ...recoveredAnimeDefinitions,
        ...legacyAnimeDefinitions.filter((definition) => definition.id.startsWith("cinezo-anime-")),
      ]
    : [...legacyAnimeDefinitions, ...quarantinedAnimeDefinitions]),
];

const supportsDefinition = (definition: EmbedDefinition, request: SourceRequest): boolean => {
  if (definition.priorities[request.mediaType] === undefined) return false;
  const requirements = definition.requirements[request.mediaType] ?? [];
  return (
    requirements.every((key) => request[key] !== undefined && request[key] !== "") &&
    definition.build(request) !== null
  );
};

const candidateFrom = (
  definition: EmbedDefinition,
  request: SourceRequest,
): StreamCandidate | null => {
  const url = definition.build(request);
  if (!url) return null;
  return {
    id: definition.id,
    providerId: definition.providerId ?? definition.id,
    label: definition.label,
    kind: "iframe",
    url,
    providerOrigin: definition.origin,
    providerTier: definition.tier,
    playerVariant: definition.variant,
    mediaType: request.mediaType,
    priority: definition.priorities[request.mediaType] ?? Number.MAX_SAFE_INTEGER,
    audioVariant: request.mediaType === "anime" ? definition.audioVariant : undefined,
    capabilities: {
      subtitles: "unverified",
      iframe: IFRAME_CAPABILITIES,
      ...definition.capabilities,
    },
  };
};

/** Pure and synchronous so the browser can mount a public embed without an API waterfall. */
export function createPublicEmbedSources(request: SourceRequest): PlayerSource[] {
  return allDefinitions
    .filter((definition) => supportsDefinition(definition, request))
    .map((definition) => candidateFrom(definition, request))
    .filter((candidate): candidate is StreamCandidate => candidate !== null)
    .sort((a, b) => a.priority - b.priority)
    .map((candidate) => ({
      ...candidate,
      availability: "unverified",
      healthEvidence: "manifest",
    }));
}

export function createEmbedAdapters(): SourceAdapter[] {
  return allDefinitions.map((definition): SourceAdapter => ({
    id: definition.id,
    label: definition.label,
    supportedMediaTypes: Object.keys(definition.priorities) as MediaType[],
    identifierRequirements: definition.requirements,
    priority: (request) => definition.priorities[request.mediaType] ?? Number.MAX_SAFE_INTEGER,
    supports: (request) => supportsDefinition(definition, request),
    async resolve(request): Promise<StreamCandidate[]> {
      const candidate = candidateFrom(definition, request);
      return candidate ? [candidate] : [];
    },
  }));
}
