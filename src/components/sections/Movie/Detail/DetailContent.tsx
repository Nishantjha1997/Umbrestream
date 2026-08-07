"use client";

/**
 * The movie detail page's actual content, extracted from `app/movie/[id]/page.tsx`
 * (Phase 2, §6) so the direct route and the intercepted `@modal` route
 * (`app/@modal/(.)movie/[id]/page.tsx`) can share it instead of duplicating
 * the data-fetching. Nothing here is aware of whether it's rendered as a
 * full page or inside `<DetailModal>` — that distinction lives entirely in
 * the two `page.tsx` files and the modal chrome, not in this component.
 */

import { Suspense } from "react";
import { Spinner } from "@heroui/spinner";
import { useQuery } from "@tanstack/react-query";
import { tmdbBrowser } from "@/api/tmdb-browser";
import { Cast } from "tmdb-ts/dist/types/credits";
import { notFound } from "next/navigation";
import { Image } from "tmdb-ts";
import dynamic from "next/dynamic";
import { getEnglishLogoUrl, getImageUrl, mutateMovieTitle } from "@/utils/movies";
const PhotosSection = dynamic(() => import("@/components/ui/other/PhotosSection"));
const MediaBackdrop = dynamic(() => import("@/components/media/MediaBackdrop"));
const OverviewSection = dynamic(() => import("@/components/sections/Movie/Detail/Overview"));
const CastsSection = dynamic(() => import("@/components/sections/Movie/Detail/Casts"));
const RelatedSection = dynamic(() => import("@/components/sections/Movie/Detail/Related"));

export default function MovieDetailContent({ id }: { id: number }) {
  const {
    data: movie,
    isPending,
    error,
  } = useQuery({
    queryFn: () =>
      tmdbBrowser.movies.details(id, [
        "images",
        "videos",
        "credits",
        "keywords",
        "recommendations",
        "similar",
        "reviews",
        "watch/providers",
      ]),
    queryKey: ["movie-detail", id],
  });

  if (isPending) {
    return <Spinner size="lg" className="absolute-center" variant="simple" />;
  }

  if (error) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <Suspense fallback={<Spinner size="lg" className="absolute-center" variant="simple" />}>
        <div className="flex flex-col gap-10">
          <MediaBackdrop
            alt={mutateMovieTitle(movie)}
            backdropUrl={getImageUrl(movie.backdrop_path, "backdrop", true)}
            logoUrl={getEnglishLogoUrl(movie.images.logos)}
          />
          <OverviewSection movie={movie} />
          <CastsSection casts={movie.credits.cast as Cast[]} />
          <PhotosSection images={movie.images.backdrops as Image[]} />
          <RelatedSection movie={movie} />
        </div>
      </Suspense>
    </div>
  );
}
