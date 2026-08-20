package online.streamfree.nativeapp.auth

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.StreamFreeHttpClient
import online.streamfree.nativeapp.network.StreamFreeHttpTransport

enum class NativeAnimeProvider(val wireValue: String) {
  AniList("anilist"),
  MyAnimeList("mal"),
}

class NativeAnimeLinkClient(
  private val transport: StreamFreeHttpTransport = StreamFreeHttpClient(PRODUCTION_POLICY),
  private val json: Json = Json { ignoreUnknownKeys = true },
) {
  suspend fun start(provider: NativeAnimeProvider, bearerToken: String): String? = withContext(Dispatchers.IO) {
    runCatching {
      val response = transport.get(
        "$DEFAULT_API_BASE_URL/api/mobile/anime-links/start?provider=${provider.wireValue}",
        mapOf("Accept" to "application/json", "Authorization" to "Bearer $bearerToken"),
      )
      if (response.statusCode !in 200..299) return@runCatching null
      val authorizationUrl = json.parseToJsonElement(response.text).jsonObject["authorizationUrl"]
        ?.jsonPrimitive?.contentOrNull ?: return@runCatching null
      val parsed = authorizationUrl.toHttpUrlOrNull() ?: return@runCatching null
      if (parsed.scheme != "https" || parsed.host !in APPROVED_PROVIDER_HOSTS) return@runCatching null
      authorizationUrl
    }.getOrNull()
  }

  companion object {
    const val DEFAULT_API_BASE_URL = "https://streamfree.online"
    val APPROVED_PROVIDER_HOSTS = setOf("anilist.co", "myanimelist.net")
    val PRODUCTION_POLICY = SafeUrlPolicy(
      allowedHosts = setOf("streamfree.online", "www.streamfree.online", "umbrestream.vercel.app"),
      allowSubdomains = false,
      maxRedirects = 2,
    )
  }
}
