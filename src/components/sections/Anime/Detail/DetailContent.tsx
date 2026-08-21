"use client";

/**
 * The anime detail page's actual content, extracted from
 * `app/anime/[id]/page.tsx` (Phase 2, §6) so the direct route and the
 * intercepted `@modal` route (`app/@modal/(.)anime/[id]/page.tsx`) can share
 * it — see `Movie/Detail/DetailContent.tsx`'s header for the full rationale.
 */

import { anilistApi } from "@/api/anilist";
import { useSetAmbient } from "@/components/media/AmbientProvider";
import ServiceRetryState from "@/components/ui/feedback/ServiceRetryState";
import { useExtractColors } from "@/hooks/useExtractColors";
import type { AniListMediaDetail } from "@/types/anilist";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";

const MediaBackdrop = dynamic(() => import("@/components/media/MediaBackdrop"));
const OverviewSection = dynamic(() => import("@/components/sections/Anime/Detail/Overview"));
const StudiosSection = dynamic(() => import("@/components/sections/Anime/Detail/Studios"));
const RelatedSection = dynamic(() => import("@/components/sections/Anime/Detail/Related"));
const AnimeEpisodesSelection = dynamic(() => import("@/components/sections/Anime/Detail/Episodes"));

export default function AnimeDetailContent({
  id,
  initialData,
}: {
  id: number;
  initialData?: AniListMediaDetail | null;
}) {
  const {
    data: anime,
    isPending,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryFn: () => anilistApi.details(id),
    queryKey: ["anime-detail", id],
    initialData: initialData ?? undefined,
  });

  const backdropUrl =
    anime?.bannerImage ?? anime?.coverImage.extraLarge ?? anime?.coverImage.large ?? "";
  const { dominantColor } = useExtractColors(backdropUrl);
  useSetAmbient(dominantColor || anime?.coverImage.color || null);

  if (isPending) {
    return (
      <div className="mx-auto max-w-5xl">
        {/* One accent (Phase 1, §1.1.3 / §5.2): was `color="secondary"`. */}
        <Spinner size="lg" className="absolute-center" color="primary" variant="simple" />
      </div>
    );
  }

  // A failed request is not a missing page. `details()` now throws on transient
  // failures (AniList rate-limits fairly aggressively) and resolves to null
  // only when the title genuinely doesn't exist, so the two are handled apart.
  if (error) {
    return (
      <ServiceRetryState
        title="Couldn’t reach AniList"
        description="This title didn’t load. It’s usually temporary."
        isRetrying={isFetching}
        onRetry={() => void refetch()}
      />
    );
  }

  if (!anime) notFound();

  return (
    <div className="anime-detail-surface mx-auto min-h-dvh max-w-5xl overflow-x-clip">
      <Suspense
        fallback={
          <Spinner size="lg" className="absolute-center" color="primary" variant="simple" />
        }
      >
        <div className="relative z-3 flex flex-col gap-10 px-5 pb-12 sm:px-6 md:px-0 md:pb-0">
          {/* AniList has no wordmark art, so `logoUrl` is deliberately omitted —
              the anime title is rendered by the Overview section below. Banner
              art is optional too; falling back to the cover, then to a block
              tinted with the cover's dominant colour. */}
          <div className="absolute inset-x-0 top-0 -z-1 -mx-5 sm:-mx-6 md:mx-0">
            <MediaBackdrop
              alt={anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled"}
              backdropUrl={
                anime.bannerImage ??
                anime.coverImage.extraLarge ??
                anime.coverImage.large ??
                undefined
              }
              fallbackColor={anime.coverImage.color ?? undefined}
            />
          </div>
          <OverviewSection anime={anime} />
          <AnimeEpisodesSelection anime={anime} />
          <StudiosSection studios={anime.studios} />
          <RelatedSection recommendations={anime.recommendations} />
        </div>
      </Suspense>
    </div>
  );
}
