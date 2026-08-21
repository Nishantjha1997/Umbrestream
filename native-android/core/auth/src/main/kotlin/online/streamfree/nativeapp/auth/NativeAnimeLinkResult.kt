package online.streamfree.nativeapp.auth

import java.net.URI
import java.net.URLDecoder
import java.nio.charset.StandardCharsets

/**
 * The only data accepted from the browser return intent. OAuth tokens never
 * travel through this URI; the server stores them against the one-time state.
 */
data class NativeAnimeLinkResult(
  val provider: NativeAnimeProvider,
  val success: Boolean,
  val reason: String? = null,
) {
  val message: String
    get() = if (success) {
      "${provider.displayName} account linked successfully."
    } else {
      "${provider.displayName} linking could not be completed. Please try again."
    }

  companion object {
    /**
     * Parses only `streamfree://anime-link?provider=...&status=...`.
     * Unknown schemes, hosts, providers, statuses, and malformed queries are
     * ignored so arbitrary external intents cannot alter auth state.
     */
    fun parse(rawUri: String?): NativeAnimeLinkResult? {
      val uri = rawUri?.let { runCatching { URI(it) }.getOrNull() } ?: return null
      if (!uri.scheme.equals("streamfree", ignoreCase = true) ||
        !uri.host.equals("anime-link", ignoreCase = true) ||
        uri.userInfo != null || uri.port != -1 ||
        (uri.path != null && uri.path.isNotEmpty() && uri.path != "/") ||
        uri.fragment != null
      ) return null

      val query = parseQuery(uri.rawQuery ?: return null)
      if (query.keys.any { it !in CALLBACK_KEYS }) return null
      val provider = when (query["provider"]?.lowercase()) {
        NativeAnimeProvider.AniList.wireValue -> NativeAnimeProvider.AniList
        NativeAnimeProvider.MyAnimeList.wireValue -> NativeAnimeProvider.MyAnimeList
        else -> return null
      }
      val success = when (query["status"]?.lowercase()) {
        "success" -> true
        "error" -> false
        else -> return null
      }
      val reason = query["reason"]
      if (reason != null && !reason.matches(REASON_PATTERN)) return null
      return NativeAnimeLinkResult(
        provider = provider,
        success = success,
        reason = reason,
      )
    }

    private fun parseQuery(rawQuery: String): Map<String, String> = rawQuery
      .split('&')
      .asSequence()
      .mapNotNull { part ->
        val separator = part.indexOf('=')
        if (separator <= 0) return@mapNotNull null
        val key = decode(part.substring(0, separator))
        val value = decode(part.substring(separator + 1))
        if (key.isBlank()) null else key to value
      }
      .toMap()

    private fun decode(value: String): String = runCatching {
      URLDecoder.decode(value, StandardCharsets.UTF_8.name())
    }.getOrDefault("")

    private val REASON_PATTERN = Regex("[a-z_]{1,64}")
    private val CALLBACK_KEYS = setOf("provider", "status", "reason")
  }
}

val NativeAnimeProvider.displayName: String
  get() = when (this) {
    NativeAnimeProvider.AniList -> "AniList"
    NativeAnimeProvider.MyAnimeList -> "MyAnimeList"
  }
