"use client";

import { legacySourceId } from "@/lib/sources/legacy";
import { selectDefaultSource } from "@/lib/sources/selectDefault";
import type {
  PlayerSource,
  SourceAvailability,
  SourceRequest,
  SourceResolutionResponse,
} from "@/lib/sources/types";
import type { PlayersProps } from "@/types";
import { track } from "@vercel/analytics";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const SESSION_FAILURE_KEY = "umbra:player-provider-failures:v1";
const ENGINE_V2_ENABLED = process.env.NEXT_PUBLIC_PLAYER_ENGINE_V2 !== "false";

type StatusMap = Record<string, SourceAvailability>;

interface UsePlayerEngineOptions {
  request: SourceRequest;
  legacyPlayers: PlayersProps[];
  currentTime: number;
}

interface SessionFailures {
  [providerId: string]: number;
}

const providerIdFromTitle = (title: string, index: number): string => {
  const normalized = title.toLowerCase();
  if (normalized.includes("vidking")) return "vidking";
  if (
    normalized.includes("vidlink") &&
    (normalized.includes("2") || normalized.includes("native"))
  ) {
    return "vidlink-alt";
  }
  if (normalized.includes("vidlink")) return "vidlink";
  if (normalized.includes("embed.su") || normalized.includes("<embed>")) return "embed-su";
  if (normalized.includes("autoembed") && normalized.includes("anime")) {
    return "anime-autoembed";
  }
  if (normalized.includes("autoembed") && normalized.includes("2")) return "autoembed-player";
  if (normalized.includes("autoembed")) return "autoembed";
  if (normalized.includes("vidsrc anime") && normalized.includes("dub")) {
    return "vidsrc-anime-dub";
  }
  if (normalized.includes("vidsrc anime")) return "vidsrc-anime-sub";
  if (normalized.includes("vidsrc") && normalized.includes("icu")) return "vidsrc-icu";
  if (normalized.includes("vidsrc") && normalized.includes("v3")) return "vidsrc-v3";
  if (normalized.includes("vidsrc") && normalized.includes("to")) return "vidsrc-to";
  if (normalized.includes("vidsrc") && normalized.includes("xyz")) return "vidsrc-xyz";
  if (normalized.includes("cinesrc")) return "cinesrc";
  if (normalized.includes("vidsrc") && normalized.includes("ru")) return "vidsrc-ru";
  if (normalized.includes("vidsrc") && normalized.includes("mov")) return "vidsrc-mov";
  if (normalized.includes("megaplay") && normalized.includes("dub")) return "megaplay-dub";
  if (normalized.includes("megaplay")) return "megaplay-sub";
  if (normalized.includes("dropfile") && normalized.includes("dub")) return "dropfile-dub";
  if (normalized.includes("dropfile")) return "dropfile-sub";
  if (normalized.includes("superembed")) return "superembed";
  if (normalized.includes("filmku")) return "filmku";
  if (normalized.includes("nontongo")) return "nontongo";
  if (normalized.includes("2embed")) return "two-embed";
  if (normalized.includes("moviesapi")) return "moviesapi";
  return `legacy-${index}`;
};

function legacySources(players: PlayersProps[], request: SourceRequest): PlayerSource[] {
  return players.map((player, index) => {
    const url = new URL(player.source);
    return {
      id: providerIdFromTitle(player.title, index),
      providerId: providerIdFromTitle(player.title, index),
      label: player.title,
      kind: "iframe",
      url: player.source,
      providerOrigin: url.origin,
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
        events:
          url.hostname.includes("vidlink") ||
          url.hostname.includes("vidking") ||
          url.hostname.includes("cinesrc") ||
          url.hostname.includes("megaplay"),
        resumeParam: url.hostname.includes("vidlink") ? "startAt" : undefined,
        subtitles:
          url.hostname.includes("vidlink") ||
          url.hostname.includes("cinesrc") ||
          url.hostname.includes("vidsrc") ||
          url.hostname.includes("dropfile")
            ? "native"
            : url.hostname.includes("vidking")
              ? "none"
              : "unverified",
      },
      availability: "unverified",
    };
  });
}

function loadSessionFailures(): SessionFailures {
  if (typeof window === "undefined") return {};
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(SESSION_FAILURE_KEY) ?? "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, number] =>
        Number.isFinite(entry[1]),
      ),
    );
  } catch {
    return {};
  }
}

function saveSessionFailures(failures: SessionFailures): void {
  try {
    sessionStorage.setItem(SESSION_FAILURE_KEY, JSON.stringify(failures));
  } catch {
    // Private browsing and storage policies may disable sessionStorage.
  }
}

function sourceRequestUrl(request: SourceRequest): string {
  const params = new URLSearchParams({ mediaType: request.mediaType });
  Object.entries(request).forEach(([key, value]) => {
    if (key !== "mediaType" && value !== undefined && value !== "") params.set(key, String(value));
  });
  return `/api/player/sources?${params.toString()}`;
}

function withResume(source: PlayerSource, seconds: number): string {
  const resumeParam = source.capabilities.resumeParam;
  if (!resumeParam || seconds <= 5) return source.url;
  const url = new URL(source.url);
  url.searchParams.set(resumeParam, String(Math.floor(seconds)));
  return url.toString();
}

const emit = (name: string, properties: Record<string, string | number | boolean>): void => {
  try {
    track(name, properties);
  } catch {
    // Analytics must never interrupt playback.
  }
};

export function usePlayerEngine({ request, legacyPlayers, currentTime }: UsePlayerEngineOptions) {
  const requestKey = JSON.stringify(request);
  const fallback = useMemo(
    () => legacySources(legacyPlayers, request),
    // The request key is the stable representation; player arrays are rebuilt by callers.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [requestKey],
  );
  const [sourceParam, setSourceParam] = useQueryState("src", parseAsString);
  const [response, setResponse] = useState<SourceResolutionResponse>({
    sources: [],
    defaultId: null,
    errors: [],
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [runtimeStatuses, setRuntimeStatuses] = useState<StatusMap>({});
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [resolving, setResolving] = useState(true);
  const [resolutionError, setResolutionError] = useState<string | null>(null);
  const [exhausted, setExhausted] = useState(false);
  const attemptedRef = useRef(new Set<string>());
  const hardFailedRef = useRef(new Set<string>());
  const currentTimeRef = useRef(currentTime);
  const reportedFailuresRef = useRef(new Set<string>());

  useEffect(() => {
    currentTimeRef.current = currentTime;
  }, [currentTime]);

  useEffect(() => {
    attemptedRef.current.clear();
    hardFailedRef.current.clear();
    reportedFailuresRef.current.clear();
    setSelectedId(null);
    setRuntimeStatuses({});
    setExhausted(false);
    setResolutionError(null);

    if (!ENGINE_V2_ENABLED) {
      const selectedDefault = selectDefaultSource(fallback, {
        preferredSubtitle: request.preferredSubtitle,
      });
      setResponse({ sources: fallback, defaultId: selectedDefault?.id ?? null, errors: [] });
      setResolving(false);
      return;
    }

    const controller = new AbortController();
    setResolving(true);

    let active = true;
    fetch(sourceRequestUrl(request), { signal: controller.signal })
      .then(async (result) => {
        if (!result.ok) throw new Error(`Source resolver returned ${result.status}`);
        return (await result.json()) as SourceResolutionResponse;
      })
      .then((data) => {
        if (!active) return;
        setResponse(data);
        data.sources
          .filter((source) => source.availability === "failed")
          .forEach((source) => {
            if (reportedFailuresRef.current.has(source.id)) return;
            reportedFailuresRef.current.add(source.id);
            emit("player_preflight_failed", {
              provider: source.providerId,
              mediaType: request.mediaType,
            });
          });
      })
      .catch((error) => {
        if (error instanceof Error && error.name === "AbortError") return;
        if (!active) return;
        setResolutionError(error instanceof Error ? error.message : "Source resolution failed");
        setResponse({
          sources: fallback,
          defaultId:
            selectDefaultSource(fallback, {
              preferredSubtitle: request.preferredSubtitle,
            })?.id ?? null,
          errors: [],
        });
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
    const failures = loadSessionFailures();
    return [...response.sources].sort((a, b) => {
      const aFailed = failures[a.providerId] ? 1 : 0;
      const bFailed = failures[b.providerId] ? 1 : 0;
      return aFailed - bFailed || a.priority - b.priority;
    });
  }, [response.sources]);

  useEffect(() => {
    if (!orderedSources.length) return;
    const requestedId = legacySourceId(request.mediaType, sourceParam);
    const next = selectDefaultSource(orderedSources, {
      requestedId,
      defaultId: response.defaultId,
      preferredSubtitle: request.preferredSubtitle,
    });
    if (!next) return;

    setSelectedId((current) => current ?? next.id);
    if (sourceParam !== next.id) void setSourceParam(next.id);
  }, [
    orderedSources,
    request.mediaType,
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
      setFrameUrl(null);
      return;
    }
    if (!attemptedRef.current.has(selectedSource.id)) {
      emit("player_provider_selected", {
        provider: selectedSource.providerId,
        mediaType: request.mediaType,
        automatic: false,
        subtitles: selectedSource.capabilities.subtitles ?? "unverified",
      });
    }
    attemptedRef.current.add(selectedSource.id);
    setRuntimeStatuses((current) => ({ ...current, [selectedSource.id]: "loading" }));
    setFrameUrl(withResume(selectedSource, currentTimeRef.current));
  }, [request.mediaType, selectedSource]);

  const switchTo = useCallback(
    (source: PlayerSource, automatic: boolean) => {
      attemptedRef.current.add(source.id);
      setExhausted(false);
      setRuntimeStatuses((current) => ({
        ...current,
        [source.id]: automatic ? "switching" : "loading",
      }));
      setSelectedId(source.id);
      void setSourceParam(source.id);
      emit("player_provider_selected", {
        provider: source.providerId,
        mediaType: request.mediaType,
        automatic,
        subtitles: source.capabilities.subtitles ?? "unverified",
      });
      emit(automatic ? "player_auto_fallback" : "player_manual_switch", {
        provider: source.providerId,
        mediaType: request.mediaType,
      });
    },
    [request.mediaType, setSourceParam],
  );

  const failCurrent = useCallback(
    (reason: string) => {
      if (!selectedSource) return;
      if (hardFailedRef.current.has(selectedSource.id)) return;
      hardFailedRef.current.add(selectedSource.id);
      const failures = loadSessionFailures();
      failures[selectedSource.providerId] = Date.now();
      saveSessionFailures(failures);
      setRuntimeStatuses((current) => ({ ...current, [selectedSource.id]: "failed" }));
      emit("player_iframe_failed", {
        provider: selectedSource.providerId,
        mediaType: request.mediaType,
        reason: reason.slice(0, 80),
      });

      const next = orderedSources.find(
        (source) => source.availability !== "failed" && !attemptedRef.current.has(source.id),
      );
      if (next) switchTo(next, true);
      else setExhausted(true);
    },
    [orderedSources, request.mediaType, selectedSource, switchTo],
  );

  useEffect(() => {
    if (selectedSource?.availability === "failed") {
      failCurrent(selectedSource.failureReason ?? "Exact source preflight failed");
    }
  }, [failCurrent, selectedSource]);

  const selectSource = useCallback(
    (id: string) => {
      const source = orderedSources.find((candidate) => candidate.id === id);
      if (!source || source.availability === "failed") return;
      attemptedRef.current.clear();
      hardFailedRef.current.delete(id);
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
    if (!selectedSource) return;
    setRuntimeStatuses((current) => ({ ...current, [selectedSource.id]: "ready" }));
    const failures = loadSessionFailures();
    delete failures[selectedSource.providerId];
    saveSessionFailures(failures);
    emit("player_playback_started", {
      provider: selectedSource.providerId,
      mediaType: request.mediaType,
    });
  }, [request.mediaType, selectedSource]);

  const statuses = useMemo<StatusMap>(() => {
    return Object.fromEntries(
      orderedSources.map((source) => [
        source.id,
        runtimeStatuses[source.id] ?? source.availability,
      ]),
    );
  }, [orderedSources, runtimeStatuses]);

  return {
    sources: orderedSources,
    selectedSource,
    selectedSourceId: selectedSource?.id ?? "",
    selectedStatus: selectedSource ? statuses[selectedSource.id] : "resolving",
    frameUrl,
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
