"use client";

/**
 * The server picker, shared by Movie/TV/Anime (Phase 6, §10). One component
 * with two renderings rather than two components: phone gets `VaulDrawer`'s
 * bottom sheet (the exact list UI TV's `SourceSelection.tsx` already shipped
 * and proved out), desktop gets `PlayerPanel`'s centred card
 * (`DESKTOP_SPEC.md` §I — desktop has no drawers at all). Both are always in
 * the DOM, `md:hidden` / `hidden md:flex`, so there is no "wrong sheet"
 * flash — the same technique `ImmersiveAppShell` uses for the nav shell.
 *
 * Health comes from `useServerHealth`, a plain URL ping with no dependency
 * on the old `usePlayerEngine` — it already worked this way for TV.
 */

import PlayerPanel from "@/components/player/PlayerPanel";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import SelectButton from "@/components/ui/input/SelectButton";
import { useServerHealth, type ServerHealthStatus } from "@/hooks/useServerHealth";
import type { PlayerSource } from "@/lib/sources/types";
import type { PlayersProps } from "@/types";
import { cn } from "@/utils/helpers";
import { Clock, Rocket, Star } from "@/utils/icons";
import { useMemo } from "react";

export interface PlayerSourceSheetProps {
  opened: boolean;
  onClose: () => void;
  sources: PlayerSource[];
  selectedSourceId: string;
  /** Resolves only after the player has accepted the new source. The parent
   * owns closing the sheet so its overlay remains above the iframe during
   * the complete click/update sequence. */
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

  return (
    <>
      <VaulDrawer
        open={opened}
        onClose={onClose}
        backdrop="blur"
        title="Select Video Server"
        direction="right"
        hiddenHandler
        withCloseButton
        classNames={{ contentWrapper: "md:hidden", overlay: "md:hidden" }}
      >
        <div className="flex flex-col gap-4 p-5">
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

          <SelectButton
            color="primary"
            groupType="list"
            value={selectedSourceId}
            onChange={(value) => {
              if (value) void onSelect(value);
            }}
            data={sources.map((source, index) => {
              const health = healthMap[index] || "checking";
              return {
                label: source.label,
                value: source.id,
                endContent: (
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                        "border-white/15 bg-white/5 text-white/70",
                      )}
                    >
                      {HEALTH_LABEL[health]}
                    </span>
                    {source.capabilities.recommended && (
                      <Star className="text-warning" size={16} />
                    )}
                    {source.capabilities.fast && <Rocket className="text-danger" size={16} />}
                    {source.capabilities.resumable && <Clock className="text-success" size={16} />}
                  </div>
                ),
              };
            })}
          />
        </div>
      </VaulDrawer>

      <PlayerPanel open={opened} onClose={onClose} title="Select a source">
        <div className="flex flex-col gap-2.5">
          {sources.map((source, index) => {
            const health = healthMap[index] || "checking";
            const isSelected = source.id === selectedSourceId;
            return (
              <button
                key={source.id}
                type="button"
                onPointerDown={(event) => {
                  // Keep an iframe below the panel from seeing a pointer
                  // sequence while a source selection is in progress.
                  event.stopPropagation();
                }}
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  void onSelect(source.id);
                }}
                className={cn(
                  "grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-[13px] border p-3.5 text-left transition-colors",
                  isSelected
                    ? "border-accent/30 bg-accent/10"
                    : "border-white/8 bg-white/[0.02] hover:border-white/15",
                  "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-hidden",
                )}
              >
                <span className={cn("size-[7px] rounded-full", HEALTH_DOT[health])} />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-[13.5px] font-medium text-white">{source.label}</span>
                  <span className="text-[11px] text-white/42">
                    {[
                      source.capabilities.recommended && "Recommended",
                      source.capabilities.fast && "Fast",
                      source.capabilities.subtitles === "native" && "Captions",
                    ]
                      .filter(Boolean)
                      .join(" · ") || "Available"}
                  </span>
                </span>
                <span className="text-[9.5px] font-medium tracking-[.1em] text-white/40 uppercase">
                  {HEALTH_LABEL[health]}
                </span>
              </button>
            );
          })}
        </div>
      </PlayerPanel>
    </>
  );
}
