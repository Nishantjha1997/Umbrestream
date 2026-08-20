import TvShowDetailContent from "@/components/sections/TV/Details/DetailContent";
import { tmdb } from "@/api/tmdb";
import { getImageUrl, mutateTvShowTitle } from "@/utils/movies";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchTvShow(id: number) {
  try {
    return await tmdb.tvShows.details(id, [
      "images",
      "videos",
      "credits",
      "keywords",
      "recommendations",
      "similar",
      "reviews",
      "watch/providers",
    ]);
  } catch {
    return undefined;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) return { title: "TV Show" };
  const tv = await fetchTvShow(numId);
  if (!tv) return { title: "TV Show Details" };

  const title = mutateTvShowTitle(tv);
  const description = tv.overview || `Watch ${title} on StreamFree`;
  const posterUrl = getImageUrl(tv.poster_path, "poster");
  const backdropUrl = getImageUrl(tv.backdrop_path, "backdrop");

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        ...(backdropUrl ? [{ url: backdropUrl, width: 1280, height: 720 }] : []),
        ...(posterUrl ? [{ url: posterUrl, width: 500, height: 750 }] : []),
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: backdropUrl ? [backdropUrl] : posterUrl ? [posterUrl] : [],
    },
  };
}

export default async function TVShowDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  const initialData = await fetchTvShow(numId);
  return <TvShowDetailContent id={numId} initialData={initialData} />;
}
