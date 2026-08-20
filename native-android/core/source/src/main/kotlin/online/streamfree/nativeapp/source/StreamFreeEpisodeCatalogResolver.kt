package online.streamfree.nativeapp.source

import kotlinx.coroutines.async
import kotlinx.coroutines.awaitAll
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import online.streamfree.nativeapp.model.EpisodeCatalog
import online.streamfree.nativeapp.model.EpisodeRef
import online.streamfree.nativeapp.model.EpisodeSummary
import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.model.SeasonEpisodes
import online.streamfree.nativeapp.network.HttpResponse
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.SafeUrlValidator
import online.streamfree.nativeapp.network.StreamFreeHttpClient
import online.streamfree.nativeapp.network.StreamFreeHttpTransport

interface EpisodeCatalogResolver {
  suspend fun resolve(request: PlaybackRequest): EpisodeCatalog?
}

/** Resolves TV season metadata through StreamFree's allowlisted TMDB proxy. */
class StreamFreeEpisodeCatalogResolver(
  private val transport: StreamFreeHttpTransport,
  apiBaseUrl: String = DEFAULT_API_BASE_URL,
  private val json: Json = Json { ignoreUnknownKeys = true },
) : EpisodeCatalogResolver {
  private val validator = SafeUrlValidator(API_POLICY)
  private val apiBase = validator.validate(apiBaseUrl).toString().trimEnd('/')

  override suspend fun resolve(request: PlaybackRequest): EpisodeCatalog? = withContext(Dispatchers.IO) {
    resolveBlocking(request)
  }

  private suspend fun resolveBlocking(request: PlaybackRequest): EpisodeCatalog? {
    if (request.mediaType != MediaType.Tv) return null
    val tmdbId = request.tmdbId ?: request.titleId.toIntOrNull() ?: return null
    val details = fetch("api/tmdb/tv/$tmdbId") ?: return null
    val seasonNumbers = details["seasons"]
      ?.jsonArray
      ?.mapNotNull { season ->
        val record = season as? JsonObject ?: return@mapNotNull null
        val number = record.number("season_number") ?: return@mapNotNull null
        val count = record.number("episode_count") ?: return@mapNotNull null
        number.takeIf { it > 0 && count > 0 }
      }
      ?.distinct()
      ?.sorted()
      .orEmpty()
    if (seasonNumbers.isEmpty()) return null

    val requestedSeason = request.season?.takeIf { it in seasonNumbers } ?: seasonNumbers.first()
    val seasonPayloads = coroutineScope {
      seasonNumbers.map { season ->
        async { season to fetch("api/tmdb/tv/$tmdbId/season/$season") }
      }.awaitAll()
    }
    val seasons = seasonPayloads.mapNotNull { (season, response) ->
      val episodes = response?.episodes?.episodeNumbers().orEmpty()
      if (episodes.isEmpty()) null else SeasonEpisodes(season, episodes)
    }
    val episodeSummaries = seasonPayloads.flatMap { (season, response) ->
      response?.episodes?.summaries(season).orEmpty()
    }
    if (seasons.none { it.season == requestedSeason }) return null
    return EpisodeCatalog(seasons = seasons, episodes = episodeSummaries)
  }

  private fun fetch(path: String): JsonObject? = try {
    val response = transport.get(
      buildUrl(path),
      headers = mapOf("Accept" to "application/json"),
    )
    json.parseToJsonElement(response.text).jsonObject
  } catch (_: Throwable) {
    null
  }

  private fun buildUrl(path: String): String = "$apiBase/$path?language=en-US"

  private fun JsonObject.number(key: String): Int? = this[key]
    ?.jsonPrimitive
    ?.contentOrNull
    ?.toIntOrNull()

  private val JsonObject.episodes: JsonArray?
    get() = this["episodes"] as? JsonArray

  private fun JsonArray.episodeNumbers(): List<Int> = mapNotNull { value ->
    (value as? JsonObject)?.number("episode_number")?.takeIf { it > 0 }
  }

  private fun JsonArray.summaries(season: Int): List<EpisodeSummary> = mapNotNull { value ->
    val episode = value as? JsonObject ?: return@mapNotNull null
    val number = episode.number("episode_number")?.takeIf { it > 0 } ?: return@mapNotNull null
    EpisodeSummary(
      ref = EpisodeRef(season, number),
      title = episode.string("name")?.takeIf(String::isNotBlank) ?: "Episode $number",
      airDate = episode.string("air_date"),
      runtimeMinutes = episode.number("runtime"),
    )
  }

  private fun JsonObject.string(key: String): String? = this[key]
    ?.jsonPrimitive
    ?.contentOrNull

  companion object {
    const val DEFAULT_API_BASE_URL = "https://streamfree.online"
    val API_POLICY = SafeUrlPolicy(
      allowedHosts = setOf("streamfree.online", "www.streamfree.online", "umbrestream.vercel.app"),
      allowSubdomains = false,
      maxRedirects = 2,
    )

    fun production(): StreamFreeEpisodeCatalogResolver =
      StreamFreeEpisodeCatalogResolver(StreamFreeHttpClient(API_POLICY))
  }
}
