package online.streamfree.nativeapp.auth

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.longOrNull
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.StreamFreeHttpClient
import online.streamfree.nativeapp.network.StreamFreeHttpTransport

data class NativeAnimeNotification(
  val id: Long,
  val animeId: Int,
  val title: String,
  val episode: Int,
  val airedAt: String?,
  val readAt: String?,
  val createdAt: String,
)

data class NativeAnimeNotifications(
  val notifications: List<NativeAnimeNotification>,
  val unreadCount: Int,
)

class AnimeNotificationClient(
  private val transport: StreamFreeHttpTransport = StreamFreeHttpClient(PRODUCTION_POLICY),
  private val json: Json = Json { ignoreUnknownKeys = true },
) {
  suspend fun load(bearerToken: String): NativeAnimeNotifications? = withContext(Dispatchers.IO) {
    runCatching {
      val response = transport.get(
        "$DEFAULT_API_BASE_URL/api/mobile/anime-notifications",
        mapOf("Accept" to "application/json", "Authorization" to "Bearer $bearerToken"),
      )
      if (response.statusCode !in 200..299) return@runCatching null
      val root = json.parseToJsonElement(response.text).jsonObject
      val notifications = root["notifications"]?.jsonArray.orEmpty().mapNotNull { value ->
        val item = value.jsonObject
        val id = item["id"]?.jsonPrimitive?.longOrNull ?: return@mapNotNull null
        val animeId = item["anilist_id"]?.jsonPrimitive?.intOrNull ?: return@mapNotNull null
        val episode = item["episode"]?.jsonPrimitive?.intOrNull ?: return@mapNotNull null
        NativeAnimeNotification(
          id = id,
          animeId = animeId,
          title = item["title"]?.jsonPrimitive?.contentOrNull.orEmpty(),
          episode = episode,
          airedAt = item["aired_at"]?.jsonPrimitive?.contentOrNull,
          readAt = item["read_at"]?.jsonPrimitive?.contentOrNull,
          createdAt = item["created_at"]?.jsonPrimitive?.contentOrNull.orEmpty(),
        )
      }
      NativeAnimeNotifications(
        notifications = notifications,
        unreadCount = root["unreadCount"]?.jsonPrimitive?.intOrNull ?: notifications.count { it.readAt == null },
      )
    }.getOrNull()
  }

  suspend fun markAllRead(bearerToken: String): Boolean = withContext(Dispatchers.IO) {
    runCatching {
      val response = transport.post(
        "$DEFAULT_API_BASE_URL/api/mobile/anime-notifications",
        "{\"all\":true}".toByteArray(Charsets.UTF_8),
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
  }
}
