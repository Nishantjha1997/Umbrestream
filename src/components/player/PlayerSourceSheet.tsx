"use client";

/**
 * Shared Movie/TV/Anime server picker. Phone uses a bottom sheet and desktop
 * uses the centred player panel, but both render the same native button list.
 * Keeping the selection path on plain buttons avoids press/gesture arbitration
 * between a component-library radio group and Vaul's draggable surface.
 */

import PlayerPanel from "@/components/player/PlayerPanel";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import { useServerHealth, type ServerHealthStatus } from "@/hooks/useServerHealth";
import type { PlayerSource } from "@/lib/sources/types";
import type { PlayersProps } from "@/types";
import { cn } from "@/utils/helpers";
import { Check, Clock, Rocket, Star } from "@/utils/icons";
import { useMemo } from "react";

export interface PlayerSourceSheetProps {
  opened: boolean;
  onClose: () => void;
  sources: PlayerSource[];
  selectedSourceId: string;
  switchingSourceId?: string | null;
  /** The parent commits the iframe swap before dismissing this overlay. */
  onSelect: (sourceId: string) => Promise<void> | void;
}

const HEALTH_LABEL: Record<ServerHealthStatus, string> = {
  checking: "Testing...",
  online: "Online",
  slow: "Slow",
  offline: "Offline",
};

const HEALTH_DOT: Record<ServerHealthStatus, string> = {
  checking: "bg-default-400",
  online: "bg-success",
  slow: "bg-warning",
  offline: "bg-danger",
};

export default function PlayerSourceSheet({
  opened,
  onClose,
  sources,
  selectedSourceId,
  switchingSourceId,
  onSelect,
}: PlayerSourceSheetProps) {
  const players: PlayersProps[] = useMemo(
    () =>
      sources.map((source) => ({
        title: source.label,
        source: source.url as `https://${string}`,
        recommended: source.capabilities.recommended,
        fast: source.capabilities.fast,
        ads: source.capabilities.ads,
        resumable: source.capabilities.resumable,
      })),
    [sources],
  );
  const healthMap = useServerHealth(players, opened);

  const sourceOptions = sources.map((source, index) => {
    const health = healthMap[index] || "checking";
    const isSelected = source.id === selectedSourceId;
    const isSwitching = source.id === switchingSourceId;

    return (
      <button
        key={source.id}
        type="button"
        role="radio"
        aria-checked={isSelected}
        onPointerDown={(event) => event.stopPropagation()}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          void onSelect(source.id);
        }}
        className={cn(
          "grid min-h-14 w-full touch-manipulation grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[13px] border p-3.5 text-left transition-[background-color,border-color,transform] duration-200 active:scale-[.985]",
          isSelected
            ? "border-primary/45 bg-primary/15"
            : "border-white/8 bg-white/[0.025] hover:border-white/18 hover:bg-white/[0.055]",
          "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-hidden",
        )}
      >
        <span className={cn("size-[7px] rounded-full", HEALTH_DOT[health])} />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[13.5px] font-medium text-white">{source.label}</span>
          <span className="truncate text-[11px] text-white/48">
            {[
              source.capabilities.recommended && "Recommended",
              source.capabilities.fast && "Fast",
              source.capabilities.subtitles === "native" && "Captions",
              source.audioVariant === "sub" && "Subbed",
              source.audioVariant === "dub" && "Dubbed",
            ]
              .filter(Boolean)
              .join(" · ") || "Available"}
          </span>
        </span>
        <span className="flex min-w-[66px] items-center justify-end gap-2 text-[9.5px] font-medium tracking-[.08em] text-white/45 uppercase">
          {isSwitching ? "Switching" : isSelected ? "Selected" : HEALTH_LABEL[health]}
          {isSelected && <Check aria-hidden size={12} className="text-primary" />}
        </span>
      </button>
    );
  });

  return (
    <>
      <VaulDrawer
        open={opened}
        onClose={onClose}
        backdrop="blur"
        title="Select Video Server"
        direction="bottom"
        hiddenHandler
        withCloseButton
        classNames={{ contentWrapper: "md:hidden", overlay: "md:hidden" }}
      >
        <div className="flex max-h-[72dvh] flex-col gap-4 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="grid grid-cols-2 gap-2 px-1 py-2 text-xs">
            <div className="flex items-center gap-1.5">
              <Star className="text-warning-500" size={14} />
              <span>Recommended</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Rocket className="text-danger-500" size={14} />
              <span>Fast Hosting</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="text-success-500" size={14} />
              <span>Auto Progress</span>
            </div>
          </div>

          <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Video servers">
            {sourceOptions}
          </div>
        </div>
      </VaulDrawer>

      <PlayerPanel open={opened} onClose={onClose} title="Select a source">
        <div className="flex flex-col gap-2.5" role="radiogroup" aria-label="Video servers">
          {sourceOptions}
        </div>
      </PlayerPanel>
    </>
  );
}
