package online.streamfree.nativeapp.phone

import android.os.Bundle
import android.content.pm.ActivityInfo
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import androidx.core.view.WindowInsetsControllerCompat
import androidx.media3.common.util.UnstableApi
import online.streamfree.nativeapp.designsystem.StreamFreeTheme
import online.streamfree.nativeapp.player.Media3SourcePipeline
import online.streamfree.nativeapp.player.PlaybackSessionController
import online.streamfree.nativeapp.player.PreferencesPlaybackDisplayModeStore
import online.streamfree.nativeapp.player.PreferencesPlaybackStore
import online.streamfree.nativeapp.source.SourceResolverRegistry

@UnstableApi
class MainActivity : ComponentActivity() {
  private lateinit var playbackController: PlaybackSessionController
  private var playerFullscreen = false

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    enableEdgeToEdge()
    WindowCompat.setDecorFitsSystemWindows(window, false)
    playbackController = PlaybackSessionController(
      context = this,
      sourcePipeline = Media3SourcePipeline(this, SourceResolverRegistry(emptyList())),
      store = PreferencesPlaybackStore(this),
    )
    setContent {
      StreamFreeTheme {
        var showPlayer by rememberSaveable { mutableStateOf(false) }
        if (showPlayer) {
          PhonePlayerScreen(
            controller = playbackController,
            displayModeStore = PreferencesPlaybackDisplayModeStore(this@MainActivity),
            onExit = { showPlayer = false },
            onFullscreenChanged = ::setPlayerFullscreen,
          )
        } else {
          PhoneHomeScreen(onOpenPlayer = { showPlayer = true })
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
