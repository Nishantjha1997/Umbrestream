"use client";

/**
 * Intercepted TV detail route (Phase 2, §6). Mirrors
 * `@modal/(.)movie/[id]/page.tsx` exactly — see that file's header for the
 * full rationale.
 */

import { use } from "react";
import { Params } from "@/types";
import { NextPage } from "next";
import DetailModal from "@/components/shell/DetailModal";
import TvShowDetailContent from "@/components/sections/TV/Details/DetailContent";

const InterceptedTvDetail: NextPage<Params<{ id: number }>> = ({ params }) => {
  const { id } = use(params);
  return (
    <DetailModal>
      <TvShowDetailContent id={id} />
    </DetailModal>
  );
};

export default InterceptedTvDetail;
