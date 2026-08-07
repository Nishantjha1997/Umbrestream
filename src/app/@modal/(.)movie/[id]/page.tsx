"use client";

/**
 * Intercepted movie detail route (Phase 2, §6 — reference implementation;
 * `tv`/`anime` mirror this exactly). `(.)movie/[id]` intercepts same-level
 * client-side navigation to `/movie/[id]` from anywhere in the app — a
 * poster click, a related-title click, whatever — and renders it here,
 * inside `<DetailModal>`, instead of swapping `children`. A hard reload or
 * a direct link still hits `app/movie/[id]/page.tsx` and gets the real full
 * page; this slot's own `default.tsx` covers every path that isn't this one.
 *
 * `MovieDetailContent` is the same component the direct route renders — see
 * that file's header for why the data-fetching isn't duplicated here.
 */

import { use } from "react";
import { Params } from "@/types";
import { NextPage } from "next";
import DetailModal from "@/components/shell/DetailModal";
import MovieDetailContent from "@/components/sections/Movie/Detail/DetailContent";

const InterceptedMovieDetail: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);
  return (
    <DetailModal>
      <MovieDetailContent id={id} />
    </DetailModal>
  );
};

export default InterceptedMovieDetail;
