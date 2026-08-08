"use client";

/**
 * The shared player controller for Movie, TV, and Anime (Phase 6, §10 —
 * promoted from Phase 0's TV-only direct-mount controller, which produced
 * the only checked fixture that reached a playable state after the
 * Filmu-first outage; see `TV_PLAYER_ROLLBACK_HANDOFF.md`). Mounts exactly
 * one iframe or native `<video>`, synchronously, from the same public
 * adapter registry TV already used (`createPublicEmbedSources`) — no
 * `/api/player/sources` round trip on the critical path, no provider
 * preflight before mounting, no automatic fallback switching. The embedded
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
 * **No fullscreen button, no fallback chain.** The player owns the viewport
 * at `100dvh` from the moment it opens (portalled past `template.tsx`'s
 * animated wrapper for the same containing-block reason `DetailModal.tsx`
 * is — any ancestor `transform` breaks a `position: fixed` descendant).
 * Rotating to landscape *is* fullscreen: the persistent nav chrome is
 * already hidden on `/player` routes (`ImmersiveAppShell.tsx`), and the top
 * and bottom bars are overlays on a full-bleed stage in both orientations,
 * not grid rows that would letterbox the video. There is no
 * `webkitEnterFullscreen` → `requestFullscreen` → cinema-mode cascade to
 * silently cancel.
 */

import NativePlayer from "@/components/player/NativePlayer";
import PlayerNotificationSlot, {
  type PlayerNotification,
} from "@/components/player/PlayerNotificationSlot";
import PlayerSourceSheet from "@/components/player/PlayerSourceSheet";
import { usePlayerEvents, type PlayerEventIdentity } from "@/hooks/usePlayerEvents";
import { createPublicEmbedSources } from "@/lib/sources/adapters/embed";
import { legacySourceId } from "@/lib/sources/legacy";
import { selectDefaultSource } from "@/lib/sources/selectDefault";
import type { PlayerSource, SourceRequest, SourceResolutionResponse } from "@/lib/sources/types";
import { parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export interface PlayerShellHeaderContext {
  selectedSourceId: string;
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
}

/** How long a source that claims postMessage support gets before the
 *  "can't confirm playback" nudge appears. Matches the old toast's delay. */
const STUCK_DELAY_MS = 12_000;

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
}: PlayerShellProps) {
  const [mounted, setMounted] = useState(false);
  // Standard one-tick-late mount guard for `createPortal` — see `DetailModal.tsx`.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  const [sourceOpened, setSourceOpened] = useState(false);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const events = usePlayerEvents({ saveHistory: true, metadata: historyMetadata, identity });
  const { setAllowedOrigin } = events;

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
      ].join(":"),
    [
      request.mediaType,
      request.tmdbId,
      request.anilistId,
      request.malId,
      request.animeTmdbId,
      request.season,
      request.episode,
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
        const direct = data?.sources.filter((s) => s.providerId === "direct") ?? [];
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

  const selectedSource = useMemo(() => {
    if (!sources.length) return null;
    return selectDefaultSource(sources, {
      requestedId: legacySourceId(request.mediaType, sourceParam),
      defaultId: sources[0]?.id,
      preferredSubtitle: request.preferredSubtitle,
      preferredAudio: request.preferredAudio,
    });
  }, [sourceParam, sources, request.mediaType, request.preferredSubtitle, request.preferredAudio]);

  // Keep `?src=` a stable provider id. Never blocks the mount above — the
  // stage below renders from `selectedSource` on the same render regardless
  // of whether the URL has caught up yet.
  //
  // Gated on `directSettled`: writing an *auto-picked* source into `?src=`
  // makes `selectDefaultSource`'s `requestedId` branch treat it as an
  // explicit choice on every future render, permanently outranking a
  // higher-priority direct source that resolves a moment later. Waiting for
  // the direct-source fetch to settle first means whatever we sync is
  // already the correct final default. An explicit id already in the URL on
  // mount is honored immediately regardless — `selectedSource` picks it via
  // `requestedId` before this effect ever runs, so there's nothing to wait
  // for in that case.
  useEffect(() => {
    if (!directSettled) return;
    if (selectedSource && sourceParam !== selectedSource.id) {
      void setSourceParam(selectedSource.id);
    }
  }, [directSettled, selectedSource, setSourceParam, sourceParam]);

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
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setConfirmedReadySourceId(selectedSource.id);
    }
  }, [events.eventVersion, events.lastEvent, events.lastEventOrigin, selectedSource]);

  const [nativeErrorState, setNativeErrorState] = useState<{
    sourceId: string;
    message: string;
  } | null>(null);
  const nativeError =
    nativeErrorState !== null && nativeErrorState.sourceId === selectedSource?.id
      ? nativeErrorState.message
      : null;

  // Only sources that declare postMessage support get the "can't confirm
  // playback" nudge — for a source that never claimed to send events,
  // Umbra was never going to hear from it, and that is not a fault to flag.
  const [stuckSourceId, setStuckSourceId] = useState<string | null>(null);
  const stuckVisible = stuckSourceId === selectedSource?.id && !confirmedReady;

  useEffect(() => {
    if (!selectedSource?.capabilities.events) return;
    const id = selectedSource.id;
    const timer = window.setTimeout(() => {
      if (!confirmedReadyRef.current) setStuckSourceId(id);
    }, STUCK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [selectedSource?.id, selectedSource?.capabilities.events]);

  const openSource = useCallback(() => setSourceOpened(true), []);

  const notifications = useMemo<PlayerNotification[]>(() => {
    const list: PlayerNotification[] = [];
    if (nativeError) {
      list.push({
        id: "native-error",
        message: nativeError,
        actionLabel: "Switch Server",
        onAction: openSource,
        tone: "danger",
        dismissible: false,
      });
    }
    if (stuckVisible) {
      list.push({
        id: "stuck",
        message:
          "This provider loaded but cannot confirm playback. If the video is stuck, choose another available server.",
        actionLabel: "Switch Server",
        onAction: openSource,
        tone: "warning",
      });
    }
    if (
      request.preferredSubtitle &&
      selectedSource &&
      selectedSource.capabilities.subtitles === "none"
    ) {
      list.push({
        id: "no-captions",
        message: `${selectedSource.label} has no captions. Choose a caption server.`,
        actionLabel: "Switch Server",
        onAction: openSource,
        tone: "warning",
      });
    }
    return list.filter((n) => !dismissedIds.has(n.id));
  }, [nativeError, stuckVisible, request.preferredSubtitle, selectedSource, dismissedIds, openSource]);

  const handleDismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
  }, []);

  const headerContext: PlayerShellHeaderContext = {
    selectedSourceId: selectedSource?.id ?? "",
    onOpenSource: openSource,
  };

  if (!mounted) return null;

  return createPortal(
    <div className="player-shell fixed inset-0 z-70 h-dvh w-full overflow-hidden bg-black">
      {selectedSource ? (
        selectedSource.kind === "iframe" ? (
          <iframe
            key={`${selectedSource.id}:${selectedSource.url}`}
            src={selectedSource.url}
            allowFullScreen
            allow={selectedSource.capabilities.iframe?.allow}
            referrerPolicy={selectedSource.capabilities.iframe?.referrerPolicy}
            title={`${selectedSource.label} player`}
            className="absolute inset-0 h-full w-full border-0"
          />
        ) : (
          <NativePlayer
            key={`${selectedSource.id}:${selectedSource.url}`}
            source={selectedSource}
            src={selectedSource.url}
            startAt={events.currentTime || request.startAt}
            onReady={() => setConfirmedReadySourceId(selectedSource.id)}
            onError={(message) => setNativeErrorState({ sourceId: selectedSource.id, message })}
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
        onClose={() => setSourceOpened(false)}
        sources={sources}
        selectedSourceId={selectedSource?.id ?? ""}
        onSelect={(id) => void setSourceParam(id)}
      />
    </div>,
    document.body,
  );
}
