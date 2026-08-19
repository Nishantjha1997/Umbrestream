"use client";

/**
 * The player's one notification slot (Phase 6, §10 / `PHONE_SPEC.md` §F row
 * 3). Finding 03 in `UI Analysis`: four systems used to place alerts
 * absolutely and independently — the exhausted-servers banner, the
 * no-captions prompt, and the old `StuckStreamToast` all shared
 * `.player-safe-bottom` and stacked on top of each other, and a media query
 * hid the one thing (the server switcher) a viewer needed exactly when a
 * stream died. This replaces all of that: callers pass a priority-ordered
 * list of candidates, and this renders at most one, queued rather than
 * layered.
 */

import { Close, Server } from "@/utils/icons";
import { cn } from "@/utils/helpers";

export interface PlayerNotification {
  id: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
  dismissLabel?: string;
  tone?: "warning" | "danger";
  dismissible?: boolean;
}

export interface PlayerNotificationSlotProps {
  /** Already priority-ordered by the caller; only the first renders. */
  notifications: PlayerNotification[];
  onDismiss: (id: string) => void;
}

export default function PlayerNotificationSlot({
  notifications,
  onDismiss,
}: PlayerNotificationSlotProps) {
  const active = notifications[0];
  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "flex flex-wrap items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm",
        active.tone === "danger"
          ? "border-danger/30 bg-danger/15 text-danger-200"
          : "border-warning/30 bg-warning/12 text-warning-200",
      )}
    >
      <Server size={16} className="shrink-0" />
      <p className="min-w-0 flex-1 text-[11.5px] leading-snug">{active.message}</p>
      {active.actionLabel && active.onAction && (
        <button
          type="button"
          onClick={active.onAction}
          className="min-h-11 shrink-0 rounded-lg bg-white px-3 text-[11px] font-semibold text-black focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
        >
          {active.actionLabel}
        </button>
      )}
      {active.secondaryActionLabel && active.onSecondaryAction && (
        <button
          type="button"
          onClick={active.onSecondaryAction}
          className="min-h-11 shrink-0 rounded-lg border border-white/20 px-3 text-[11px] font-semibold text-white focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
        >
          {active.secondaryActionLabel}
        </button>
      )}
      {active.dismissible !== false && (
        <button
          type="button"
          aria-label={active.dismissLabel ?? "Dismiss"}
          title={active.dismissLabel}
          onClick={() => onDismiss(active.id)}
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white/50 hover:text-white focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:outline-none"
        >
          <Close size={16} />
        </button>
      )}
    </div>
  );
}
