"use client";

import SelectButton from "@/components/ui/input/SelectButton";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import type { PlayerSource, SourceAvailability } from "@/lib/sources/types";
import type { HandlerType } from "@/types/component";
import { cn } from "@/utils/helpers";
import { Ads, Clock, Rocket, Star } from "@/utils/icons";
import type { ButtonProps } from "@heroui/react";

interface PlayerSourceSelectionProps extends HandlerType {
  mediaType: "movie" | "tv" | "anime";
  color: ButtonProps["color"];
  sources: PlayerSource[];
  statuses: Record<string, SourceAvailability>;
  selectedSourceId: string;
  onSelect: (id: string) => void;
  resolving: boolean;
  preferredSubtitle?: string;
}

const statusBadge: Record<SourceAvailability, { label: string; className: string }> = {
  resolving: { label: "Resolving", className: "bg-default/20 text-default-400 border-default/30" },
  loading: { label: "Loading", className: "bg-primary/20 text-primary border-primary/30" },
  ready: { label: "Ready", className: "bg-success/20 text-success border-success/30" },
  switching: { label: "Switching", className: "bg-primary/20 text-primary border-primary/30" },
  available: { label: "Available", className: "bg-success/20 text-success border-success/30" },
  slow: { label: "Slow", className: "bg-warning/20 text-warning border-warning/30" },
  unverified: {
    label: "Unverified",
    className: "bg-default/20 text-default-400 border-default/30",
  },
  failed: { label: "Failed", className: "bg-danger/20 text-danger border-danger/30" },
};

const subtitleBadge = {
  native: { label: "Captions", className: "bg-success/20 text-success border-success/30" },
  none: { label: "No captions", className: "bg-warning/20 text-warning border-warning/30" },
  unverified: {
    label: "Captions unverified",
    className: "bg-default/20 text-default-400 border-default/30",
  },
} as const;

function SourceList({
  sources,
  statuses,
  selectedSourceId,
  color,
  onSelect,
}: Pick<
  PlayerSourceSelectionProps,
  "sources" | "statuses" | "selectedSourceId" | "color" | "onSelect"
>) {
  if (!sources.length) return null;

  return (
    <SelectButton
      color={color}
      groupType="list"
      value={selectedSourceId}
      onChange={(value) => value && onSelect(value)}
      data={sources.map((source) => {
        const status = statuses[source.id] ?? source.availability;
        const badge = statusBadge[status];
        const captions = subtitleBadge[source.capabilities.subtitles ?? "unverified"];
        return {
          label: source.label,
          value: source.id,
          disabled: status === "failed",
          endContent: (
            <div className="flex flex-wrap items-center gap-2" key={`info-${source.id}`}>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  badge.className,
                )}
              >
                {badge.label}
              </span>
              <span
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[10px] font-medium",
                  captions.className,
                )}
              >
                {captions.label}
              </span>
              {source.providerTier === "experimental" && (
                <span className="border-warning/30 bg-warning/15 text-warning rounded-full border px-2 py-0.5 text-[10px] font-medium">
                  Experimental
                </span>
              )}
              {source.providerTier === "direct" && (
                <span className="border-secondary/30 bg-secondary/15 text-secondary rounded-full border px-2 py-0.5 text-[10px] font-medium">
                  Umbra Player
                </span>
              )}
              {source.capabilities.recommended && <Star className="text-warning" size={16} />}
              {source.capabilities.fast && <Rocket className="text-danger" size={16} />}
              {source.capabilities.resumable && <Clock className="text-success" size={16} />}
              {source.capabilities.ads && <Ads className="text-primary" size={16} />}
            </div>
          ),
        };
      })}
    />
  );
}

export default function PlayerSourceSelection({
  opened,
  onClose,
  mediaType,
  color,
  sources,
  statuses,
  selectedSourceId,
  onSelect,
  resolving,
  preferredSubtitle,
}: PlayerSourceSelectionProps) {
  const subbed = sources.filter((source) => source.audioVariant !== "dub");
  const dubbed = sources.filter((source) => source.audioVariant === "dub");
  const select = (id: string) => {
    onSelect(id);
    onClose();
  };

  return (
    <VaulDrawer
      open={opened}
      onClose={onClose}
      backdrop="blur"
      title={mediaType === "anime" ? "Select Anime Server" : "Select Video Server"}
      direction="right"
      hiddenHandler
      withCloseButton
      classNames={{ content: "space-y-0" }}
    >
      <div className="flex flex-col gap-4 p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
        {preferredSubtitle && (
          <p className="bg-success/10 text-success-700 border-success/20 dark:text-success-300 rounded-lg border p-3 text-xs">
            Caption-capable servers are preferred automatically. Subtitle availability can still
            vary by title.
          </p>
        )}

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
          <div className="flex items-center gap-1.5">
            <Ads className="text-primary-500" size={14} />
            <span>Popup Ads</span>
          </div>
        </div>

        {resolving && (
          <p className="text-default-400 px-1 text-xs">
            The player is ready. Loading any additional configured servers…
          </p>
        )}

        {!resolving && !sources.length && (
          <p className="text-default-400 border-default-200 rounded-lg border p-3 text-xs">
            No server is configured for this title.
          </p>
        )}

        {mediaType === "anime" && <h4 className="text-sm font-semibold">Subbed</h4>}
        {mediaType !== "anime" || subbed.length ? (
          <SourceList
            sources={mediaType === "anime" ? subbed : sources}
            statuses={statuses}
            selectedSourceId={selectedSourceId}
            color={color}
            onSelect={select}
          />
        ) : (
          <p className="text-default-400 border-default-200 rounded-lg border p-3 text-xs">
            No subtitled source is available for this episode.
          </p>
        )}

        {mediaType === "anime" && (
          <>
            <h4 className="mt-2 text-sm font-semibold">Dubbed</h4>
            {dubbed.length ? (
              <SourceList
                sources={dubbed}
                statuses={statuses}
                selectedSourceId={selectedSourceId}
                color={color}
                onSelect={select}
              />
            ) : (
              <p className="text-default-400 border-default-200 rounded-lg border p-3 text-xs">
                No dubbed source is available for this episode.
              </p>
            )}
          </>
        )}
      </div>
    </VaulDrawer>
  );
}
