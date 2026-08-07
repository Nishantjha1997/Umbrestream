"use client";

import { use } from "react";
import { Params } from "@/types";
import { NextPage } from "next";
import TvShowDetailContent from "@/components/sections/TV/Details/DetailContent";

const TVShowDetailPage: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);
  return <TvShowDetailContent id={id} />;
};

export default TVShowDetailPage;
