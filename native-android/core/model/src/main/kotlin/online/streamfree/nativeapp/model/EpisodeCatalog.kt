package online.streamfree.nativeapp.model

data class EpisodeSummary(
  val ref: EpisodeRef,
  val title: String,
  val airDate: String? = null,
  val runtimeMinutes: Int? = null,
)

data class EpisodeCatalog(
  val seasons: List<SeasonEpisodes>,
  val episodes: List<EpisodeSummary>,
) {
  init {
    require(seasons.all { it.season > 0 }) { "Episode catalog cannot include season zero" }
    require(episodes.all { it.ref.season > 0 && it.ref.episode > 0 }) {
      "Episode catalog cannot include specials"
    }
  }

  fun episodesForSeason(season: Int): List<EpisodeSummary> = episodes
    .filter { it.ref.season == season }
    .sortedBy { it.ref.episode }
}
