package online.streamfree.nativeapp.auth

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.StreamFreeHttpClient
import online.streamfree.nativeapp.network.StreamFreeHttpTransport

class HistorySyncClient(
  private val transport: StreamFreeHttpTransport = StreamFreeHttpClient(PRODUCTION_POLICY),
) {
  suspend fun sync(
    bearerToken: String,
    mediaType: String,
    mediaId: String,
    currentTimeSeconds: Double,
    durationSeconds: Double,
    season: Int?,
    episode: Int?,
    completed: Boolean,
  ): Boolean = withContext(Dispatchers.IO) {
    if (bearerToken.isBlank() || mediaId.isBlank() || mediaType !in ALLOWED_TYPES) return@withContext false
    if (!currentTimeSeconds.isFinite() || currentTimeSeconds < 0.0 || !durationSeconds.isFinite() || durationSeconds <= 0.0) return@withContext false
    runCatching {
      val body = buildJsonObject {
        put("event", if (completed) "ended" else "timeupdate")
        put("currentTime", currentTimeSeconds.coerceAtMost(durationSeconds))
        put("duration", durationSeconds)
        put("mediaId", mediaId)
        put("mediaType", mediaType)
        season?.let { put("season", it) }
        episode?.let { put("episode", it) }
        put("completed", completed)
      }.toString()
      val response = transport.post(
        "$DEFAULT_API_BASE_URL/api/mobile/history",
        body.toByteArray(Charsets.UTF_8),
        mapOf(
          "Accept" to "application/json",
          "Content-Type" to "application/json",
          "Authorization" to "Bearer $bearerToken",
        ),
      )
      response.statusCode in 200..299
    }.getOrDefault(false)
  }

  companion object {
    const val DEFAULT_API_BASE_URL = "https://streamfree.online"
    val PRODUCTION_POLICY = SafeUrlPolicy(
      allowedHosts = setOf("streamfree.online", "www.streamfree.online", "umbrestream.vercel.app"),
      allowSubdomains = false,
      maxRedirects = 2,
    )
    val ALLOWED_TYPES = setOf("movie", "tv", "anime")
  }
}
