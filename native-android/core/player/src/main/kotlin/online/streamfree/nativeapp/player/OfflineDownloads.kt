@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package online.streamfree.nativeapp.player

import android.content.Context
import android.net.Uri
import androidx.media3.common.MimeTypes
import androidx.media3.database.StandaloneDatabaseProvider
import androidx.media3.datasource.DataSource
import androidx.media3.datasource.DefaultHttpDataSource
import androidx.media3.datasource.cache.Cache
import androidx.media3.datasource.cache.CacheDataSource
import androidx.media3.datasource.cache.NoOpCacheEvictor
import androidx.media3.datasource.cache.SimpleCache
import androidx.media3.exoplayer.offline.Download
import androidx.media3.exoplayer.offline.DownloadManager
import androidx.media3.exoplayer.offline.DownloadRequest
import androidx.media3.exoplayer.offline.DownloadService
import androidx.media3.exoplayer.offline.DownloadNotificationHelper
import androidx.media3.exoplayer.scheduler.Requirements
import java.io.File
import java.security.MessageDigest
import java.util.concurrent.Executors
import online.streamfree.nativeapp.source.PlaybackRequest
import online.streamfree.nativeapp.source.ResolvedSource
import online.streamfree.nativeapp.source.SourceKind
import online.streamfree.nativeapp.source.StreamFormat

/**
 * Media3 offline-download integration. The persistent cache is intentionally
 * separate from the bounded playback cache: downloaded content must never be
 * evicted by normal streaming activity.
 *
 * A source is downloadable only when the release explicitly enables the
 * provider ID and the source has no provider-specific header policy. This
 * prevents third-party iframe or hotlink-protected streams from being treated
 * as offline-authorized content by accident.
 */
@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
object OfflineDownloadStore {
  private const val CACHE_DIRECTORY = "streamfree-offline-downloads"
  private const val KNOWN_DOWNLOADS = "streamfree_known_offline_downloads"
  private const val MAX_PARALLEL_DOWNLOADS = 1
  private const val USER_AGENT = "StreamFree Android Offline"

  private val lock = Any()
  private val runtimes = mutableMapOf<String, OfflineDownloadRuntime>()

  fun contentId(source: ResolvedSource): String =
    "streamfree:${sha256(source.providerId + "|" + source.playbackUrl)}"

  fun canDownload(policy: OfflineDownloadPolicy, source: ResolvedSource): Boolean =
    policy.canDownload(source)

  fun buildRequest(request: PlaybackRequest, source: ResolvedSource, policy: OfflineDownloadPolicy): DownloadRequest {
    require(canDownload(policy, source)) {
      "Offline downloads are not enabled for ${source.providerId}"
    }
    val metadata = listOf(
      request.mediaType.name,
      request.titleId,
      request.title.orEmpty(),
      request.season?.toString().orEmpty(),
      request.episode?.toString().orEmpty(),
      source.providerId,
      source.label,
    ).joinToString("\u001f")
    return DownloadRequest.Builder(contentId(source), Uri.parse(source.playbackUrl))
      .setMimeType(source.format.mimeType())
      .setData(metadata.toByteArray(Charsets.UTF_8))
      .build()
  }

  fun enqueue(
    context: Context,
    serviceClass: Class<out DownloadService>,
    request: PlaybackRequest,
    source: ResolvedSource,
    policy: OfflineDownloadPolicy,
  ): String {
    val downloadRequest = buildRequest(request, source, policy)
    val runtime = runtime(context, policy)
    check(runtime.cache.cacheSpace < policy.maxStorageBytes) {
      "Offline storage limit reached. Remove a download before adding another."
    }
    markKnown(context, downloadRequest.id)
    DownloadService.sendAddDownload(context, serviceClass, downloadRequest, false)
    return downloadRequest.id
  }

  fun pause(context: Context, serviceClass: Class<out DownloadService>) {
    DownloadService.sendPauseDownloads(context, serviceClass, false)
  }

  fun resume(context: Context, serviceClass: Class<out DownloadService>) {
    DownloadService.sendResumeDownloads(context, serviceClass, false)
  }

  fun remove(context: Context, serviceClass: Class<out DownloadService>, source: ResolvedSource) {
    val id = contentId(source)
    DownloadService.sendRemoveDownload(context, serviceClass, id, false)
    removeKnown(context, id)
  }

  fun isKnown(context: Context, source: ResolvedSource): Boolean =
    context.getSharedPreferences(KNOWN_DOWNLOADS, Context.MODE_PRIVATE)
      .getStringSet("ids", emptySet())
      ?.contains(contentId(source)) == true

  /** Returns the persistent cache only for sources the user explicitly queued. */
  fun cacheForPlayback(context: Context, source: ResolvedSource): Cache? =
    if (isKnown(context, source)) runtime(context, OfflineDownloadPolicy()).cache else null

  fun runtime(context: Context, policy: OfflineDownloadPolicy = OfflineDownloadPolicy()): OfflineDownloadRuntime {
    val applicationContext = context.applicationContext
    val directory = File(applicationContext.filesDir, CACHE_DIRECTORY)
    val key = directory.absolutePath
    synchronized(lock) {
      runtimes[key]?.let { return it }
      directory.mkdirs()
      val databaseProvider = StandaloneDatabaseProvider(applicationContext)
      val cache = SimpleCache(
        directory,
        NoOpCacheEvictor(),
        databaseProvider,
      )
      val upstreamFactory: DataSource.Factory = DefaultHttpDataSource.Factory()
        .setUserAgent(USER_AGENT)
        .setAllowCrossProtocolRedirects(false)
        .setConnectTimeoutMs(15_000)
        .setReadTimeoutMs(15_000)
      val manager = DownloadManager(
        applicationContext,
        databaseProvider,
        cache,
        upstreamFactory,
        Executors.newFixedThreadPool(MAX_PARALLEL_DOWNLOADS),
      ).apply {
        maxParallelDownloads = MAX_PARALLEL_DOWNLOADS
        minRetryCount = 3
        requirements = Requirements(
          if (policy.wifiOnly) Requirements.NETWORK_UNMETERED else Requirements.NETWORK,
        )
      }
      return OfflineDownloadRuntime(cache, manager).also { runtimes[key] = it }
    }
  }

  private fun markKnown(context: Context, id: String) {
    val preferences = context.getSharedPreferences(KNOWN_DOWNLOADS, Context.MODE_PRIVATE)
    val ids = preferences.getStringSet("ids", emptySet()).orEmpty() + id
    preferences.edit().putStringSet("ids", ids).apply()
  }

  private fun removeKnown(context: Context, id: String) {
    val preferences = context.getSharedPreferences(KNOWN_DOWNLOADS, Context.MODE_PRIVATE)
    val ids = preferences.getStringSet("ids", emptySet()).orEmpty() - id
    preferences.edit().putStringSet("ids", ids).apply()
  }

  private fun sha256(value: String): String = MessageDigest
    .getInstance("SHA-256")
    .digest(value.toByteArray(Charsets.UTF_8))
    .joinToString("") { byte -> "%02x".format(byte) }
}

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
data class OfflineDownloadRuntime(
  val cache: Cache,
  val manager: DownloadManager,
)

@androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)
abstract class StreamFreeDownloadService : DownloadService(
  FOREGROUND_NOTIFICATION_ID,
  DEFAULT_FOREGROUND_NOTIFICATION_UPDATE_INTERVAL,
  CHANNEL_ID,
  androidx.media3.exoplayer.R.string.exo_download_notification_channel_name,
  0,
) {
  private val notificationHelper by lazy { DownloadNotificationHelper(this, CHANNEL_ID) }

  override fun getDownloadManager(): DownloadManager = OfflineDownloadStore.runtime(this).manager

  override fun getScheduler(): androidx.media3.exoplayer.scheduler.Scheduler? = null

  override fun getForegroundNotification(
    downloads: List<Download>,
    notMetRequirements: Int,
  ) = notificationHelper.buildProgressNotification(
    this,
    android.R.drawable.stat_sys_download,
    null,
    null,
    downloads,
    notMetRequirements,
  )

  private companion object {
    const val CHANNEL_ID = "streamfree_offline_downloads"
    const val FOREGROUND_NOTIFICATION_ID = 4701
  }
}

private fun StreamFormat.mimeType(): String = when (this) {
  StreamFormat.Hls -> MimeTypes.APPLICATION_M3U8
  StreamFormat.Dash -> MimeTypes.APPLICATION_MPD
  StreamFormat.Mp4 -> MimeTypes.VIDEO_MP4
  StreamFormat.Embed -> error("Embed sources cannot be downloaded")
}
