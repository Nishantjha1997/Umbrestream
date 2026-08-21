"use client";

import { tmdbBrowser } from "@/api/tmdb-browser";
import SectionTitle from "@/components/ui/other/SectionTitle";
import { getImageUrl } from "@/utils/movies";
import { Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import type { MovieDetails } from "tmdb-ts/dist/types/movies";

interface MovieSuggestion {
  id: number;
  title?: string;
  original_title?: string;
  poster_path?: string | null;
  release_date?: string;
  vote_average?: number;
}

interface MovieSuggestionPage {
  results: MovieSuggestion[];
}

interface MoviePlayerSuggestionsProps {
  movie: MovieDetails;
}

function uniqueMovies(groups: MovieSuggestion[][], currentId: number) {
  const seen = new Set<number>([currentId]);
  return groups.flat().filter((suggestion) => {
    if (!suggestion.id || seen.has(suggestion.id) || !suggestion.poster_path) return false;
    seen.add(suggestion.id);
    return true;
  });
}

function SuggestionCard({ movie }: { movie: MovieSuggestion }) {
  const title = movie.title || movie.original_title || "Untitled movie";
  const year = movie.release_date?.slice(0, 4);
  const rating = movie.vote_average && movie.vote_average > 0 ? movie.vote_average.toFixed(1) : null;

  return (
    <Link
      href={`/movie/${movie.id}`}
      prefetch={false}
      className="group flex min-w-0 gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-2.5 outline-none transition hover:border-white/20 hover:bg-white/[0.07] focus-visible:ring-2 focus-visible:ring-white/70"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={getImageUrl(movie.poster_path ?? undefined, "poster")}
        alt=""
        aria-hidden="true"
        loading="lazy"
        decoding="async"
        className="aspect-2/3 w-14 shrink-0 rounded-xl object-cover shadow-lg transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none"
      />
      <span className="flex min-w-0 flex-col justify-center gap-1">
        <span className="line-clamp-2 text-sm leading-snug font-semibold text-white/90">
          {title}
        </span>
        <span className="text-xs text-white/55">
          {[year, rating ? `★ ${rating}` : null].filter(Boolean).join(" · ") || "Movie"}
        </span>
      </span>
    </Link>
  );
}

/**
 * Movies have no episode rail, so the desktop workspace uses that column for
 * a small, lazy recommendation queue. It moves below the player on narrow
 * screens and never enters the fullscreen element.
 */
const MoviePlayerSuggestions: React.FC<MoviePlayerSuggestionsProps> = ({ movie }) => {
  const { data, isPending } = useQuery({
    queryKey: ["movie-player-suggestions", movie.id],
    queryFn: async () => {
      const [recommendations, similar, trending] = await Promise.all([
        tmdbBrowser.movies.recommendations<MovieSuggestionPage>(movie.id, { page: 1 }),
        tmdbBrowser.movies.similar<MovieSuggestionPage>(movie.id, { page: 1 }),
        tmdbBrowser.trending.trending<MovieSuggestionPage>("movie", "week", { page: 1 }),
      ]);

      return {
        recommendations: uniqueMovies([recommendations.results], movie.id).slice(0, 5),
        trending: uniqueMovies(
          [trending.results, recommendations.results, similar.results],
          movie.id,
        ).slice(0, 5),
      };
    },
    staleTime: 30 * 60 * 1000,
  });

  const groups = [
    { title: "More like this", items: data?.recommendations ?? [] },
    { title: "Trending now", items: data?.trending ?? [] },
  ].filter((group) => group.items.length > 0);

  return (
    <aside
      aria-labelledby="movie-player-suggestions-title"
      className="min-w-0 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)] lg:overflow-y-auto lg:pr-1"
    >
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="mb-1 text-[10px] font-semibold tracking-[0.18em] text-primary uppercase">
            Keep exploring
          </p>
          <SectionTitle id="movie-player-suggestions-title" size="h5">
            Suggested for you
          </SectionTitle>
        </div>
        {isPending && <Spinner size="sm" color="default" aria-label="Loading suggestions" />}
      </div>

      {groups.length > 0 ? (
        <div className="flex flex-col gap-5">
          {groups.map((group) => (
            <section key={group.title} aria-label={group.title} className="flex flex-col gap-2.5">
              <h3 className="text-xs font-semibold tracking-wide text-white/55 uppercase">
                {group.title}
              </h3>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-1">
                {group.items.map((suggestion) => (
                  <SuggestionCard key={`${group.title}-${suggestion.id}`} movie={suggestion} />
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : (
        !isPending && (
          <p className="rounded-2xl border border-white/8 bg-white/[0.025] p-4 text-sm text-white/55">
            Suggestions will appear here when more titles are available.
          </p>
        )
      )}
    </aside>
  );
};

export default MoviePlayerSuggestions;
