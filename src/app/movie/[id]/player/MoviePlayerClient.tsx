"use client";

import { Spinner } from "@heroui/react";
import dynamic from "next/dynamic";
import type { MovieDetails } from "tmdb-ts/dist/types/movies";

const MoviePlayer = dynamic(() => import("@/components/sections/Movie/Player/Player"), {
  ssr: false,
  loading: () => <Spinner size="lg" className="absolute-center" variant="simple" />,
});

interface MoviePlayerClientProps {
  movie: MovieDetails;
  startAt: number;
}

/**
 * The provider controller currently depends on browser-only player libraries.
 * Keep that boundary client-only while allowing the route Server Component to
 * fetch movie metadata and resume progress in parallel before hydration.
 */
export default function MoviePlayerClient({ movie, startAt }: MoviePlayerClientProps) {
  return <MoviePlayer movie={movie} startAt={startAt} />;
}
