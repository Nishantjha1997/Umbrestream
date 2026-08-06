"use client";

import React, { useState, useEffect } from "react";
import { Button, Card } from "@heroui/react";
import { Server, Close } from "@/utils/icons";
import type { SourceAvailability } from "@/lib/sources/types";

interface StuckStreamToastProps {
  onOpenSource: () => void;
  onAutoFallback?: () => void;
  autoFallback?: boolean;
  sourceId?: string;
  status?: SourceAvailability;
  delayMs?: number;
}

export const StuckStreamToast: React.FC<StuckStreamToastProps> = ({
  onOpenSource,
  onAutoFallback,
  autoFallback = false,
  sourceId,
  status = "unverified",
  delayMs = 12_000,
}) => {
  const [visibleSourceId, setVisibleSourceId] = useState<string | null>(null);
  const [dismissedSourceId, setDismissedSourceId] = useState<string | null>(null);
  const canOfferSwitch =
    Boolean(sourceId) &&
    status !== "available" &&
    status !== "ready" &&
    status !== "failed" &&
    status !== "resolving";

  useEffect(() => {
    if (!sourceId || !canOfferSwitch) return;

    const timer = setTimeout(() => {
      setVisibleSourceId(sourceId);
      if (autoFallback) onAutoFallback?.();
    }, delayMs);

    return () => clearTimeout(timer);
  }, [autoFallback, canOfferSwitch, delayMs, onAutoFallback, sourceId]);

  if (!canOfferSwitch || visibleSourceId !== sourceId || dismissedSourceId === sourceId)
    return null;

  return (
    <div className="player-safe-toast animate-in fade-in slide-in-from-top-4 absolute z-50 w-[calc(100%-1rem)] max-w-sm duration-300">
      <Card className="bg-background/90 border-primary/40 flex flex-col gap-2 border p-3 shadow-2xl backdrop-blur-md">
        <div className="flex items-start justify-between gap-2">
          <div className="text-warning flex items-center gap-2 text-xs font-semibold">
            <Server className="animate-pulse" size={16} />
            <span>{status === "slow" ? "Slow stream detected" : "Stream still loading?"}</span>
          </div>
          <button
            onClick={() => setDismissedSourceId(sourceId ?? null)}
            className="text-default-400 hover:text-foreground p-1 transition-colors"
            aria-label="Dismiss"
          >
            <Close size={18} />
          </button>
        </div>

        <p className="text-default-300 text-[11px] leading-tight">
          This provider loaded but cannot confirm playback. If the video is stuck, choose another
          available server.
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            size="sm"
            variant="flat"
            color="default"
            className="h-7 px-2 text-xs"
            onPress={() => setDismissedSourceId(sourceId ?? null)}
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            color="primary"
            className="shadow-primary/20 h-7 px-3 text-xs font-medium shadow-md"
            startContent={<Server size={14} />}
            onPress={() => {
              setDismissedSourceId(sourceId ?? null);
              onOpenSource();
            }}
          >
            Switch Server
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default StuckStreamToast;
