"use client";

import { useEffect, useRef, useState } from "react";
import type { StreamCandidate } from "@/lib/sources/types";

interface Props {
  candidates: StreamCandidate[];
  onProgress?: (positionSec: number, durationSec: number) => void;
}

export function Player({ candidates, onProgress }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [index, setIndex] = useState(0);
  const [failed, setFailed] = useState<Set<string>>(new Set());

  const current = candidates[index];
  const exhausted = failed.size >= candidates.length;

  // Walk to the next candidate the user hasn't already burned through.
  const advance = () => {
    setFailed((prev) => {
      const next = new Set(prev);
      if (current) next.add(current.id);
      return next;
    });
    setIndex((i) => (i + 1 < candidates.length ? i + 1 : i));
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !current || current.kind === "iframe") return;

    let hls: { destroy(): void } | null = null;
    let cancelled = false;

    const attach = async () => {
      if (current.kind === "mp4" || video.canPlayType("application/vnd.apple.mpegurl")) {
        // Safari plays HLS natively; everything else needs the mp4 path here.
        video.src = current.url;
        return;
      }

      const { default: Hls } = await import("hls.js");
      if (cancelled) return;

      if (!Hls.isSupported()) {
        video.src = current.url;
        return;
      }

      const instance = new Hls({ enableWorker: true });
      hls = instance;
      instance.loadSource(current.url);
      instance.attachMedia(video);
      instance.on(Hls.Events.ERROR, (_e, data) => {
        // Only fatal errors are worth failing over; hls.js recovers from
        // the rest on its own and a hair-trigger switch makes playback worse.
        if (data.fatal) advance();
      });
    };

    void attach();

    return () => {
      cancelled = true;
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onProgress) return;

    const report = () => {
      if (video.duration > 0) onProgress(video.currentTime, video.duration);
    };
    video.addEventListener("pause", report);
    video.addEventListener("ended", report);
    return () => {
      report();
      video.removeEventListener("pause", report);
      video.removeEventListener("ended", report);
    };
  }, [onProgress]);

  if (candidates.length === 0 || exhausted) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface-1)]">
        <p className="text-sm text-[var(--color-fg-muted)]">
          {candidates.length === 0 ? "No sources available." : "All sources failed."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-black">
        {current.kind === "iframe" ? (
          <iframe
            src={current.url}
            allowFullScreen
            className="aspect-video w-full"
            referrerPolicy="origin"
            sandbox="allow-scripts allow-same-origin allow-presentation"
          />
        ) : (
          <video
            ref={videoRef}
            controls
            playsInline
            onError={advance}
            className="aspect-video w-full bg-black"
          >
            {current.subtitleTracks?.map((t) =>
              t.url ? (
                <track
                  key={t.id}
                  kind="subtitles"
                  src={t.url}
                  srcLang={t.language}
                  label={t.label}
                  default={t.isDefault}
                />
              ) : null,
            )}
          </video>
        )}
      </div>

      {candidates.length > 1 && (
        <label className="flex items-center gap-3 text-sm">
          <span className="text-[var(--color-fg-muted)]">Server</span>
          <select
            value={current.id}
            onChange={(e) => setIndex(candidates.findIndex((c) => c.id === e.target.value))}
            className="rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-surface-2)] px-3 py-1.5 text-[var(--color-fg)]"
          >
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
                {failed.has(c.id) ? " (failed)" : ""}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
}
