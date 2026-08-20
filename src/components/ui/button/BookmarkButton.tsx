"use client";

import { useEffect, useState, useTransition } from "react";
import { BsBookmarkCheckFill, BsBookmarkFill } from "react-icons/bs";
import { addToast, Button } from "@heroui/react";
import IconButton from "./IconButton";
import { Trash } from "@/utils/icons";
import useDeviceVibration from "@/hooks/useDeviceVibration";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { SavedMovieDetails } from "@/types/movie";
import { addToWatchlist, removeFromWatchlist, checkInWatchlist } from "@/actions/library";
import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";

interface BookmarkButtonProps {
  data: SavedMovieDetails;
  isTooltipDisabled?: boolean;
}

const BookmarkButton: React.FC<BookmarkButtonProps> = ({ data, isTooltipDisabled }) => {
  const queryClient = useQueryClient();
  const pathname = usePathname();
  const { startVibration } = useDeviceVibration();
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();
  const [isPending, startTransition] = useTransition();
  const [isSaved, setIsSaved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  const watchlistItem = {
    id: data.id,
    type: data.type,
    adult: data.adult,
    backdrop_path: data.backdrop_path,
    poster_path: data.poster_path || null,
    release_date: data.release_date,
    title: data.title,
    vote_average: data.vote_average,
  };

  const updateWatchlistCache = (remove: boolean) => {
    queryClient.setQueriesData({ queryKey: ["watchlist"] }, (old: unknown) => {
      if (!old || typeof old !== "object") return old;
      const value = old as {
        pages?: Array<{ data?: Array<{ id: number; type: string }> }>;
      };
      if (!Array.isArray(value.pages)) return old;
      return {
        ...value,
        pages: value.pages.map((page) => ({
          ...page,
          data: Array.isArray(page.data)
            ? remove
              ? page.data.filter((item) => item.id !== data.id || item.type !== data.type)
              : page.data
            : page.data,
        })),
      };
    });
  };

  useEffect(() => {
    const checkWatchlistStatus = async () => {
      if (!user) {
        setIsChecking(false);
        setIsSaved(false);
        return;
      }

      setIsChecking(true);
      try {
        const result = await checkInWatchlist(data.id, data.type);
        if (result.success) {
          setIsSaved(result.isInWatchlist);
        }
      } catch (error) {
        console.error("Error checking watchlist status:", error);
      } finally {
        setIsChecking(false);
      }
    };

    checkWatchlistStatus();
  }, [user, data.id, data.type]);

  const handleBookmark = () => {
    if (!user) {
      addToast({
        title: "You must be logged in to use this feature",
        color: "warning",
      });
      return;
    }

    startTransition(async () => {
      try {
        if (isSaved) {
          setIsSaved(false);
          updateWatchlistCache(true);
          const result = await removeFromWatchlist(data.id, data.type);

          if (result.success) {
            addToast({
              title: `${data.title} removed from your watchlist!`,
              color: "warning",
              icon: <Trash />,
              endContent: (
                <Button
                  size="sm"
                  variant="flat"
                  color="warning"
                  onPress={async () => {
                    const restored = await addToWatchlist(watchlistItem);
                    if (restored.success) {
                      setIsSaved(true);
                      queryClient.invalidateQueries({ queryKey: ["watchlist"] });
                      addToast({ title: "Restored to watchlist", color: "success" });
                    } else {
                      addToast({
                        title: "Could not restore",
                        description: restored.error,
                        color: "danger",
                      });
                    }
                  }}
                >
                  Undo
                </Button>
              ),
            });

            if (pathname.startsWith("/library")) {
              queryClient.invalidateQueries({ queryKey: ["watchlist"] });
            }
          } else {
            setIsSaved(true);
            queryClient.invalidateQueries({ queryKey: ["watchlist"] });
            addToast({
              title: "Error",
              description: result.error || "Failed to remove from watchlist",
              color: "danger",
            });
          }
        } else {
          const result = await addToWatchlist(watchlistItem);

          if (result.success) {
            setIsSaved(true);
            startVibration([100]);
            addToast({
              title: `${data.title} added to your watchlist!`,
              color: "success",
            });
          } else {
            if (result.error === "This item is already in your watchlist") {
              setIsSaved(true);
              addToast({
                title: "Already in watchlist",
                description: `${data.title} is already in your watchlist`,
                color: "warning",
              });
            } else {
              addToast({
                title: "Error",
                description: result.error || "Failed to add to watchlist",
                color: "danger",
              });
            }
          }
        }
      } catch (error) {
        console.error("Error updating watchlist:", error);
        addToast({
          title: "Error",
          description: "An unexpected error occurred",
          color: "danger",
        });
      }
    });
  };

  return (
    <span
      className="inline-flex"
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
      <IconButton
        onPress={handleBookmark}
        onClick={(event) => {
          // The bookmark control is also rendered by preview/card surfaces.
          // Consume the activation on the control itself so a parent Link can
          // never interpret removal as a request to open or play the title.
          event.preventDefault();
          event.stopPropagation();
        }}
        icon={isSaved ? <BsBookmarkCheckFill size={20} /> : <BsBookmarkFill size={20} />}
        variant={isSaved ? "shadow" : "faded"}
        color="warning"
        isLoading={isUserLoading || isChecking || isPending}
        tooltip={
          isTooltipDisabled ? undefined : isSaved ? "Remove from Watchlist" : "Add to Watchlist"
        }
      />
    </span>
  );
};

export default BookmarkButton;
