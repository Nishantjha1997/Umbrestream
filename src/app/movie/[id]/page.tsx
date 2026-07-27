"use client";

import { Suspense, use } from "react";
import { Spinner } from "@heroui/spinner";
import { useQuery } from "@tanstack/react-query";
import { tmdbBrowser } from "@/api/tmdb-browser";
import { Cast } from "tmdb-ts/dist/types/credits";
import { notFound } from "next/navigation";
import { Image } from "tmdb-ts";
import dynamic from "next/dynamic";
import { Params } from "@/types";
import { NextPage } from "next";
import { getEnglishLogoUrl, getImageUrl, mutateMovieTitle } from "@/utils/movies";
const PhotosSection = dynamic(() => import("@/components/ui/other/PhotosSection"));
const MediaBackdrop = dynamic(() => import("@/components/media/MediaBackdrop"));
const OverviewSection = dynamic(() => import("@/components/sections/Movie/Detail/Overview"));
const CastsSection = dynamic(() => import("@/components/sections/Movie/Detail/Casts"));
const RelatedSection = dynamic(() => import("@/components/sections/Movie/Detail/Related"));

const MovieDetailPage: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);

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
};

export default MovieDetailPage;
