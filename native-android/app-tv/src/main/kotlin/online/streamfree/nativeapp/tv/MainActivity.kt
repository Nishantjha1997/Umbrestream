package online.streamfree.nativeapp.tv

import android.os.Bundle
import android.content.Intent
import androidx.media3.common.util.UnstableApi
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import online.streamfree.nativeapp.designsystem.StreamFreeTheme
import online.streamfree.nativeapp.player.Media3SourcePipeline
import online.streamfree.nativeapp.player.PlaybackSessionController
import online.streamfree.nativeapp.player.PreferencesPlaybackDisplayModeStore
import online.streamfree.nativeapp.player.PreferencesPlaybackStore
import online.streamfree.nativeapp.source.SourceResolverRegistry
import online.streamfree.nativeapp.source.StreamFreeSourceApiResolver
import online.streamfree.nativeapp.source.ResolutionOrchestrator
import online.streamfree.nativeapp.source.PlaybackRequest
import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.player.PreferencesSourcePreferenceStore

@UnstableApi
class MainActivity : ComponentActivity() {
  private lateinit var playbackController: PlaybackSessionController

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    val sourceRegistry = SourceResolverRegistry(listOf(StreamFreeSourceApiResolver.production()))
    val sourceOrchestrator = ResolutionOrchestrator(sourceRegistry)
    val sourcePreferenceStore = PreferencesSourcePreferenceStore(this)
    val launchRequest = intent.toPlaybackRequest()
    playbackController = PlaybackSessionController(
      context = this,
      sourcePipeline = Media3SourcePipeline(this, sourceRegistry),
      store = PreferencesPlaybackStore(this),
    )
    setContent {
      StreamFreeTheme {
        var showPlayer by rememberSaveable { mutableStateOf(launchRequest != null) }
        if (showPlayer) {
          TvPlayerScreen(
            controller = playbackController,
            displayModeStore = PreferencesPlaybackDisplayModeStore(this@MainActivity),
            onExit = { showPlayer = false },
            sourcePreferenceStore = sourcePreferenceStore,
            initialRequest = launchRequest,
            sourceOrchestrator = sourceOrchestrator,
          )
        } else {
          TvHomeScreen(onOpenPlayer = { showPlayer = true })
        }
      }
    }
  }

  override fun onDestroy() {
    playbackController.release()
    super.onDestroy()
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
