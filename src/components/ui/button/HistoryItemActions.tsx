"use client";

import { deleteHistory, markHistoryComplete } from "@/actions/histories";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import type { ContentType } from "@/types";
import { Check, Trash } from "@/utils/icons";
import { addToast } from "@heroui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTransition } from "react";
import IconButton from "./IconButton";

interface HistoryItemActionsProps {
  mediaId: number;
  type: ContentType;
  season?: number;
  episode?: number;
  title: string;
  /** Hides the mark-complete button when the title is already completed —
   *  only the Watch History list (which shows completed rows too) passes
   *  this; Continue Watching surfaces never render a completed row at all. */
  completed?: boolean;
  className?: string;
}

/**
 * Mark-complete/remove controls for a Continue Watching card. Every card
 * this mounts on (`StillWatching`, `StillWatchingDesktop`, `ResumeHero`,
 * `DesktopHero`) is itself wrapped in a `<Link>` that resumes playback — the
 * wrapper's `onClick` stops that click from bubbling into the card's own
 * navigation.
 */
const HistoryItemActions: React.FC<HistoryItemActionsProps> = ({
  mediaId,
  type,
  season = 0,
  episode = 0,
  title,
  completed,
  className,
}) => {
  const queryClient = useQueryClient();
  const { data: user } = useSupabaseUser();
  const [isPending, startTransition] = useTransition();

  // Covers every surface this mounts on — the home page's Continue
  // Watching (rail + hero) and the Account Watch History list both need to
  // drop this row/refresh its totals, whichever one triggered the change.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["continue-watching", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["watch-history", user?.id] });
    queryClient.invalidateQueries({ queryKey: ["watch-time-summary", user?.id] });
  };

  const handleComplete = () => {
    startTransition(async () => {
      const result = await markHistoryComplete(mediaId, type, season, episode);
      if (result.success) {
        invalidate();
        addToast({ title: `${title} marked as complete`, color: "success" });
      } else {
        addToast({ title: "Error", description: result.message, color: "danger" });
      }
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const result = await deleteHistory(mediaId, type, season, episode);
      if (result.success) {
        invalidate();
        addToast({
          title: `${title} removed from Continue Watching`,
          color: "danger",
          icon: <Trash />,
        });
      } else {
        addToast({ title: "Error", description: result.message, color: "danger" });
      }
    });
  };

  return (
    <div
      className={className}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
    >
      {!completed && (
        <IconButton
          onPress={handleComplete}
          icon={<Check size={14} />}
          variant="faded"
          color="success"
          size="sm"
          isLoading={isPending}
          tooltip="Mark as complete"
        />
      )}
      <IconButton
        onPress={handleRemove}
        icon={<Trash size={14} />}
        variant="faded"
        color="danger"
        size="sm"
        isLoading={isPending}
        tooltip="Remove"
      />
    </div>
  );
};

export default HistoryItemActions;
