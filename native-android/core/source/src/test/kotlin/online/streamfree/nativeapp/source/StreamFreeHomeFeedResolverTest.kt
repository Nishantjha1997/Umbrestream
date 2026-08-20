package online.streamfree.nativeapp.source

import kotlinx.coroutines.runBlocking
import online.streamfree.nativeapp.network.HttpResponse
import online.streamfree.nativeapp.network.StreamFreeHttpTransport
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Assert.assertNull
import org.junit.Assert.assertTrue
import org.junit.Test

class StreamFreeHomeFeedResolverTest {
  @Test
  fun `parses region provenance hero and rows`() = runBlocking {
    val transport = FakeTransport(
      """
      {
        "schemaVersion":1,
        "region":{"detectedCountry":"IN","effectiveCountry":"IN","countryName":"India","source":"edge"},
        "provenance":"signed_out",
        "hero":{"intent":"trending","media":{"kind":"movie","id":550,"href":"/movie/550","title":"Fight Club","posterUrl":"https://image.example/poster.jpg","isAdult":false}},
        "rows":[{"id":"continue","title":"Continue Watching","kind":"continue","nextCursor":"2026-08-21T00%3A00%3A00Z%7C42","items":[{"kind":"movie","id":550,"href":"/movie/550","title":"Fight Club","posterUrl":"https://image.example/poster.jpg","year":1999,"rating":8.4,"isAdult":false}]},{"id":"trending","title":"Trending","kind":"trending","items":[{"kind":"movie","id":550,"href":"/movie/550","title":"Fight Club","posterUrl":"https://image.example/poster.jpg","year":1999,"rating":8.4,"isAdult":false}]}],
        "generatedAt":"2026-08-21T00:00:00Z"
      }
      """.trimIndent(),
    )
    val feed = StreamFreeHomeFeedResolver(transport).resolve()

    assertNotNull(feed)
    assertEquals("IN", feed!!.region.effectiveCountry)
    assertEquals("signed_out", feed.provenance)
    assertEquals("Fight Club", feed.hero!!.media.title)
    assertEquals(550, feed.rows.first { it.kind == "continue" }.items.single().id)
    assertEquals("2026-08-21T00%3A00%3A00Z%7C42", feed.rows.first { it.kind == "continue" }.nextCursor)
    assertTrue(transport.lastHeaders["X-StreamFree-Region"].isNullOrEmpty())
  }

  @Test
  fun `sends only validated region override and bearer`() = runBlocking {
    val transport = FakeTransport(
      """{"schemaVersion":1,"region":{},"rows":[{"id":"r","title":"r","kind":"trending","items":[{"kind":"movie","id":1,"href":"/movie/1","title":"One","posterUrl":"https://image.example/one.jpg"}]}],"generatedAt":"now"}""",
    )
    val resolver = StreamFreeHomeFeedResolver(
      transport = transport,
      bearerToken = { "token" },
      regionOverride = { "in" },
    )

    assertNotNull(resolver.resolve())
    assertEquals("Bearer token", transport.lastHeaders["Authorization"])
    assertEquals("IN", transport.lastHeaders["X-StreamFree-Region"])
  }

  @Test
  fun `rejects unsupported schema and empty rows`() = runBlocking {
    val transport = FakeTransport("""{"schemaVersion":2,"rows":[],"generatedAt":"now"}""")
    assertNull(StreamFreeHomeFeedResolver(transport).resolve())
  }

  @Test
  fun `adds a bounded encoded cursor to the home request`() = runBlocking {
    val transport = FakeTransport(
      """{"schemaVersion":1,"region":{},"rows":[{"id":"r","title":"r","kind":"trending","items":[{"kind":"movie","id":1,"href":"/movie/1","title":"One","posterUrl":"https://image.example/one.jpg"}]}],"generatedAt":"now"}""",
    )

    StreamFreeHomeFeedResolver(transport).resolve(continueCursorValue = "2026-08-21T00:00:00Z|42")

    assertTrue(transport.lastUrl.contains("continueCursor=2026-08-21T00%3A00%3A00Z%7C42"))
  }

  private class FakeTransport(private val payload: String) : StreamFreeHttpTransport {
    var lastHeaders: Map<String, String> = emptyMap()
    var lastUrl: String = ""
    override fun get(url: String, headers: Map<String, String>): HttpResponse {
      lastUrl = url
      lastHeaders = headers
      return HttpResponse(url, 200, emptyMap(), payload.toByteArray())
    }
  }
}
