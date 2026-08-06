"use client";

import type { PlayerSource } from "@/lib/sources/types";
import type { PlayerEventType } from "@/hooks/usePlayerEvents";
import { useEffect, useRef, useState } from "react";

interface NativePlayerProps {
  source: PlayerSource;
  src: string;
  startAt?: number;
  onReady: () => void;
  onError: (reason: string) => void;
  onEvent: (event: PlayerEventType, currentTime: number, duration: number) => void;
}

interface SelectOption {
  value: number;
  label: string;
}

export default function NativePlayer({
  source,
  src,
  startAt = 0,
  onReady,
  onError,
  onEvent,
}: NativePlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<import("hls.js").default | null>(null);
  const [qualityOptions, setQualityOptions] = useState<SelectOption[]>([]);
  const [audioOptions, setAudioOptions] = useState<SelectOption[]>([]);
  const [quality, setQuality] = useState(-1);
  const [audioTrack, setAudioTrack] = useState(-1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    let cancelled = false;
    let dashPlayer: ReturnType<ReturnType<typeof import("dashjs").MediaPlayer>["create"]> | null =
      null;

    const load = async () => {
      if (source.kind === "mp4") {
        video.src = src;
        return;
      }

      if (source.kind === "hls") {
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = src;
          return;
        }
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (!Hls.isSupported()) {
          onError("HLS is not supported by this browser");
          return;
        }
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false });
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
          setQualityOptions([
            { value: -1, label: "Auto" },
            ...data.levels.map((level, index) => ({
              value: index,
              label: level.height ? `${level.height}p` : `Quality ${index + 1}`,
            })),
          ]);
        });
        hls.on(Hls.Events.AUDIO_TRACKS_UPDATED, (_event, data) => {
          setAudioOptions(
            data.audioTracks.map((track, index) => ({
              value: index,
              label: track.name || track.lang || `Audio ${index + 1}`,
            })),
          );
        });
        hls.on(Hls.Events.ERROR, (_event, data) => {
          if (data.fatal) onError(`HLS playback failed: ${data.details}`);
        });
        hls.attachMedia(video);
        hls.loadSource(src);
        return;
      }

      const dashjs = await import("dashjs");
      if (cancelled) return;
      dashPlayer = dashjs.MediaPlayer().create();
      dashPlayer.on(dashjs.MediaPlayer.events.ERROR, () => onError("DASH playback failed"));
      dashPlayer.initialize(video, src, false);
    };

    void load().catch((error) =>
      onError(error instanceof Error ? error.message : "Native player failed to initialize"),
    );

    return () => {
      cancelled = true;
      hlsRef.current?.destroy();
      hlsRef.current = null;
      dashPlayer?.destroy();
      video.removeAttribute("src");
      video.load();
    };
  }, [onError, source.kind, src]);

  useEffect(() => {
    if (hlsRef.current) hlsRef.current.currentLevel = quality;
  }, [quality]);

  useEffect(() => {
    if (hlsRef.current && audioTrack >= 0) hlsRef.current.audioTrack = audioTrack;
  }, [audioTrack]);

  const report = (event: PlayerEventType) => {
    const video = videoRef.current;
    if (video)
      onEvent(event, video.currentTime, Number.isFinite(video.duration) ? video.duration : 0);
  };

  return (
    <div className="relative z-10 h-full w-full bg-black">
      <video
        ref={videoRef}
        controls
        playsInline
        preload="metadata"
        className="h-full w-full bg-black object-contain"
        onLoadedMetadata={(event) => {
          if (startAt > 5 && startAt < event.currentTarget.duration - 5) {
            event.currentTarget.currentTime = startAt;
          }
        }}
        onCanPlay={onReady}
        onPlay={() => report("play")}
        onPause={() => report("pause")}
        onSeeked={() => report("seeked")}
        onEnded={() => report("ended")}
        onTimeUpdate={() => report("timeupdate")}
        onError={() => onError("Browser media error")}
      >
        {source.subtitleTracks?.map((track) =>
          track.url ? (
            <track
              key={track.id}
              kind="subtitles"
              src={track.url}
              srcLang={track.language}
              label={track.label}
              default={track.isDefault}
            />
          ) : null,
        )}
      </video>

      {(qualityOptions.length > 2 || audioOptions.length > 1) && (
        <div className="absolute top-[max(4.5rem,env(safe-area-inset-top))] right-3 flex gap-2 rounded-lg bg-black/75 p-2 text-xs text-white backdrop-blur">
          {qualityOptions.length > 2 && (
            <label className="flex items-center gap-1">
              <span className="sr-only">Quality</span>
              <select
                aria-label="Video quality"
                value={quality}
                onChange={(event) => setQuality(Number(event.target.value))}
                className="rounded bg-black/60 px-2 py-1"
              >
                {qualityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          {audioOptions.length > 1 && (
            <label className="flex items-center gap-1">
              <span className="sr-only">Audio track</span>
              <select
                aria-label="Audio track"
                value={audioTrack}
                onChange={(event) => setAudioTrack(Number(event.target.value))}
                className="rounded bg-black/60 px-2 py-1"
              >
                {audioOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>
      )}
    </div>
  );
}
