"use client";

import { anilistApi } from "@/api/anilist";
import { Params } from "@/types";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { notFound } from "next/navigation";
import { Suspense, use } from "react";
import dynamic from "next/dynamic";
import { NextPage } from "next";

const BackdropSection = dynamic(() => import("@/components/sections/Anime/Detail/Backdrop"));
const OverviewSection = dynamic(() => import("@/components/sections/Anime/Detail/Overview"));
const StudiosSection = dynamic(() => import("@/components/sections/Anime/Detail/Studios"));
const RelatedSection = dynamic(() => import("@/components/sections/Anime/Detail/Related"));

const AnimeDetailPage: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);

  const {
    data: anime,
    isPending,
    error,
  } = useQuery({
    queryFn: () => anilistApi.details(id),
    queryKey: ["anime-detail", id],
  });

  if (isPending) {
    return (
      <div className="mx-auto max-w-5xl">
        <Spinner size="lg" className="absolute-center" color="secondary" variant="simple" />
      </div>
    );
  }

  // anilistApi.details() swallows errors and resolves to null rather than
  // throwing, so `!anime` is what actually catches the not-found case here —
  // the `error` check just mirrors the same guard used by the sibling
  // movie/tv detail pages and the anime player page.
  if (error || !anime) notFound();

  return (
    <div className="mx-auto max-w-5xl">
      <Suspense
        fallback={
          <Spinner size="lg" className="absolute-center" color="secondary" variant="simple" />
        }
      >
        <div className="flex flex-col gap-10">
          <BackdropSection anime={anime} />
          <OverviewSection anime={anime} />
          <StudiosSection studios={anime.studios} />
          <RelatedSection recommendations={anime.recommendations} />
        </div>
      </Suspense>
    </div>
  );
};

export default AnimeDetailPage;
