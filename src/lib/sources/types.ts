import type { MediaType } from "@/types/title";

export interface MediaTrack {
  id: string;
  /** ISO 639-1 where known, otherwise "und". */
  language: string;
  label: string;
  isDefault?: boolean;
  isForced?: boolean;
  /** Sidecar URL for external subtitle tracks. */
  url?: string;
}

export type StreamKind = "hls" | "mp4" | "iframe";

export interface StreamCandidate {
  /** Unique within its adapter. */
  id: string;
  /** Shown in the server dropdown, e.g. "1080p Direct". */
  label: string;
  kind: StreamKind;
  url: string;
  /** Higher wins when sorting candidates. */
  quality?: number;
  audioTracks?: MediaTrack[];
  subtitleTracks?: MediaTrack[];
}

export interface SourceRequest {
  mediaType: MediaType;
  tmdbId?: number;
  imdbId?: string;
  anilistId?: number;
  season?: number;
  episode?: number;
  preferredAudio?: string;
  preferredSubtitle?: string;
}

/**
 * Contract for anything that can turn a title reference into playable streams.
 *
 * The player, the server dropdown, and the fallback chain all talk to this
 * interface and nothing else, so adding a backend is one file plus one
 * `register()` call — no changes anywhere else in the app.
 */
export interface SourceAdapter {
  id: string;
  label: string;
  /** Lower sorts first in the dropdown. */
  priority: number;
  /** Cheap synchronous check so we don't fire requests that can't succeed. */
  supports(req: SourceRequest): boolean;
  resolve(req: SourceRequest, signal?: AbortSignal): Promise<StreamCandidate[]>;
}
