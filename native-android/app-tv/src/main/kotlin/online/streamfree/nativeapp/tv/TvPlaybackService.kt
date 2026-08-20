package online.streamfree.nativeapp.tv

import android.content.Context
import androidx.media3.common.util.UnstableApi
import online.streamfree.nativeapp.player.Media3SourcePipeline
import online.streamfree.nativeapp.player.PlaybackSessionController
import online.streamfree.nativeapp.player.PreferencesPlaybackStore
import online.streamfree.nativeapp.player.StreamFreePlaybackService
import online.streamfree.nativeapp.source.SourceResolverRegistry

@UnstableApi
class TvPlaybackService : StreamFreePlaybackService() {
  override fun createPlaybackController(context: Context): PlaybackSessionController =
    PlaybackSessionController(
      context = context,
      sourcePipeline = Media3SourcePipeline(context, SourceResolverRegistry(emptyList())),
      store = PreferencesPlaybackStore(context),
    )
}
