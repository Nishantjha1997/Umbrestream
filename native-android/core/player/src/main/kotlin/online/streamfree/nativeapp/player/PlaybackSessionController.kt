package online.streamfree.nativeapp.player

import android.content.Context
import androidx.media3.common.Player
import androidx.media3.common.util.UnstableApi
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.session.MediaSession
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.cancel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.runBlocking
import online.streamfree.nativeapp.source.PlaybackRequest
import online.streamfree.nativeapp.source.ResolvedSource

@UnstableApi
class PlaybackSessionController(
  context: Context,
  private val sourcePipeline: Media3SourcePipeline,
  private val store: PlaybackStore,
  private val clock: () -> Long = { System.currentTimeMillis() },
) : Player.Listener {
  private val scope = CoroutineScope(SupervisorJob() + Dispatchers.Main.immediate)
  private val _state = MutableStateFlow(PlaybackUiState())
  private var persistenceJob: Job? = null

  val state: StateFlow<PlaybackUiState> = _state.asStateFlow()
  private val exoPlayer: ExoPlayer = ExoPlayer.Builder(context.applicationContext).build()
  val player: Player = exoPlayer
  val mediaSession: MediaSession = MediaSession.Builder(context.applicationContext, exoPlayer).build()

  init {
    player.addListener(this)
    persistenceJob = scope.launch {
      while (isActive) {
        delay(PERSIST_INTERVAL_MS)
        persistIfTrusted()
      }
    }
  }

  fun load(request: PlaybackRequest, source: ResolvedSource) {
    scope.launch {
      try {
        val saved = store.get(progressKey(request))
        val startPosition = when {
          request.resumePositionMs > 0L -> request.resumePositionMs
          saved?.completed == true -> 0L
          else -> saved?.positionMs ?: 0L
        }
        val mediaSource = sourcePipeline.createMediaSource(request, source)
        exoPlayer.setMediaSource(mediaSource)
        player.seekTo(startPosition)
        reduce(PlaybackEvent.SourceLoaded(request, source, startPosition))
        player.prepare()
        player.playWhenReady = true
      } catch (error: CancellationException) {
        throw error
      } catch (error: Throwable) {
        reduce(PlaybackEvent.Failed(error.message ?: "Unable to prepare playback"))
      }
    }
  }

  fun pause() {
    player.pause()
  }

  fun stop() {
    player.stop()
    reduce(PlaybackEvent.Reset)
  }

  suspend fun flush() {
    persistIfTrusted()
  }

  fun release() {
    val pendingRecord = currentRecord()
    runBlocking(Dispatchers.IO) {
      if (pendingRecord != null) store.save(pendingRecord)
    }
    persistenceJob?.cancel()
    player.removeListener(this)
    exoPlayer.release()
    mediaSession.release()
    scope.coroutineContext.cancel()
  }

  override fun onPlaybackStateChanged(playbackState: Int) {
    when (playbackState) {
      Player.STATE_IDLE -> if (_state.value.request == null) reduce(PlaybackEvent.Reset)
      Player.STATE_BUFFERING -> if (_state.value.request != null) {
        _state.value = _state.value.copy(phase = PlaybackPhase.Preparing)
      }
      Player.STATE_READY -> reduce(PlaybackEvent.Ready)
      Player.STATE_ENDED -> {
        reduce(PlaybackEvent.PositionChanged(player.currentPosition, player.durationOrZero()))
        reduce(PlaybackEvent.Ended)
        scope.launch { persistIfTrusted() }
      }
      else -> Unit
    }
  }

  override fun onIsPlayingChanged(isPlaying: Boolean) {
    reduce(PlaybackEvent.PlayingChanged(isPlaying))
    if (!isPlaying) scope.launch { persistIfTrusted() }
  }

  override fun onPositionDiscontinuity(
    oldPosition: Player.PositionInfo,
    newPosition: Player.PositionInfo,
    reason: Int,
  ) {
    reduce(PlaybackEvent.PositionChanged(player.currentPosition, player.durationOrZero()))
  }

  override fun onPlayerError(error: androidx.media3.common.PlaybackException) {
    reduce(PlaybackEvent.Failed(error.errorCodeName))
    scope.launch { persistIfTrusted() }
  }

  private suspend fun persistIfTrusted() {
    val record = currentRecord()
    if (record != null) store.save(record)
  }

  private fun currentRecord(): PlaybackProgressRecord? {
    val current = state.value
    val request = current.request ?: return null
    if (!current.hasTrustedPlayback) return null
    val position = player.currentPosition.coerceAtLeast(0L)
    val duration = player.durationOrZero()
    return PlaybackProgressRecord(
      mediaType = request.mediaType,
      titleId = request.titleId,
      season = request.season,
      episode = request.episode,
      audioVariant = request.audioVariant,
      sourceId = current.source?.providerId,
      positionMs = position,
      durationMs = duration,
      updatedAtEpochMs = clock().coerceAtLeast(0L),
      completed = duration > 0L && position.toDouble() / duration.toDouble() >= COMPLETION_FRACTION,
    )
  }

  private fun progressKey(request: PlaybackRequest): String = PlaybackProgressRecord(
    mediaType = request.mediaType,
    titleId = request.titleId,
    season = request.season,
    episode = request.episode,
    audioVariant = request.audioVariant,
    updatedAtEpochMs = 0L,
  ).key

  private fun reduce(event: PlaybackEvent) {
    _state.value = reducePlaybackState(_state.value, event)
  }

  private fun Player.durationOrZero(): Long = duration.takeIf { it > 0L } ?: 0L

  private companion object {
    const val PERSIST_INTERVAL_MS = 15_000L
    const val COMPLETION_FRACTION = 0.85
  }
}
