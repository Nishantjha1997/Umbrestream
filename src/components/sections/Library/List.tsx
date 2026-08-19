"use client";

import { getWatchlist, removeAllWatchlist } from "@/actions/library";
import { useQueryClient } from "@tanstack/react-query";
import BackToTopButton from "@/components/ui/button/BackToTopButton";
import ContentTypeSelection from "@/components/ui/other/ContentTypeSelection";
import ServiceRetryState from "@/components/ui/feedback/ServiceRetryState";
import useDiscoverFilters from "@/hooks/useDiscoverFilters";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import { isEmpty } from "@/utils/helpers";
import { Trash } from "@/utils/icons";
import { addToast, Button, Select, SelectItem, Spinner } from "@heroui/react";
import { useDisclosure, useInViewport } from "@mantine/hooks";
import { useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { Suspense, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import PosterCard from "@/components/media/PosterCard";
import type { MediaSummary } from "@/types/media";
import { getImageUrl, getLoadingLabel } from "@/utils/movies";
import { ITEMS_PER_PAGE } from "@/utils/constants";
import ConfirmationModal from "@/components/ui/overlay/ConfirmationModal";

type SortOption = "title" | "release_date" | "vote_average" | "created_at";
type FilterType = "movie" | "tv" | "anime" | "all";

/** Lowercase noun for copy ("No movies in your watchlist yet."). */
const contentLabel = (content: FilterType) =>
  content === "movie" ? "movies" : content === "tv" ? "TV shows" : content === "anime" ? "anime" : "titles";

/** Title-case noun for button and confirmation labels ("Clear Movies?"). */
const contentTitle = (content: FilterType) =>
  content === "movie" ? "Movies" : content === "tv" ? "TV Shows" : content === "anime" ? "Anime" : "Everything";

/**
 * A watchlist row is already flat — it is this app's own denormalized copy of
 * a TMDB/AniList record, not a source payload — so it maps straight onto
 * MediaSummary. This replaces three blocks that faked a `Movie`/`TV`/
 * `AniListMediaSummary` object (two of them behind `@ts-expect-error`) purely
 * to satisfy the old per-type card components.
 */
const toMediaSummary = (item: {
  id: number;
  type: "movie" | "tv" | "anime";
  title: string;
  adult: boolean;
  poster_path?: string | null;
  backdrop_path: string;
  release_date: string;
  vote_average: number;
}): MediaSummary => {
  const year = Number.parseInt(String(item.release_date ?? "").slice(0, 4), 10);
  return {
    kind: item.type,
    id: item.id,
    href: `/${item.type}/${item.id}`,
    title: item.title,
    // getImageUrl passes absolute URLs through, so AniList covers stored in
    // this column survive alongside TMDB's relative paths.
    posterUrl: getImageUrl(item.poster_path ?? undefined, "poster"),
    backdropUrl: item.backdrop_path ? getImageUrl(item.backdrop_path, "backdrop") : undefined,
    year: Number.isFinite(year) ? year : undefined,
    rating: item.vote_average,
    isAdult: Boolean(item.adult),
  };
};

const SORT_OPTIONS: { key: SortOption; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "release_date", label: "Release Date" },
  { key: "vote_average", label: "Rating" },
  { key: "created_at", label: "Date Added" },
];

const LibraryList = () => {
  const queryClient = useQueryClient();
  const { ref, inViewport } = useInViewport();
  const { content } = useDiscoverFilters();
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();
  const [isPending, startTransition] = useTransition();
  const [sortOption, setSortOption] = useState<SortOption>("created_at");
  const [opened, { open, close }] = useDisclosure(false);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status, refetch } =
    useInfiniteQuery({
      queryKey: ["watchlist", content, user?.id],
      queryFn: async ({ pageParam = 1 }) => {
        if (!user) return { success: true, data: [], hasNextPage: false };
        return await getWatchlist(content as FilterType, pageParam, ITEMS_PER_PAGE);
      },
      initialPageParam: 1,
      getNextPageParam: (lastPage, pages) => {
        if (lastPage.hasNextPage) {
          return pages.length + 1;
        }
        return undefined;
      },
      enabled: !isUserLoading,
      staleTime: 1000 * 60 * 5,
    });

  useEffect(() => {
    if (inViewport && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, inViewport, isFetchingNextPage]);

  const clearWatchlistMutation = useMutation({
    mutationFn: async (type: "movie" | "tv" | "anime") => {
      if (!user) throw new Error("User not authenticated");
      const result = await removeAllWatchlist(type);
      if (!result.success) {
        throw new Error(result.error || "Failed to clear watchlist");
      }
      const allItems = data?.pages.flatMap((page) => page.data || []) || [];
      const count = allItems.filter((item) => item.type === type).length;
      return { type, count };
    },
    onSuccess: ({ type, count }) => {
      queryClient.invalidateQueries({ queryKey: ["watchlist"] });

      let label = "movies";
      if (type === "tv") label = "TV shows";
      if (type === "anime") label = "anime";

      addToast({
        title: `Cleared ${count} ${label} from your watchlist!`,
        color: "success",
        icon: <Trash />,
      });

      close();
    },
    onError: (error) => {
      addToast({
        title: "Error",
        description: "Failed to clear watchlist. Please try again.",
        color: "danger",
      });
      console.error("Clear watchlist error:", error);
    },
  });

  const sortedWatchlist = useMemo(() => {
    if (!data?.pages) return [];

    const allItems = data.pages.flatMap((page) => page.data || []);

    return [...allItems].sort((a, b) => {
      switch (sortOption) {
        case "vote_average":
        case "release_date":
          return b[sortOption] > a[sortOption] ? 1 : -1;
        case "created_at":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "title":
        default:
          return a.title.localeCompare(b.title);
      }
    });
  }, [data?.pages, sortOption]);

  const confirmClearWatchlist = () => {
    startTransition(() => {
      clearWatchlistMutation.mutate(content);
    });
  };

  if (status === "error") {
    return (
      <ServiceRetryState
        title="Couldn't load your watchlist"
        description="Your saved titles didn't load. It's usually a temporary blip."
        onRetry={() => void refetch()}
      />
    );
  }

  const hasItems = !isEmpty(sortedWatchlist);

  return (
    <>
      <div className="relative flex flex-col items-center justify-center gap-10">
        <div className="flex w-full flex-col items-center justify-center gap-2">
          <ContentTypeSelection className="justify-center" />
          <Select
            label="Sort by"
            size="sm"
            placeholder="Select sort"
            className="max-w-xs p-4"
            selectedKeys={[sortOption]}
            onChange={({ target }) => setSortOption(target.value as SortOption)}
          >
            {SORT_OPTIONS.map(({ key, label }) => (
              <SelectItem key={key}>{label}</SelectItem>
            ))}
          </Select>
          {/* Destructive, so it stays red — but `flat` rather than `shadow`.
              A glowing red button is the loudest thing on the page, and this
              is a rarely-used bulk action, not the primary path (§9). */}
          {hasItems && (
            <Button
              startContent={<Trash />}
              color="danger"
              variant="flat"
              radius="full"
              onPress={() => {
                if (user) open();
              }}
              isLoading={clearWatchlistMutation.isPending || isPending}
            >
              Clear {contentTitle(content)} from Watchlist
            </Button>
          )}
        </div>
        {status === "pending" ? (
          <Spinner
            size="lg"
            variant="simple"
            className="absolute-center mt-[30vh]"
          />
        ) : hasItems ? (
          <>
            <div className="movie-grid">
              {sortedWatchlist.map((item) => (
                <Suspense key={`${item.type}-${item.id}`}>
                  <PosterCard media={toMediaSummary(item)} variant="grid" />
                </Suspense>
              ))}
            </div>
            <div ref={ref} className="flex h-24 items-center justify-center">
              {isFetchingNextPage && (
                <Spinner
                  size="lg"
                  variant="wave"
                  label={getLoadingLabel()}
                />
              )}
              {!hasNextPage && !isFetchingNextPage && sortedWatchlist.length > 0 && (
                <p className="text-muted-foreground text-center text-base">
                  You have reached the end of your watchlist.
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex min-h-[30vh] items-center justify-center">
            <div className="glass-panel flex min-h-48 w-full max-w-md flex-col items-center justify-center gap-3 rounded-(--radius-panel) border px-6 py-10 text-center">
              <h3 className="text-lg font-semibold">Your watchlist is empty</h3>
              <p className="text-default-500 max-w-sm text-sm">
                No {contentLabel(content)} in your watchlist yet. Find something you like and tap
                the bookmark to keep it here.
              </p>
              <Button
                as={Link}
                href={content === "anime" ? "/anime/discover" : "/browse"}
                size="sm"
                radius="full"
                variant="flat"
              >
                Browse {contentLabel(content)}
              </Button>
            </div>
          </div>
        )}
      </div>

      <BackToTopButton />

      <ConfirmationModal
        title={`Clear ${contentTitle(content)}?`}
        isOpen={opened}
        onClose={close}
        onConfirm={confirmClearWatchlist}
        confirmLabel="Clear All"
        isLoading={clearWatchlistMutation.isPending}
      >
        <p>
          Are you sure you want to remove all {contentLabel(content)} from your watchlist? This
          action cannot be undone.
        </p>
        <p className="text-default-500 text-sm">
          {sortedWatchlist.length} {sortedWatchlist.length === 1 ? "item" : "items"} will be
          removed.
        </p>
      </ConfirmationModal>
    </>
  );
};

export default LibraryList;
