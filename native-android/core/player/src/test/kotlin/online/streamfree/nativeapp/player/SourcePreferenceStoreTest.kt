package online.streamfree.nativeapp.player

import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType
import org.junit.Assert.assertEquals
import org.junit.Test

class SourcePreferenceStoreTest {
  @Test
  fun `movie and tv preferences do not share a scope`() {
    assertEquals(SourcePreferenceScope.Movie, sourcePreferenceScope(MediaType.Movie, null))
    assertEquals(SourcePreferenceScope.Tv, sourcePreferenceScope(MediaType.Tv, null))
  }

  @Test
  fun `anime sub and dub preferences remain separate`() {
    assertEquals(SourcePreferenceScope.AnimeSub, sourcePreferenceScope(MediaType.Anime, AudioVariant.Sub))
    assertEquals(SourcePreferenceScope.AnimeDub, sourcePreferenceScope(MediaType.Anime, AudioVariant.Dub))
    assertEquals(SourcePreferenceScope.AnimeSub, sourcePreferenceScope(MediaType.Anime, null))
  }
}
