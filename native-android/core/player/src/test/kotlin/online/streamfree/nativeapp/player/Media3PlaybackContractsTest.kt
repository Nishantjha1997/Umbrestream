package online.streamfree.nativeapp.player

import androidx.media3.common.MimeTypes
import online.streamfree.nativeapp.source.StreamFormat
import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class Media3PlaybackContractsTest {
  @Test
  fun `native media formats map to Media3 MIME types`() {
    assertEquals(MimeTypes.APPLICATION_M3U8, Media3PlaybackContracts.mimeType(StreamFormat.Hls))
    assertEquals(MimeTypes.APPLICATION_MPD, Media3PlaybackContracts.mimeType(StreamFormat.Dash))
    assertEquals(MimeTypes.VIDEO_MP4, Media3PlaybackContracts.mimeType(StreamFormat.Mp4))
    assertTrue(Media3PlaybackContracts.isNativePlayable(StreamFormat.Hls))
    assertTrue(Media3PlaybackContracts.isNativePlayable(StreamFormat.Dash))
    assertTrue(Media3PlaybackContracts.isNativePlayable(StreamFormat.Mp4))
  }

  @Test
  fun `iframe is not a native Media3 format`() {
    assertFalse(Media3PlaybackContracts.isNativePlayable(StreamFormat.Embed))
    try {
      Media3PlaybackContracts.mimeType(StreamFormat.Embed)
      throw AssertionError("Embed sources must not be passed to Media3")
    } catch (_: UnsupportedOperationException) {
      // Expected: embeds use the separate consent-based fallback surface.
    }
  }
}
