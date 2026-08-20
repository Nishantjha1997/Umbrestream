package online.streamfree.nativeapp.model

/** A playable episode reference. Season zero and episode zero are never valid. */
data class EpisodeRef(
  val season: Int,
  val episode: Int,
) {
  init {
    require(season > 0) { "Playable seasons must be greater than zero" }
    require(episode > 0) { "Playable episodes must be greater than zero" }
  }
}

/** Metadata needed to resolve adjacent playable episodes without client guesses. */
data class SeasonEpisodes(
  val season: Int,
  val episodes: List<Int>,
) {
  init {
    require(season >= 0) { "Season cannot be negative" }
  }

  val playableEpisodes: List<Int>
    get() = episodes.filter { it > 0 }.distinct().sorted()
}

enum class EpisodeDirection { Previous, Next }

/**
 * Resolves adjacent episodes from authoritative season metadata. Specials and
 * season zero are ignored, gaps are preserved, and the resolver returns null
 * only at the true beginning/end of the playable catalogue.
 */
object AdjacentEpisodeResolver {
  fun resolve(
    current: EpisodeRef,
    seasons: List<SeasonEpisodes>,
    direction: EpisodeDirection,
  ): EpisodeRef? {
    val playableSeasons = seasons
      .filter { it.season > 0 && it.playableEpisodes.isNotEmpty() }
      .distinctBy { it.season }
      .sortedBy { it.season }
    val seasonIndex = playableSeasons.indexOfFirst { it.season == current.season }
    if (seasonIndex < 0) return null

    val currentEpisodes = playableSeasons[seasonIndex].playableEpisodes
    val episodeIndex = currentEpisodes.indexOf(current.episode)
    if (episodeIndex < 0) return null

    return when (direction) {
      EpisodeDirection.Previous -> when {
        episodeIndex > 0 -> EpisodeRef(current.season, currentEpisodes[episodeIndex - 1])
        seasonIndex > 0 -> playableSeasons[seasonIndex - 1].playableEpisodes.lastOrNull()?.let {
          EpisodeRef(playableSeasons[seasonIndex - 1].season, it)
        }
        else -> null
      }
      EpisodeDirection.Next -> when {
        episodeIndex < currentEpisodes.lastIndex -> EpisodeRef(current.season, currentEpisodes[episodeIndex + 1])
        seasonIndex < playableSeasons.lastIndex -> playableSeasons[seasonIndex + 1].playableEpisodes.firstOrNull()?.let {
          EpisodeRef(playableSeasons[seasonIndex + 1].season, it)
        }
        else -> null
      }
    }
  }
}
