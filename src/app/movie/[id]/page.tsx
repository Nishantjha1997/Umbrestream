import MovieDetailContent from "@/components/sections/Movie/Detail/DetailContent";
import { tmdb } from "@/api/tmdb";
import { getImageUrl, mutateMovieTitle } from "@/utils/movies";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchMovie(id: number) {
  try {
    return await tmdb.movies.details(id, [
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
  if (!Number.isFinite(numId)) return { title: "Movie" };
  const movie = await fetchMovie(numId);
  if (!movie) return { title: "Movie Details" };

  const title = mutateMovieTitle(movie);
  const description = movie.overview || `Watch ${title} on StreamFree`;
  const posterUrl = getImageUrl(movie.poster_path, "poster");
  const backdropUrl = getImageUrl(movie.backdrop_path, "backdrop");

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

export default async function MovieDetailPage({ params }: Props) {
  const { id } = await params;
  const numId = Number(id);
  const initialData = await fetchMovie(numId);
  return <MovieDetailContent id={numId} initialData={initialData} />;
}
