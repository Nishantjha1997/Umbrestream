package online.streamfree.nativeapp.phone

import android.os.Bundle
import android.content.pm.ActivityInfo
import android.content.Intent
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.common.util.UnstableApi
import online.streamfree.nativeapp.designsystem.StreamFreeTheme
import online.streamfree.nativeapp.auth.AuthSessionManager
import online.streamfree.nativeapp.auth.AnimeNotificationClient
import online.streamfree.nativeapp.auth.EncryptedAuthSessionStore
import online.streamfree.nativeapp.auth.SupabaseAuthClient
import online.streamfree.nativeapp.player.Media3SourcePipeline
import online.streamfree.nativeapp.player.PlaybackSessionController
import online.streamfree.nativeapp.player.PreferencesPlaybackDisplayModeStore
import online.streamfree.nativeapp.player.PreferencesPlaybackStore
import online.streamfree.nativeapp.player.PreferencesSourcePreferenceStore
import online.streamfree.nativeapp.player.PreferencesRegionPreferenceStore
import online.streamfree.nativeapp.source.SourceResolverRegistry
import online.streamfree.nativeapp.source.StreamFreeSourceApiResolver
import online.streamfree.nativeapp.source.StreamFreeEpisodeCatalogResolver
import online.streamfree.nativeapp.source.StreamFreeHomeFeedResolver
import online.streamfree.nativeapp.source.ResolutionOrchestrator
import online.streamfree.nativeapp.source.PlaybackRequest
import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType

@UnstableApi
class MainActivity : ComponentActivity() {
  private lateinit var playbackController: PlaybackSessionController
  private var playerFullscreen = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    WindowCompat.setDecorFitsSystemWindows(window, false)
    val sourceRegistry = SourceResolverRegistry(listOf(StreamFreeSourceApiResolver.production()))
    val sourceOrchestrator = ResolutionOrchestrator(sourceRegistry)
    val episodeCatalogResolver = StreamFreeEpisodeCatalogResolver.production()
    val homeFeedResolver = StreamFreeHomeFeedResolver.production()
    val sourcePreferenceStore = PreferencesSourcePreferenceStore(this)
    val regionPreferenceStore = PreferencesRegionPreferenceStore(this)
    val authManager = AuthSessionManager(SupabaseAuthClient(), EncryptedAuthSessionStore(this))
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
          PhonePlayerScreen(
            controller = playbackController,
            displayModeStore = PreferencesPlaybackDisplayModeStore(this@MainActivity),
            sourcePreferenceStore = sourcePreferenceStore,
            onExit = { showPlayer = false; selectedRequest = null },
            onFullscreenChanged = ::setPlayerFullscreen,
            initialRequest = selectedRequest,
            sourceOrchestrator = sourceOrchestrator,
            episodeCatalogResolver = episodeCatalogResolver,
          )
        } else {
          PhoneHomeScreen(
            onOpenPlayer = { showPlayer = true },
            feedResolver = homeFeedResolver,
            regionPreferenceStore = regionPreferenceStore,
            authManager = authManager,
            notificationClient = AnimeNotificationClient(),
            onOpenTitle = { request ->
              selectedRequest = request
              showPlayer = true
            },
          )
        }
      }
    }
  }

  override fun onStop() {
    if (playerFullscreen) setPlayerFullscreen(false)
    super.onStop()
  }

  override fun onDestroy() {
    playbackController.release()
    super.onDestroy()
  }

  private fun setPlayerFullscreen(enabled: Boolean) {
    if (playerFullscreen == enabled) return
    playerFullscreen = enabled
    requestedOrientation = if (enabled) {
      ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
    } else {
      ActivityInfo.SCREEN_ORIENTATION_PORTRAIT
    }
    val insetsController = WindowCompat.getInsetsController(window, window.decorView)
    if (enabled) {
      insetsController.hide(WindowInsetsCompat.Type.systemBars())
      insetsController.systemBarsBehavior =
        WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE
    } else {
      insetsController.show(WindowInsetsCompat.Type.systemBars())
    }
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
