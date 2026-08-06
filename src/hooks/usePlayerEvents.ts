import { syncHistory } from "@/actions/histories";
import { ContentType } from "@/types";
import { diff } from "@/utils/helpers";
import { useDocumentVisibility } from "@mantine/hooks";
import { useCallback, useEffect, useRef, useState } from "react";
import useSupabaseUser from "./useSupabaseUser";

export type PlayerEventType = "play" | "pause" | "seeked" | "ended" | "timeupdate" | "error";

export interface BasePlayerEventEnvelope<T> {
  type: "PLAYER_EVENT" | "MEDIA_DATA";
  data: T;
}

export interface VidlinkEventData {
  event: PlayerEventType;
  currentTime: number;
  duration: number;
  mtmdbId: number;
  mediaType: ContentType;
  season?: number;
  episode?: number;
}

export type VidlinkPlayerMessage = BasePlayerEventEnvelope<VidlinkEventData>;

export interface VidkingEventData {
  event: PlayerEventType;
  currentTime: number;
  duration: number;
  id: string | number;
  mediaType: ContentType;
  season?: number;
  episode?: number;
  progress?: number;
}

export type VidkingPlayerMessage = BasePlayerEventEnvelope<VidkingEventData>;

export interface UnifiedPlayerEventData {
  event: PlayerEventType;
  currentTime: number;
  duration: number;
  mediaId: string | number;
  mediaType: ContentType;
  season?: number;
  episode?: number;
  progress?: number;
}

export interface PlayerAdapter {
  /** Domain origin for identifying source */
  origin: `https://${string}`;
  /** Converts raw → unified structure */
  parse: (raw: unknown) => UnifiedPlayerEventData | null;
}

export type AdapterMap = Record<string, PlayerAdapter>;

const PLAYER_EVENT_TYPES = new Set<PlayerEventType>([
  "play",
  "pause",
  "seeked",
  "ended",
  "timeupdate",
  "error",
]);
const CONTENT_TYPES = new Set<ContentType>(["movie", "tv", "anime"]);

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

function parseProviderPayload(
  raw: unknown,
  idKey: "mtmdbId" | "id",
): UnifiedPlayerEventData | null {
  if (!isRecord(raw) || raw.type !== "PLAYER_EVENT" || !isRecord(raw.data)) return null;
  const data = raw.data;
  if (typeof data.event !== "string" || !PLAYER_EVENT_TYPES.has(data.event as PlayerEventType)) {
    return null;
  }

  const event = data.event as PlayerEventType;
  const rawId = data[idKey];
  const rawMediaType = data.mediaType;
  const validId = typeof rawId === "string" || typeof rawId === "number";
  const validMediaType =
    typeof rawMediaType === "string" && CONTENT_TYPES.has(rawMediaType as ContentType);

  if (event !== "error" && (!validId || !validMediaType)) return null;

  return {
    event,
    currentTime: typeof data.currentTime === "number" ? data.currentTime : 0,
    duration: typeof data.duration === "number" ? data.duration : 0,
    mediaId: validId ? rawId : "",
    mediaType: validMediaType ? (rawMediaType as ContentType) : "movie",
    season: typeof data.season === "number" ? data.season : undefined,
    episode: typeof data.episode === "number" ? data.episode : undefined,
    progress: typeof data.progress === "number" ? data.progress : undefined,
  };
}

function parseFilmuPayload(raw: unknown): UnifiedPlayerEventData | null {
  if (!isRecord(raw) || !isRecord(raw.data)) return null;
  if (raw.type === "SYNC_HISTORY") {
    const data = raw.data;
    return {
      event: "timeupdate",
      currentTime: Number(data.watched) || 0,
      duration: Number(data.duration) || 0,
      mediaId:
        typeof data.media_id === "string" || typeof data.media_id === "number" ? data.media_id : "",
      mediaType: CONTENT_TYPES.has(data.media_type as ContentType)
        ? (data.media_type as ContentType)
        : "movie",
      season: Number(data.season) || undefined,
      episode: Number(data.episode) || undefined,
    };
  }
  if (raw.type !== "FILMU_PLAYER_EVENT") return null;
  const data = raw.data;
  if (typeof data.event !== "string" || !PLAYER_EVENT_TYPES.has(data.event as PlayerEventType)) {
    return null;
  }
  return {
    event: data.event as PlayerEventType,
    currentTime: Number(data.currentTime) || 0,
    duration: Number(data.duration) || 0,
    mediaId: typeof data.tmdbId === "string" || typeof data.tmdbId === "number" ? data.tmdbId : "",
    mediaType: CONTENT_TYPES.has(data.mediaType as ContentType)
      ? (data.mediaType as ContentType)
      : "movie",
    season: Number(data.season) || undefined,
    episode: Number(data.episode) || undefined,
  };
}

function parseVideasyPayload(raw: unknown): UnifiedPlayerEventData | null {
  if (!isRecord(raw)) return null;
  const mediaType = CONTENT_TYPES.has(raw.type as ContentType)
    ? (raw.type as ContentType)
    : "movie";
  const duration = Number(raw.duration) || 0;
  if (!duration) return null;
  return {
    event: "timeupdate",
    currentTime: Number(raw.timestamp) || 0,
    duration,
    mediaId: typeof raw.id === "string" || typeof raw.id === "number" ? raw.id : "",
    mediaType,
    season: Number(raw.season) || undefined,
    episode: Number(raw.episode) || undefined,
  };
}

export const playerAdapters = {
  vidlink: {
    origin: "https://vidlink.pro",
    parse: (raw) => parseProviderPayload(raw, "mtmdbId"),
  },

  vidking: {
    origin: "https://www.vidking.net",
    parse: (raw) => parseProviderPayload(raw, "id"),
  },

  cinezo: {
    origin: "https://player.cinezo.live",
    parse: (raw) => parseProviderPayload(raw, "mtmdbId"),
  },

  filmu: {
    origin: "https://embed.filmu.in",
    parse: parseFilmuPayload,
  },

  videasy: {
    origin: "https://player.videasy.to",
    parse: parseVideasyPayload,
  },
} as const satisfies AdapterMap;

export interface UsePlayerEventsOptions {
  metadata?: { season?: number; episode?: number };
  saveHistory?: boolean;
  onPlay?: (data: UnifiedPlayerEventData) => void;
  onPause?: (data: UnifiedPlayerEventData) => void;
  onSeeked?: (data: UnifiedPlayerEventData) => void;
  onEnded?: (data: UnifiedPlayerEventData) => void;
  onTimeUpdate?: (data: UnifiedPlayerEventData) => void;
  onError?: (data: UnifiedPlayerEventData) => void;
}

export function usePlayerEvents(options: UsePlayerEventsOptions = {}) {
  const { data: user } = useSupabaseUser();
  const documentState = useDocumentVisibility();

  const { metadata, saveHistory, onPlay, onPause, onSeeked, onEnded, onTimeUpdate, onError } =
    options;

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [lastEvent, setLastEvent] = useState<PlayerEventType | null>(null);
  const [lastEventOrigin, setLastEventOrigin] = useState<string | null>(null);
  const [eventVersion, setEventVersion] = useState(0);
  const [lastCurrentTime, setLastCurrentTime] = useState(0);

  const eventDataRef = useRef<UnifiedPlayerEventData | null>(null);

  // Track latest state to avoid stale closures in event listeners
  const stateRef = useRef({
    user,
    metadata,
    saveHistory,
    lastCurrentTime,
    onPlay,
    onPause,
    onSeeked,
    onEnded,
    onTimeUpdate,
    onError,
  });

  useEffect(() => {
    stateRef.current = {
      user,
      metadata,
      saveHistory,
      lastCurrentTime,
      onPlay,
      onPause,
      onSeeked,
      onEnded,
      onTimeUpdate,
      onError,
    };
  }, [
    user,
    metadata,
    saveHistory,
    lastCurrentTime,
    onPlay,
    onPause,
    onSeeked,
    onEnded,
    onTimeUpdate,
    onError,
  ]);

  const syncToServer = useCallback(async (data: UnifiedPlayerEventData, completed?: boolean) => {
    const state = stateRef.current;
    if (!state.saveHistory || !state.user) return;
    if (data.mediaId === "") return;
    if (diff(data.currentTime, state.lastCurrentTime) <= 5) return; // prevent spam

    const payload: UnifiedPlayerEventData = {
      ...data,
      season: data.season || state.metadata?.season || 0,
      episode: data.episode || state.metadata?.episode || 0,
    };

    const { success, message } = await syncHistory(payload, completed);
    if (success) setLastCurrentTime(data.currentTime);
    else console.error("Save history failed:", message);
  }, []);

  const processParsedEvent = useCallback(
    (parsed: UnifiedPlayerEventData) => {
      eventDataRef.current = parsed;
      setLastEvent(parsed.event);
      setLastEventOrigin(parsed.event === "error" ? null : "native");
      setEventVersion((version) => version + 1);

      const state = stateRef.current;
      switch (parsed.event) {
        case "play":
          setIsPlaying(true);
          state.onPlay?.(parsed);
          break;
        case "pause":
          setIsPlaying(false);
          state.onPause?.(parsed);
          break;
        case "ended":
          setIsPlaying(false);
          void syncToServer(parsed, true);
          state.onEnded?.(parsed);
          break;
        case "seeked":
          setCurrentTime(parsed.currentTime);
          setDuration(parsed.duration);
          state.onSeeked?.(parsed);
          break;
        case "timeupdate":
          setCurrentTime(parsed.currentTime);
          setDuration(parsed.duration);
          state.onTimeUpdate?.(parsed);
          break;
        case "error":
          setIsPlaying(false);
          state.onError?.(parsed);
          break;
      }
    },
    [syncToServer],
  );

  useEffect(() => {
    if (!saveHistory || !user) return;
    if (documentState === "visible") return;
    if (!eventDataRef.current) return;
    syncToServer(eventDataRef.current);
  }, [documentState, saveHistory, syncToServer, user]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      const state = stateRef.current;
      if (!state.saveHistory || !state.user) return;
      if (!eventDataRef.current) return;

      const payload = {
        ...eventDataRef.current,
        completed: eventDataRef.current.event === "ended",
      };
      navigator.sendBeacon("/api/player/save-history", JSON.stringify(payload));
    };

    const handleMessage = (event: MessageEvent) => {
      const adapter = Object.values(playerAdapters).find((a) => a.origin === event.origin);
      if (!adapter) return;

      let rawData: unknown;
      try {
        rawData = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
      } catch (err) {
        console.warn("Invalid JSON from player:", err);
        return;
      }

      const parsed = adapter.parse(rawData);
      if (!parsed) return;

      processParsedEvent(parsed);
      setLastEventOrigin(event.origin);
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (eventDataRef.current) handleBeforeUnload();
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [processParsedEvent, saveHistory, user]);

  return {
    isPlaying,
    currentTime,
    duration,
    lastEvent,
    lastEventOrigin,
    eventVersion,
    reportNativeEvent: processParsedEvent,
  };
}
