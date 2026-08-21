package online.streamfree.nativeapp.player

import android.content.Context
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.cache.Cache
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import java.io.File
import online.streamfree.nativeapp.source.ResolvedSource
import online.streamfree.nativeapp.source.SourceKind

/**
 * Policy for the on-the-fly playback cache.
 *
 * This is deliberately not an offline-download permission. The cache is an
 * app-private, bounded performance cache and may be purged by Android at any
 * time. Permanent downloads require a separate, provider-authorized Media3
 * DownloadService flow and are disabled until that contract exists.
 */
data class StreamCachePolicy(
  val enabled: Boolean = true,
  val maxBytes: Long = 256L * 1024L * 1024L,
  val offlineDownloads: OfflineDownloadPolicy = OfflineDownloadPolicy(),
) {
  init {
    require(maxBytes in MIN_CACHE_BYTES..MAX_CACHE_BYTES) {
      "Stream cache size must be between 16 MiB and 512 MiB"
    }
  }

  fun shouldCache(source: ResolvedSource): Boolean =
    enabled && source.kind == SourceKind.NativeDirect

  fun permitsOfflinePlayback(source: ResolvedSource): Boolean =
    offlineDownloads.canDownload(source)

  private companion object {
    const val MIN_CACHE_BYTES = 16L * 1024L * 1024L
    const val MAX_CACHE_BYTES = 512L * 1024L * 1024L
  }
}

/**
 * Explicit allowlist for a future Media3 DownloadService integration.
 *
 * Empty by default: no current third-party provider is silently treated as
 * authorized for permanent downloads. A release may opt in only after its
 * provider contract explicitly permits offline storage.
 */
data class OfflineDownloadPolicy(
  val enabled: Boolean = false,
  val permittedProviderIds: Set<String> = emptySet(),
) {
  fun canDownload(source: ResolvedSource): Boolean =
    enabled && source.kind == SourceKind.NativeDirect && source.providerId in permittedProviderIds
}

/**
 * Process-wide Media3 cache holder.
 *
 * Media3 requires a single SimpleCache instance per directory in a process.
 * Both the activity and media-session service can construct a player, so the
 * holder prevents duplicate database locks while keeping the cache lifecycle
 * tied to the application process.
 */
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
object StreamCacheStore {
  private val lock = Any()
  private val caches = mutableMapOf<String, Cache>()

  fun getOrCreate(context: Context, policy: StreamCachePolicy): Cache? {
    if (!policy.enabled) return null
    val directory = File(context.applicationContext.cacheDir, "streamfree-media-cache")
    val key = directory.absolutePath
    synchronized(lock) {
      caches[key]?.let { return it }
      return runCatching {
        directory.mkdirs()
        SimpleCache(
          directory,
          LeastRecentlyUsedCacheEvictor(policy.maxBytes),
          StandaloneDatabaseProvider(context.applicationContext),
        )
      }.getOrNull()?.also { caches[key] = it }
    }
  }
}
