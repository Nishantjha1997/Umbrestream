package online.streamfree.nativeapp.player

import android.content.Context
import android.content.Intent
import androidx.media3.common.util.UnstableApi
import androidx.media3.session.MediaSession
import androidx.media3.session.MediaSessionService

@UnstableApi
abstract class StreamFreePlaybackService : MediaSessionService() {
  private var controller: PlaybackSessionController? = null

  override fun onCreate() {
    super.onCreate()
    controller = createPlaybackController(applicationContext)
  }

  protected abstract fun createPlaybackController(context: Context): PlaybackSessionController

  override fun onGetSession(controllerInfo: MediaSession.ControllerInfo): MediaSession? =
    controller?.mediaSession

  override fun onTaskRemoved(rootIntent: Intent?) {
    // MediaSessionService retains an active playback service by default. The
    // controller persists progress on pause, error, end, and destruction.
    super.onTaskRemoved(rootIntent)
  }

  override fun onDestroy() {
    controller?.release()
    controller = null
    super.onDestroy()
  }
}
