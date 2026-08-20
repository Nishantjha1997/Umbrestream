"use client";

import { cn } from "@/utils/helpers";

type PlayerDisplayMode = "fit" | "fill";

interface PlayerDisplayModeToggleProps {
  displayMode: PlayerDisplayMode;
  canUseFillMode: boolean;
  onChooseDisplayMode: (mode: PlayerDisplayMode) => void;
  className?: string;
}

/**
 * Shared framing control for every StreamFree player surface.
 *
 * A cross-origin iframe is a complete provider document, not a video element.
 * Scaling it would also crop and enlarge the provider's controls, so Fill is
 * deliberately available only for native video sources where object-fit can
 * change the picture without transforming the control surface.
 */
export default function PlayerDisplayModeToggle({
  displayMode,
  canUseFillMode,
  onChooseDisplayMode,
  className,
}: PlayerDisplayModeToggleProps) {
  return (
    <div
      className={cn(
        "player-display-toggle flex min-h-11 overflow-hidden rounded-full border border-white/10 bg-white/5",
        className,
      )}
      role="group"
      aria-label="Video framing"
    >
      {(["fit", "fill"] as const).map((mode) => {
        const disabled = mode === "fill" && !canUseFillMode;
        const unavailableLabel =
          "Fill is unavailable for this embedded server because it would crop the server controls";

        return (
          <button
            key={mode}
            type="button"
            onClick={() => onChooseDisplayMode(mode)}
            disabled={disabled}
            title={disabled ? unavailableLabel : undefined}
            aria-label={disabled ? unavailableLabel : `${mode === "fit" ? "Fit" : "Fill"} video`}
            aria-pressed={displayMode === mode}
            className={cn(
              "min-h-11 min-w-11 px-3 text-xs font-semibold transition focus-visible:z-10 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none",
              displayMode === mode
                ? "bg-white text-black"
                : "text-white/75 hover:bg-white/10 hover:text-white",
              disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-white/75",
            )}
          >
            {mode === "fit" ? "Fit" : "Fill"}
          </button>
        );
      })}
    </div>
  );
}
