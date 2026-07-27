"use client";

import React, { useState, useEffect } from "react";
import { Button, Card } from "@heroui/react";
import { Server, Close } from "@/utils/icons";
import { cn } from "@/utils/helpers";

interface StuckStreamToastProps {
  onOpenSource: () => void;
  delayMs?: number;
}

export const StuckStreamToast: React.FC<StuckStreamToastProps> = ({
  onOpenSource,
  delayMs = 6000,
}) => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;

    const timer = setTimeout(() => {
      setVisible(true);
    }, delayMs);

    return () => clearTimeout(timer);
  }, [delayMs, dismissed]);

  if (!visible || dismissed) return null;

  return (
    <div className="absolute top-16 right-4 z-50 animate-in fade-in slide-in-from-top-4 duration-300 max-w-sm">
      <Card className="bg-background/90 backdrop-blur-md border border-primary/40 shadow-2xl p-3 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-warning font-semibold text-xs">
            <Server className="animate-pulse" size={16} />
            <span>Slow or Stuck Stream?</span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-default-400 hover:text-foreground transition-colors p-1"
            aria-label="Dismiss"
          >
            <Close size={18} />
          </button>
        </div>

        <p className="text-[11px] text-default-300 leading-tight">
          If the video buffering spinner is taking longer than usual, try switching to another fast online server!
        </p>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button
            size="sm"
            variant="flat"
            color="default"
            className="h-7 text-xs px-2"
            onPress={() => setDismissed(true)}
          >
            Dismiss
          </Button>
          <Button
            size="sm"
            color="primary"
            className="h-7 text-xs px-3 font-medium shadow-md shadow-primary/20"
            startContent={<Server size={14} />}
            onPress={() => {
              setDismissed(true);
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
