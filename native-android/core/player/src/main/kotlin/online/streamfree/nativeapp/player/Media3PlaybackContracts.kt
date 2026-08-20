package online.streamfree.nativeapp.player

import androidx.media3.common.MimeTypes
import online.streamfree.nativeapp.source.StreamFormat

object Media3PlaybackContracts {
  fun mimeType(format: StreamFormat): String = when (format) {
    StreamFormat.Hls -> MimeTypes.APPLICATION_M3U8
    StreamFormat.Dash -> MimeTypes.APPLICATION_MPD
    StreamFormat.Mp4 -> MimeTypes.VIDEO_MP4
    StreamFormat.Embed -> throw UnsupportedOperationException(
      "Iframe embeds require the separate consent-based WebView fallback",
    )
  }

  fun isNativePlayable(format: StreamFormat): Boolean = format != StreamFormat.Embed
}
