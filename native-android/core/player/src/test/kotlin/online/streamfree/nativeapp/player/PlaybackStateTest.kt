package online.streamfree.nativeapp.player

import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.flow.first
import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.source.PlaybackRequest
import online.streamfree.nativeapp.source.ResolvedSource
import online.streamfree.nativeapp.source.SourceKind
import online.streamfree.nativeapp.source.StreamFormat
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PlaybackStateTest {
  private val request = PlaybackRequest(
    mediaType = MediaType.Anime,
    titleId = "anime-1",
    episode = 1,
    audioVariant = AudioVariant.Dub,
  )
  private val source = ResolvedSource(
    providerId = "native-source",
    label = "Native source",
    playbackUrl = "https://streamfree.online/anime-1.m3u8",
    kind = SourceKind.NativeDirect,
    format = StreamFormat.Hls,
    audioVariant = AudioVariant.Dub,
  )

  @Test
  fun `opening and preparing does not create trusted playback`() {
    val loaded = reducePlaybackState(
      PlaybackUiState(),
      PlaybackEvent.SourceLoaded(request, source, 0L),
    )
    val ready = reducePlaybackState(loaded, PlaybackEvent.Ready)

    assertEquals(PlaybackPhase.Ready, ready.phase)
    assertFalse(ready.hasTrustedPlayback)
  }

  @Test
  fun `playing transition creates trusted activity and pause preserves it`() {
    val ready = reducePlaybackState(
      reducePlaybackState(PlaybackUiState(), PlaybackEvent.SourceLoaded(request, source, 0L)),
      PlaybackEvent.Ready,
    )
    val playing = reducePlaybackState(ready, PlaybackEvent.PlayingChanged(true))
    val paused = reducePlaybackState(playing, PlaybackEvent.PlayingChanged(false))

    assertEquals(PlaybackPhase.Playing, playing.phase)
    assertTrue(playing.hasTrustedPlayback)
    assertEquals(PlaybackPhase.Paused, paused.phase)
    assertTrue(paused.hasTrustedPlayback)
  }

  @Test
  fun `progress store keeps Sub and Dub records separate and newest first`() = runBlocking {
    val store = InMemoryPlaybackStore()
    val sub = PlaybackProgressRecord(
      mediaType = MediaType.Anime,
      titleId = "anime-1",
      episode = 1,
      audioVariant = AudioVariant.Sub,
      positionMs = 10L,
      updatedAtEpochMs = 10L,
    )
    val dub = sub.copy(audioVariant = AudioVariant.Dub, positionMs = 20L, updatedAtEpochMs = 20L)

    store.save(sub)
    store.save(dub)

    assertEquals(2, store.records.first().size)
    assertEquals(dub.key, store.records.first().first().key)
    assertEquals(10L, store.get(sub.key)?.positionMs)
  }
}
