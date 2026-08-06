"use client";

import PlayerSourceSelection from "@/components/player/PlayerSourceSelection";
import NativePlayer from "@/components/player/NativePlayer";
import StuckStreamToast from "@/components/ui/overlay/StuckStreamToast";
import { usePlayerEngine } from "@/hooks/usePlayerEngine";
import { usePlayerEvents } from "@/hooks/usePlayerEvents";
import { usePlayerChromeVisibility } from "@/hooks/usePlayerChromeVisibility";
import type { SourceRequest } from "@/lib/sources/types";
import type { PlayersProps } from "@/types";
import { cn } from "@/utils/helpers";
import { SpacingClasses } from "@/utils/constants";
import { Button, Card, Skeleton, type ButtonProps } from "@heroui/react";
import { useDisclosure } from "@mantine/hooks";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export interface PlayerHeaderContext {
  hidden: boolean;
  selectedSourceId: string;
  onOpenSource: () => void;
  fullscreen: boolean;
  onToggleFullscreen: () => void;
}

interface ReliablePlayerProps {
  request: SourceRequest;
  legacyPlayers: PlayersProps[];
  color: ButtonProps["color"];
  historyMetadata?: { season?: number; episode?: number };
  renderHeader: (context: PlayerHeaderContext) => ReactNode;
  renderExtras?: (context: PlayerHeaderContext) => ReactNode;
}

export default function ReliablePlayer({
  request,
  legacyPlayers,
  color,
  historyMetadata,
  renderHeader,
  renderExtras,
}: ReliablePlayerProps) {
  const [sourceOpened, sourceHandlers] = useDisclosure(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [cinemaMode, setCinemaMode] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  // A fullscreen player should become visually quiet after the normal idle
  // delay. Only an open drawer pins the chrome; fullscreen itself must not keep
  // Umbra's controls over the provider's captions/settings buttons.
  const chrome = usePlayerChromeVisibility(sourceOpened, 3_000);
  const events = usePlayerEvents({
    saveHistory: true,
    metadata: historyMetadata,
    // The frame is never trusted to say what it is playing — see PlayerEventIdentity.
    identity: {
      mediaId: request.tmdbId ?? request.anilistId ?? "",
      mediaType: request.mediaType,
      season: request.season,
      episode: request.episode,
    },
  });
  const engine = usePlayerEngine({ request, legacyPlayers, currentTime: events.currentTime });
  const handledEventVersionRef = useRef(0);
  const { failCurrent, markPlaybackReady } = engine;
  const { setAllowedOrigin } = events;

  // Narrow the postMessage allowlist to the provider actually on screen. `engine`
  // has to be constructed after `events` (it consumes events.currentTime), so the
  // origin is pushed in rather than passed as an option.
  useEffect(() => {
    setAllowedOrigin(engine.selectedSource?.providerOrigin ?? null);
  }, [engine.selectedSource?.providerOrigin, setAllowedOrigin]);

  useEffect(() => {
    if (handledEventVersionRef.current >= events.eventVersion) return;
    handledEventVersionRef.current = events.eventVersion;
    if (events.lastEventOrigin !== engine.selectedSource?.providerOrigin) return;
    if (events.lastEvent === "play" || events.lastEvent === "timeupdate") {
      markPlaybackReady();
    }
    if (events.lastEvent === "error") {
      failCurrent("Provider reported playback error");
    }
  }, [
    engine.selectedSource?.providerOrigin,
    events.eventVersion,
    events.lastEvent,
    events.lastEventOrigin,
    failCurrent,
    markPlaybackReady,
  ]);

  const toggleFullscreen = useCallback(async () => {
    const shell = shellRef.current;
    if (!shell) return;

    if (cinemaMode) {
      setCinemaMode(false);
      return;
    }

    const webkitDocument = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void> | void;
    };
    const activeElement = document.fullscreenElement ?? webkitDocument.webkitFullscreenElement;

    if (activeElement === shell) {
      if (document.exitFullscreen) await document.exitFullscreen().catch(() => undefined);
      else if (webkitDocument.webkitExitFullscreen) await webkitDocument.webkitExitFullscreen();
      else setCinemaMode(false);
      return;
    }

    // iPhone Safari exposes fullscreen on the video element rather than on an
    // arbitrary container. Prefer that native path for authorized direct media.
    const video = shell.querySelector("video") as
      | (HTMLVideoElement & {
          webkitEnterFullscreen?: () => void;
        })
      | null;
    if (video?.webkitEnterFullscreen && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      video.webkitEnterFullscreen();
      return;
    }

    if (shell.requestFullscreen) {
      try {
        await shell.requestFullscreen({ navigationUI: "hide" });
        return;
      } catch {
        // Safari iframe/container fullscreen can reject; use the in-page
        // cinema mode so the user still gets a usable full-screen layout.
      }
    }

    setCinemaMode((current) => !current);
  }, [cinemaMode]);

  useEffect(() => {
    const sync = () => {
      const webkitDocument = document as Document & { webkitFullscreenElement?: Element | null };
      const active = document.fullscreenElement ?? webkitDocument.webkitFullscreenElement;
      setFullscreen(active === shellRef.current);
      if (active !== shellRef.current) setCinemaMode(false);
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener("webkitfullscreenchange", sync as EventListener);
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener("webkitfullscreenchange", sync as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!cinemaMode) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [cinemaMode]);

  const context: PlayerHeaderContext = {
    // Keep server and episode controls visible during normal playback. Fullscreen
    // still uses the idle chrome behavior so provider controls stay clear.
    hidden: chrome.hidden && (fullscreen || cinemaMode),
    selectedSourceId: engine.selectedSourceId,
    onOpenSource: sourceHandlers.open,
    fullscreen: fullscreen || cinemaMode,
    onToggleFullscreen: () => void toggleFullscreen(),
  };

  return (
    <>
      <div
        ref={shellRef}
        className={cn(
          "player-shell relative overflow-hidden bg-black",
          SpacingClasses.reset,
          cinemaMode && "player-cinema-mode",
        )}
        onPointerMove={chrome.reveal}
        onPointerDown={chrome.reveal}
        onKeyDown={chrome.reveal}
      >
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-linear-to-b from-black/85 via-black/30 to-transparent transition-opacity duration-300 motion-reduce:transition-none",
            chrome.hidden && "opacity-0",
          )}
        />
        <div
          className={cn(
            "pointer-events-none absolute inset-x-0 bottom-0 z-20 h-24 bg-linear-to-t from-black/70 to-transparent transition-opacity duration-300 motion-reduce:transition-none",
            chrome.hidden && "opacity-0",
          )}
        />

        <StuckStreamToast
          key={engine.playbackUrl ?? engine.selectedSourceId}
          sourceId={engine.selectedSourceId}
          status={engine.selectedStatus}
          delayMs={12_000}
          onOpenSource={sourceHandlers.open}
        />

        {/* The callback accesses fullscreen refs only after a user gesture. */}
        {/* eslint-disable-next-line react-hooks/refs */}
        {renderHeader(context)}

        <Card shadow="md" radius="none" className="relative h-svh min-h-[320px] bg-black">
          <Skeleton className="absolute h-full w-full" />
          {engine.playbackUrl && engine.selectedSource ? (
            engine.selectedSource.kind === "iframe" ? (
              <iframe
                allowFullScreen
                allow={engine.selectedSource.capabilities.iframe?.allow}
                referrerPolicy={engine.selectedSource.capabilities.iframe?.referrerPolicy}
                key={`${engine.selectedSource.id}:${engine.playbackUrl}`}
                src={engine.playbackUrl}
                title={`${engine.selectedSource.label} player`}
                onLoad={engine.markFrameLoaded}
                onError={() => engine.failCurrent("Iframe network error")}
                className="z-10 h-full w-full border-none"
              />
            ) : (
              <NativePlayer
                key={`${engine.selectedSource.id}:${engine.playbackUrl}`}
                source={engine.selectedSource}
                src={engine.playbackUrl}
                startAt={events.currentTime || request.startAt}
                onReady={engine.markPlaybackReady}
                onError={engine.failCurrent}
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
            <div className="relative z-10 flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <h3 className="text-lg font-semibold">No playable source found</h3>
              <p className="text-default-400 max-w-md text-sm">
                {engine.resolutionError ?? "Every available provider failed for this title."}
              </p>
              <Button color={color} onPress={sourceHandlers.open}>
                Review servers
              </Button>
            </div>
          )}
        </Card>

        {engine.exhausted && (
          <div className="bg-danger/90 player-safe-bottom absolute left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl px-4 py-2 text-center text-sm text-white shadow-lg">
            Every server was tried. Choose a server manually or try again later.
          </div>
        )}

        {request.preferredSubtitle &&
          engine.selectedSource?.capabilities.subtitles === "none" &&
          !engine.exhausted && (
            <button
              type="button"
              onClick={sourceHandlers.open}
              className="bg-warning/95 player-safe-bottom absolute left-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 rounded-xl px-4 py-2 text-sm font-medium text-black shadow-lg"
            >
              {engine.selectedSource.label} has no captions. Choose a caption server.
            </button>
          )}
      </div>

      <PlayerSourceSelection
        opened={sourceOpened}
        onClose={sourceHandlers.close}
        mediaType={request.mediaType}
        color={color}
        sources={engine.sources}
        statuses={engine.statuses}
        selectedSourceId={engine.selectedSourceId}
        onSelect={engine.selectSource}
        resolving={engine.resolving}
        preferredSubtitle={request.preferredSubtitle}
      />

      {/* eslint-disable-next-line react-hooks/refs */}
      {renderExtras?.(context)}
    </>
  );
}
