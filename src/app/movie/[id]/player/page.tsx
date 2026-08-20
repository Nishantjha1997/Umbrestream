import { getMovieLastPosition } from "@/actions/histories";
import { tmdb } from "@/api/tmdb";
import { isEmpty } from "@/utils/helpers";
import { notFound } from "next/navigation";
import MoviePlayerClient from "./MoviePlayerClient";

interface MoviePlayerPageProps {
  params: Promise<{ id: string }>;
}

async function fetchMovieForPlayback(id: number) {
  try {
    return await tmdb.movies.details(id);
  } catch {
    return null;
  }
}

export default async function MoviePlayerPage({ params }: MoviePlayerPageProps) {
  const { id: rawId } = await params;
  const id = Number(rawId);
  if (!Number.isFinite(id) || id <= 0) notFound();

  // Metadata and resume progress are independent. Fetch them together on the
  // server so the browser receives the complete player tree in its first RSC
  // response instead of hydrating, calling the TMDB proxy, and then loading a
  // second player chunk before the provider iframe can mount.
  const [movie, startAt] = await Promise.all([
    fetchMovieForPlayback(id),
    getMovieLastPosition(id),
  ]);

  if (!movie || isEmpty(movie)) notFound();

  return <MoviePlayerClient movie={movie} startAt={startAt} />;
}
