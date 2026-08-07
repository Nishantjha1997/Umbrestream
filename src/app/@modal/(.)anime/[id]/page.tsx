"use client";

/**
 * Intercepted anime detail route (Phase 2, §6). Mirrors
 * `@modal/(.)movie/[id]/page.tsx` exactly — see that file's header for the
 * full rationale.
 */

import { use } from "react";
import { Params } from "@/types";
import { NextPage } from "next";
import DetailModal from "@/components/shell/DetailModal";
import AnimeDetailContent from "@/components/sections/Anime/Detail/DetailContent";

const InterceptedAnimeDetail: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);
  return (
    <DetailModal>
      <AnimeDetailContent id={id} />
    </DetailModal>
  );
};

export default InterceptedAnimeDetail;
