"use client";

import PlayerPanel from "@/components/player/PlayerPanel";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import type { PlayerSource } from "@/lib/sources/types";
import { cn } from "@/utils/helpers";
import { Check, Rocket, Star } from "@/utils/icons";
import { useMediaQuery } from "@mantine/hooks";

export interface PlayerSourceSheetProps {
  opened: boolean;
  onClose: () => void;
  sources: PlayerSource[];
  selectedSourceId: string;
  switchingSourceId?: string | null;
  hasPreference?: boolean;
  onResetPreference?: () => void;
  /** The parent commits the iframe swap before dismissing this overlay. */
  onSelect: (sourceId: string) => Promise<void> | void;
}

export default function PlayerSourceSheet({
  opened,
  onClose,
  sources,
  selectedSourceId,
  switchingSourceId,
  hasPreference,
  onResetPreference,
  onSelect,
}: PlayerSourceSheetProps) {
  // Do not mount Vaul's modal drawer on desktop. Hiding an open drawer with
  // CSS still leaves its focus/pointer lock active on <body>, which makes the
  // visible desktop panel look interactive while swallowing every click.
  const isDesktop = useMediaQuery("(min-width: 768px)", false, {
    getInitialValueInEffect: false,
  });

  const sourceOption = (source: PlayerSource) => {
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
        <span
          className={cn(
            "size-[7px] rounded-full",
            isSelected
              ? "bg-primary"
              : source.providerTier === "stable"
                ? "bg-success"
                : "bg-warning",
          )}
        />
        <span className="flex min-w-0 flex-col gap-0.5">
          <span className="truncate text-[13.5px] font-medium text-white">{source.label}</span>
          <span className="truncate text-[11px] text-white/48">
            {[
              source.capabilities.recommended && "Recommended",
              source.capabilities.fast && "Fast",
              source.capabilities.subtitles === "native" && "Captions",
              source.audioVariant === "sub" && "Sub",
              source.audioVariant === "dub" && "Dub",
              source.capabilities.ads && "May contain ads",
            ]
              .filter(Boolean)
              .join(" · ") ||
              (source.providerTier === "stable" ? "Stable provider" : "Backup provider")}
          </span>
        </span>
        <span className="flex min-w-[66px] items-center justify-end gap-2 text-[9.5px] font-medium tracking-[.08em] text-white/45 uppercase">
          {isSwitching
            ? "Switching"
            : isSelected
              ? "Selected"
              : source.providerTier === "stable"
                ? "Stable"
                : "Backup"}
          {isSelected && <Check aria-hidden size={12} className="text-primary" />}
        </span>
      </button>
    );
  };

  const renderSourceGroups = () => {
    const hasAudioGroups = sources.some((source) => source.audioVariant);
    const groups = hasAudioGroups
      ? [
          {
            label: "Sub servers",
            sources: sources.filter((source) => source.audioVariant === "sub"),
          },
          {
            label: "Dub servers",
            sources: sources.filter((source) => source.audioVariant === "dub"),
          },
        ]
      : [{ label: "Video servers", sources }];

    return groups
      .filter((group) => group.sources.length > 0)
      .map((group) => (
        <section key={group.label} className="flex flex-col gap-2.5" aria-label={group.label}>
          {hasAudioGroups && (
            <h3 className="px-1 text-[11px] font-semibold tracking-[.12em] text-white/55 uppercase">
              {group.label}
            </h3>
          )}
          <div className="flex flex-col gap-2.5" role="radiogroup" aria-label={group.label}>
            {group.sources.map(sourceOption)}
          </div>
        </section>
      ));
  };

  const resetPreference = hasPreference && onResetPreference && (
    <button
      type="button"
      onClick={onResetPreference}
      className="min-h-11 rounded-xl border border-white/10 px-3 text-xs font-semibold text-white/70 transition hover:border-white/20 hover:text-white focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none"
    >
      Reset to recommended
    </button>
  );

  const content = (
    <div className="flex flex-col gap-4">
      {renderSourceGroups()}
      {resetPreference}
    </div>
  );

  if (isDesktop) {
    return (
      <PlayerPanel open={opened} onClose={onClose} title="Select a source">
        {content}
      </PlayerPanel>
    );
  }

  return (
    <VaulDrawer
      open={opened}
      onClose={onClose}
      backdrop="blur"
      title="Select Video Server"
      direction="bottom"
      hiddenHandler
      withCloseButton
    >
      <div className="flex max-h-[72dvh] flex-col gap-4 overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <div className="grid grid-cols-2 gap-2 px-1 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Star className="text-warning-500" size={14} />
            <span>Recommended</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Rocket className="text-danger-500" size={14} />
            <span>Fast hosting</span>
          </div>
        </div>
        {content}
      </div>
    </VaulDrawer>
  );
}
