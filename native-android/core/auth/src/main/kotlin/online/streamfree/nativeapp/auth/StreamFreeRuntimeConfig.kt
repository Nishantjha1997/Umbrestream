package online.streamfree.nativeapp.auth

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.contentOrNull
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.SafeUrlValidator
import online.streamfree.nativeapp.network.StreamFreeHttpClient
import online.streamfree.nativeapp.network.StreamFreeHttpTransport

data class StreamFreeRuntimeConfig(
  val supabaseUrl: String,
  val supabasePublishableKey: String,
) {
  val supabaseHost: String get() = requireNotNull(supabaseUrl.toHttpUrlOrNull()).host
}

class StreamFreeRuntimeConfigClient(
  private val transport: StreamFreeHttpTransport = StreamFreeHttpClient(PRODUCTION_POLICY),
  private val json: Json = Json { ignoreUnknownKeys = true },
) {
  suspend fun load(): StreamFreeRuntimeConfig? = withContext(Dispatchers.IO) {
    runCatching {
      val response = transport.get("$DEFAULT_API_BASE_URL/api/mobile/config", mapOf("Accept" to "application/json"))
      if (response.statusCode !in 200..299) return@runCatching null
      val root = json.parseToJsonElement(response.text).jsonObject
      val rawUrl = root["supabaseUrl"]?.jsonPrimitive?.contentOrNull ?: return@runCatching null
      val publishableKey = root["supabasePublishableKey"]?.jsonPrimitive?.contentOrNull
        ?.takeIf { it.isNotBlank() }
        ?: return@runCatching null
      val url = rawUrl.toHttpUrlOrNull() ?: return@runCatching null
      if (url.scheme != "https" || url.port != 443 || url.encodedPath !in setOf("", "/") || url.query != null || url.fragment != null) {
        return@runCatching null
      }
      SafeUrlValidator(
        SafeUrlPolicy(allowedHosts = setOf(url.host), allowSubdomains = false),
      ).validate(url)
      StreamFreeRuntimeConfig(url.toString().trimEnd('/'), publishableKey)
    }.getOrNull()
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
