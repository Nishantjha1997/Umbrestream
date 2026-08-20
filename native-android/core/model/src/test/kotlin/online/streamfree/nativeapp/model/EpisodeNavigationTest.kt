package online.streamfree.nativeapp.model

import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class EpisodeNavigationTest {
  private val seasons = listOf(
    SeasonEpisodes(0, listOf(1, 2)),
    SeasonEpisodes(1, listOf(1, 2, 0, 4)),
    SeasonEpisodes(2, listOf(1, 3)),
  )

  @Test
  fun `next skips specials and crosses into first episode of next season`() {
    assertEquals(
      EpisodeRef(1, 4),
      AdjacentEpisodeResolver.resolve(EpisodeRef(1, 2), seasons, EpisodeDirection.Next),
    )
    assertEquals(
      EpisodeRef(2, 1),
      AdjacentEpisodeResolver.resolve(EpisodeRef(1, 4), seasons, EpisodeDirection.Next),
    )
  }

  @Test
  fun `previous crosses into last episode of previous season`() {
    assertEquals(
      EpisodeRef(1, 4),
      AdjacentEpisodeResolver.resolve(EpisodeRef(2, 1), seasons, EpisodeDirection.Previous),
    )
  }

  @Test
  fun `true catalogue boundaries return null`() {
    assertNull(AdjacentEpisodeResolver.resolve(EpisodeRef(1, 1), seasons, EpisodeDirection.Previous))
    assertNull(AdjacentEpisodeResolver.resolve(EpisodeRef(2, 3), seasons, EpisodeDirection.Next))
    assertNull(AdjacentEpisodeResolver.resolve(EpisodeRef(1, 3), seasons, EpisodeDirection.Next))
  }
}
