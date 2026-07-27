import { anilistApi, currentAniListSeason } from "@/api/anilist";
import { AniListMediaSummary, AniListPage } from "@/types/anilist";

/**
 * Row config for the anime home page (src/app/anime/page.tsx).
 *
 * Deliberately kept separate from `SiteConfigType["queryLists"]` in
 * @/config/site.tsx — that type (`QueryList<T extends Movie | TV>`) is
 * shaped specifically for TMDB's Movie/TV page-result format and doesn't fit
 * AniList's `{ pageInfo, media }` shape.
 */
export interface AnimeQueryList {
  name: string;
  query: () => Promise<AniListPage<AniListMediaSummary>>;
  param: string;
}

export const animeQueryLists: AnimeQueryList[] = [
  {
    name: "Trending Now",
    query: () => anilistApi.trending(),
    param: "trending",
  },
  {
    name: "Popular",
    query: () => anilistApi.popular(),
    param: "popular",
  },
  {
    name: "Top Rated",
    query: () => anilistApi.topRated(),
    param: "topRated",
  },
  {
    name: "This Season",
    // Computed at call time (rather than once at module load) so a
    // long-lived server process doesn't cache a stale season/year.
    query: () => {
      const { seasonYear, season } = currentAniListSeason();
      return anilistApi.thisSeason(seasonYear, season);
    },
    param: "thisSeason",
  },
];
