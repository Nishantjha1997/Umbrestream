package online.streamfree.nativeapp.source

import kotlinx.serialization.json.Json
import kotlinx.serialization.json.JsonArray
import kotlinx.serialization.json.JsonElement
import kotlinx.serialization.json.JsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.network.HttpResponse
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.SafeUrlValidator
import online.streamfree.nativeapp.network.StreamFreeHttpClient
import online.streamfree.nativeapp.network.StreamFreeHttpTransport
import java.net.URLEncoder
import java.nio.charset.StandardCharsets

/**
 * The only native source discovery entry point. It deliberately consumes the
 * versioned StreamFree API contract instead of duplicating web adapters in the
 * APK. The API may return embeds and direct streams; Media3 consumes only the
 * latter, while the future consent-based WebView path can consume the former.
 */
class StreamFreeSourceApiResolver(
  private val transport: StreamFreeHttpTransport,
  apiBaseUrl: String = DEFAULT_API_BASE_URL,
  private val bearerToken: () -> String? = { null },
  private val json: Json = Json { ignoreUnknownKeys = true },
) : SourceResolver {
  private val apiValidator = SafeUrlValidator(STREAMFREE_API_POLICY)
  private val sourceValidator = SafeUrlValidator(STREAMFREE_SOURCE_POLICY)
  private val apiBase: String = apiValidator.validate(apiBaseUrl).toString().trimEnd('/')

  override val descriptor: ProviderDescriptor = STREAMFREE_API_DESCRIPTOR

  // One API request returns many provider IDs. An explicit source selection is
  // still honoured by filtering the response below rather than silently
  // replacing the user's choice with another provider.
  override fun acceptsSourceId(sourceId: String): Boolean = sourceId.isNotBlank()

  override suspend fun resolve(request: PlaybackRequest): ResolutionResult {
    val query = queryFor(request)
      ?: return ResolutionResult(
        sources = emptyList(),
        attempts = listOf(
          ResolutionAttempt(
            providerId = descriptor.id,
            outcome = ResolutionOutcome.Rejected,
            durationMs = 0L,
            failureCategory = "missing_external_identifier",
          ),
        ),
      )

    val startedAt = System.nanoTime()
    return try {
      val headers = buildMap {
        put("Accept", "application/json")
        bearerToken()?.trim()?.takeIf(String::isNotEmpty)?.let { put("Authorization", "Bearer $it") }
      }
      val response = transport.get(buildUrl(query), headers)
      val sources = parseSources(response, request)
      val attempt = ResolutionAttempt(
        providerId = descriptor.id,
        outcome = if (sources.isEmpty()) ResolutionOutcome.NoCompatibleSource else ResolutionOutcome.Success,
        durationMs = elapsedMs(startedAt),
        failureCategory = if (sources.isEmpty()) "no_compatible_source" else null,
      )
      ResolutionResult(sources, listOf(attempt))
    } catch (error: Throwable) {
      ResolutionResult(
        sources = emptyList(),
        attempts = listOf(
          ResolutionAttempt(
            providerId = descriptor.id,
            outcome = ResolutionOutcome.Failed,
            durationMs = elapsedMs(startedAt),
            failureCategory = error::class.simpleName ?: "api_failure",
          ),
        ),
      )
    }
  }

  private fun queryFor(request: PlaybackRequest): Map<String, String>? {
    val query = linkedMapOf("mediaType" to request.mediaType.apiValue)
    when (request.mediaType) {
      MediaType.Movie, MediaType.Tv -> {
        val tmdbId = request.tmdbId ?: request.titleId.toIntOrNull() ?: return null
        query["tmdbId"] = tmdbId.toString()
      }
      MediaType.Anime -> {
        val anilistId = request.anilistId ?: request.titleId.toIntOrNull() ?: return null
        query["anilistId"] = anilistId.toString()
        request.malId?.let { query["malId"] = it.toString() }
        request.animeTmdbId?.let { query["animeTmdbId"] = it.toString() }
      }
    }
    request.title?.takeIf(String::isNotBlank)?.let { query["title"] = it }
    request.season?.let { query["season"] = it.toString() }
    request.episode?.let { query["episode"] = it.toString() }
    request.audioVariant?.let { query["preferredAudio"] = it.apiValue }
    request.resumePositionMs.takeIf { it > 0L }?.let { query["startAt"] = (it / 1000L).toString() }
    request.explicitSourceId?.let { query["sourceId"] = it }
    return query
  }

  private fun buildUrl(query: Map<String, String>): String {
    val encoded = query.entries.joinToString("&") { (key, value) ->
      "${encode(key)}=${encode(value)}"
    }
    return "$apiBase/api/player/sources?$encoded"
  }

  private fun encode(value: String): String =
    URLEncoder.encode(value, StandardCharsets.UTF_8.name())

  private fun parseSources(response: HttpResponse, request: PlaybackRequest): List<ResolvedSource> {
    val root = json.parseToJsonElement(response.text).jsonObject
    val values = root["sources"]?.jsonArray ?: return emptyList()
    return values.mapNotNull { value -> parseSource(value, request) }
      .distinctBy { Triple(it.providerId, it.playbackUrl, it.audioVariant) }
  }

  private fun parseSource(value: JsonElement, request: PlaybackRequest): ResolvedSource? {
    val source = value as? JsonObject ?: return null
    val rawUrl = source.string("url") ?: source.string("playbackUrl") ?: return null
    val url = try {
      sourceValidator.validate(rawUrl).toString()
    } catch (_: Throwable) {
      return null
    }
    val providerId = stableProviderId(
      source.string("id") ?: source.string("providerId") ?: source.string("label") ?: return null,
    )
    if (request.explicitSourceId != null && request.explicitSourceId != providerId) return null
    val audioVariant = source.audioVariant()
    if (request.audioVariant != null && audioVariant != null && request.audioVariant != audioVariant) return null
    val format = formatOf(source.string("kind") ?: source.string("format"), url) ?: return null
    return ResolvedSource(
      providerId = providerId,
      label = source.string("label")?.takeIf(String::isNotBlank) ?: providerId,
      playbackUrl = url,
      kind = format.kind,
      format = format.format,
      contractId = descriptor.id,
      audioVariant = audioVariant,
      quality = source.number("quality"),
      subtitles = parseTracks(source["subtitleTracks"] ?: source["subtitles"]),
    )
  }

  private fun parseTracks(value: JsonElement?): List<SubtitleTrack> {
    val array = value as? JsonArray ?: return emptyList()
    return array.mapNotNull { entry ->
      val track = entry as? JsonObject ?: return@mapNotNull null
      val url = track.string("url") ?: return@mapNotNull null
      val validated = try {
        sourceValidator.validate(url).toString()
      } catch (_: Throwable) {
        return@mapNotNull null
      }
      SubtitleTrack(
        id = track.string("id") ?: validated,
        languageTag = track.string("language") ?: track.string("languageTag") ?: "und",
        url = validated,
        format = track.string("format") ?: "vtt",
        isDefault = track.boolean("isDefault") == true,
      )
    }
  }

  private fun elapsedMs(startedAt: Long): Long = (System.nanoTime() - startedAt) / 1_000_000L

  private data class ParsedFormat(val kind: SourceKind, val format: StreamFormat)

  private fun formatOf(raw: String?, url: String): ParsedFormat? {
    val normalized = raw?.lowercase().orEmpty()
    return when {
      normalized in setOf("hls", "m3u8") || url.substringBefore('?').endsWith(".m3u8") ->
        ParsedFormat(SourceKind.NativeDirect, StreamFormat.Hls)
      normalized in setOf("dash", "mpd") || url.substringBefore('?').endsWith(".mpd") ->
        ParsedFormat(SourceKind.NativeDirect, StreamFormat.Dash)
      normalized in setOf("mp4", "video") || url.substringBefore('?').endsWith(".mp4") ->
        ParsedFormat(SourceKind.NativeDirect, StreamFormat.Mp4)
      normalized in setOf("iframe", "embed") -> ParsedFormat(SourceKind.Iframe, StreamFormat.Embed)
      else -> null
    }
  }

  private fun stableProviderId(value: String): String = value
    .trim()
    .lowercase()
    .replace(Regex("[^a-z0-9]+"), "-")
    .trim('-')
    .take(64)

  private fun JsonObject.string(key: String): String? = this[key]
    ?.jsonPrimitive
    ?.contentOrNull

  private fun JsonObject.number(key: String): Int? = this[key]
    ?.jsonPrimitive
    ?.contentOrNull
    ?.toDoubleOrNull()
    ?.toInt()
    ?.takeIf { it > 0 }

  private fun JsonObject.boolean(key: String): Boolean? = this[key]
    ?.jsonPrimitive
    ?.contentOrNull
    ?.toBooleanStrictOrNull()

  private fun JsonObject.audioVariant(): AudioVariant? =
    (string("audioVariant") ?: string("audio") ?: string("variant"))?.let {
      when (it.lowercase()) {
        "sub", "subtitle", "subbed" -> AudioVariant.Sub
        "dub", "dubbed" -> AudioVariant.Dub
        else -> null
      }
    }

  private val MediaType.apiValue: String
    get() = name.lowercase()

  private val AudioVariant.apiValue: String
    get() = name.lowercase()

  companion object {
    const val DEFAULT_API_BASE_URL = "https://streamfree.online"
    val SOURCE_HOSTS = setOf(
      "streamfree.online",
      "www.streamfree.online",
      "umbrestream.vercel.app",
      "streamfree-proxy.nishantjha31.workers.dev",
      "anivexa-api-tvd0.onrender.com",
      "embed.filmu.in",
      "player.cinezo.live",
      "vidlink.pro",
      "www.vidking.net",
      "embed.vidrift.in",
      "player.videasy.to",
      "vidsrc.me",
    )
    val STREAMFREE_API_POLICY = SafeUrlPolicy(
      allowedHosts = setOf("streamfree.online", "www.streamfree.online", "umbrestream.vercel.app"),
      allowSubdomains = false,
      maxRedirects = 2,
    )
    val STREAMFREE_SOURCE_POLICY = SafeUrlPolicy(
      allowedHosts = SOURCE_HOSTS,
      allowSubdomains = true,
      maxRedirects = 2,
    )
    val STREAMFREE_API_DESCRIPTOR = ProviderDescriptor(
      id = "streamfree-api",
      label = "StreamFree source API",
      kind = SourceKind.CloudApi,
      supportedMediaTypes = setOf(MediaType.Movie, MediaType.Tv, MediaType.Anime),
      hosts = SOURCE_HOSTS,
      capabilities = SourceCapabilities(
        formats = setOf(StreamFormat.Hls, StreamFormat.Dash, StreamFormat.Mp4, StreamFormat.Embed),
        audioVariants = setOf(AudioVariant.Sub, AudioVariant.Dub),
        supportsResume = true,
        supportsSubtitles = true,
      ),
    )

    fun production(bearerToken: () -> String? = { null }): StreamFreeSourceApiResolver =
      StreamFreeSourceApiResolver(
        transport = StreamFreeHttpClient(STREAMFREE_API_POLICY),
        bearerToken = bearerToken,
      )
  }
}
