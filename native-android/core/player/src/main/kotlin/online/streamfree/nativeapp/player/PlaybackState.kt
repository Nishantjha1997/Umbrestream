package online.streamfree.nativeapp.player

import online.streamfree.nativeapp.source.PlaybackRequest
import online.streamfree.nativeapp.source.ResolvedSource

enum class PlaybackPhase {
  Idle,
  Preparing,
  Ready,
  Playing,
  Paused,
  Ended,
  Error,
}

data class PlaybackUiState(
  val phase: PlaybackPhase = PlaybackPhase.Idle,
  val request: PlaybackRequest? = null,
  val source: ResolvedSource? = null,
  val positionMs: Long = 0L,
  val durationMs: Long = 0L,
  val hasTrustedPlayback: Boolean = false,
  val errorMessage: String? = null,
)

sealed interface PlaybackEvent {
  data class SourceLoaded(
    val request: PlaybackRequest,
    val source: ResolvedSource,
    val positionMs: Long,
  ) : PlaybackEvent

  data object Ready : PlaybackEvent

  data class PlayingChanged(val isPlaying: Boolean) : PlaybackEvent

  data class PositionChanged(val positionMs: Long, val durationMs: Long) : PlaybackEvent

  data object Ended : PlaybackEvent

  data class Failed(val message: String) : PlaybackEvent

  data object Reset : PlaybackEvent
}

fun reducePlaybackState(state: PlaybackUiState, event: PlaybackEvent): PlaybackUiState = when (event) {
  is PlaybackEvent.SourceLoaded -> state.copy(
    phase = PlaybackPhase.Preparing,
    request = event.request,
    source = event.source,
    positionMs = event.positionMs,
    durationMs = 0L,
    hasTrustedPlayback = false,
    errorMessage = null,
  )
  PlaybackEvent.Ready -> state.copy(
    phase = if (state.hasTrustedPlayback) PlaybackPhase.Playing else PlaybackPhase.Ready,
    errorMessage = null,
  )
  is PlaybackEvent.PlayingChanged -> state.copy(
    phase = when {
      event.isPlaying -> PlaybackPhase.Playing
      state.phase == PlaybackPhase.Idle -> PlaybackPhase.Idle
      state.phase == PlaybackPhase.Ended -> PlaybackPhase.Ended
      else -> PlaybackPhase.Paused
    },
    hasTrustedPlayback = state.hasTrustedPlayback || event.isPlaying,
  )
  is PlaybackEvent.PositionChanged -> state.copy(
    positionMs = event.positionMs.coerceAtLeast(0L),
    durationMs = event.durationMs.coerceAtLeast(0L),
  )
  PlaybackEvent.Ended -> state.copy(phase = PlaybackPhase.Ended)
  is PlaybackEvent.Failed -> state.copy(
    phase = PlaybackPhase.Error,
    errorMessage = event.message,
  )
  PlaybackEvent.Reset -> PlaybackUiState()
}
