package online.streamfree.nativeapp.auth

import kotlinx.coroutines.runBlocking
import online.streamfree.nativeapp.network.HttpResponse
import online.streamfree.nativeapp.network.StreamFreeHttpTransport
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
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

  @Test
  fun `queues transient failure without persisting the bearer token`() = runBlocking {
    val queue = FakeQueue()
    var scheduled = false
    val result = HistorySyncClient(
      transport = FakeTransport(503),
      retryQueue = queue,
      onRetryQueued = { scheduled = true },
    ).sync("secret-token", "movie", "10", 25.0, 100.0, null, null, false)

    assertFalse(result)
    assertEquals(1, queue.events.size)
    assertEquals("10", queue.events.single().mediaId)
    assertTrue(scheduled)
    assertFalse(queue.events.single().dedupeKey.contains("secret-token"))
  }

  @Test
  fun `successful retry removes the matching queued event`() = runBlocking {
    val queue = FakeQueue()
    val event = PendingHistorySync("movie", "10", 25.0, 100.0, null, null, false)
    queue.events += event

    assertTrue(HistorySyncClient(FakeTransport(204), queue).sync("token", "movie", "10", 25.0, 100.0, null, null, false))
    assertTrue(queue.events.isEmpty())
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

  private class FakeQueue : HistorySyncRetryQueue {
    val events = mutableListOf<PendingHistorySync>()

    override suspend fun peek(): List<PendingHistorySync> = events.toList()

    override suspend fun enqueue(event: PendingHistorySync) {
      if (events.none { it.dedupeKey == event.dedupeKey }) events += event
    }

    override suspend fun remove(event: PendingHistorySync) {
      events.removeAll { it.dedupeKey == event.dedupeKey }
    }

    override suspend fun replace(events: List<PendingHistorySync>) {
      this.events.clear()
      this.events += events
    }

    override suspend fun clear() {
      events.clear()
    }
  }
}
