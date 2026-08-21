package online.streamfree.nativeapp.auth

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class NativeAnimeLinkResultTest {
  @Test
  fun `accepts successful AniList callback without exposing tokens`() {
    val result = NativeAnimeLinkResult.parse(
      "streamfree://anime-link?provider=anilist&status=success",
    )

    assertEquals(NativeAnimeProvider.AniList, result?.provider)
    assertTrue(result?.success == true)
    assertEquals("AniList account linked successfully.", result?.message)
  }

  @Test
  fun `accepts known failure and keeps reason bounded`() {
    val result = NativeAnimeLinkResult.parse(
      "streamfree://anime-link?provider=mal&status=error&reason=state_expired",
    )

    assertEquals(NativeAnimeProvider.MyAnimeList, result?.provider)
    assertFalse(result?.success == true)
    assertEquals("state_expired", result?.reason)
  }

  @Test
  fun `rejects untrusted callback shapes`() {
    val invalid = listOf(
      "https://streamfree.online/api/mobile/anime-links/callback/anilist?status=success",
      "streamfree://other-host?provider=anilist&status=success",
      "streamfree://anime-link?provider=unknown&status=success",
      "streamfree://anime-link?provider=anilist&status=success&token=secret",
      "streamfree://anime-link?provider=anilist&status=error&reason=not-safe!",
    )

    invalid.forEach { assertNull(NativeAnimeLinkResult.parse(it)) }
  }
}
