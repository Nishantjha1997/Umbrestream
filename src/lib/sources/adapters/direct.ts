import type { SourceAdapter, SourceRequest, StreamCandidate } from "../types";

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
}

function matches(entry: DirectEntry, req: SourceRequest): boolean {
  if (entry.tmdbId !== undefined && entry.tmdbId !== req.tmdbId) return false;
  if (entry.anilistId !== undefined && entry.anilistId !== req.anilistId) return false;
  if (entry.season !== undefined && entry.season !== req.season) return false;
  if (entry.episode !== undefined && entry.episode !== req.episode) return false;
  return entry.tmdbId !== undefined || entry.anilistId !== undefined;
}

function kindOf(url: string): "hls" | "mp4" {
  return url.split("?")[0].endsWith(".m3u8") ? "hls" : "mp4";
}

export function createDirectAdapter(entries: DirectEntry[]): SourceAdapter {
  return {
    id: "direct",
    label: "Local library",
    priority: 0,

    supports(req) {
      return entries.some((e) => matches(e, req));
    },

    async resolve(req): Promise<StreamCandidate[]> {
      return entries
        .filter((e) => matches(e, req))
        .map((e, i) => ({
          id: `direct-${i}`,
          label: e.label ?? (e.quality ? `${e.quality}p` : "Direct"),
          kind: kindOf(e.url),
          url: e.url,
          quality: e.quality,
        }));
    },
  };
}
