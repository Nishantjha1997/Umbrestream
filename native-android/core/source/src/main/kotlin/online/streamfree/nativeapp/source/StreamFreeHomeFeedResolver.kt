package online.streamfree.nativeapp.source

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.model.NativeContinueProgress
import online.streamfree.nativeapp.model.NativeHomeFeed
import online.streamfree.nativeapp.model.NativeHomeHero
import online.streamfree.nativeapp.model.NativeHomeRegion
import online.streamfree.nativeapp.model.NativeHomeRow
import online.streamfree.nativeapp.model.NativeMediaSummary
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.SafeUrlValidator
import online.streamfree.nativeapp.network.StreamFreeHttpClient
import online.streamfree.nativeapp.network.StreamFreeHttpTransport

class StreamFreeHomeFeedResolver(
  private val transport: StreamFreeHttpTransport,
  apiBaseUrl: String = DEFAULT_API_BASE_URL,
  private val bearerToken: () -> String? = { null },
  private val regionOverride: () -> String? = { null },
  private val json: Json = Json { ignoreUnknownKeys = true },
) {
  private val validator = SafeUrlValidator(API_POLICY)
  private val apiBase = validator.validate(apiBaseUrl).toString().trimEnd('/')

  suspend fun resolve(): NativeHomeFeed? = withContext(Dispatchers.IO) {
    val headers = buildMap {
      put("Accept", "application/json")
      bearerToken()?.trim()?.takeIf(String::isNotEmpty)?.let { put("Authorization", "Bearer $it") }
      regionOverride()?.trim()?.uppercase()?.takeIf { REGION_PATTERN.matches(it) }?.let {
        put("X-StreamFree-Region", it)
      }
    }
    runCatching {
      val response = transport.get("$apiBase/api/mobile/home", headers)
      if (response.statusCode !in 200..299) return@runCatching null
      parse(json.parseToJsonElement(response.text).jsonObject)
    }.getOrNull()
  }

  private fun parse(root: JsonObject): NativeHomeFeed? {
    if (root.int("schemaVersion") != 1) return null
    val regionObject = root["region"]?.jsonObject ?: return null
    val rows = root["rows"]?.jsonArray?.mapNotNull(::parseRow).orEmpty()
    if (rows.isEmpty()) return null
    val region = NativeHomeRegion(
      detectedCountry = regionObject.string("detectedCountry") ?: "US",
      effectiveCountry = regionObject.string("effectiveCountry") ?: "US",
      countryName = regionObject.string("countryName") ?: "United States",
      source = regionObject.string("source") ?: "default",
    )
    return NativeHomeFeed(
      region = region,
      provenance = root.string("provenance") ?: "fallback",
      hero = root["hero"]?.jsonObject?.let(::parseHero),
      rows = rows,
      generatedAt = root.string("generatedAt") ?: return null,
    )
  }

  private fun parseHero(value: JsonObject): NativeHomeHero? {
    val media = value["media"]?.jsonObject?.let(::parseMedia) ?: return null
    return NativeHomeHero(
      intent = value.string("intent") ?: "trending",
      media = media,
      progress = value["progress"]?.jsonObject?.let(::parseProgress),
    )
  }

  private fun parseProgress(value: JsonObject): NativeContinueProgress? {
    val type = mediaType(value.string("mediaType") ?: return null) ?: return null
    return NativeContinueProgress(
      mediaId = value.int("mediaId") ?: return null,
      mediaType = type,
      season = value.int("season") ?: return null,
      episode = value.int("episode") ?: return null,
      lastPositionMs = ((value.double("lastPosition") ?: 0.0) * 1_000.0).toLong().coerceAtLeast(0L),
      durationMs = ((value.double("duration") ?: 0.0) * 1_000.0).toLong().coerceAtLeast(0L),
      progressPercent = value.double("progressPercent") ?: 0.0,
    )
  }

  private fun parseRow(value: JsonElement): NativeHomeRow? {
    val row = value as? JsonObject ?: return null
    val items = row["items"]?.jsonArray?.mapNotNull { (it as? JsonObject)?.let(::parseMedia) }.orEmpty()
    if (items.isEmpty()) return null
    return NativeHomeRow(
      id = row.string("id") ?: return null,
      title = row.string("title") ?: return null,
      kind = row.string("kind") ?: "trending",
      items = items,
      nextCursor = row.string("nextCursor"),
    )
  }

  private fun parseMedia(value: JsonObject): NativeMediaSummary? {
    val type = mediaType(value.string("kind") ?: return null) ?: return null
    return NativeMediaSummary(
      mediaType = type,
      id = value.int("id") ?: return null,
      href = value.string("href") ?: return null,
      title = value.string("title") ?: return null,
      posterUrl = value.string("posterUrl") ?: return null,
      backdropUrl = value.string("backdropUrl"),
      year = value.int("year"),
      rating = value.double("rating"),
      isAdult = value.boolean("isAdult") ?: false,
      format = value.string("format"),
    )
  }

  private fun mediaType(value: String): MediaType? = when (value.lowercase()) {
    "movie" -> MediaType.Movie
    "tv" -> MediaType.Tv
    "anime" -> MediaType.Anime
    else -> null
  }

  private fun JsonObject.string(key: String): String? = this[key]?.jsonPrimitive?.contentOrNull
  private fun JsonObject.int(key: String): Int? = string(key)?.toDoubleOrNull()?.toInt()
  private fun JsonObject.double(key: String): Double? = string(key)?.toDoubleOrNull()
  private fun JsonObject.boolean(key: String): Boolean? = string(key)?.toBooleanStrictOrNull()

  companion object {
    const val DEFAULT_API_BASE_URL = "https://streamfree.online"
    val API_POLICY = SafeUrlPolicy(
      allowedHosts = setOf("streamfree.online", "www.streamfree.online", "umbrestream.vercel.app"),
      allowSubdomains = false,
      maxRedirects = 2,
    )
    private val REGION_PATTERN = Regex("[A-Z]{2}")

    fun production(
      bearerToken: () -> String? = { null },
      regionOverride: () -> String? = { null },
    ): StreamFreeHomeFeedResolver = StreamFreeHomeFeedResolver(
      transport = StreamFreeHttpClient(API_POLICY),
      bearerToken = bearerToken,
      regionOverride = regionOverride,
    )
  }
}
