package online.streamfree.nativeapp.source

import java.net.URI

/**
 * Narrow boundary for the consent-based native WebView fallback.
 *
 * This policy accepts only HTTPS iframe candidates from known provider embed
 * hosts. It does not inspect, rewrite, scrape, or expose provider page
 * contents to the app.
 */
object EmbedSourcePolicy {
  private val allowedHosts = setOf(
    "embed.filmu.in",
    "player.cinezo.live",
    "vidlink.pro",
    "www.vidking.net",
    "embed.vidrift.in",
    "player.videasy.to",
    "vidsrc.me",
  )

  fun isEligible(source: ResolvedSource): Boolean =
    source.kind == SourceKind.Iframe &&
      source.format == StreamFormat.Embed &&
      isAllowedUrl(source.playbackUrl)

  fun isAllowedUrl(rawUrl: String): Boolean {
    val uri = runCatching { URI(rawUrl) }.getOrNull() ?: return false
    if (uri.scheme?.lowercase() != "https") return false
    val host = uri.host?.lowercase()?.trimEnd('.') ?: return false
    return allowedHosts.any { host == it || host.endsWith(".$it") }
  }
}
