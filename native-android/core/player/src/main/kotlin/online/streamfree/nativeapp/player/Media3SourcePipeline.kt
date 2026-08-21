package online.streamfree.nativeapp.player

import android.content.Context
import android.net.Uri
import androidx.media3.common.MediaItem
import androidx.media3.common.MimeTypes
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultDataSource
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.okhttp.OkHttpDataSource
import androidx.media3.exoplayer.source.DefaultMediaSourceFactory
import androidx.media3.exoplayer.source.MediaSource
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.SafeUrlValidator
import online.streamfree.nativeapp.source.ProviderHeaderRegistry
import online.streamfree.nativeapp.source.PlaybackRequest
import online.streamfree.nativeapp.source.ResolvedSource
import online.streamfree.nativeapp.source.SourceResolverRegistry

data class Media3PipelinePolicy(
  val defaultUserAgent: String = "StreamFree Android Player",
  val maxRedirects: Int = 3,
  val streamCache: StreamCachePolicy = StreamCachePolicy(),
) {
  init {
    require(defaultUserAgent.isNotBlank()) { "A player user agent is required" }
    require(maxRedirects in 0..3) { "Media3 redirects must be capped at three" }
  }
}

class Media3SourcePipeline(
  context: Context,
  private val registry: SourceResolverRegistry,
  private val headerRegistry: ProviderHeaderRegistry = ProviderHeaderRegistry(emptyList()),
  private val policy: Media3PipelinePolicy = Media3PipelinePolicy(),
) {
  private val applicationContext = context.applicationContext

  @androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
  fun createMediaSource(request: PlaybackRequest, source: ResolvedSource): MediaSource {
    require(Media3PlaybackContracts.isNativePlayable(source.format)) {
      "Iframe sources require the separate consent-based WebView fallback"
    }
    val descriptor = registry.descriptor(source.contractId)
      ?: throw IllegalArgumentException("Unknown source contract: ${source.contractId}")
    require(registry.isCompatible(source, request)) {
      "Source is incompatible with its provider contract: ${source.providerId}"
    }

    val safePolicy = SafeUrlPolicy(
      allowedHosts = descriptor.hosts,
      allowSubdomains = true,
      maxRedirects = policy.maxRedirects,
    )
    val validator = SafeUrlValidator(safePolicy)
    val validatedUrl = validator.validate(source.playbackUrl)
    val subtitles = source.subtitles.map { subtitle ->
      MediaItem.SubtitleConfiguration.Builder(Uri.parse(validator.validate(subtitle.url).toString()))
        .setMimeType(subtitleMimeType(subtitle.format))
        .setLanguage(subtitle.languageTag)
        .setSelectionFlags(
          if (subtitle.isDefault) androidx.media3.common.C.SELECTION_FLAG_DEFAULT else 0,
        )
        .build()
    }

    val headers = source.headerPolicyId?.let(headerRegistry::headersFor).orEmpty()
    val httpFactory = OkHttpDataSource.Factory(SafeMedia3HttpClient(safePolicy).build())
      .setDefaultRequestProperties(headers)
      .setUserAgent(headers.userAgentOrNull() ?: policy.defaultUserAgent)
    val upstreamFactory: DataSource.Factory = DefaultDataSource.Factory(applicationContext, httpFactory)
    val dataSourceFactory: DataSource.Factory = if (policy.streamCache.shouldCache(source)) {
      StreamCacheStore.getOrCreate(applicationContext, policy.streamCache)?.let { cache ->
        CacheDataSource.Factory()
          .setCache(cache)
          .setUpstreamDataSourceFactory(upstreamFactory)
          .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR)
      } ?: upstreamFactory
    } else {
      upstreamFactory
    }
    val mediaItem = MediaItem.Builder()
      .setUri(validatedUrl.toString())
      .setMimeType(Media3PlaybackContracts.mimeType(source.format))
      .setSubtitleConfigurations(subtitles)
      .build()

    return DefaultMediaSourceFactory(dataSourceFactory).createMediaSource(mediaItem)
  }

  private fun subtitleMimeType(format: String): String = when (format.lowercase()) {
    "vtt", "webvtt" -> MimeTypes.TEXT_VTT
    "ass", "ssa" -> MimeTypes.TEXT_SSA
    "srt" -> MimeTypes.APPLICATION_SUBRIP
    else -> throw IllegalArgumentException("Unsupported subtitle format: $format")
  }

  private fun Map<String, String>.userAgentOrNull(): String? = entries
    .firstOrNull { it.key.equals("User-Agent", ignoreCase = true) }
    ?.value
}
