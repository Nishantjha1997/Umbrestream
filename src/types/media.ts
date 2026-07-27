export type MediaKind = "movie" | "tv" | "anime";

/**
 * The single shape every card, shelf, and grid consumes.
 *
 * Before this, Movie/TV/Anime each had their own near-identical card and row
 * components differing only in field names — `title` vs `name`, `release_date`
 * vs `first_air_date`, `vote_average` (0-10) vs `averageScore` (0-100),
 * relative TMDB paths vs absolute AniList URLs. Normalizing once at the edge
 * means the presentation layer never branches on media type again.
 *
 * Every field here is already display-ready: `title` has been resolved through
 * its fallback chain, `posterUrl` is absolute, and `rating` is on a single
 * 0-10 scale.
 */
export interface MediaSummary {
  kind: MediaKind;
  id: number;
  /** Precomputed detail route, e.g. /movie/27205 or /anime/21. */
  href: string;
  title: string;
  posterUrl: string;
  backdropUrl?: string;
  year?: number;
  /** Normalized to 0-10 regardless of source scale. */
  rating?: number;
  isAdult: boolean;
  /** Anime only: TV / OVA / Movie / ONA etc., already humanized. */
  format?: string;
}
