package online.streamfree.nativeapp.auth

import kotlinx.coroutines.runBlocking
import online.streamfree.nativeapp.network.HttpResponse
import online.streamfree.nativeapp.network.StreamFreeHttpTransport
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class NativeAnimeLinkClientTest {
  @Test
  fun `accepts only approved provider authorization hosts`() = runBlocking {
    val transport = FakeTransport("""{"authorizationUrl":"https://anilist.co/api/v2/oauth/authorize?state=x"}""")

    val result = NativeAnimeLinkClient(transport).start(NativeAnimeProvider.AniList, "token")

    assertEquals("https://anilist.co/api/v2/oauth/authorize?state=x", result)
  }

  @Test
  fun `rejects insecure or unrelated authorization hosts`() = runBlocking {
    val insecure = NativeAnimeLinkClient(FakeTransport("""{"authorizationUrl":"http://anilist.co/authorize"}"""))
    val unrelated = NativeAnimeLinkClient(FakeTransport("""{"authorizationUrl":"https://example.com/authorize"}"""))

    assertNull(insecure.start(NativeAnimeProvider.AniList, "token"))
    assertNull(unrelated.start(NativeAnimeProvider.MyAnimeList, "token"))
  }

  private class FakeTransport(private val payload: String) : StreamFreeHttpTransport {
    override fun get(url: String, headers: Map<String, String>): HttpResponse =
      HttpResponse(url, 200, emptyMap(), payload.toByteArray())
  }
}
