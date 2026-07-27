import { tmdbBrowser } from "@/api/tmdb-browser";
import { DiscoverMoviesFetchQueryType } from "@/types/movie";
import { MovieDiscoverResult } from "tmdb-ts/dist/types/discover";

interface FetchDiscoverMovies {
  page?: number;
  type?: DiscoverMoviesFetchQueryType;
  genres?: string;
}

const fetchDiscoverMovies = ({
  page = 1,
  type = "discover",
  genres,
}: FetchDiscoverMovies): Promise<MovieDiscoverResult> => {
  type R = MovieDiscoverResult;

  // Routed through /api/tmdb so the access token stays server-side.
  const queryData = {
    discover: () => tmdbBrowser.discover.movie<R>({ page, with_genres: genres }),
    todayTrending: () => tmdbBrowser.trending.trending<R>("movie", "day", { page }),
    thisWeekTrending: () => tmdbBrowser.trending.trending<R>("movie", "week", { page }),
    popular: () => tmdbBrowser.movies.popular<R>({ page }),
    nowPlaying: () => tmdbBrowser.movies.nowPlaying<R>({ page }),
    upcoming: () => tmdbBrowser.movies.upcoming<R>({ page }),
    topRated: () => tmdbBrowser.movies.topRated<R>({ page }),
  }[type];

  return queryData();
};

export default fetchDiscoverMovies;
