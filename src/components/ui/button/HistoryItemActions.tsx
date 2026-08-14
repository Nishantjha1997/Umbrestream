"use client";

import { deleteHistory, markHistoryComplete, restoreHistories } from "@/actions/histories";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import type { ContentType } from "@/types";
import type { HistoryDetail } from "@/types/movie";
import { Check, Trash } from "@/utils/icons";
import { addToast, Button } from "@heroui/react";
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
  /** Continue Watching cards remove the title; the full history page removes one episode row. */
  scope?: "episode" | "title";
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
  scope = "episode",
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
      const result = await markHistoryComplete(mediaId, type, season, episode, scope);
      if (result.success) {
        invalidate();
        addToast({ title: `${title} marked as complete`, color: "success" });
      } else {
        addToast({ title: "Error", description: result.message, color: "danger" });
      }
    });
  };

  const handleRemove = () => {
    const querySnapshots = queryClient.getQueriesData({
      queryKey: ["continue-watching", user?.id],
    });

    const removeFromCache = (old: unknown): unknown => {
      if (!old || typeof old !== "object") return old;
      const value = old as {
        pages?: Array<{ success?: boolean; data?: { items?: HistoryDetail[] } }>;
        success?: boolean;
        data?: HistoryDetail[];
      };

      if (Array.isArray(value.pages)) {
        return {
          ...value,
          pages: value.pages.map((page) =>
            page.success && page.data?.items
              ? {
                  ...page,
                  data: {
                    ...page.data,
                    items: page.data.items.filter(
                      (item) =>
                        scope === "title"
                          ? item.type !== type || item.media_id !== mediaId
                          : item.type !== type ||
                            item.media_id !== mediaId ||
                            item.season !== season ||
                            item.episode !== episode,
                    ),
                  },
                }
              : page,
          ),
        };
      }

      if (value.success && Array.isArray(value.data)) {
        return {
          ...value,
          data: value.data.filter(
            (item) =>
              scope === "title"
                ? item.type !== type || item.media_id !== mediaId
                : item.type !== type ||
                  item.media_id !== mediaId ||
                  item.season !== season ||
                  item.episode !== episode,
          ),
        };
      }

      return old;
    };

    for (const [queryKey, old] of querySnapshots) {
      queryClient.setQueryData(queryKey, removeFromCache(old));
    }

    startTransition(async () => {
      const result = await deleteHistory(mediaId, type, season, episode, scope);
      if (result.success) {
        invalidate();
        addToast({
          title: `${title} removed from Continue Watching`,
          color: "warning",
          icon: <Trash />,
          endContent: result.data?.length ? (
            <Button
              size="sm"
              variant="flat"
              color="warning"
              onPress={async () => {
                const restored = await restoreHistories(result.data ?? []);
                if (restored.success) {
                  queryClient.invalidateQueries({ queryKey: ["continue-watching", user?.id] });
                  queryClient.invalidateQueries({ queryKey: ["watch-history", user?.id] });
                  addToast({ title: "Restored", color: "success" });
                } else {
                  addToast({ title: "Could not restore", description: restored.message, color: "danger" });
                }
              }}
            >
              Undo
            </Button>
          ) : undefined,
        });
      } else {
        for (const [queryKey, old] of querySnapshots) {
          queryClient.setQueryData(queryKey, old);
        }
        addToast({ title: "Error", description: result.message, color: "danger" });
      }
    });
  };

  return (
    <div
      className={className}
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onTouchStart={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          event.stopPropagation();
        }
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
