package online.streamfree.nativeapp.tv

import android.graphics.Color as AndroidColor
import android.os.Build
import android.view.ViewGroup
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.viewinterop.AndroidView
import online.streamfree.nativeapp.source.EmbedSourcePolicy
import online.streamfree.nativeapp.source.ResolvedSource

@Suppress("SetJavaScriptEnabled")
@Composable
fun EmbedPlaybackView(source: ResolvedSource, modifier: Modifier = Modifier) {
  require(EmbedSourcePolicy.isEligible(source)) { "Only approved HTTPS embed sources may enter the WebView" }
  AndroidView(
    modifier = modifier,
    factory = { context ->
      WebView(context).apply {
        layoutParams = ViewGroup.LayoutParams(
          ViewGroup.LayoutParams.MATCH_PARENT,
          ViewGroup.LayoutParams.MATCH_PARENT,
        )
        setBackgroundColor(AndroidColor.BLACK)
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.allowFileAccess = false
        settings.allowContentAccess = false
        settings.mediaPlaybackRequiresUserGesture = false
        settings.setSupportMultipleWindows(false)
        settings.displayZoomControls = false
        settings.builtInZoomControls = false
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_NEVER_ALLOW
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) settings.safeBrowsingEnabled = true
        webViewClient = RestrictedEmbedWebViewClient(source.playbackUrl)
        webChromeClient = WebChromeClient()
        loadUrl(source.playbackUrl)
      }
    },
    update = { webView ->
      if (webView.url != source.playbackUrl) webView.loadUrl(source.playbackUrl)
    },
  )
}

private class RestrictedEmbedWebViewClient(initialUrl: String) : WebViewClient() {
  private val initialHost = requireNotNull(java.net.URI(initialUrl).host).lowercase()

  override fun shouldOverrideUrlLoading(view: WebView, request: WebResourceRequest): Boolean {
    if (!request.isForMainFrame) return false
    val url = request.url.toString()
    val host = request.url.host?.lowercase() ?: return true
    return !EmbedSourcePolicy.isAllowedUrl(url) || !(host == initialHost || host.endsWith(".$initialHost"))
  }

  @Deprecated("Deprecated in Java")
  override fun shouldOverrideUrlLoading(view: WebView, url: String): Boolean {
    val host = runCatching { java.net.URI(url).host?.lowercase() }.getOrNull() ?: return true
    return !EmbedSourcePolicy.isAllowedUrl(url) || !(host == initialHost || host.endsWith(".$initialHost"))
  }
}
