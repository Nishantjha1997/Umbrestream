package online.streamfree.nativeapp.player

import org.junit.Assert.assertEquals
import org.junit.Test

class PlaybackDisplayModeTest {
  @Test
  fun `fit is the product default`() {
    assertEquals(PlaybackDisplayMode.Fit, PlaybackDisplayMode.values().first())
  }

  @Test
  fun `display modes are explicit and stable`() {
    assertEquals(listOf("Fit", "Fill"), PlaybackDisplayMode.values().map { it.name })
  }
}
