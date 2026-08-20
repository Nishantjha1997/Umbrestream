package online.streamfree.nativeapp.auth

import kotlinx.coroutines.runBlocking
import online.streamfree.nativeapp.network.HttpResponse
import online.streamfree.nativeapp.network.StreamFreeHttpTransport
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class HistorySyncClientTest {
  @Test
  fun `posts trusted completion with bearer token`() = runBlocking {
    val transport = FakeTransport(200)

    assertTrue(HistorySyncClient(transport).sync("token", "anime", "10", 85.0, 100.0, null, 4, true))
    assertEquals("https://streamfree.online/api/mobile/history", transport.url)
    assertEquals("Bearer token", transport.headers["Authorization"])
    assertTrue(transport.body.contains("\"completed\":true"))
  }

  @Test
  fun `rejects malformed media and duration before network`() = runBlocking {
    val transport = FakeTransport(200)

    assertTrue(!HistorySyncClient(transport).sync("token", "book", "10", 1.0, 10.0, null, null, false))
    assertTrue(!HistorySyncClient(transport).sync("token", "movie", "10", 1.0, 0.0, null, null, false))
    assertEquals(null, transport.url)
  }

  private class FakeTransport(private val status: Int) : StreamFreeHttpTransport {
    var url: String? = null
    var body = ""
    var headers: Map<String, String> = emptyMap()

    override fun get(url: String, headers: Map<String, String>): HttpResponse =
      HttpResponse(url, 404, emptyMap(), ByteArray(0))

    override fun post(url: String, body: ByteArray, headers: Map<String, String>): HttpResponse {
      this.url = url
      this.body = body.toString(Charsets.UTF_8)
      this.headers = headers
      return HttpResponse(url, status, emptyMap(), ByteArray(0))
    }
  }
}
