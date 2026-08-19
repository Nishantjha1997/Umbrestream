export interface EpisodeLike {
  episode_number: number;
  season_number?: number;
}

export interface SeasonLike {
  season_number: number;
  episode_count?: number;
}

export interface AdjacentEpisode {
  season: number;
  episode: number;
}

function validSeason(season: SeasonLike): boolean {
  return season.season_number > 0 && (season.episode_count ?? 0) > 0;
}

function validEpisodes(episodes: EpisodeLike[]): EpisodeLike[] {
  return episodes
    .filter((episode) => episode.episode_number > 0)
    .sort((a, b) => a.episode_number - b.episode_number);
}

/**
 * Resolve the next or previous real episode without making a client guess at
 * season boundaries. Season zero and episode zero specials are intentionally
 * excluded. The current season's loaded episode list is authoritative for
 * gaps; season summaries provide the boundary target without another request.
 */
export function resolveAdjacentEpisode(
  seasons: SeasonLike[],
  currentSeason: number,
  currentEpisode: number,
  currentEpisodes: EpisodeLike[],
  direction: "next" | "previous",
): AdjacentEpisode | null {
  const orderedSeasons = seasons.filter(validSeason).sort((a, b) => a.season_number - b.season_number);
  const seasonIndex = orderedSeasons.findIndex((season) => season.season_number === currentSeason);
  if (seasonIndex < 0) return null;

  const episodes = validEpisodes(currentEpisodes);
  const episodeIndex = episodes.findIndex((episode) => episode.episode_number === currentEpisode);
  if (episodeIndex < 0) return null;

  if (direction === "next" && episodeIndex < episodes.length - 1) {
    return { season: currentSeason, episode: episodes[episodeIndex + 1].episode_number };
  }
  if (direction === "previous" && episodeIndex > 0) {
    return { season: currentSeason, episode: episodes[episodeIndex - 1].episode_number };
  }

  const adjacentSeason = orderedSeasons[seasonIndex + (direction === "next" ? 1 : -1)];
  if (!adjacentSeason) return null;

  return {
    season: adjacentSeason.season_number,
    episode:
      direction === "next"
        ? 1
        : Math.max(1, adjacentSeason.episode_count ?? 1),
  };
}
