"use client";

/**
 * The TV detail page's actual content, extracted from `app/tv/[id]/page.tsx`
 * (Phase 2, §6) so the direct route and the intercepted `@modal` route
 * (`app/@modal/(.)tv/[id]/page.tsx`) can share it — see
 * `Movie/Detail/DetailContent.tsx`'s header for the full rationale.
 */

import { tmdbBrowser } from "@/api/tmdb-browser";
import { Spinner } from "@heroui/react";
import ServiceRetryState from "@/components/ui/feedback/ServiceRetryState";
import { useScrollIntoView } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import {
  getCinematicBackdropUrl,
  getEnglishLogoUrl,
  getImageUrl,
  mutateTvShowTitle,
} from "@/utils/movies";
const PhotosSection = dynamic(() => import("@/components/ui/other/PhotosSection"));
const TvShowRelatedSection = dynamic(() => import("@/components/sections/TV/Details/Related"));
const TvShowCastsSection = dynamic(() => import("@/components/sections/TV/Details/Casts"));
const MediaBackdrop = dynamic(() => import("@/components/media/MediaBackdrop"));
const TvShowOverviewSection = dynamic(() => import("@/components/sections/TV/Details/Overview"));
const TvShowsSeasonsSelection = dynamic(() => import("@/components/sections/TV/Details/Seasons"));

export default function TvShowDetailContent({ id }: { id: number }) {
  const { scrollIntoView, targetRef } = useScrollIntoView<HTMLDivElement>({
    duration: 500,
  });

  const {
    data: tv,
    isPending,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryFn: () =>
      tmdbBrowser.tvShows.details(id, [
        "images",
        "videos",
        "credits",
        "keywords",
        "recommendations",
        "similar",
        "reviews",
        "watch/providers",
      ]),
    queryKey: ["tv-show-detail", id],
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-5xl">
        {/* One accent (Phase 1, §1.1.3 / §5.2): was `color="warning"`. */}
        <Spinner size="lg" className="absolute-center" color="primary" variant="simple" />
      </div>
    );
  }

  if (error) {
    return (
      <ServiceRetryState
        title="Couldn’t reach TMDB"
        description="This series didn’t load. It’s usually temporary."
        isRetrying={isFetching}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="mx-auto max-w-5xl">
      <Suspense
        fallback={
          <Spinner size="lg" className="absolute-center" color="primary" variant="simple" />
        }
      >
        <div className="flex flex-col gap-10">
          <MediaBackdrop
            alt={mutateTvShowTitle(tv)}
            backdropUrl={getCinematicBackdropUrl(
              tv.images.backdrops,
              getImageUrl(tv.backdrop_path, "backdrop", true),
            )}
            logoUrl={getEnglishLogoUrl(tv.images.logos)}
          />
          <TvShowOverviewSection
            onViewEpisodesClick={() => scrollIntoView({ alignment: "center" })}
            tv={tv}
          />
          <TvShowCastsSection casts={tv.credits.cast} />
          <PhotosSection images={tv.images.backdrops} type="tv" />
          <TvShowsSeasonsSelection ref={targetRef} id={id} seasons={tv.seasons} />
          <TvShowRelatedSection tv={tv} />
        </div>
      </Suspense>
    </div>
  );
}
