package online.streamfree.nativeapp.player

import online.streamfree.nativeapp.source.ResolvedSource
import online.streamfree.nativeapp.source.SourceKind
import online.streamfree.nativeapp.source.StreamFormat
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class StreamCachePolicyTest {
  private val direct = ResolvedSource(
    providerId = "direct-provider",
    label = "Direct provider",
    playbackUrl = "https://media.example.test/video.m3u8",
    kind = SourceKind.NativeDirect,
    format = StreamFormat.Hls,
  )

  private val embed = direct.copy(
    providerId = "embed-provider",
    kind = SourceKind.Iframe,
    format = StreamFormat.Embed,
    playbackUrl = "https://embed.example.test/player",
  )

  @Test
  fun `default policy caches direct streams but never grants offline playback`() {
    val policy = StreamCachePolicy()

    assertTrue(policy.shouldCache(direct))
    assertFalse(policy.shouldCache(embed))
    assertFalse(policy.permitsOfflinePlayback(direct))
  }

  @Test
  fun `offline playback requires an explicit provider allowlist`() {
    val policy = StreamCachePolicy(
      offlineDownloads = OfflineDownloadPolicy(
        enabled = true,
        permittedProviderIds = setOf("direct-provider"),
      ),
    )

    assertTrue(policy.permitsOfflinePlayback(direct))
    assertFalse(policy.permitsOfflinePlayback(embed))
  }

  @Test
  fun `offline policy rejects hotlink header sources and unsupported embeds`() {
    val policy = OfflineDownloadPolicy(
      enabled = true,
      permittedProviderIds = setOf("direct-provider"),
    )

    assertTrue(policy.canDownload(direct))
    assertFalse(policy.canDownload(direct.copy(headerPolicyId = "provider-origin")))
    assertFalse(policy.canDownload(embed))
  }

  @Test
  fun `offline download identity is stable and source-specific`() {
    val policy = OfflineDownloadPolicy(
      enabled = true,
      permittedProviderIds = setOf("direct-provider"),
    )
    assertEquals(OfflineDownloadStore.contentId(direct), OfflineDownloadStore.contentId(direct.copy()))
    assertFalse(OfflineDownloadStore.contentId(direct) == OfflineDownloadStore.contentId(direct.copy(providerId = "another")))
    assertTrue(policy.canDownload(direct))
  }

  @Test(expected = IllegalArgumentException::class)
  fun `cache size is bounded`() {
    StreamCachePolicy(maxBytes = 513L * 1024L * 1024L)
  }
}
