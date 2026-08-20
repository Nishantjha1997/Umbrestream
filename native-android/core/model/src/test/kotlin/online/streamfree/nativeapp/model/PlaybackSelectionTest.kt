package online.streamfree.nativeapp.model

import org.junit.Assert.assertEquals
import org.junit.Test

class PlaybackSelectionTest {
  @Test
  fun `anime selection preserves its audio intent`() {
    val selection = PlaybackSelection(
      mediaType = MediaType.Anime,
      titleId = "21",
      episode = 1,
      audioVariant = AudioVariant.Dub,
    )

    assertEquals(AudioVariant.Dub, selection.audioVariant)
  }
}
