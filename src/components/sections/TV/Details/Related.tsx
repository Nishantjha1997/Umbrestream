"use client";

import SectionTitle from "@/components/ui/other/SectionTitle";
import { isEmpty } from "@/utils/helpers";
import { AppendToResponse, TV, TvShowDetails } from "tmdb-ts/dist/types";
import TvShowRelatedList from "./RelatedList";

/** A rail longer than this is a scroll marathon nobody finishes. */
const MAX_PER_ROW = 20;

interface TvShowRelatedSectionProps {
  tv: AppendToResponse<TvShowDetails, ("recommendations" | "similar")[], "tvShow">;
}

/**
 * The two "more to watch" rails — the TV twin of the movie section, including
 * the removal of the tab strip and its `sm:translate-y-10` alignment hack. See
 * @/components/sections/Movie/Detail/Related for the reasoning.
 */
const TvShowRelatedSection: React.FC<TvShowRelatedSectionProps> = ({ tv }) => {
  // tmdb-ts types a TV show's `recommendations` with the movie result shape, so
  // the double cast is load-bearing rather than lazy — the payload really is
  // TV shows.
  const recommendations = (tv.recommendations.results as unknown as TV[]).slice(0, MAX_PER_ROW);
  const recommendedIds = new Set(recommendations.map(({ id }) => id));
  const similar = (tv.similar.results as TV[])
    .filter(({ id }) => !recommendedIds.has(id))
    .slice(0, MAX_PER_ROW);

  if (isEmpty(recommendations) && isEmpty(similar)) return null;

  return (
    <section id="related" className="z-3 flex flex-col gap-8">
      {!isEmpty(recommendations) && (
        <div className="flex flex-col gap-3">
          <SectionTitle size="h5">More Like This</SectionTitle>
          <TvShowRelatedList tvs={recommendations} />
        </div>
      )}
      {!isEmpty(similar) && (
        <div className="flex flex-col gap-3">
          <SectionTitle size="h5">Similar Shows</SectionTitle>
          <TvShowRelatedList tvs={similar} />
        </div>
      )}
    </section>
  );
};

export default TvShowRelatedSection;
