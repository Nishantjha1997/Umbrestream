import { syncHistory } from "@/actions/histories";
import { ContentType } from "@/types";
import { diff } from "@/utils/helpers";
import { useDocumentVisibility } from "@mantine/hooks";
import { useEffect, useRef, useState } from "react";
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

function parseCineSrcPayload(raw: unknown): UnifiedPlayerEventData | null {
  if (!isRecord(raw) || typeof raw.type !== "string" || !raw.type.startsWith("cinesrc:")) {
    return null;
  }
  const event = raw.type.slice("cinesrc:".length);
  if (!PLAYER_EVENT_TYPES.has(event as PlayerEventType)) return null;

  return {
    event: event as PlayerEventType,
    currentTime: typeof raw.currentTime === "number" ? raw.currentTime : 0,
    duration: typeof raw.duration === "number" ? raw.duration : 0,
    mediaId: "",
    mediaType: "movie",
  };
}

function parseMegaPlayPayload(raw: unknown): UnifiedPlayerEventData | null {
  if (!isRecord(raw)) return null;
  const event =
    raw.type === "watching-log"
      ? "timeupdate"
      : raw.event === "time"
        ? "timeupdate"
        : raw.event === "complete"
          ? "ended"
          : raw.event === "error"
            ? "error"
            : null;
  if (!event) return null;

  return {
    event,
    currentTime:
      typeof raw.currentTime === "number"
        ? raw.currentTime
        : typeof raw.time === "number"
          ? raw.time
          : 0,
    duration: typeof raw.duration === "number" ? raw.duration : 0,
    mediaId: "",
    mediaType: "anime",
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

  cinesrc: {
    origin: "https://cinesrc.st",
    parse: parseCineSrcPayload,
  },

  megaplay: {
    origin: "https://megaplay.buzz",
    parse: parseMegaPlayPayload,
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

  const syncToServer = async (data: UnifiedPlayerEventData, completed?: boolean) => {
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
  };

  useEffect(() => {
    if (!saveHistory || !user) return;
    if (documentState === "visible") return;
    if (!eventDataRef.current) return;
    syncToServer(eventDataRef.current);
  }, [documentState, saveHistory, user]);

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

      eventDataRef.current = parsed;
      setLastEvent(parsed.event);
      setLastEventOrigin(event.origin);
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
          syncToServer(parsed, true);
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
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      if (eventDataRef.current) handleBeforeUnload();
      window.removeEventListener("message", handleMessage);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return { isPlaying, currentTime, duration, lastEvent, lastEventOrigin, eventVersion };
}
