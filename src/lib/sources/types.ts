import type { MediaType } from "@/types/title";

export type AudioVariant = "sub" | "dub";
export type SubtitleSupport = "native" | "unverified" | "none";
export type ProviderTier = "direct" | "stable" | "experimental";
export type PlayerEventProtocol = "native" | "vidlink" | "vidking" | "cinezo" | "filmu" | "videasy";
export type SourceAvailability =
  | "resolving"
  | "loading"
  | "ready"
  | "available"
  | "slow"
  | "unverified"
  | "failed"
  | "switching";

export interface SourceCapabilities {
  recommended?: boolean;
  fast?: boolean;
  ads?: boolean;
  resumable?: boolean;
  events?: boolean;
  eventProtocol?: PlayerEventProtocol;
  /** Whether the provider player can render subtitles. Exact title availability may still vary. */
  subtitles?: SubtitleSupport;
  /** Query parameter used when resuming after a provider switch. */
  resumeParam?: string;
  iframe?: {
    allow?: string;
    referrerPolicy?: ReferrerPolicy;
    sandbox?: string;
  };
}

export interface MediaTrack {
  id: string;
  /** ISO 639-1 where known, otherwise "und". */
  language: string;
  label: string;
  isDefault?: boolean;
  isForced?: boolean;
  /** Sidecar URL for external subtitle tracks. */
  url?: string;
  format?: "vtt" | "srt";
}

export type StreamKind = "hls" | "dash" | "mp4" | "iframe";

export interface StreamCandidate {
  /** Unique within its adapter. */
  id: string;
  providerId: string;
  /** Shown in the server dropdown, e.g. "1080p Direct". */
  label: string;
  kind: StreamKind;
  url: string;
  providerOrigin: string;
  providerTier: ProviderTier;
  /** A rendering choice within one provider, not an independent fallback. */
  playerVariant?: string;
  mediaType: MediaType;
  priority: number;
  audioVariant?: AudioVariant;
  capabilities: SourceCapabilities;
  /** Higher wins when sorting candidates. */
  quality?: number;
  audioTracks?: MediaTrack[];
  subtitleTracks?: MediaTrack[];
}

export interface SourceRequest {
  mediaType: MediaType;
  /** Human-readable title, used only by providers whose documented contract is title-based. */
  title?: string;
  tmdbId?: number;
  imdbId?: string;
  anilistId?: number;
  malId?: number;
  /** Optional TMDB mapping used only by experimental anime embeds that require it. */
  animeTmdbId?: number;
  season?: number;
  episode?: number;
  startAt?: number;
  preferredAudio?: string;
  preferredSubtitle?: string;
}

export interface PlayerSource extends StreamCandidate {
  availability: SourceAvailability;
  latencyMs?: number;
  failureReason?: string;
  healthEvidence?: "manifest" | "iframe-load" | "playback-event" | "native-playback";
}

export interface SourceResolutionError {
  providerId: string;
  message: string;
}

export interface SourceResolutionResponse {
  sources: PlayerSource[];
  defaultId: string | null;
  errors: SourceResolutionError[];
  unsupported?: SourceResolutionError[];
  resolvedInMs?: number;
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
  supportedMediaTypes: MediaType[];
  identifierRequirements: Partial<
    Record<
      MediaType,
      (
        | "title"
        | "tmdbId"
        | "imdbId"
        | "anilistId"
        | "malId"
        | "animeTmdbId"
        | "season"
        | "episode"
      )[]
    >
  >;
  /** Lower sorts first. A function allows media-specific ordering. */
  priority: number | ((req: SourceRequest) => number);
  /** Cheap synchronous check so we don't fire requests that can't succeed. */
  supports(req: SourceRequest): boolean;
  resolve(req: SourceRequest, signal?: AbortSignal): Promise<StreamCandidate[]>;
}
