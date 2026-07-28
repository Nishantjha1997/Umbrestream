"use client";

import SectionTitle from "@/components/ui/other/SectionTitle";
import { isEmpty } from "@/utils/helpers";
import { AppendToResponse, Movie, MovieDetails } from "tmdb-ts/dist/types";
import RelatedMovieList from "./RelatedList";

/** A rail longer than this is a scroll marathon nobody finishes. */
const MAX_PER_ROW = 20;

interface RelatedSectionProps {
  movie: AppendToResponse<MovieDetails, ("recommendations" | "similar")[], "movie">;
}

/**
 * The two "more to watch" rails.
 *
 * Previously these were `Tab`s inside a right-floated tab strip, with the
 * section heading dragged into place by `sm:translate-y-10` — a magic number
 * that faked alignment against the strip and broke at any other font size or
 * breakpoint. Both are gone: tabs-inside-a-shelf is an unusual pattern for
 * streaming (Netflix and Apple TV+ both just stack rows), and two plain rows
 * need no alignment hack because nothing is floated beside them.
 *
 * TMDB's `similar` and `recommendations` overlap heavily, so the second row is
 * deduped against the first — the same poster twice reads as a bug.
 */
const RelatedSection: React.FC<RelatedSectionProps> = ({ movie }) => {
  const recommendations = (movie.recommendations.results as Movie[]).slice(0, MAX_PER_ROW);
  const recommendedIds = new Set(recommendations.map(({ id }) => id));
  const similar = (movie.similar.results as Movie[])
    .filter(({ id }) => !recommendedIds.has(id))
    .slice(0, MAX_PER_ROW);

  if (isEmpty(recommendations) && isEmpty(similar)) return null;

  return (
    <section id="related" className="z-3 flex flex-col gap-8">
      {!isEmpty(recommendations) && (
        <div className="flex flex-col gap-3">
          <SectionTitle size="h5">More Like This</SectionTitle>
          <RelatedMovieList movies={recommendations} />
        </div>
      )}
      {!isEmpty(similar) && (
        <div className="flex flex-col gap-3">
          <SectionTitle size="h5">Similar Movies</SectionTitle>
          <RelatedMovieList movies={similar} />
        </div>
      )}
    </section>
  );
};

export default RelatedSection;
