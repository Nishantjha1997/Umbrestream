import { tmdbBrowser } from "@/api/tmdb-browser";
import { DiscoverTvShowsFetchQueryType } from "@/types/movie";
import { TvShowDiscoverResult } from "tmdb-ts/dist/types/discover";

interface FetchDiscoverTvShows {
  page?: number;
  type?: DiscoverTvShowsFetchQueryType;
  genres?: string;
}

const fetchDiscoverTvShows = ({
  page = 1,
  type = "discover",
  genres,
}: FetchDiscoverTvShows): Promise<TvShowDiscoverResult> => {
  type R = TvShowDiscoverResult;

  // Routed through /api/tmdb so the access token stays server-side.
  const queryData = {
    discover: () => tmdbBrowser.discover.tv<R>({ page, with_genres: genres }),
    todayTrending: () => tmdbBrowser.trending.trending<R>("tv", "day", { page }),
    thisWeekTrending: () => tmdbBrowser.trending.trending<R>("tv", "week", { page }),
    popular: () => tmdbBrowser.tvShows.popular<R>({ page }),
    onTheAir: () => tmdbBrowser.tvShows.onTheAir<R>({ page }),
    topRated: () => tmdbBrowser.tvShows.topRated<R>({ page }),
  }[type];

  return queryData();
};

export default fetchDiscoverTvShows;
