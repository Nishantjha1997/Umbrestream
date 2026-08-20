package online.streamfree.nativeapp.tv

import android.os.Bundle
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

@UnstableApi
class MainActivity : ComponentActivity() {
  private lateinit var playbackController: PlaybackSessionController

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    val sourceRegistry = SourceResolverRegistry(listOf(StreamFreeSourceApiResolver.production()))
    playbackController = PlaybackSessionController(
      context = this,
      sourcePipeline = Media3SourcePipeline(this, sourceRegistry),
      store = PreferencesPlaybackStore(this),
    )
    setContent {
      StreamFreeTheme {
        var showPlayer by rememberSaveable { mutableStateOf(false) }
        if (showPlayer) {
          TvPlayerScreen(
            controller = playbackController,
            displayModeStore = PreferencesPlaybackDisplayModeStore(this@MainActivity),
            onExit = { showPlayer = false },
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
