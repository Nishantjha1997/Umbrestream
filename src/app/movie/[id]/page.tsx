"use client";

import { use } from "react";
import { Params } from "@/types";
import { NextPage } from "next";
import MovieDetailContent from "@/components/sections/Movie/Detail/DetailContent";

const MovieDetailPage: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);
  return <MovieDetailContent id={id} />;
};

export default MovieDetailPage;
