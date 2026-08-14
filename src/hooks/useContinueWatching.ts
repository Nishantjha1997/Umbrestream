"use client";

import {
  getContinueWatchingPage,
  type ContinueWatchingCursor,
} from "@/actions/histories";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import type { HistoryDetail } from "@/types/movie";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const PAGE_SIZE = 24;

export default function useContinueWatching() {
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();
  const query = useInfiniteQuery({
    queryKey: ["continue-watching", user?.id, "cursor-v1"],
    queryFn: ({ pageParam }) => getContinueWatchingPage(pageParam, PAGE_SIZE),
    initialPageParam: null as ContinueWatchingCursor | null,
    getNextPageParam: (lastPage) =>
      lastPage.success ? lastPage.data?.nextCursor : undefined,
    enabled: !isUserLoading && Boolean(user),
    staleTime: 60_000,
  });

  const items = useMemo<HistoryDetail[]>(
    () =>
      query.data?.pages.flatMap((page) =>
        page.success ? page.data?.items ?? [] : [],
      ) ?? [],
    [query.data?.pages],
  );

  return {
    ...query,
    items,
    user,
    isUserLoading,
    isSignedOut: !isUserLoading && !user,
    isLoading: isUserLoading || (Boolean(user) && query.isPending),
  };
}
