package online.streamfree.nativeapp.source

import kotlinx.coroutines.runBlocking
import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.network.HttpResponse
import online.streamfree.nativeapp.network.StreamFreeHttpTransport
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class StreamFreeSourceApiResolverTest {

  @Test
  fun `mixed api resolver accepts validated embed output without making it media3 playable`() {
    val source = ResolvedSource(
      providerId = "vidking",
      label = "VidKing",
      playbackUrl = "https://www.vidking.net/embed/movie/550",
      kind = SourceKind.Iframe,
      format = StreamFormat.Embed,
      contractId = "streamfree-api",
    )
    val registry = SourceResolverRegistry(listOf(StreamFreeSourceApiResolver(FakeTransport("{}"))))

    assertTrue(registry.isCompatible(source, PlaybackRequest(MediaType.Movie, "550", tmdbId = 550)))
    assertTrue(EmbedSourcePolicy.isEligible(source))
  }

  @Test
  fun `embed policy rejects unsafe and unrelated hosts`() {
    assertFalse(EmbedSourcePolicy.isAllowedUrl("http://www.vidking.net/embed/movie/550"))
    assertFalse(EmbedSourcePolicy.isAllowedUrl("https://evil.example/embed/movie/550"))
  }
  @Test
  fun `maps only approved direct and embed sources and preserves anime audio`() = runBlocking {
    val transport = FakeTransport(
      """
      {
        "sources": [
          {
            "id": "anivexa:reanime",
            "label": "ReAnime · Sub · 1080p",
            "kind": "hls",
            "url": "https://streamfree-proxy.nishantjha31.workers.dev/hls/episode.m3u8",
            "audioVariant": "sub",
            "quality": 1080,
            "subtitleTracks": [{"id":"en","language":"en","url":"https://streamfree.online/subs/en.vtt","format":"vtt","isDefault":true}]
          },
          {
            "id": "filmu",
            "label": "Filmu",
            "kind": "iframe",
            "url": "https://embed.filmu.in/movie/550"
          },
          {
            "id": "unsafe",
            "label": "Unsafe",
            "kind": "mp4",
            "url": "https://example.com/video.mp4"
          }
        ]
      }
      """.trimIndent(),
    )
    val resolver = StreamFreeSourceApiResolver(transport)

    val result = resolver.resolve(
      PlaybackRequest(
        mediaType = MediaType.Anime,
        titleId = "21",
        anilistId = 21,
        episode = 4,
        audioVariant = AudioVariant.Sub,
      ),
    )

    assertEquals(2, result.sources.size)
    assertEquals("anivexa-reanime", result.sources[0].providerId)
    assertEquals(StreamFormat.Hls, result.sources[0].format)
    assertEquals(AudioVariant.Sub, result.sources[0].audioVariant)
    assertEquals("streamfree-api", result.sources[0].contractId)
    assertEquals("en", result.sources[0].subtitles.single().id)
    assertEquals(SourceKind.Iframe, result.sources[1].kind)
    assertTrue(transport.lastUrl.contains("anilistId=21"))
    assertTrue(transport.lastUrl.contains("preferredAudio=sub"))
  }

  @Test
  fun `explicit provider selection never silently returns another provider`() = runBlocking {
    val resolver = StreamFreeSourceApiResolver(
      FakeTransport(
        """
        {"sources":[
          {"id":"filmu","label":"Filmu","kind":"iframe","url":"https://embed.filmu.in/movie/550"},
          {"id":"vidking","label":"VidKing","kind":"iframe","url":"https://www.vidking.net/embed/movie/550"}
        ]}
        """.trimIndent(),
      ),
    )

    val result = resolver.resolve(
      PlaybackRequest(
        mediaType = MediaType.Movie,
        titleId = "550",
        tmdbId = 550,
        explicitSourceId = "vidking",
      ),
    )

    assertEquals(listOf("vidking"), result.sources.map { it.providerId })
  }

  private class FakeTransport(private val payload: String) : StreamFreeHttpTransport {
    var lastUrl: String = ""

    override fun get(url: String, headers: Map<String, String>): HttpResponse {
      lastUrl = url
      return HttpResponse(
        finalUrl = url,
        statusCode = 200,
        headers = mapOf("content-type" to "application/json"),
        body = payload.toByteArray(),
      )
    }
  }
}
