package online.streamfree.nativeapp.tv

import android.os.Bundle
import android.content.Intent
import java.io.File
import androidx.media3.common.util.UnstableApi
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.core.content.FileProvider
import online.streamfree.nativeapp.designsystem.StreamFreeTheme
import online.streamfree.nativeapp.auth.AuthSessionManager
import online.streamfree.nativeapp.auth.AnimeNotificationClient
import online.streamfree.nativeapp.auth.AnimeNotificationPreferenceStore
import online.streamfree.nativeapp.auth.HistorySyncClient
import online.streamfree.nativeapp.auth.HistorySyncScheduler
import online.streamfree.nativeapp.auth.EncryptedHistorySyncQueue
import online.streamfree.nativeapp.auth.AnimeNotificationScheduler
import online.streamfree.nativeapp.auth.EncryptedAuthSessionStore
import online.streamfree.nativeapp.auth.NativeAnimeLinkResult
import online.streamfree.nativeapp.auth.NativeUpdateClient
import online.streamfree.nativeapp.auth.SupabaseAuthClient
import online.streamfree.nativeapp.player.Media3SourcePipeline
import online.streamfree.nativeapp.player.PlaybackSessionController
import online.streamfree.nativeapp.player.PreferencesPlaybackDisplayModeStore
import online.streamfree.nativeapp.player.PreferencesPlaybackStore
import online.streamfree.nativeapp.source.SourceResolverRegistry
import online.streamfree.nativeapp.source.StreamFreeSourceApiResolver
import online.streamfree.nativeapp.source.StreamFreeEpisodeCatalogResolver
import online.streamfree.nativeapp.source.StreamFreeHomeFeedResolver
import online.streamfree.nativeapp.source.ResolutionOrchestrator
import online.streamfree.nativeapp.source.PlaybackRequest
import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.player.PreferencesSourcePreferenceStore
import online.streamfree.nativeapp.player.PreferencesRegionPreferenceStore
import online.streamfree.nativeapp.player.PreferencesOnboardingPreferenceStore

@UnstableApi
class MainActivity : ComponentActivity() {
  private lateinit var playbackController: PlaybackSessionController
  private var animeLinkResult by mutableStateOf<NativeAnimeLinkResult?>(null)

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    handleAnimeLinkIntent(intent)
    enableEdgeToEdge()
    val sourceRegistry = SourceResolverRegistry(listOf(StreamFreeSourceApiResolver.production()))
    val sourceOrchestrator = ResolutionOrchestrator(sourceRegistry)
    val episodeCatalogResolver = StreamFreeEpisodeCatalogResolver.production()
    val homeFeedResolver = StreamFreeHomeFeedResolver.production()
    val sourcePreferenceStore = PreferencesSourcePreferenceStore(this)
    val regionPreferenceStore = PreferencesRegionPreferenceStore(this)
    val authManager = AuthSessionManager(SupabaseAuthClient(), EncryptedAuthSessionStore(this))
    val notificationPreferenceStore = AnimeNotificationPreferenceStore(this)
    val historySyncClient = HistorySyncClient(
      retryQueue = EncryptedHistorySyncQueue(this),
      onRetryQueued = { HistorySyncScheduler.enqueue(this) },
    )
    HistorySyncScheduler.enqueue(this)
    AnimeNotificationScheduler.ensure(this)
    val launchRequest = intent.toPlaybackRequest()
    playbackController = PlaybackSessionController(
      context = this,
      sourcePipeline = Media3SourcePipeline(this, sourceRegistry),
      store = PreferencesPlaybackStore(this),
    )
    setContent {
      StreamFreeTheme {
        var showPlayer by rememberSaveable { mutableStateOf(launchRequest != null) }
        var selectedRequest by remember { mutableStateOf(launchRequest) }
        if (showPlayer) {
          TvPlayerScreen(
            controller = playbackController,
            displayModeStore = PreferencesPlaybackDisplayModeStore(this@MainActivity),
            onExit = { showPlayer = false; selectedRequest = null },
            sourcePreferenceStore = sourcePreferenceStore,
            authManager = authManager,
            historySyncClient = historySyncClient,
            initialRequest = selectedRequest,
            sourceOrchestrator = sourceOrchestrator,
            episodeCatalogResolver = episodeCatalogResolver,
          )
        } else {
          TvHomeScreen(
            onOpenPlayer = { showPlayer = true },
            feedResolver = homeFeedResolver,
            regionPreferenceStore = regionPreferenceStore,
            onboardingPreferenceStore = PreferencesOnboardingPreferenceStore(this@MainActivity),
            updateClient = NativeUpdateClient(
              packageId = "online.streamfree.tv",
              currentVersionCode = BuildConfig.VERSION_CODE.toLong(),
              expectedSigningCertificateSha256 = "93038E301F34C9E5AD8E28EB72B08604C1A0EA8BBF43B486765B819939E4BA2A",
              manifestFileName = NativeUpdateClient.TV_MANIFEST,
            ),
            onInstallUpdate = ::installUpdate,
            authManager = authManager,
            notificationClient = AnimeNotificationClient(),
            notificationPreferenceStore = notificationPreferenceStore,
            animeLinkResult = animeLinkResult,
            onAnimeLinkResultHandled = { animeLinkResult = null },
            onOpenTitle = { request ->
              selectedRequest = request
              showPlayer = true
            },
          )
        }
      }
    }
  }

  override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    setIntent(intent)
    handleAnimeLinkIntent(intent)
  }

  override fun onDestroy() {
    playbackController.release()
    super.onDestroy()
  }

  private fun handleAnimeLinkIntent(intent: Intent?) {
    animeLinkResult = NativeAnimeLinkResult.parse(intent?.data?.toString())
  }

  private fun installUpdate(apk: File) {
    val uri = FileProvider.getUriForFile(this, "$packageName.update-provider", apk)
    startActivity(
      Intent(Intent.ACTION_VIEW).apply {
        setDataAndType(uri, "application/vnd.android.package-archive")
        addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK)
      },
    )
  }
}

private fun Intent.toPlaybackRequest(): PlaybackRequest? {
  val mediaType = when (getStringExtra("mediaType")?.lowercase()) {
    "movie" -> MediaType.Movie
    "tv" -> MediaType.Tv
    "anime" -> MediaType.Anime
    else -> return null
  }
  val titleId = getStringExtra("titleId") ?: when (mediaType) {
    MediaType.Movie, MediaType.Tv -> optionalId("tmdbId")
    MediaType.Anime -> optionalId("anilistId")
  } ?: return null
  return PlaybackRequest(
    mediaType = mediaType,
    titleId = titleId,
    title = getStringExtra("title"),
    tmdbId = optionalId("tmdbId")?.toIntOrNull(),
    anilistId = optionalId("anilistId")?.toIntOrNull(),
    malId = optionalId("malId")?.toIntOrNull(),
    animeTmdbId = optionalId("animeTmdbId")?.toIntOrNull(),
    season = optionalId("season")?.toIntOrNull(),
    episode = optionalId("episode")?.toIntOrNull(),
    audioVariant = when (getStringExtra("audio")?.lowercase()) {
      "dub" -> AudioVariant.Dub
      "sub" -> AudioVariant.Sub
      else -> null
    },
    explicitSourceId = getStringExtra("sourceId"),
    resumePositionMs = getLongExtra("resumePositionMs", 0L).coerceAtLeast(0L),
  )
}

private fun Intent.optionalId(name: String): String? =
  getStringExtra(name)?.takeIf(String::isNotBlank)
    ?: getIntExtra(name, -1).takeIf { it > 0 }?.toString()
