"use client";

/**
 * The shared player controller for Movie, TV, and Anime (Phase 6, §10 —
 * promoted from Phase 0's TV-only direct-mount controller, which produced
 * the only checked fixture that reached a playable state after the
 * Filmu-first outage; see `TV_PLAYER_ROLLBACK_HANDOFF.md`). Mounts exactly
 * one iframe or native `<video>`, synchronously, from the same public
 * adapter registry TV already used (`createPublicEmbedSources`) — no
 * `/api/player/sources` round trip on the critical path, no provider
 * preflight before mounting, with bounded automatic fallback for clean
 * movie/TV launches. The embedded
 * provider owns playback and fullscreen entirely; Umbra never inspects or
 * intercepts it.
 *
 * `ReliablePlayer.tsx` and `usePlayerEngine.ts` are deleted, not orphaned —
 * this replaces both. What survives from that stack, unchanged: `usePlayerEvents`
 * (postMessage parsing + trusted history-saving), `NativePlayer` (real
 * HLS/DASH/MP4 playback for operator-configured direct sources), and
 * `useServerHealth` (used inside `PlayerSourceSheet`).
 *
 * **One control layer.** Finding 03 in `UI Analysis`: the old stack let the
 * exhausted-servers banner, the no-captions prompt, `StuckStreamToast`, and
 * the header controls each pin themselves independently, so two shared
 * `.player-safe-bottom` and stacked on top of each other, and a media query
 * hid the server switcher exactly when a stream died. Here there is exactly
 * one notification slot (`PlayerNotificationSlot`) and nothing is ever
 * hidden by media query.
 *
 * **Explicit fullscreen, bounded automatic fallback.** The player opens in a
 * borderless 16:9 cinema stage and becomes a fixed viewport only after the
 * user chooses Full screen. It is portalled past `template.tsx`'s animated
 * wrapper for the same containing-block reason `DetailModal.tsx` is — any
 * ancestor `transform` breaks a `position: fixed` descendant. The persistent
 * nav chrome is already hidden on `/player` routes (`ImmersiveAppShell.tsx`),
 * and the top and bottom bars are overlays on the stage in both states.
 * StreamFree chrome yields to provider controls after three idle seconds and
 * can be restored from a small left-edge reveal target. There is no
 * `webkitEnterFullscreen` → `requestFullscreen` → cinema-mode cascade to
 * silently cancel. Explicit and remembered source choices remain
 * user-controlled during recovery.
 */

import NativePlayer from "@/components/player/NativePlayer";
import PlayerNotificationSlot, {
  type PlayerNotification,
} from "@/components/player/PlayerNotificationSlot";
import PlayerSourceSheet from "@/components/player/PlayerSourceSheet";
import { usePlayerChromeVisibility } from "@/hooks/usePlayerChromeVisibility";
import { usePlayerEvents, type PlayerEventIdentity } from "@/hooks/usePlayerEvents";
import { trackUmbraEvent } from "@/lib/analytics/client";
import { createPublicEmbedSources } from "@/lib/sources/adapters/embed";
import { ANIME_PROVIDER_CATALOG } from "@/lib/sources/animeCatalog";
import { legacySourceId } from "@/lib/sources/legacy";
import { isSourceActivationKey } from "@/lib/player/sourceInteraction";
import {
  canAutomaticallyRecoverSource,
  clearPlaybackPreference,
  findNextAutomaticFallbackSource,
  findNextFallbackSource,
  findPreferredSource,
  PLAYBACK_RECOVERY_TIMEOUT_MS,
  readPlaybackPreference,
  sourceParamForPlaybackSwitch,
  shouldUseAutomaticRecovery,
  type PlaybackSourceSwitchReason,
  withResumePosition,
  writePlaybackPreference,
} from "@/lib/sources/playbackPolicy";
import type {
  AudioVariant,
  PlayerSource,
  SourceRequest,
  SourceResolutionResponse,
} from "@/lib/sources/types";
import { Menu } from "@/utils/icons";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal, flushSync } from "react-dom";

export interface PlayerShellHeaderContext {
  selectedSourceId: string;
  selectedAudioVariant?: AudioVariant;
  onOpenSource: () => void;
  chromeHidden: boolean;
}

/** Context passed to the optional `renderControls` render-prop. When provided
 *  the default Source/Fit/Fill/Fullscreen button row inside the shell is
 *  suppressed so the caller can render those controls outside the video
 *  viewport (e.g. below the player on the anime page). */
export interface PlayerShellControlsContext {
  displayMode: "fit" | "fill";
  isFullscreen: boolean;
  selectedSourceId: string;
  onChooseDisplayMode: (mode: "fit" | "fill") => void;
  onToggleFullscreen: () => Promise<void>;
  onOpenSource: () => void;
}

export interface PlayerShellProps {
  /** Callers must keep this referentially stable (useMemo) — it drives
   *  every derived query below. */
  request: SourceRequest;
  /** Trusted identity for history-saving — see `PlayerEventIdentity`. The
   *  frame is allowed to report position, never what it is playing. */
  identity: PlayerEventIdentity;
  historyMetadata?: { season?: number; episode?: number };
  renderHeader: (context: PlayerShellHeaderContext) => ReactNode;
  /** Extra sheets a specific media type owns — episode drawers/panels. */
  renderExtras?: (context: PlayerShellHeaderContext) => ReactNode;
  /** When provided, the built-in Source/Fit/Fill/Fullscreen button row is
   *  omitted from inside the player viewport. The caller is responsible for
   *  rendering those controls using the supplied context. */
  renderControls?: (context: PlayerShellControlsContext) => ReactNode;
  onEnded?: () => void;
  onAudioVariantChange?: (audioVariant: AudioVariant) => void;
  /** Render the initial stage in the route flow instead of as a body portal. */
  inlineLayout?: boolean;
}

type PlayerDisplayMode = "fit" | "fill";
const PLAYER_DISPLAY_STORAGE_KEY = "streamfree:player-display:v1";

function directSourceParams(request: SourceRequest): URLSearchParams {
  const params = new URLSearchParams({ mediaType: request.mediaType, version: "3" });
  if (request.tmdbId) params.set("tmdbId", String(request.tmdbId));
  if (request.anilistId) params.set("anilistId", String(request.anilistId));
  if (request.malId) params.set("malId", String(request.malId));
  if (request.animeTmdbId) params.set("animeTmdbId", String(request.animeTmdbId));
  if (request.season !== undefined) params.set("season", String(request.season));
  if (request.episode !== undefined) params.set("episode", String(request.episode));
  if (request.startAt) params.set("startAt", String(request.startAt));
  if (request.preferredSubtitle) params.set("preferredSubtitle", request.preferredSubtitle);
  if (request.preferredAudio) params.set("preferredAudio", request.preferredAudio);
  return params;
}

export default function PlayerShell({
  request,
  identity,
  historyMetadata,
  renderHeader,
  renderExtras,
  renderControls,
  onEnded,
  onAudioVariantChange,
  inlineLayout = false,
}: PlayerShellProps) {
  const [mounted, setMounted] = useState(false);
  // Standard one-tick-late mount guard for `createPortal` — see `DetailModal.tsx`.
  useEffect(() => setMounted(true), []);

  const [sourceOpened, setSourceOpened] = useState(false);
  const sourceOpenerRef = useRef<HTMLElement | null>(null);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const { hidden: chromeHidden, reveal: revealChrome } = usePlayerChromeVisibility(sourceOpened);

  useEffect(() => {
    const revealFromKeyboard = () => revealChrome();
    window.addEventListener("keydown", revealFromKeyboard);
    return () => window.removeEventListener("keydown", revealFromKeyboard);
  }, [revealChrome]);

  useEffect(() => {
    const root = playerRootRef.current;
    if (!root) return;

    let lastMoveTime = 0;
    const handlePointerMove = () => {
      const now = performance.now();
      if (now - lastMoveTime >= 350) {
        lastMoveTime = now;
        revealChrome();
      }
    };

    root.addEventListener("pointermove", handlePointerMove, { passive: true });
    return () => root.removeEventListener("pointermove", handlePointerMove);
  }, [revealChrome, mounted]);

  const events = usePlayerEvents({ saveHistory: true, metadata: historyMetadata, identity });
  const { setAllowedOrigin } = events;
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [displayMode, setDisplayMode] = useState<PlayerDisplayMode>("fit");
  const playerRootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(PLAYER_DISPLAY_STORAGE_KEY);
    if (saved === "fill") setDisplayMode("fill");
  }, []);

  const chooseDisplayMode = useCallback((mode: PlayerDisplayMode) => {
    setDisplayMode(mode);
    window.localStorage.setItem(PLAYER_DISPLAY_STORAGE_KEY, mode);
  }, []);

  const setPlaybackOrientation = useCallback((fullscreen: boolean) => {
    const nativeBridge = (
      window as Window & {
        StreamFreeNative?: {
          lockLandscape?: () => void;
          lockPortrait?: () => void;
          enterPlayerImmersive?: () => void;
          exitPlayerImmersive?: () => void;
        };
      }
    ).StreamFreeNative;
    const orientation = window.screen.orientation as ScreenOrientation & {
      lock?: (orientation: string) => Promise<void>;
      unlock?: () => void;
    };
    if (fullscreen) {
      nativeBridge?.lockLandscape?.();
      nativeBridge?.enterPlayerImmersive?.();
      void Promise.resolve(orientation.lock?.("landscape")).catch(() => undefined);
    } else {
      nativeBridge?.lockPortrait?.();
      nativeBridge?.exitPlayerImmersive?.();
      orientation.unlock?.();
    }
  }, []);

  useEffect(() => {
    const syncFullscreen = () => {
      const active = document.fullscreenElement === playerRootRef.current;
      setIsFullscreen(active);
      document.documentElement.classList.toggle("player-fullscreen", active);
      setPlaybackOrientation(active);
    };
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, [setPlaybackOrientation]);

  useEffect(() => {
    if (!isFullscreen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;

    // Mobile browsers and WebViews can suspend or tear down fullscreen while
    // the app is backgrounded without emitting a reliable fullscreenchange
    // before the route resumes. Restore the shell to a safe portrait state so
    // the next foreground frame cannot inherit a stale immersive lock.
    const restoreAfterBackground = () => {
      if (document.visibilityState !== "hidden") return;
      setIsFullscreen(false);
      document.documentElement.classList.remove("player-fullscreen");
      setPlaybackOrientation(false);
      if (document.fullscreenElement === playerRootRef.current) {
        void document.exitFullscreen?.().catch(() => undefined);
      }
    };

    document.addEventListener("visibilitychange", restoreAfterBackground);
    window.addEventListener("pagehide", restoreAfterBackground);
    return () => {
      document.removeEventListener("visibilitychange", restoreAfterBackground);
      window.removeEventListener("pagehide", restoreAfterBackground);
    };
  }, [isFullscreen, setPlaybackOrientation]);

  useEffect(() => {
    return () => {
      document.documentElement.classList.remove("player-fullscreen");
      setPlaybackOrientation(false);
    };
  }, [setPlaybackOrientation]);

  const toggleFullscreen = useCallback(async () => {
    // `document.fullscreenElement` stays null in several Android WebViews
    // even though the native bridge has put the shell into its fixed
    // immersive fallback. Use the app state as the source of truth for the
    // second tap so that fallback fullscreen can always be exited.
    const entering = !isFullscreen && !document.fullscreenElement;
    try {
      if (entering) await playerRootRef.current?.requestFullscreen?.({ navigationUI: "hide" });
      else if (document.fullscreenElement) await document.exitFullscreen();
    } catch {
      // The fixed shell and native orientation bridge remain the fallback in WebView.
    }
    // `requestFullscreen()` updates `document.fullscreenElement` asynchronously
    // and some WebViews reject it even though the fixed player shell remains a
    // usable full-bleed fallback. Treat the user's intent as authoritative for
    // entry, while an exit only becomes portrait once the browser confirms it.
    const active = entering ? true : Boolean(document.fullscreenElement);
    setIsFullscreen(active);
    document.documentElement.classList.toggle("player-fullscreen", active);
    setPlaybackOrientation(active);
  }, [isFullscreen, setPlaybackOrientation]);

  const endedEventVersionRef = useRef(0);
  useEffect(() => {
    if (!onEnded || endedEventVersionRef.current >= events.eventVersion) return;
    endedEventVersionRef.current = events.eventVersion;
    if (events.lastEvent === "ended") onEnded();
  }, [events.eventVersion, events.lastEvent, onEnded]);

  // Non-blocking: only ever *adds* an operator-configured direct source
  // (`PLAYER_DIRECT_SOURCES_JSON`) if one resolves. The public sources below
  // mount synchronously regardless of whether or when this settles.
  //
  // Tagged with the request key it was fetched for and derived against the
  // *current* key, rather than reset in the effect that starts the next
  // fetch — switching titles invalidates a stale result by comparison alone,
  // the same way `confirmedReadySourceId`/`stuckSourceId` below do for the
  // events that arrive after a source switch.
  const directRequestKey = useMemo(
    () =>
      [
        request.mediaType,
        request.tmdbId,
        request.anilistId,
        request.malId,
        request.animeTmdbId,
        request.season,
        request.episode,
        request.preferredAudio,
      ].join(":"),
    [
      request.mediaType,
      request.tmdbId,
      request.anilistId,
      request.malId,
      request.animeTmdbId,
      request.season,
      request.episode,
      request.preferredAudio,
    ],
  );
  const [directResult, setDirectResult] = useState<{ key: string; sources: PlayerSource[] } | null>(
    null,
  );
  // Tagged the same way `directResult` is — lets the URL-sync effect below
  // tell "still waiting on the direct-source fetch" apart from "fetch
  // settled, direct source doesn't exist for this title" without a reset
  // effect for a title/episode change.
  const [directSettledKey, setDirectSettledKey] = useState<string | null>(null);
  const directSettled = directSettledKey === directRequestKey;

  useEffect(() => {
    const key = directRequestKey;
    const controller = new AbortController();
    fetch(`/api/player/sources?${directSourceParams(request)}`, { signal: controller.signal })
      .then((res) => (res.ok ? (res.json() as Promise<SourceResolutionResponse>) : null))
      .then((data) => {
        const direct = data?.sources.filter(
          (s) => s.providerId === "direct" || s.providerId === "anivexa" || s.providerId === "miruro" || s.providerId.startsWith("anivexa:") || s.providerId.startsWith("miruro:"),
        ) ?? [];
        if (direct.length) setDirectResult({ key, sources: direct });
      })
      .catch(() => undefined)
      .finally(() => setDirectSettledKey(key));
    return () => controller.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [directRequestKey]);

  const sources = useMemo(() => {
    const publicSources = createPublicEmbedSources(request);
    const direct = directResult?.key === directRequestKey ? directResult.sources : [];
    if (!direct.length) return publicSources;
    const seen = new Set(publicSources.map((s) => s.id));
    return [...direct.filter((s) => !seen.has(s.id)), ...publicSources].sort(
      (a, b) => a.priority - b.priority,
    );
  }, [request, directResult, directRequestKey]);

  const [sourceParam, setSourceParam] = useQueryState("src", parseAsString);
  const preferredAudio: AudioVariant | undefined =
    request.mediaType === "anime" ? (request.preferredAudio === "dub" ? "dub" : "sub") : undefined;
  const [rememberedSourceId, setRememberedSourceId] = useState<string | null>(null);

  useEffect(() => {
    setRememberedSourceId(
      readPlaybackPreference(window.localStorage, request.mediaType, preferredAudio),
    );
  }, [request.mediaType, preferredAudio]);
  // Query-state updates are asynchronous. Keep a request-scoped override so
  // an explicit server click remounts the selected iframe immediately rather
  // than waiting for Next's URL update to complete behind a cross-origin
  // player.
  const [selectedSourceOverride, setSelectedSourceOverride] = useState<{
    id: string;
    requestKey: string;
  } | null>(null);
  const [resumeOverride, setResumeOverride] = useState<{
    requestKey: string;
    sourceId: string;
    seconds: number;
  } | null>(null);
  const [switchingSourceId, setSwitchingSourceId] = useState<string | null>(null);
  const [sourceFeedback, setSourceFeedback] = useState<{
    sourceId: string;
    label: string;
    audioVariant?: AudioVariant;
    phase: "switching" | "selected";
  } | null>(null);
  const selectionVersionRef = useRef(0);
  const requestedSourceId = selectedSourceOverride?.requestKey === directRequestKey
    ? selectedSourceOverride.id
    : sources.some((source) => source.id === sourceParam)
      ? sourceParam
      : legacySourceId(request.mediaType, sourceParam);

  const selectedSource = useMemo(() => {
    if (!sources.length) return null;
    return findPreferredSource(sources, {
      explicitId: requestedSourceId,
      rememberedId: sourceParam ? null : rememberedSourceId,
      audioVariant: preferredAudio,
    });
  }, [preferredAudio, rememberedSourceId, requestedSourceId, sourceParam, sources]);
  const selectedSourceUrl = useMemo(
    () =>
      selectedSource &&
      resumeOverride?.requestKey === directRequestKey &&
      resumeOverride.sourceId === selectedSource.id
        ? withResumePosition(selectedSource, resumeOverride.seconds)
        : selectedSource?.url,
    [directRequestKey, resumeOverride, selectedSource],
  );

  // Automatic failover is enabled only for a clean movie/TV launch. A source
  // in the URL or a remembered device preference is a user decision and must
  // never be silently replaced. This ref is initialized before URL
  // synchronization can write the recommended source into `src`.
  const automaticFallbackRequestKeyRef = useRef<string | null>(null);
  const automaticFallbackEnabledRef = useRef(false);
  const automaticFailureHandlerRef = useRef<((sourceId: string) => boolean) | null>(null);
  const initialSourceParamRef = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (initialSourceParamRef.current !== undefined) return;
    initialSourceParamRef.current = new URL(window.location.href).searchParams.get("src");
  }, []);
  useEffect(() => {
    if (!selectedSource || !directSettled) return;
    if (automaticFallbackRequestKeyRef.current === directRequestKey) return;

    const remembered = readPlaybackPreference(
      window.localStorage,
      request.mediaType,
      preferredAudio,
    );
    automaticFallbackRequestKeyRef.current = directRequestKey;
    automaticFallbackEnabledRef.current = shouldUseAutomaticRecovery({
      mediaType: request.mediaType,
      initialSourceId: initialSourceParamRef.current,
      rememberedSourceId: remembered,
    });
  }, [
    directRequestKey,
    directSettled,
    preferredAudio,
    request.mediaType,
    selectedSource,
  ]);

  // Do not write the recommended/default source to `?src=`. That URL value
  // is reserved for an actual server choice: persisting our own Filmu default
  // made the next load look manual and prevented automatic recovery.

  // Once the shallow URL update is observable through nuqs, the query string
  // becomes the source of truth again. Until then the request-scoped override
  // prevents Safari's slower History API scheduling from snapping the iframe
  // back to the previous provider.
  useEffect(() => {
    if (
      selectedSourceOverride?.requestKey === directRequestKey &&
      sourceParam === selectedSourceOverride.id
    ) {
      setSelectedSourceOverride(null);
    }
  }, [directRequestKey, selectedSourceOverride, sourceParam]);

  useEffect(() => {
    setAllowedOrigin(selectedSource?.providerOrigin ?? null);
  }, [selectedSource?.providerOrigin, setAllowedOrigin]);

  // Sticky per-source flags, each derived by comparing a remembered source id
  // against the *current* one rather than cleared in a reset effect —
  // switching sources invalidates a stale value by comparison alone (same
  // technique as `directSources` above).
  const [confirmedReadySourceId, setConfirmedReadySourceId] = useState<string | null>(null);
  const confirmedReady = confirmedReadySourceId === selectedSource?.id;
  const confirmedReadyRef = useRef(confirmedReady);
  const [recoveryPrompt, setRecoveryPrompt] = useState<{
    requestKey: string;
    sourceId: string;
    reason: "timeout" | "error";
  } | null>(null);
  const [attemptedState, setAttemptedState] = useState<{
    requestKey: string;
    ids: Set<string>;
  }>({ requestKey: directRequestKey, ids: new Set() });
  const attemptedSourceIds = useMemo(
    () =>
      attemptedState.requestKey === directRequestKey ? attemptedState.ids : new Set<string>(),
    [attemptedState, directRequestKey],
  );
  useEffect(() => {
    confirmedReadyRef.current = confirmedReady;
  }, [confirmedReady]);

  const handledEventVersionRef = useRef(0);
  useEffect(() => {
    if (handledEventVersionRef.current >= events.eventVersion) return;
    handledEventVersionRef.current = events.eventVersion;
    if (!selectedSource || events.lastEventOrigin !== selectedSource.providerOrigin) return;
    if (events.lastEvent === "play" || events.lastEvent === "timeupdate") {
      // Syncing from `usePlayerEvents`' postMessage-derived state, which is
      // exactly the "external system" case an effect is for — this isn't
      // derivable from props/state already available at render time.
      setConfirmedReadySourceId(selectedSource.id);
      setRecoveryPrompt((current) =>
        current?.sourceId === selectedSource.id ? null : current,
      );
      if (!confirmedReady) {
        trackUmbraEvent("player_playback_confirmed", {
          mediaType: request.mediaType,
          provider: selectedSource.providerId,
          audio: selectedSource.audioVariant ?? "none",
        });
      }
    } else if (events.lastEvent === "error") {
      if (!automaticFailureHandlerRef.current?.(selectedSource.id)) {
        setRecoveryPrompt({
          requestKey: directRequestKey,
          sourceId: selectedSource.id,
          reason: "error",
        });
      }
    }
  }, [
    directRequestKey,
    confirmedReady,
    events.eventVersion,
    events.lastEvent,
    events.lastEventOrigin,
    request.mediaType,
    selectedSource,
  ]);

  const [nativeErrorState, setNativeErrorState] = useState<{
    sourceId: string;
    message: string;
  } | null>(null);
  const nativeError =
    nativeErrorState !== null && nativeErrorState.sourceId === selectedSource?.id
      ? nativeErrorState.message
      : null;

  useEffect(() => {
    if (!sourceFeedback) return;
    const timeout = window.setTimeout(
      () => {
        if (sourceFeedback.phase === "switching") {
          setSwitchingSourceId((current) => (current === sourceFeedback.sourceId ? null : current));
        }
        setSourceFeedback((current) => (current === sourceFeedback ? null : current));
      },
      sourceFeedback.phase === "switching" ? 8_000 : 2_500,
    );
    return () => window.clearTimeout(timeout);
  }, [sourceFeedback]);

  const closeSource = useCallback(() => {
    setSourceOpened(false);
    window.requestAnimationFrame(() => sourceOpenerRef.current?.focus());
  }, []);

  const openSource = useCallback(() => {
    sourceOpenerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    revealChrome();
    setSourceOpened(true);
    trackUmbraEvent("source_sheet_opened", { mediaType: request.mediaType });
  }, [request.mediaType, revealChrome]);

  const switchSource = useCallback(
    (id: string, reason: PlaybackSourceSwitchReason = "manual") => {
      const nextSource = sources.find((source) => source.id === id);
      if (!nextSource) return;

      if (selectedSource?.id === id) {
        if (reason === "reset") {
          clearPlaybackPreference(window.localStorage, request.mediaType, preferredAudio);
          setRememberedSourceId(null);
          automaticFallbackEnabledRef.current =
            request.mediaType === "movie" || request.mediaType === "tv";
          void setSourceParam(null, { history: "replace", shallow: true, scroll: false });
        }
        closeSource();
        revealChrome();
        return;
      }

      const selectionVersion = ++selectionVersionRef.current;

      // Commit the iframe swap synchronously while the modal scrim is still
      // above the old cross-origin frame. This prevents the provider below
      // from receiving the tail of the same touch/pointer sequence.
      flushSync(() => {
        setSwitchingSourceId(id);
        setSelectedSourceOverride({ id, requestKey: directRequestKey });
        if (events.currentTime > 0) {
          setResumeOverride({
            requestKey: directRequestKey,
            sourceId: id,
            seconds: events.currentTime,
          });
        }
        setSourceFeedback({
          sourceId: id,
          label: nextSource.label,
          audioVariant: nextSource.audioVariant,
          phase: "switching",
        });
      });
      closeSource();
      setRecoveryPrompt(null);
      revealChrome();

      if (nextSource.audioVariant && nextSource.audioVariant !== preferredAudio) {
        onAudioVariantChange?.(nextSource.audioVariant);
      }

      if (reason === "manual") {
        automaticFallbackEnabledRef.current = false;
        writePlaybackPreference(
          window.localStorage,
          request.mediaType,
          nextSource.id,
          nextSource.audioVariant ?? preferredAudio,
        );
        setRememberedSourceId(nextSource.id);
        setAttemptedState({ requestKey: directRequestKey, ids: new Set() });
        trackUmbraEvent("player_manual_switch", {
          mediaType: request.mediaType,
          fromProvider: selectedSource?.providerId ?? "unknown",
          toProvider: nextSource.providerId,
          audio: nextSource.audioVariant ?? "none",
        });
      } else if (reason === "recovery" || reason === "automatic") {
        setAttemptedState((current) => {
          const ids = current.requestKey === directRequestKey ? new Set(current.ids) : new Set<string>();
          if (selectedSource) ids.add(selectedSource.id);
          return { requestKey: directRequestKey, ids };
        });
        trackUmbraEvent(reason === "automatic" ? "player_auto_fallback" : "player_recovery_accepted", {
          mediaType: request.mediaType,
          fromProvider: selectedSource?.providerId ?? "unknown",
          toProvider: nextSource.providerId,
          audio: nextSource.audioVariant ?? "none",
          reason: reason === "automatic" ? "timeout" : "prompt_accepted",
        });
      } else {
        clearPlaybackPreference(window.localStorage, request.mediaType, preferredAudio);
        setRememberedSourceId(null);
        automaticFallbackEnabledRef.current =
          request.mediaType === "movie" || request.mediaType === "tv";
      }

      trackUmbraEvent("source_sheet_selection_completed", {
        mediaType: request.mediaType,
        provider: nextSource.providerId,
        audio: nextSource.audioVariant ?? "none",
      });

      // The selected iframe already changed above; URL persistence is
      // intentionally non-blocking. A failed History API update must never
      // undo a user's server choice. Defaults, resets, and automatic recovery
      // deliberately clear `src`; recovery accepted from the visible prompt
      // remains a conscious, deep-linkable server decision.
      const nextSourceParam = sourceParamForPlaybackSwitch(id, reason);
      void setSourceParam(nextSourceParam, { history: "replace", shallow: true, scroll: false }).catch(() => {
          if (selectionVersionRef.current !== selectionVersion) return;
          const nextUrl = new URL(window.location.href);
          if (nextSourceParam) nextUrl.searchParams.set("src", nextSourceParam);
          else nextUrl.searchParams.delete("src");
          window.history.replaceState(window.history.state, "", nextUrl);
        });
    },
    [
      directRequestKey,
      events.currentTime,
      closeSource,
      onAudioVariantChange,
      preferredAudio,
      request.mediaType,
      revealChrome,
      selectedSource,
      setSourceParam,
      sources,
    ],
  );

  const selectSource = useCallback((id: string) => switchSource(id, "manual"), [switchSource]);

  const resetPreferredSource = useCallback(() => {
    const recommended = findPreferredSource(sources, { audioVariant: preferredAudio });
    if (recommended) switchSource(recommended.id, "reset");
  }, [preferredAudio, sources, switchSource]);

  const handleIframeLoad = useCallback((source: PlayerSource) => {
    setSwitchingSourceId((current) => (current === source.id ? null : current));
    setSourceFeedback((current) =>
      current?.sourceId === source.id
        ? { sourceId: source.id, label: source.label, audioVariant: source.audioVariant, phase: "selected" }
        : current,
    );
  }, []);

  const activeRecovery =
    recoveryPrompt?.requestKey === directRequestKey &&
    recoveryPrompt.sourceId === selectedSource?.id &&
    !confirmedReady;
  const recoveryFallback = useMemo(
    () =>
      activeRecovery
        ? findNextFallbackSource(
            sources,
            selectedSource?.id,
            attemptedSourceIds,
            selectedSource?.audioVariant ?? preferredAudio,
          )
        : null,
    [activeRecovery, attemptedSourceIds, preferredAudio, selectedSource, sources],
  );

  const attemptAutomaticFallback = useCallback(
    (sourceId: string): boolean => {
      if (!automaticFallbackEnabledRef.current) return false;
      const currentSource = sources.find((source) => source.id === sourceId);
      if (!canAutomaticallyRecoverSource(currentSource)) return false;
      const automaticFallback = findNextAutomaticFallbackSource(
        sources,
        sourceId,
        attemptedSourceIds,
        selectedSource?.audioVariant ?? preferredAudio,
      );
      if (!automaticFallback) return false;
      setRecoveryPrompt(null);
      switchSource(automaticFallback.id, "automatic");
      return true;
    },
    [attemptedSourceIds, preferredAudio, selectedSource, sources, switchSource],
  );

  useEffect(() => {
    automaticFailureHandlerRef.current = attemptAutomaticFallback;
    return () => {
      automaticFailureHandlerRef.current = null;
    };
  }, [attemptAutomaticFallback]);

  // External iframe failures are often silent because the provider is
  // cross-origin. Give the current provider the full grace period, pause it
  // while the tab is hidden, and then move to the next stable/direct source
  // automatically for a clean movie/TV launch. If no candidate remains,
  // retain the explicit recovery panel rather than claiming the provider is
  // offline.
  useEffect(() => {
    if (!selectedSource || !directSettled) return;
    // An eventless cross-origin iframe can be visibly playing while remaining
    // opaque to StreamFree. A timer cannot distinguish that healthy state from
    // failure, so do not show a false warning or replace it. The persistent
    // Source control and the provider's own resolver remain available.
    if (selectedSource.kind === "iframe" && !selectedSource.capabilities.events) return;
    const sourceId = selectedSource.id;
    let remainingMs = PLAYBACK_RECOVERY_TIMEOUT_MS;
    let startedAt = performance.now();
    let timer: number | null = null;

    const showPrompt = () => {
      if (confirmedReadyRef.current) return;
      if (attemptAutomaticFallback(sourceId)) return;

      setRecoveryPrompt({ requestKey: directRequestKey, sourceId, reason: "timeout" });
      trackUmbraEvent("player_recovery_prompted", {
        mediaType: request.mediaType,
        provider: selectedSource.providerId,
        reason: selectedSource.capabilities.events ? "unconfirmed" : "eventless",
        audio: selectedSource.audioVariant ?? "none",
      });
    };
    const startTimer = () => {
      startedAt = performance.now();
      timer = window.setTimeout(showPrompt, remainingMs);
    };
    const handleVisibility = () => {
      if (document.hidden) {
        if (timer !== null) window.clearTimeout(timer);
        remainingMs = Math.max(0, remainingMs - (performance.now() - startedAt));
      } else if (!confirmedReadyRef.current) {
        startTimer();
      }
    };

    if (!document.hidden) startTimer();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      if (timer !== null) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [
    attemptedSourceIds,
    directRequestKey,
    directSettled,
    preferredAudio,
    request.mediaType,
    selectedSource,
    attemptAutomaticFallback,
  ]);

  const declineRecovery = useCallback(() => {
    if (!selectedSource) return;
    setRecoveryPrompt(null);
    trackUmbraEvent("player_recovery_declined", {
      mediaType: request.mediaType,
      provider: selectedSource.providerId,
      audio: selectedSource.audioVariant ?? "none",
    });
  }, [request.mediaType, selectedSource]);

  const acceptRecovery = useCallback(() => {
    if (recoveryFallback) switchSource(recoveryFallback.id, "recovery");
  }, [recoveryFallback, switchSource]);

  const reportPlaybackIssue = useCallback(() => {
    if (!selectedSource) return;
    trackUmbraEvent("player_all_sources_exhausted", {
      mediaType: request.mediaType,
      provider: selectedSource.providerId,
      audio: selectedSource.audioVariant ?? "none",
    });
    setRecoveryPrompt(null);
  }, [request.mediaType, selectedSource]);

  const notifications = useMemo<PlayerNotification[]>(() => {
    const list: PlayerNotification[] = [];
    if (nativeError) {
      list.push({
        id: "native-error",
        message: nativeError,
        actionLabel: recoveryFallback ? `Try ${recoveryFallback.label}` : "Choose server",
        onAction: recoveryFallback ? acceptRecovery : openSource,
        secondaryActionLabel: recoveryFallback ? "Choose server" : undefined,
        onSecondaryAction: recoveryFallback ? openSource : undefined,
        tone: "danger",
        dismissible: false,
      });
    }
    if (activeRecovery && selectedSource) {
      list.push({
        id: `recovery:${selectedSource.id}`,
        message: recoveryFallback
          ? selectedSource.capabilities.events
            ? `${selectedSource.label} hasn’t started yet. Try ${recoveryFallback.label}?`
            : `Having trouble with ${selectedSource.label}? Try ${recoveryFallback.label} or choose another server.`
          : "No other stable server remains in this session. Retry this server or report the issue.",
        actionLabel: recoveryFallback ? `Try ${recoveryFallback.label}` : "Report issue",
        onAction: recoveryFallback ? acceptRecovery : reportPlaybackIssue,
        secondaryActionLabel: "Choose server",
        onSecondaryAction: openSource,
        dismissLabel: "Keep current server",
        tone: "warning",
      });
    }
    return list.filter((n) => !dismissedIds.has(n.id));
  }, [
    acceptRecovery,
    activeRecovery,
    dismissedIds,
    nativeError,
    openSource,
    recoveryFallback,
    reportPlaybackIssue,
    selectedSource,
  ]);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    if (id.startsWith("recovery:")) declineRecovery();
  }, [declineRecovery]);

  const headerContext: PlayerShellHeaderContext = {
    selectedSourceId: selectedSource?.id ?? "",
    selectedAudioVariant: selectedSource?.audioVariant,
    onOpenSource: openSource,
    chromeHidden,
  };

  const controlsContext: PlayerShellControlsContext = {
    displayMode,
    isFullscreen,
    selectedSourceId: selectedSource?.id ?? "",
    onChooseDisplayMode: chooseDisplayMode,
    onToggleFullscreen: toggleFullscreen,
    onOpenSource: openSource,
  };

  if (!mounted) return null;

  const playerContent = (
    <div
      ref={playerRootRef}
      className={`player-shell player-shell-${displayMode} ${
        isFullscreen
          ? "fixed inset-0 z-70 h-dvh w-full"
          : inlineLayout
            ? "relative z-30 mx-auto aspect-video w-full max-w-[min(100vw,1600px)]"
            : "fixed inset-x-0 top-0 z-70 mx-auto aspect-video w-full max-w-[min(100vw,1600px)]"
      } overflow-hidden bg-black`}
    >
      {selectedSource ? (
        selectedSource.kind === "iframe" ? (
          <iframe
            key={`${selectedSource.id}:${selectedSourceUrl}`}
            src={selectedSourceUrl}
            allowFullScreen
            allow={selectedSource.capabilities.iframe?.allow}
            referrerPolicy={selectedSource.capabilities.iframe?.referrerPolicy}
            title={`${selectedSource.label} player`}
            onLoad={() => handleIframeLoad(selectedSource)}
            className="player-shell-frame absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <NativePlayer
            key={`${selectedSource.id}:${selectedSourceUrl}`}
            source={selectedSource}
            src={selectedSourceUrl ?? selectedSource.url}
            startAt={events.currentTime || request.startAt}
            onReady={() => setConfirmedReadySourceId(selectedSource.id)}
            onError={(message) => {
              if (!automaticFailureHandlerRef.current?.(selectedSource.id)) {
                setNativeErrorState({ sourceId: selectedSource.id, message });
                setRecoveryPrompt({
                  requestKey: directRequestKey,
                  sourceId: selectedSource.id,
                  reason: "error",
                });
              }
            }}
            onEvent={(event, currentTime, duration) =>
              events.reportNativeEvent({
                event,
                currentTime,
                duration,
                mediaId: request.tmdbId ?? request.anilistId ?? "",
                mediaType: request.mediaType,
                season: request.season,
                episode: request.episode,
              })
            }
          />
        )
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center text-white">
          <h3 className="text-lg font-semibold">No playable source found</h3>
          <p className="max-w-md text-sm text-white/60">
            This title has no compatible source right now.
          </p>
        </div>
      )}

      {renderHeader(headerContext)}

      {isFullscreen && (
        <div className="player-safe-header pointer-events-none absolute inset-x-0 top-0 z-45 flex justify-end px-3 py-2 sm:px-5">
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label="Exit full screen"
            className="pointer-events-auto min-h-11 rounded-full border border-white/20 bg-black/70 px-4 py-2 text-xs font-semibold text-white/90 shadow-lg backdrop-blur-xl transition hover:bg-black/90 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
          >
            Exit full screen
          </button>
        </div>
      )}

      {!renderControls && (
        <div className="absolute right-4 bottom-5 z-45 flex items-center gap-2">
          <button
            type="button"
            onClick={openSource}
            onKeyDown={(event) => {
              if (!isSourceActivationKey(event.key)) return;
              event.preventDefault();
              event.stopPropagation();
              openSource();
            }}
            aria-label="Choose playback source"
            className="min-h-11 rounded-full border border-white/20 bg-black/65 px-3.5 py-2 text-xs font-semibold text-white/90 shadow-lg backdrop-blur-xl transition hover:bg-black/85 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
          >
            Source
          </button>
          <div className="player-display-toggle flex overflow-hidden rounded-full border border-white/20 bg-black/65 shadow-lg backdrop-blur-xl" role="group" aria-label="Video framing">
            {(["fit", "fill"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => chooseDisplayMode(mode)}
                aria-pressed={displayMode === mode}
                className={`px-3.5 py-2 text-xs font-semibold transition focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none ${displayMode === mode ? "bg-white text-black" : "text-white/85 hover:bg-white/15"}`}
              >
                {mode === "fit" ? "Fit" : "Fill"}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label={isFullscreen ? "Exit full screen" : "Enter full screen"}
            className="rounded-full border border-white/20 bg-black/65 px-3.5 py-2 text-xs font-semibold text-white/90 shadow-lg backdrop-blur-xl transition hover:bg-black/85 focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
          >
            {isFullscreen ? "Exit full screen" : "Full screen"}
          </button>
        </div>
      )}

      {chromeHidden && !sourceOpened && (
        <button
          type="button"
          aria-label="Show StreamFree player controls"
          title="Show player controls"
          onClick={revealChrome}
          className="player-controls-reveal glass-control absolute z-40 flex size-11 touch-manipulation items-center justify-center rounded-full border border-white/12 text-white/85 shadow-lg transition-[opacity,transform] duration-200 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-hidden"
        >
          <Menu size={21} />
        </button>
      )}

      {sourceFeedback && (
        <div className="player-source-feedback pointer-events-none absolute inset-x-0 z-40 flex justify-center px-4">
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="rounded-full border border-white/12 bg-black/72 px-3.5 py-2 text-[11.5px] font-medium text-white/90 shadow-xl backdrop-blur-xl"
          >
            {sourceFeedback.phase === "switching" ? "Switching to" : "Now using"}{" "}
            {sourceFeedback.label}
            {sourceFeedback.audioVariant
              ? ` · ${sourceFeedback.audioVariant === "dub" ? "Dub" : "Sub"}`
              : ""}
          </div>
        </div>
      )}

      {notifications.length > 0 && (
        <div className="player-safe-bottom pointer-events-none absolute inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-3 sm:px-6">
          <div className="pointer-events-auto w-full max-w-lg">
            <PlayerNotificationSlot notifications={notifications} onDismiss={handleDismiss} />
          </div>
        </div>
      )}

      {renderExtras?.(headerContext)}

      <PlayerSourceSheet
        opened={sourceOpened}
        onClose={closeSource}
        sources={sources}
        animeCatalog={request.mediaType === "anime" ? ANIME_PROVIDER_CATALOG : undefined}
        loading={request.mediaType === "anime" && !directSettled}
        selectedSourceId={selectedSource?.id ?? ""}
        switchingSourceId={switchingSourceId}
        hasPreference={Boolean(rememberedSourceId)}
        onResetPreference={resetPreferredSource}
        onSelect={selectSource}
      />
    </div>
  );

  if (renderControls) {
    return (
      <>
        {inlineLayout ? playerContent : createPortal(playerContent, document.body)}
        {renderControls(controlsContext)}
      </>
    );
  }

  return inlineLayout ? playerContent : createPortal(playerContent, document.body);
}
