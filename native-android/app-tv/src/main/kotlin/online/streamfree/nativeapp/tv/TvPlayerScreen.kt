@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package online.streamfree.nativeapp.tv

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.focusable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.material3.Button
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import kotlinx.coroutines.launch
import online.streamfree.nativeapp.player.PlaybackDisplayMode
import online.streamfree.nativeapp.player.PlaybackDisplayModeStore
import online.streamfree.nativeapp.player.PlaybackPhase
import online.streamfree.nativeapp.player.PlaybackSessionController

@Composable
fun TvHomeScreen(onOpenPlayer: () -> Unit) {
  Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .padding(horizontal = 72.dp, vertical = 48.dp),
      verticalArrangement = Arrangement.Center,
      horizontalAlignment = Alignment.CenterHorizontally,
    ) {
      Text("StreamFree TV", style = MaterialTheme.typography.displaySmall)
      Text(
        "Remote-first native playback foundation",
        style = MaterialTheme.typography.titleLarge,
        modifier = Modifier.padding(top = 12.dp, bottom = 32.dp),
      )
      TvFocusButton(
        text = "Open player",
        onClick = onOpenPlayer,
        contentDescription = "Open TV player",
      )
      Text(
        "Playback mode removes normal navigation from the screen and remote focus.",
        style = MaterialTheme.typography.bodyLarge,
        modifier = Modifier.padding(top = 24.dp),
      )
    }
  }
}

@Composable
fun TvPlayerScreen(
  controller: PlaybackSessionController,
  displayModeStore: PlaybackDisplayModeStore,
  onExit: () -> Unit,
) {
  val displayMode by displayModeStore.mode.collectAsStateWithLifecycle(
    initialValue = PlaybackDisplayMode.Fit,
  )
  val state by controller.state.collectAsStateWithLifecycle()
  val firstControl = remember { FocusRequester() }
  val scope = androidx.compose.runtime.rememberCoroutineScope()
  var isOverlayVisible by rememberSaveable { mutableStateOf(true) }

  LaunchedEffect(Unit) { firstControl.requestFocus() }
  DisposableEffect(Unit) {
    onDispose { controller.pause() }
  }
  BackHandler { onExit() }

  BoxWithConstraints(
    modifier = Modifier
      .fillMaxSize()
      .background(Color.Black),
  ) {
    val safeMargin = (maxWidth * 0.04f).coerceIn(32.dp, 84.dp)
    AndroidView(
      modifier = Modifier.fillMaxSize(),
      factory = { context ->
        PlayerView(context).apply {
          useController = false
          keepScreenOn = true
          setShutterBackgroundColor(android.graphics.Color.BLACK)
          setShowBuffering(PlayerView.SHOW_BUFFERING_WHEN_PLAYING)
        }
      },
      update = { playerView ->
        playerView.player = controller.player
        playerView.resizeMode = when (displayMode) {
          PlaybackDisplayMode.Fit -> AspectRatioFrameLayout.RESIZE_MODE_FIT
          PlaybackDisplayMode.Fill -> AspectRatioFrameLayout.RESIZE_MODE_ZOOM
        }
      },
    )
    if (isOverlayVisible) {
      Column(
        modifier = Modifier
          .fillMaxSize()
          .padding(horizontal = safeMargin, vertical = 32.dp),
        verticalArrangement = Arrangement.SpaceBetween,
      ) {
        Row(
          modifier = Modifier.fillMaxWidth(),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          TvFocusButton(
            text = "Back",
            onClick = onExit,
            contentDescription = "Exit playback",
            modifier = Modifier.focusRequester(firstControl),
          )
          Text(
            text = state.request?.titleId ?: "Select an episode",
            style = MaterialTheme.typography.titleLarge,
            color = Color.White,
            maxLines = 1,
            overflow = TextOverflow.Ellipsis,
            modifier = Modifier.weight(1f).padding(horizontal = 20.dp),
          )
          Text(
            text = if (state.phase == PlaybackPhase.Playing) "Playing" else state.phase.name,
            style = MaterialTheme.typography.labelLarge,
            color = Color.White,
          )
        }
        Row(
          modifier = Modifier
            .fillMaxWidth()
            .widthIn(max = 1700.dp)
            .wrapContentHeight()
            .navigationBarsPadding(),
          horizontalArrangement = Arrangement.spacedBy(16.dp),
          verticalAlignment = Alignment.CenterVertically,
        ) {
          TvFocusButton(
            text = if (controller.player.isPlaying) "Pause" else "Play",
            onClick = {
              if (controller.player.isPlaying) controller.pause() else controller.player.play()
            },
            contentDescription = "Play or pause playback",
            modifier = Modifier.weight(1f),
          )
          TvFocusButton(
            text = "Servers",
            onClick = { isOverlayVisible = true },
            contentDescription = "Choose playback server",
            modifier = Modifier.weight(1f),
          )
          TvFocusButton(
            text = displayMode.name,
            onClick = {
              val next = if (displayMode == PlaybackDisplayMode.Fit) {
                PlaybackDisplayMode.Fill
              } else {
                PlaybackDisplayMode.Fit
              }
              // TV mode keeps the same PlayerView; the activity owns the store.
              scope.launch {
                displayModeStore.set(next)
              }
            },
            contentDescription = "Toggle fit or fill display",
            modifier = Modifier.weight(1f),
          )
          TvFocusButton(
            text = "Next",
            onClick = { isOverlayVisible = true },
            contentDescription = "Play next episode",
            modifier = Modifier.weight(1f),
          )
        }
      }
    }
  }
}

@Composable
private fun TvFocusButton(
  text: String,
  onClick: () -> Unit,
  contentDescription: String,
  modifier: Modifier = Modifier,
) {
  var focused by remember { mutableStateOf(false) }
  Button(
    onClick = onClick,
    modifier = modifier
      .sizeIn(minWidth = 128.dp, minHeight = 64.dp)
      .onFocusChanged { focused = it.isFocused }
      .scale(if (focused) 1.02f else 1f)
      .then(if (focused) Modifier.border(2.dp, MaterialTheme.colorScheme.primary) else Modifier)
      .focusable()
      .semantics { this.contentDescription = contentDescription },
  ) {
    Text(text, style = MaterialTheme.typography.titleMedium)
  }
}
