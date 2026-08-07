"use client";

import { use } from "react";
import { Params } from "@/types";
import { NextPage } from "next";
import AnimeDetailContent from "@/components/sections/Anime/Detail/DetailContent";

const AnimeDetailPage: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);
  return <AnimeDetailContent id={id} />;
};

export default AnimeDetailPage;
