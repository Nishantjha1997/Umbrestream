"use client";

import { createPublicEmbedSources } from "@/lib/sources/adapters/embed";
import { legacySourceId } from "@/lib/sources/legacy";
import { selectDefaultSource } from "@/lib/sources/selectDefault";
import type {
  PlayerSource,
  SourceAvailability,
  SourceRequest,
  SourceResolutionResponse,
} from "@/lib/sources/types";
import type { MediaType } from "@/types/title";
import type { PlayersProps } from "@/types";
import { track } from "@vercel/analytics";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SESSION_HEALTH_KEY = "umbra:player-provider-health:v2";
const ENGINE_V2_ENABLED = process.env.NEXT_PUBLIC_PLAYER_ENGINE_V2 !== "false";
const ENGINE_V3_ENABLED = process.env.NEXT_PUBLIC_PLAYER_ENGINE_V3 !== "false";

type StatusMap = Record<string, SourceAvailability>;

interface UsePlayerEngineOptions {
  request: SourceRequest;
  legacyPlayers: PlayersProps[];
  currentTime: number;
}

interface ProviderHealth {
  failures: number;
  successes: number;
  lastFailureAt?: number;
  lastSuccessAt?: number;
  lastStartupMs?: number;
}

interface SessionHealth {
  providers: Record<string, ProviderHealth>;
  lastSuccessful: Partial<Record<MediaType, string>>;
}

const EMPTY_HEALTH: SessionHealth = { providers: {}, lastSuccessful: {} };

const emit = (name: string, properties: Record<string, string | number | boolean>): void => {
  try {
    track(name, properties);
  } catch {
    // Analytics must never interrupt playback.
  }
};

function loadSessionHealth(): SessionHealth {
  if (typeof window === "undefined") return EMPTY_HEALTH;
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(SESSION_HEALTH_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return EMPTY_HEALTH;
    const value = parsed as Partial<SessionHealth>;
    return {
      providers: value.providers && typeof value.providers === "object" ? value.providers : {},
      lastSuccessful:
        value.lastSuccessful && typeof value.lastSuccessful === "object"
          ? value.lastSuccessful
          : {},
    };
  } catch {
    return EMPTY_HEALTH;
  }
}

function saveSessionHealth(health: SessionHealth): void {
  try {
    sessionStorage.setItem(SESSION_HEALTH_KEY, JSON.stringify(health));
  } catch {
    // Private browsing and storage policies may disable sessionStorage.
  }
}

const providerIdFromTitle = (title: string, index: number): string => {
  const normalized = title.toLowerCase();
  if (normalized.includes("cinezo") || normalized.includes("cinesrc")) return "cinezo";
  if (normalized.includes("vidking")) return "vidking";
  if (normalized.includes("vidlink")) return "vidlink";
  if (normalized.includes("vidrift")) return "vidrift";
  if (normalized.includes("vidbolt")) return "vidbolt";
  if (normalized.includes("videasy")) return "videasy";
  if (normalized.includes("filmu")) return "filmu";
  return `legacy-${index}`;
};

function legacySources(players: PlayersProps[], request: SourceRequest): PlayerSource[] {
  return players.map((player, index) => {
    const url = new URL(player.source);
    const providerId = providerIdFromTitle(player.title, index);
    return {
      id: providerId,
      providerId,
      label: player.title,
      kind: "iframe",
      url: player.source,
      providerOrigin: url.origin,
      providerTier: "experimental",
      mediaType: request.mediaType,
      priority: index,
      audioVariant:
        request.mediaType === "anime"
          ? player.title.toLowerCase().includes("dub")
            ? "dub"
            : "sub"
          : undefined,
      capabilities: {
        recommended: player.recommended,
        fast: player.fast,
        ads: player.ads,
        resumable: player.resumable,
        events: url.hostname.includes("vidlink") || url.hostname.includes("vidking"),
        resumeParam: url.hostname.includes("vidlink") ? "startAt" : undefined,
        subtitles: url.hostname.includes("vidking") ? "none" : "unverified",
        iframe: {
          allow: "autoplay; encrypted-media; picture-in-picture; fullscreen; screen-wake-lock",
          referrerPolicy: "origin-when-cross-origin",
        },
      },
      availability: "unverified",
      healthEvidence: "manifest",
    };
  });
}

function sourceRequestUrl(request: SourceRequest, version: 2 | 3): string {
  const params = new URLSearchParams({ mediaType: request.mediaType, version: String(version) });
  Object.entries(request).forEach(([key, value]) => {
    if (key !== "mediaType" && value !== undefined && value !== "") params.set(key, String(value));
  });
  return `/api/player/sources?${params.toString()}`;
}

function withResume(source: PlayerSource, seconds: number): string {
  if (source.kind !== "iframe") return source.url;
  const resumeParam = source.capabilities.resumeParam;
  if (!resumeParam || seconds <= 5) return source.url;
  const url = new URL(source.url);
  url.searchParams.set(resumeParam, String(Math.floor(seconds)));
  return url.toString();
}

export function usePlayerEngine({ request, legacyPlayers, currentTime }: UsePlayerEngineOptions) {
  const requestKey = JSON.stringify(request);
  const legacy = useMemo(
    () => legacySources(legacyPlayers, request),
    // The request key is the stable representation; player arrays are rebuilt by callers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestKey],
  );
  const immediate = useMemo(
    () => (ENGINE_V3_ENABLED ? createPublicEmbedSources(request) : legacy),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestKey, legacy],
  );
  const initialDefault = useMemo(
    () =>
      selectDefaultSource(immediate, {
        defaultId:
          request.mediaType === "movie" || request.mediaType === "tv"
            ? immediate[0]?.id
            : undefined,
        preferredSubtitle: request.preferredSubtitle,
        preferredAudio: request.preferredAudio,
      })?.id ?? null,
    [immediate, request.mediaType, request.preferredAudio, request.preferredSubtitle],
  );
  const [sourceParam, setSourceParam] = useQueryState("src", parseAsString);
  const [response, setResponse] = useState<SourceResolutionResponse>(() => ({
    sources: immediate,
    defaultId: initialDefault,
    errors: [],
  }));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runtimeStatuses, setRuntimeStatuses] = useState<StatusMap>({});
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(ENGINE_V2_ENABLED);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const attemptedProvidersRef = useRef(new Set<string>());
  const hardFailedProvidersRef = useRef(new Set<string>());
  const readySourcesRef = useRef(new Set<string>());
  const currentTimeRef = useRef(currentTime);
  const manualPinnedRef = useRef(false);
  const playbackReadyRef = useRef(false);
  const selectionStartedAtRef = useRef(performance.now());

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    attemptedProvidersRef.current.clear();
    hardFailedProvidersRef.current.clear();
    readySourcesRef.current.clear();
    manualPinnedRef.current = false;
    playbackReadyRef.current = false;
    setSelectedId(null);
    setRuntimeStatuses({});
    setExhausted(false);
    setResolutionError(null);

    if (!ENGINE_V2_ENABLED) {
      setResponse({ sources: legacy, defaultId: initialDefault, errors: [] });
      setResolving(false);
      return;
    }

    setResponse({ sources: immediate, defaultId: initialDefault, errors: [] });
    const controller = new AbortController();
    setResolving(true);
    const requestStartedAt = performance.now();
    let active = true;
    fetch(sourceRequestUrl(request, ENGINE_V3_ENABLED ? 3 : 2), { signal: controller.signal })
      .then(async (result) => {
        if (!result.ok) throw new Error(`Source resolver returned ${result.status}`);
        return (await result.json()) as SourceResolutionResponse;
      })
      .then((data) => {
        if (!active) return;
        setResponse(data);
        emit("player_manifest_resolved", {
          mediaType: request.mediaType,
          elapsedMs: Math.round(performance.now() - requestStartedAt),
          serverMs: data.resolvedInMs ?? -1,
          sourceCount: data.sources.length,
        });
        if (
          ENGINE_V3_ENABLED &&
          data.defaultId?.startsWith("direct-") &&
          !sourceParam &&
          !manualPinnedRef.current &&
          !playbackReadyRef.current
        ) {
          setSelectedId(data.defaultId);
        }
        data.sources
          .filter((source) => source.availability === "failed")
          .forEach((source) =>
            emit("player_preflight_failed", {
              provider: source.providerId,
              mediaType: request.mediaType,
            }),
          );
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        if (!active) return;
        setResolutionError(error instanceof Error ? error.message : "Source resolution failed");
        if (!immediate.length)
          setResponse({ sources: legacy, defaultId: initialDefault, errors: [] });
      })
      .finally(() => {
        if (active) setResolving(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestKey]);

  const orderedSources = useMemo(() => {
    const health = loadSessionHealth();
    const lastSuccessful = health.lastSuccessful[request.mediaType];
    return [...response.sources].sort((a, b) => {
      const aHealth = health.providers[a.providerId];
      const bHealth = health.providers[b.providerId];
      const aFailed = aHealth?.failures ? 1 : 0;
      const bFailed = bHealth?.failures ? 1 : 0;
      const aPreferred = a.providerId === lastSuccessful ? 0 : 1;
      const bPreferred = b.providerId === lastSuccessful ? 0 : 1;
      return aFailed - bFailed || aPreferred - bPreferred || a.priority - b.priority;
    });
  }, [request.mediaType, response.sources]);

  useEffect(() => {
    if (!orderedSources.length) return;
    const requestedId = legacySourceId(request.mediaType, sourceParam);
    const next = selectDefaultSource(orderedSources, {
      requestedId,
      defaultId: response.defaultId,
      preferredSubtitle: request.preferredSubtitle,
      preferredAudio: request.preferredAudio,
    });
    if (!next) return;
    setSelectedId((current) => current ?? next.id);
    if (sourceParam !== next.id) void setSourceParam(next.id);
  }, [
    orderedSources,
    request.mediaType,
    request.preferredAudio,
    request.preferredSubtitle,
    response.defaultId,
    setSourceParam,
    sourceParam,
  ]);

  const selectedSource = useMemo(
    () => orderedSources.find((source) => source.id === selectedId) ?? null,
    [orderedSources, selectedId],
  );

  useEffect(() => {
    if (!selectedSource) {
      setPlaybackUrl(null);
      return;
    }
    attemptedProvidersRef.current.add(selectedSource.providerId);
    playbackReadyRef.current = false;
    selectionStartedAtRef.current = performance.now();
    setRuntimeStatuses((current) => ({ ...current, [selectedSource.id]: "loading" }));
    setPlaybackUrl(withResume(selectedSource, currentTimeRef.current));
    emit("player_provider_selected", {
      provider: selectedSource.providerId,
      variant: selectedSource.playerVariant ?? "default",
      mediaType: request.mediaType,
      kind: selectedSource.kind,
      subtitles: selectedSource.capabilities.subtitles ?? "unverified",
    });
  }, [request.mediaType, selectedSource]);

  const switchTo = useCallback(
    (source: PlayerSource, automatic: boolean) => {
      attemptedProvidersRef.current.add(source.providerId);
      setExhausted(false);
      setRuntimeStatuses((current) => ({
        ...current,
        [source.id]: automatic ? "switching" : "loading",
      }));
      setSelectedId(source.id);
      void setSourceParam(source.id);
      emit(automatic ? "player_auto_fallback" : "player_manual_switch", {
        provider: source.providerId,
        mediaType: request.mediaType,
      });
    },
    [request.mediaType, setSourceParam],
  );

  const failCurrent = useCallback(
    (reason: string) => {
      if (!selectedSource || hardFailedProvidersRef.current.has(selectedSource.providerId)) return;
      const providerId = selectedSource.providerId;
      hardFailedProvidersRef.current.add(providerId);
      attemptedProvidersRef.current.add(providerId);
      const health = loadSessionHealth();
      const previous = health.providers[providerId] ?? { failures: 0, successes: 0 };
      health.providers[providerId] = {
        ...previous,
        failures: previous.failures + 1,
        lastFailureAt: Date.now(),
      };
      saveSessionHealth(health);
      setRuntimeStatuses((current) => ({
        ...current,
        ...Object.fromEntries(
          orderedSources
            .filter((source) => source.providerId === providerId)
            .map((source) => [source.id, "failed" as const]),
        ),
      }));
      emit("player_source_failed", {
        provider: providerId,
        mediaType: request.mediaType,
        reason: reason.slice(0, 80),
      });

      const next = orderedSources.find(
        (source) =>
          source.availability !== "failed" &&
          source.providerId !== providerId &&
          !attemptedProvidersRef.current.has(source.providerId),
      );
      if (next) switchTo(next, true);
      else setExhausted(true);
    },
    [orderedSources, request.mediaType, selectedSource, switchTo],
  );

  useEffect(() => {
    if (selectedSource?.availability === "failed") {
      failCurrent(selectedSource.failureReason ?? "Source manifest failed");
    }
  }, [failCurrent, selectedSource]);

  const selectSource = useCallback(
    (id: string) => {
      const source = orderedSources.find((candidate) => candidate.id === id);
      if (!source || source.availability === "failed") return;
      attemptedProvidersRef.current.clear();
      hardFailedProvidersRef.current.delete(source.providerId);
      manualPinnedRef.current = true;
      switchTo(source, false);
    },
    [orderedSources, switchTo],
  );

  const markFrameLoaded = useCallback(() => {
    if (!selectedSource) return;
    setRuntimeStatuses((current) =>
      current[selectedSource.id] === "failed"
        ? current
        : { ...current, [selectedSource.id]: "unverified" },
    );
  }, [selectedSource]);

  const markPlaybackReady = useCallback(() => {
    if (!selectedSource || readySourcesRef.current.has(selectedSource.id)) return;
    readySourcesRef.current.add(selectedSource.id);
    playbackReadyRef.current = true;
    const startupMs = Math.round(performance.now() - selectionStartedAtRef.current);
    setRuntimeStatuses((current) => ({ ...current, [selectedSource.id]: "ready" }));
    const health = loadSessionHealth();
    const previous = health.providers[selectedSource.providerId] ?? { failures: 0, successes: 0 };
    health.providers[selectedSource.providerId] = {
      ...previous,
      failures: 0,
      successes: previous.successes + 1,
      lastSuccessAt: Date.now(),
      lastStartupMs: startupMs,
    };
    health.lastSuccessful[request.mediaType] = selectedSource.providerId;
    saveSessionHealth(health);
    emit("player_playback_started", {
      provider: selectedSource.providerId,
      mediaType: request.mediaType,
      startupMs,
      subtitles: selectedSource.capabilities.subtitles ?? "unverified",
    });
  }, [request.mediaType, selectedSource]);

  const statuses = useMemo<StatusMap>(
    () =>
      Object.fromEntries(
        orderedSources.map((source) => [
          source.id,
          runtimeStatuses[source.id] ?? source.availability,
        ]),
      ),
    [orderedSources, runtimeStatuses],
  );

  return {
    sources: orderedSources,
    selectedSource,
    selectedSourceId: selectedSource?.id ?? "",
    selectedStatus: selectedSource ? statuses[selectedSource.id] : "resolving",
    playbackUrl,
    frameUrl: selectedSource?.kind === "iframe" ? playbackUrl : null,
    statuses,
    resolving,
    resolutionError,
    exhausted,
    selectSource,
    markFrameLoaded,
    markPlaybackReady,
    failCurrent,
  };
}
