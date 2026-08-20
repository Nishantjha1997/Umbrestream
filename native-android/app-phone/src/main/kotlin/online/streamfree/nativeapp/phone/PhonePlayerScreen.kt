@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package online.streamfree.nativeapp.phone

import android.app.Activity
import android.content.Context
import android.media.AudioManager
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.LifecycleEventObserver
import androidx.lifecycle.compose.LocalLifecycleOwner
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import online.streamfree.nativeapp.player.PlaybackDisplayMode
import online.streamfree.nativeapp.player.PlaybackPhase
import online.streamfree.nativeapp.player.PlaybackSessionController
import online.streamfree.nativeapp.player.PlaybackUiState
import online.streamfree.nativeapp.player.PlaybackDisplayModeStore
import online.streamfree.nativeapp.source.ResolvedSource

@Composable
fun PhoneHomeScreen(
  onOpenPlayer: () -> Unit,
) {
  Surface(
    modifier = Modifier.fillMaxSize(),
    color = MaterialTheme.colorScheme.background,
  ) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .safeDrawingPadding()
        .padding(24.dp),
      verticalArrangement = Arrangement.Center,
      horizontalAlignment = Alignment.CenterHorizontally,
    ) {
      Text("StreamFree", style = MaterialTheme.typography.headlineMedium)
      Text(
        "Native playback foundation",
        style = MaterialTheme.typography.bodyLarge,
        modifier = Modifier.padding(top = 8.dp, bottom = 24.dp),
      )
      Button(
        onClick = onOpenPlayer,
        modifier = Modifier.sizeIn(minWidth = 180.dp, minHeight = 48.dp),
      ) {
        Text("Open player")
      }
      Text(
        "Provider source adapters will plug into this player without changing its playback shell.",
        style = MaterialTheme.typography.bodySmall,
        modifier = Modifier.padding(top = 20.dp),
      )
    }
  }
}

@Composable
fun PhonePlayerScreen(
  controller: PlaybackSessionController,
  displayModeStore: PlaybackDisplayModeStore,
  onExit: () -> Unit,
  onFullscreenChanged: (Boolean) -> Unit,
  sourceCandidates: List<ResolvedSource> = emptyList(),
) {
  val context = LocalContext.current
  val scope = rememberCoroutineScope()
  val state by controller.state.collectAsStateWithLifecycle()
  val displayMode by displayModeStore.mode.collectAsStateWithLifecycle(
    initialValue = PlaybackDisplayMode.Fit,
  )
  val lifecycleOwner = LocalLifecycleOwner.current
  var isFullscreen by rememberSaveable { mutableStateOf(false) }
  var showSourcePicker by rememberSaveable { mutableStateOf(false) }
  var positionMs by remember { mutableLongStateOf(0L) }
  var durationMs by remember { mutableLongStateOf(0L) }

  LaunchedEffect(controller.player) {
    while (isActive) {
      positionMs = controller.player.currentPosition.coerceAtLeast(0L)
      durationMs = controller.player.duration.takeIf { it > 0L } ?: 0L
      delay(500L)
    }
  }

  DisposableEffect(lifecycleOwner, isFullscreen) {
    val observer = LifecycleEventObserver { _, event ->
      if (event == Lifecycle.Event.ON_STOP && isFullscreen) {
        isFullscreen = false
        onFullscreenChanged(false)
      }
    }
    lifecycleOwner.lifecycle.addObserver(observer)
    onDispose { lifecycleOwner.lifecycle.removeObserver(observer) }
  }

  fun exitPlayer() {
    if (isFullscreen) {
      isFullscreen = false
      onFullscreenChanged(false)
    }
    onExit()
  }

  BackHandler {
    if (isFullscreen) {
      isFullscreen = false
      onFullscreenChanged(false)
    } else {
      exitPlayer()
    }
  }

  Surface(
    modifier = Modifier.fillMaxSize(),
    color = Color.Black,
  ) {
    Column(
      modifier = Modifier
        .fillMaxSize()
        .then(if (isFullscreen) Modifier else Modifier.safeDrawingPadding()),
    ) {
      PlayerCinemaStage(
        controller = controller,
        state = state,
        displayMode = displayMode,
        isFullscreen = isFullscreen,
        positionMs = positionMs,
        durationMs = durationMs,
        onTogglePlayback = {
          if (controller.player.isPlaying) controller.pause() else controller.player.play()
        },
        onSeek = { controller.player.seekTo(it) },
        onSwipe = { x, dragAmount -> adjustPlaybackWindow(context, x, dragAmount) },
        onExit = ::exitPlayer,
        sourceCount = sourceCandidates.size,
        onOpenSources = { showSourcePicker = true },
        onDisplayModeChanged = { mode -> scope.launch { displayModeStore.set(mode) } },
        onFullscreenChanged = { fullscreen ->
          isFullscreen = fullscreen
          onFullscreenChanged(fullscreen)
        },
      )
      if (!isFullscreen) {
        PlaybackContextPanel(
          state = state,
          onExit = ::exitPlayer,
          modifier = Modifier
            .fillMaxWidth()
            .navigationBarsPadding()
            .padding(horizontal = 20.dp, vertical = 16.dp),
        )
      }
    }
  }

  if (showSourcePicker) {
    SourcePickerSheet(
      sources = sourceCandidates,
      selectedProviderId = state.source?.providerId,
      onDismiss = { showSourcePicker = false },
      onSourceSelected = { source ->
        state.request?.let { request -> controller.switchSource(request, source) }
        showSourcePicker = false
      },
    )
  }
}

@Composable
private fun PlayerCinemaStage(
  controller: PlaybackSessionController,
  state: PlaybackUiState,
  displayMode: PlaybackDisplayMode,
  isFullscreen: Boolean,
  positionMs: Long,
  durationMs: Long,
  onTogglePlayback: () -> Unit,
  onSeek: (Long) -> Unit,
  onSwipe: (Float, Float) -> Unit,
  onExit: () -> Unit,
  sourceCount: Int,
  onOpenSources: () -> Unit,
  onDisplayModeChanged: (PlaybackDisplayMode) -> Unit,
  onFullscreenChanged: (Boolean) -> Unit,
) {
  val stageModifier = if (isFullscreen) {
    Modifier.fillMaxSize()
  } else {
    Modifier.fillMaxWidth().aspectRatio(16f / 9f)
  }

  Box(
    modifier = stageModifier
      .background(Color.Black)
      .pointerInput(controller.player) {
        detectTapGestures(
          onDoubleTap = { offset ->
            val delta = if (offset.x < size.width / 2f) -10_000L else 10_000L
            onSeek((controller.player.currentPosition + delta).coerceAtLeast(0L))
          },
        )
      }
      .pointerInput(controller.player) {
        detectVerticalDragGestures { change, dragAmount ->
          change.consume()
          onSwipe(change.position.x, dragAmount)
        }
      },
  ) {
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
    PlayerOverlay(
      state = state,
      displayMode = displayMode,
      isFullscreen = isFullscreen,
      positionMs = positionMs,
      durationMs = durationMs,
      onTogglePlayback = onTogglePlayback,
      onSeek = onSeek,
      onExit = onExit,
      sourceCount = sourceCount,
      onOpenSources = onOpenSources,
      onDisplayModeChanged = onDisplayModeChanged,
      onFullscreenChanged = onFullscreenChanged,
    )
  }
}

@Composable
private fun PlayerOverlay(
  state: PlaybackUiState,
  displayMode: PlaybackDisplayMode,
  isFullscreen: Boolean,
  positionMs: Long,
  durationMs: Long,
  onTogglePlayback: () -> Unit,
  onSeek: (Long) -> Unit,
  onExit: () -> Unit,
  sourceCount: Int,
  onOpenSources: () -> Unit,
  onDisplayModeChanged: (PlaybackDisplayMode) -> Unit,
  onFullscreenChanged: (Boolean) -> Unit,
) {
  val isPlaying = state.phase == PlaybackPhase.Playing
  val progress = if (durationMs > 0L) {
    (positionMs.toFloat() / durationMs.toFloat()).coerceIn(0f, 1f)
  } else {
    0f
  }

  Column(modifier = Modifier.fillMaxSize()) {
    Row(
      modifier = Modifier
        .fillMaxWidth()
        .statusBarsPadding()
        .padding(horizontal = 12.dp, vertical = 8.dp),
      horizontalArrangement = Arrangement.SpaceBetween,
      verticalAlignment = Alignment.CenterVertically,
    ) {
      OutlinedButton(
        onClick = onExit,
        modifier = Modifier
          .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
          .semantics { contentDescription = "Close player" },
      ) {
        Text("×")
      }
      Text(
        text = state.request?.titleId ?: "Select an episode",
        style = MaterialTheme.typography.labelLarge,
        color = Color.White,
      )
      OutlinedButton(
        onClick = { onFullscreenChanged(!isFullscreen) },
        modifier = Modifier
          .sizeIn(minWidth = 48.dp, minHeight = 48.dp)
          .semantics { contentDescription = if (isFullscreen) "Exit fullscreen" else "Enter fullscreen" },
      ) {
        Text(if (isFullscreen) "↙" else "↗")
      }
    }

    Box(modifier = Modifier.weight(1f).fillMaxWidth(), contentAlignment = Alignment.Center) {
      Button(
        onClick = onTogglePlayback,
        modifier = Modifier
          .sizeIn(minWidth = 64.dp, minHeight = 56.dp)
          .semantics { contentDescription = if (isPlaying) "Pause playback" else "Play playback" },
      ) {
        Text(if (isPlaying) "Ⅱ" else "▶")
      }
    }

    Column(
      modifier = Modifier
        .fillMaxWidth()
        .navigationBarsPadding()
        .padding(horizontal = 16.dp, vertical = 10.dp),
    ) {
      Slider(
        value = progress,
        onValueChange = { value ->
          if (durationMs > 0L) onSeek((value * durationMs).toLong())
        },
        enabled = durationMs > 0L,
        modifier = Modifier
          .fillMaxWidth()
          .semantics { contentDescription = "Playback progress" },
      )
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
      ) {
        Button(
          onClick = onOpenSources,
          modifier = Modifier
            .sizeIn(minWidth = 84.dp, minHeight = 48.dp)
            .semantics { contentDescription = "Choose playback server" },
        ) {
          Text(if (sourceCount > 0) "Server $sourceCount" else "Server")
        }
        Button(
          onClick = {
            onDisplayModeChanged(
              if (displayMode == PlaybackDisplayMode.Fit) PlaybackDisplayMode.Fill else PlaybackDisplayMode.Fit,
            )
          },
          modifier = Modifier.sizeIn(minWidth = 72.dp, minHeight = 48.dp),
        ) {
          Text(displayMode.name)
        }
        Text(
          text = playbackStatus(state),
          color = Color.White,
          style = MaterialTheme.typography.labelMedium,
        )
        Button(
          onClick = onTogglePlayback,
          modifier = Modifier.sizeIn(minWidth = 72.dp, minHeight = 48.dp),
        ) {
          Text(if (isPlaying) "Pause" else "Play")
        }
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SourcePickerSheet(
  sources: List<ResolvedSource>,
  selectedProviderId: String?,
  onDismiss: () -> Unit,
  onSourceSelected: (ResolvedSource) -> Unit,
) {
  ModalBottomSheet(onDismissRequest = onDismiss) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .navigationBarsPadding()
        .padding(horizontal = 20.dp, vertical = 8.dp),
    ) {
      Text("Choose a server", style = MaterialTheme.typography.headlineSmall)
      Text(
        "Only sources resolved for this episode are shown. Choosing one will preserve the current position when supported.",
        style = MaterialTheme.typography.bodyMedium,
        modifier = Modifier.padding(top = 8.dp, bottom = 12.dp),
      )
      if (sources.isEmpty()) {
        Text(
          "No compatible sources are available yet. Try again after the episode resolver returns.",
          style = MaterialTheme.typography.bodyLarge,
          modifier = Modifier.padding(bottom = 24.dp),
        )
      } else {
        LazyColumn(modifier = Modifier.fillMaxWidth()) {
          items(
            items = sources,
            key = { source -> "${source.providerId}:${source.playbackUrl}" },
          ) { source ->
            Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
              Button(
                onClick = { onSourceSelected(source) },
                modifier = Modifier
                  .fillMaxWidth()
                  .sizeIn(minHeight = 56.dp)
                  .semantics {
                    contentDescription = "Use ${source.label} server"
                  },
              ) {
                Text(
                  if (source.providerId == selectedProviderId) {
                    "${source.label} · Selected"
                  } else {
                    source.label
                  },
                )
              }
              Text(
                sourceSummary(source),
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 4.dp, start = 4.dp),
              )
            }
            HorizontalDivider()
          }
        }
      }
    }
  }
}

private fun sourceSummary(source: ResolvedSource): String = buildString {
  append(source.format.name.uppercase())
  source.quality?.let { append(" · ${it}p") }
  source.audioVariant?.let { append(" · ${it.name}") }
  if (source.subtitles.isNotEmpty()) append(" · captions")
}

@Composable
private fun PlaybackContextPanel(
  state: PlaybackUiState,
  onExit: () -> Unit,
  modifier: Modifier = Modifier,
) {
  Column(modifier = modifier) {
    Text(
      text = "Playback is framed by default. Use Fill to crop excess edges, or fullscreen for landscape cinema mode.",
      style = MaterialTheme.typography.bodyMedium,
      color = Color.White,
    )
    if (state.errorMessage != null) {
      Text(
        text = "Playback needs attention: ${state.errorMessage}",
        style = MaterialTheme.typography.bodySmall,
        color = MaterialTheme.colorScheme.error,
        modifier = Modifier.padding(top = 8.dp),
      )
    }
    if (state.phase == PlaybackPhase.Idle) {
      OutlinedButton(
        onClick = onExit,
        modifier = Modifier
          .padding(top = 12.dp)
          .sizeIn(minWidth = 140.dp, minHeight = 48.dp),
      ) {
        Text("Choose an episode")
      }
    }
  }
}

private fun playbackStatus(state: PlaybackUiState): String = when {
  state.errorMessage != null -> "Playback error"
  state.phase == PlaybackPhase.Playing -> "Playing"
  state.phase == PlaybackPhase.Paused -> "Paused"
  else -> state.phase.name
}

private fun adjustPlaybackWindow(context: Context, x: Float, dragAmount: Float) {
  val activity = context as? Activity ?: return
  val width = activity.resources.displayMetrics.widthPixels.toFloat()
  if (x < width / 2f) {
    val attributes = activity.window.attributes
    val current = attributes.screenBrightness.takeIf { it >= 0f } ?: 0.5f
    attributes.screenBrightness = (current - dragAmount / 900f).coerceIn(0.05f, 1f)
    activity.window.attributes = attributes
  } else {
    val audioManager = context.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return
    val direction = if (dragAmount < 0f) AudioManager.ADJUST_RAISE else AudioManager.ADJUST_LOWER
    audioManager.adjustStreamVolume(AudioManager.STREAM_MUSIC, direction, 0)
  }
}
