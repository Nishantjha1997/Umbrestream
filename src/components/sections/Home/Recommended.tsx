"use client";

import { getPersonalizedRecommendations } from "@/actions/recommendations";
import Shelf from "@/components/media/Shelf";
import HomeEmptyState from "@/components/sections/Home/EmptyState";
import useSupabaseUser from "@/hooks/useSupabaseUser";
import type { MediaSummary } from "@/types/media";
import { fromAnime, fromMovie, fromTvShow } from "@/utils/normalize-media";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

const TITLE = "Recommended For You";

const Recommended: React.FC = () => {
  const { data: user } = useSupabaseUser();
  const {
    data: recommendations,
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["personalized-recommendations", user?.id],
    queryFn: () => getPersonalizedRecommendations(),
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

  // <Shelf> renders nothing at all when it has no items, which left this
  // section as a silent hole for anyone the engine has nothing to go on for
  // (§6). Say so instead, and point at the one action that fixes it.
  if (!isPending && !isError && items.length === 0) {
    return (
      <section id="recommendations">
        <HomeEmptyState
          title={TITLE}
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
    <section id="recommendations">
      <Shelf
        title={TITLE}
        items={items}
        isLoading={isPending && !isError}
        isError={isError}
        onRetry={() => void refetch()}
      />
    </section>
  );
};

export default Recommended;
