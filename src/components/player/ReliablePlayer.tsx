"use client";

import PlayerSourceSelection from "@/components/player/PlayerSourceSelection";
import NativePlayer from "@/components/player/NativePlayer";
import AdsWarning from "@/components/ui/overlay/AdsWarning";
import StuckStreamToast from "@/components/ui/overlay/StuckStreamToast";
import useBreakpoints from "@/hooks/useBreakpoints";
import { usePlayerEngine } from "@/hooks/usePlayerEngine";
import { usePlayerEvents } from "@/hooks/usePlayerEvents";
import type { SourceRequest } from "@/lib/sources/types";
import type { PlayersProps } from "@/types";
import { cn } from "@/utils/helpers";
import { SpacingClasses } from "@/utils/constants";
import { Button, Card, Skeleton, type ButtonProps } from "@heroui/react";
import { useDisclosure, useIdle } from "@mantine/hooks";
import { useEffect, useRef, type ReactNode } from "react";

export interface PlayerHeaderContext {
  hidden: boolean;
  selectedSourceId: string;
  onOpenSource: () => void;
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
  const idle = useIdle(3000);
  const { mobile } = useBreakpoints();
  const [sourceOpened, sourceHandlers] = useDisclosure(false);
  const events = usePlayerEvents({ saveHistory: true, metadata: historyMetadata });
  const engine = usePlayerEngine({ request, legacyPlayers, currentTime: events.currentTime });
  const handledEventVersionRef = useRef(0);
  const { failCurrent, markPlaybackReady } = engine;

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

  const context: PlayerHeaderContext = {
    hidden: idle && !mobile,
    selectedSourceId: engine.selectedSourceId,
    onOpenSource: sourceHandlers.open,
  };

  return (
    <>
      <AdsWarning />

      <div className={cn("relative overflow-hidden bg-black", SpacingClasses.reset)}>
        <div className="absolute top-0 right-0 left-0 z-20 h-20" />

        <StuckStreamToast
          key={engine.playbackUrl ?? engine.selectedSourceId}
          sourceId={engine.selectedSourceId}
          status={engine.selectedStatus}
          delayMs={12_000}
          onOpenSource={sourceHandlers.open}
        />

        {renderHeader(context)}

        <Card shadow="md" radius="none" className="relative h-svh min-h-[320px] bg-black">
          <Skeleton className="absolute h-full w-full" />
          {engine.playbackUrl && engine.selectedSource ? (
            engine.selectedSource.kind === "iframe" ? (
              <iframe
                allowFullScreen
                allow={engine.selectedSource.capabilities.iframe?.allow}
                referrerPolicy={engine.selectedSource.capabilities.iframe?.referrerPolicy}
                sandbox={engine.selectedSource.capabilities.iframe?.sandbox}
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

      {renderExtras?.(context)}
    </>
  );
}
