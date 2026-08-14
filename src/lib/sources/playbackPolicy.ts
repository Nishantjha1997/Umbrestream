import type { MediaType } from "@/types/title";
import type { AudioVariant, PlayerSource } from "./types";

export const PLAYBACK_POLICY_VERSION = "2026-08-reliability-v1";
export const PLAYBACK_RECOVERY_TIMEOUT_MS = 20_000;
export const PLAYBACK_FALLBACK_MODE = "prompt" as const;

export const PLAYBACK_POLICY = Object.freeze({
  version: PLAYBACK_POLICY_VERSION,
  fallbackMode: PLAYBACK_FALLBACK_MODE,
  timeoutMs: PLAYBACK_RECOVERY_TIMEOUT_MS,
});

export interface PlaybackPreferenceStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const PREFERENCE_PREFIX = "streamfree:playback-source:v1";

export function normalizeAudioVariant(value?: string | null): AudioVariant {
  return value === "dub" ? "dub" : "sub";
}

export function playbackPreferenceKey(
  mediaType: MediaType,
  audioVariant?: AudioVariant | null,
): string {
  return mediaType === "anime"
    ? `${PREFERENCE_PREFIX}:anime:${normalizeAudioVariant(audioVariant)}`
    : `${PREFERENCE_PREFIX}:${mediaType}`;
}

export function readPlaybackPreference(
  store: PlaybackPreferenceStore | null | undefined,
  mediaType: MediaType,
  audioVariant?: AudioVariant | null,
): string | null {
  if (!store) return null;
  try {
    return store.getItem(playbackPreferenceKey(mediaType, audioVariant));
  } catch {
    return null;
  }
}

export function writePlaybackPreference(
  store: PlaybackPreferenceStore | null | undefined,
  mediaType: MediaType,
  sourceId: string,
  audioVariant?: AudioVariant | null,
): void {
  if (!store) return;
  try {
    store.setItem(playbackPreferenceKey(mediaType, audioVariant), sourceId);
  } catch {
    // Storage can be unavailable in private browsing or a locked-down WebView.
  }
}

export function clearPlaybackPreference(
  store: PlaybackPreferenceStore | null | undefined,
  mediaType: MediaType,
  audioVariant?: AudioVariant | null,
): void {
  if (!store) return;
  try {
    store.removeItem(playbackPreferenceKey(mediaType, audioVariant));
  } catch {
    // Preference persistence must never interrupt playback.
  }
}

export function sourceMatchesAudio(
  source: Pick<PlayerSource, "mediaType" | "audioVariant">,
  audioVariant?: AudioVariant | null,
): boolean {
  if (source.mediaType !== "anime") return true;
  return source.audioVariant === normalizeAudioVariant(audioVariant);
}

export function findPreferredSource(
  sources: PlayerSource[],
  options: {
    explicitId?: string | null;
    rememberedId?: string | null;
    audioVariant?: AudioVariant | null;
  } = {},
): PlayerSource | null {
  const compatible = sources.filter((source) => sourceMatchesAudio(source, options.audioVariant));
  if (!compatible.length) return sources[0] ?? null;

  return (
    compatible.find((source) => source.id === options.explicitId) ??
    compatible.find((source) => source.id === options.rememberedId) ??
    compatible[0]
  );
}

export function findNextFallbackSource(
  sources: PlayerSource[],
  currentSourceId: string | null | undefined,
  attemptedSourceIds: Iterable<string>,
  audioVariant?: AudioVariant | null,
): PlayerSource | null {
  const attempted = new Set(attemptedSourceIds);
  if (currentSourceId) attempted.add(currentSourceId);

  return (
    sources.find(
      (source) =>
        !attempted.has(source.id) &&
        sourceMatchesAudio(source, audioVariant) &&
        (source.providerTier === "stable" || source.providerTier === "direct"),
    ) ?? null
  );
}

export function withResumePosition(source: PlayerSource, seconds?: number | null): string {
  if (!seconds || seconds <= 0 || !source.capabilities.resumable) return source.url;
  const resumeParam = source.capabilities.resumeParam;
  if (!resumeParam) return source.url;

  try {
    const url = new URL(source.url);
    url.searchParams.set(resumeParam, String(Math.floor(seconds)));
    return url.toString();
  } catch {
    return source.url;
  }
}

export type TrustedPlaybackEvent = "play" | "timeupdate" | "pause" | "ended" | "error";

/**
 * Provider payloads vary, but event names are consistently carried in a
 * small set of fields. This parser deliberately ignores title/media identity;
 * callers must separately validate both the iframe window and exact origin.
 */
export function parsePlaybackEventName(payload: unknown): TrustedPlaybackEvent | null {
  const values: string[] = [];
  const visit = (value: unknown, depth = 0) => {
    if (depth > 3 || value == null) return;
    if (typeof value === "string") {
      values.push(value);
      try {
        if (value.startsWith("{") || value.startsWith("[")) visit(JSON.parse(value), depth + 1);
      } catch {
        // Non-JSON event names are expected.
      }
      return;
    }
    if (typeof value === "object") {
      const record = value as Record<string, unknown>;
      for (const key of ["event", "type", "action", "status", "name", "message", "data"]) {
        if (key in record) visit(record[key], depth + 1);
      }
    }
  };
  visit(payload);
  const normalized = values.join(" ").toLowerCase();
  if (/(^|[\s:_-])(ended|videoended|mediaended|episodeended|playbackended)([\s:_-]|$)/.test(normalized)) {
    return "ended";
  }
  if (/(^|[\s:_-])(timeupdate|progress|playing)([\s:_-]|$)/.test(normalized)) return "timeupdate";
  if (/(^|[\s:_-])(play|played|playbackstarted)([\s:_-]|$)/.test(normalized)) return "play";
  if (/(^|[\s:_-])(pause|paused)([\s:_-]|$)/.test(normalized)) return "pause";
  if (/(^|[\s:_-])(error|failed|playbackerror)([\s:_-]|$)/.test(normalized)) return "error";
  return null;
}
