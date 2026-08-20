package online.streamfree.nativeapp.designsystem

import android.graphics.BitmapFactory
import androidx.compose.foundation.Image
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.net.HttpURLConnection
import java.net.URI
import java.net.URL

private val allowedArtworkHosts = setOf(
  "image.tmdb.org",
  "s4.anilist.co",
  "img.anili.st",
)

@Composable
fun StreamFreeArtwork(
  url: String,
  title: String,
  modifier: Modifier = Modifier,
) {
  var bitmap by remember(url) { mutableStateOf<android.graphics.Bitmap?>(null) }
  var failed by remember(url) { mutableStateOf(false) }
  LaunchedEffect(url) {
    bitmap = withContext(Dispatchers.IO) { loadArtwork(url) }
    failed = bitmap == null
  }
  Box(
    modifier = modifier
      .background(MaterialTheme.colorScheme.surfaceVariant)
      .semantics { contentDescription = title },
    contentAlignment = Alignment.Center,
  ) {
    when {
      bitmap != null -> Image(
        bitmap = bitmap!!.asImageBitmap(),
        contentDescription = title,
        modifier = Modifier.fillMaxSize(),
        contentScale = ContentScale.Crop,
      )
      failed -> Text(
        "Artwork unavailable",
        style = MaterialTheme.typography.labelSmall,
        maxLines = 2,
        overflow = TextOverflow.Ellipsis,
      )
      else -> Text("Loading…", style = MaterialTheme.typography.labelSmall)
    }
  }
}

private fun loadArtwork(rawUrl: String): android.graphics.Bitmap? {
  val uri = runCatching { URI(rawUrl) }.getOrNull() ?: return null
  val host = uri.host?.lowercase()?.trimEnd('.') ?: return null
  if (uri.scheme?.lowercase() != "https" || host !in allowedArtworkHosts) return null
  val connection = runCatching { URL(rawUrl).openConnection() as? HttpURLConnection }.getOrNull() ?: return null
  return try {
    connection.instanceFollowRedirects = false
    connection.connectTimeout = 8_000
    connection.readTimeout = 8_000
    connection.setRequestProperty("Accept", "image/avif,image/webp,image/jpeg,image/png")
    if (connection.responseCode !in 200..299) return null
    if (connection.contentLengthLong > MAX_ARTWORK_BYTES) return null
    connection.inputStream.use { BitmapFactory.decodeStream(it) }
  } catch (_: Exception) {
    null
  } finally {
    connection.disconnect()
  }
}

private const val MAX_ARTWORK_BYTES = 4L * 1024L * 1024L
