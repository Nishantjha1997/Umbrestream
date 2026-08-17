"use client";

import { getPersonalizedRecommendations } from "@/actions/recommendations";
import Shelf from "@/components/media/Shelf";
import HomeEmptyState from "@/components/sections/Home/EmptyState";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import type { MediaSummary } from "@/types/media";
import { fromAnime, fromMovie, fromTvShow } from "@/utils/normalize-media";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const DEFAULT_TITLE = "Recommended For You";

interface RecommendedProps {
  id?: string;
  title?: string;
}

/**
 * How long a computed row stays fresh on the client.
 *
 * §7 requires the row to be cached rather than recomputed on every navigation.
 * There are two layers and this is the outer one: while the row is fresh,
 * moving around the app does not re-invoke the server action at all. The inner
 * layer is `unstable_cache` inside the action itself, keyed by the user's taste
 * fingerprint, which covers a hard reload and every other device.
 *
 * Thirty minutes matches the server TTL. The row is built from a 30-day
 * half-life, so it genuinely does not change minute to minute — and when it
 * does change, it is because the user pressed play, which invalidates the
 * server key on its own.
 */
const ROW_STALE_MS = 30 * 60 * 1000;

const Recommended: React.FC<RecommendedProps> = ({
  id = "recommendations",
  title = DEFAULT_TITLE,
}) => {
  // `isLoading`, not `isPending`: useSupabaseUser disables itself when Supabase
  // has no credentials, and a disabled query reports `pending` forever.
  const { data: user, isLoading: isUserLoading } = useSupabaseUser();

  const {
    data: recommendations,
    isPending,
    isError,
    refetch,
  } = useQuery({
    // Keyed on the user so signing in or out rebuilds the row instead of
    // serving the previous identity's taste profile from cache.
    queryKey: ["personalized-recommendations", user?.id],
    queryFn: () => getPersonalizedRecommendations(),
    // Don't fire against `undefined` and then immediately re-fire against the
    // resolved id — that was two full engine runs per cold page load.
    enabled: !isUserLoading,
    // `staleTime` alone is what satisfies "cached, not recomputed per
    // navigation": react-query skips the on-mount refetch while data is fresh,
    // so returning to Home re-renders from cache. Left at the default rather
    // than pinned to `refetchOnMount: false`, so the row does eventually
    // refresh itself once it goes stale in a long session.
    staleTime: ROW_STALE_MS,
    gcTime: ROW_STALE_MS * 2,
    refetchOnWindowFocus: false,
  });

  // The action returns a mixed-type list, so normalization happens here and
  // the shelf below never learns there was more than one source.
  const items = useMemo<MediaSummary[]>(
    () =>
      (recommendations ?? []).map((item) => {
        if (item.type === "movie") return fromMovie(item.media);
        if (item.type === "tv") return fromTvShow(item.media);
        return fromAnime(item.media);
      }),
    [recommendations],
  );

  const isLoading = isUserLoading || (isPending && !isError);
  const displayTitle = user ? title : "Trending now";

  // <Shelf> renders nothing at all when it has no items, which left this
  // section as a silent hole for anyone the engine has nothing to go on for
  // (§6). Say so instead, and point at the one action that fixes it.
  //
  // In practice this is reached only when every provider is unreachable or
  // unconfigured — the engine falls back to trending for a cold-start user
  // rather than returning nothing — but "nothing to show" must still have a
  // face rather than collapsing the section.
  if (!isLoading && !isError && items.length === 0) {
    return (
      <section id={id} className="scroll-mt-24">
        <HomeEmptyState
          title={displayTitle}
          headline={user ? "Nothing to go on yet" : "Recommendations get sharper as you watch"}
          description={
            user
              ? "Finish something and this row rebuilds itself around what you liked."
              : "Sign in and this row fills in from your own history instead of the charts."
          }
          action={
            user ? { label: "Find something", href: "/discover" } : { label: "Sign in", href: "/auth" }
          }
        />
      </section>
    );
  }

  return (
    <section id={id} className="scroll-mt-24">
      <Shelf
        title={displayTitle}
        items={items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => void refetch()}
      />
    </section>
  );
};

export default Recommended;
