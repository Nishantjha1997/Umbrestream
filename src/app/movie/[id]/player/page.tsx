"use client";

import { tmdbBrowser } from "@/api/tmdb-browser";
import { getMovieLastPosition } from "@/actions/histories";
import { Params } from "@/types";
import { isEmpty } from "@/utils/helpers";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import { NextPage } from "next";
import dynamic from "next/dynamic";
import { notFound } from "next/navigation";
import { use } from "react";

const MoviePlayer = dynamic(() => import("@/components/sections/Movie/Player/Player"), {
  ssr: false,
  loading: () => <Spinner size="lg" className="absolute-center" variant="simple" />,
});

const MoviePlayerPage: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);

  const {
    data: movie,
    isPending,
    error,
  } = useQuery({
    queryFn: () => tmdbBrowser.movies.details(id),
    queryKey: ["movie-player-detail", id],
  });

  const { data: startAt } = useQuery({
    queryFn: () => getMovieLastPosition(id),
    queryKey: ["movie-player-start-at", id],
  });

  if (isPending) {
    return <Spinner size="lg" className="absolute-center" variant="simple" />;
  }

  if (error || isEmpty(movie)) return notFound();

  return <MoviePlayer movie={movie} startAt={startAt} />;
};

export default MoviePlayerPage;
