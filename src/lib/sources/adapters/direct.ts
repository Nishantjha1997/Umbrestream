import type {
  MediaTrack,
  SourceAdapter,
  SourceRequest,
  StreamCandidate,
  StreamKind,
} from "../types";

/**
 * Reference implementation of the SourceAdapter contract.
 *
 * Maps a title to a file you already have — a local HLS manifest, an MP4 on
 * a NAS, anything reachable by URL. It exists both to be useful on its own
 * and to serve as the worked example for writing further adapters: see
 * `src/lib/sources/README.md`.
 */

export interface DirectEntry {
  tmdbId?: number;
  anilistId?: number;
  season?: number;
  episode?: number;
  url: string;
  label?: string;
  quality?: number;
  kind?: Exclude<StreamKind, "iframe">;
  audioTracks?: MediaTrack[];
  subtitleTracks?: MediaTrack[];
}

function matches(entry: DirectEntry, req: SourceRequest): boolean {
  if (entry.tmdbId !== undefined && entry.tmdbId !== req.tmdbId) return false;
  if (entry.anilistId !== undefined && entry.anilistId !== req.anilistId) return false;
  if (entry.season !== undefined && entry.season !== req.season) return false;
  if (entry.episode !== undefined && entry.episode !== req.episode) return false;
  return entry.tmdbId !== undefined || entry.anilistId !== undefined;
}

function kindOf(url: string): Exclude<StreamKind, "iframe"> {
  const path = url.split("?")[0].toLowerCase();
  if (path.endsWith(".m3u8")) return "hls";
  if (path.endsWith(".mpd")) return "dash";
  return "mp4";
}

const proxiedSubtitles = (tracks?: MediaTrack[]): MediaTrack[] | undefined =>
  tracks?.map((track) => ({
    ...track,
    url: track.url ? `/api/player/subtitles?url=${encodeURIComponent(track.url)}` : undefined,
    format: "vtt",
  }));

export function createDirectAdapter(entries: DirectEntry[]): SourceAdapter {
  return {
    id: "direct",
    label: "Local library",
    supportedMediaTypes: ["movie", "tv", "anime"],
    identifierRequirements: {
      movie: ["tmdbId"],
      tv: ["tmdbId", "season", "episode"],
      anime: ["anilistId", "episode"],
    },
    priority: 0,

    supports(req) {
      return entries.some((e) => matches(e, req));
    },

    async resolve(req): Promise<StreamCandidate[]> {
      return entries
        .filter((e) => matches(e, req))
        .map((e, i) => ({
          id: `direct-${i}`,
          providerId: "direct",
          label: e.label ?? (e.quality ? `${e.quality}p` : "Direct"),
          kind: e.kind ?? kindOf(e.url),
          url: e.url,
          providerOrigin: new URL(e.url).origin,
          providerTier: "direct",
          playerVariant: e.kind ?? kindOf(e.url),
          mediaType: req.mediaType,
          priority: 0,
          capabilities: {
            resumable: true,
            events: true,
            eventProtocol: "native",
            subtitles: e.subtitleTracks?.length ? "native" : "none",
          },
          quality: e.quality,
          audioTracks: e.audioTracks,
          subtitleTracks: proxiedSubtitles(e.subtitleTracks),
        }));
    },
  };
}
