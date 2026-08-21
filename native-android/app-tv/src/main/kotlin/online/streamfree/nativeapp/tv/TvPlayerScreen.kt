@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package online.streamfree.nativeapp.tv

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import java.io.File
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
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.material3.Button
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.OutlinedTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.snapshotFlow
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.scale
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.net.toUri
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.launch
import online.streamfree.nativeapp.model.AdjacentEpisodeResolver
import online.streamfree.nativeapp.model.EpisodeCatalog
import online.streamfree.nativeapp.model.EpisodeDirection
import online.streamfree.nativeapp.model.EpisodeRef
import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.model.NativeHomeFeed
import online.streamfree.nativeapp.model.NativeHomeRow
import online.streamfree.nativeapp.model.NativeMediaSummary
import online.streamfree.nativeapp.model.mergeContinueWatchingPage
import online.streamfree.nativeapp.player.PlaybackDisplayMode
import online.streamfree.nativeapp.auth.AuthResult
import online.streamfree.nativeapp.auth.AnimeNotificationClient
import online.streamfree.nativeapp.auth.AuthSessionManager
import online.streamfree.nativeapp.auth.HistorySyncClient
import online.streamfree.nativeapp.auth.NativeAnimeNotifications
import online.streamfree.nativeapp.auth.NativeAnimeProvider
import online.streamfree.nativeapp.auth.NativeAnimeLinkResult
import online.streamfree.nativeapp.auth.NativeUpdateCheck
import online.streamfree.nativeapp.auth.NativeUpdateClient
import online.streamfree.nativeapp.auth.NativeUpdateStatus
import online.streamfree.nativeapp.player.PlaybackDisplayModeStore
import online.streamfree.nativeapp.player.PlaybackPhase
import online.streamfree.nativeapp.player.PlaybackSessionController
import online.streamfree.nativeapp.player.SourcePreferenceStore
import online.streamfree.nativeapp.player.RegionPreferenceStore
import online.streamfree.nativeapp.player.OnboardingPreferenceStore
import online.streamfree.nativeapp.source.PlaybackRequest
import online.streamfree.nativeapp.source.EpisodeCatalogResolver
import online.streamfree.nativeapp.source.EmbedSourcePolicy
import online.streamfree.nativeapp.source.ResolvedSource
import online.streamfree.nativeapp.source.ResolutionOrchestrator
import online.streamfree.nativeapp.source.ResolutionPreferences
import online.streamfree.nativeapp.source.SourceKind
import online.streamfree.nativeapp.source.StreamFreeHomeFeedResolver

@Composable
fun TvHomeScreen(
  onOpenPlayer: () -> Unit,
  feedResolver: StreamFreeHomeFeedResolver? = null,
  regionPreferenceStore: RegionPreferenceStore? = null,
  onboardingPreferenceStore: OnboardingPreferenceStore? = null,
  updateClient: NativeUpdateClient? = null,
  onInstallUpdate: (File) -> Unit = {},
  authManager: AuthSessionManager? = null,
  notificationClient: AnimeNotificationClient? = null,
  animeLinkResult: NativeAnimeLinkResult? = null,
  onAnimeLinkResultHandled: () -> Unit = {},
  onOpenTitle: (PlaybackRequest) -> Unit = {},
) {
  var feed by remember { mutableStateOf<NativeHomeFeed?>(null) }
  var feedFailed by remember { mutableStateOf(false) }
  var regionOverride by remember { mutableStateOf<String?>(null) }
  var loadingContinue by remember { mutableStateOf(false) }
  var accountEmail by remember { mutableStateOf<String?>(null) }
  var showAuthDialog by rememberSaveable { mutableStateOf(false) }
  var authEmail by rememberSaveable { mutableStateOf("") }
  var authPassword by rememberSaveable { mutableStateOf("") }
  var authError by remember { mutableStateOf<String?>(null) }
  var authBusy by remember { mutableStateOf(false) }
  var linkMessage by remember { mutableStateOf<String?>(null) }
  var animeNotifications by remember { mutableStateOf<NativeAnimeNotifications?>(null) }
  val context = LocalContext.current
  var showRegionDialog by rememberSaveable { mutableStateOf(false) }
  var showTour by rememberSaveable { mutableStateOf(false) }
  var tourStep by rememberSaveable { mutableStateOf(0) }
  var onboardingCompleted by remember { mutableStateOf<Boolean?>(null) }
  var updateCheck by remember { mutableStateOf<NativeUpdateCheck?>(null) }
  var updateBusy by remember { mutableStateOf(false) }
  val homeScope = rememberCoroutineScope()
  fun reloadHome() {
    homeScope.launch {
      val override = regionPreferenceStore?.get()
      regionOverride = override
      val token = authManager?.accessToken()
      val resolved = feedResolver?.resolve(bearerTokenValue = token, regionOverrideValue = override)
      feed = resolved
      feedFailed = feedResolver != null && resolved == null
    }
  }
  LaunchedEffect(authManager) {
    authManager?.session?.collect { accountEmail = it?.email }
  }
  LaunchedEffect(accountEmail, authManager, notificationClient) {
    if (accountEmail == null || authManager == null || notificationClient == null) {
      animeNotifications = null
    } else {
      animeNotifications = authManager.accessToken()?.let { notificationClient.load(it) }
    }
  }
  LaunchedEffect(accountEmail) {
    if (accountEmail != null && Build.VERSION.SDK_INT >= 33) {
      val activity = context as? Activity
      if (activity != null && ContextCompat.checkSelfPermission(activity, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
        ActivityCompat.requestPermissions(activity, arrayOf(Manifest.permission.POST_NOTIFICATIONS), NOTIFICATION_PERMISSION_REQUEST_CODE)
      }
    }
  }
  LaunchedEffect(animeLinkResult) {
    animeLinkResult?.let { result ->
      linkMessage = result.message
      if (result.success) reloadHome()
      onAnimeLinkResultHandled()
    }
  }
  LaunchedEffect(onboardingPreferenceStore) {
    onboardingCompleted = onboardingPreferenceStore?.hasCompleted() ?: true
  }
  LaunchedEffect(onboardingCompleted) {
    if (onboardingCompleted == false) showTour = true
  }
  fun loadMoreContinue(cursor: String) {
    if (loadingContinue || feedResolver == null) return
    homeScope.launch {
      loadingContinue = true
      try {
        val override = regionPreferenceStore?.get()
        val nextPage = feedResolver.resolve(regionOverrideValue = override, continueCursorValue = cursor)
        if (nextPage != null) feed = feed?.mergeContinueWatchingPage(nextPage)
      } finally {
        loadingContinue = false
      }
    }
  }
  fun openAnimeLink(provider: NativeAnimeProvider) {
    homeScope.launch {
      linkMessage = "Preparing ${provider.name} linking…"
      val authorizationUrl = authManager?.beginAnimeLink(provider)
      if (authorizationUrl == null) {
        linkMessage = "Anime account linking is unavailable right now."
      } else {
        context.startActivity(Intent(Intent.ACTION_VIEW, authorizationUrl.toUri()))
        linkMessage = "Finish linking in your browser, then return to StreamFree."
      }
    }
  }
  fun checkForUpdate() {
    if (updateBusy) return
    homeScope.launch {
      updateBusy = true
      updateCheck = updateClient?.check() ?: NativeUpdateCheck(
        status = NativeUpdateStatus.Error,
        message = "Updates are unavailable in this build.",
      )
      updateBusy = false
    }
  }
  LaunchedEffect(feedResolver, regionPreferenceStore) { reloadHome() }
  Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
    if (feedResolver == null || feedFailed) {
      Column(
        modifier = Modifier.fillMaxSize().padding(horizontal = 72.dp, vertical = 48.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
      ) {
        Text("StreamFree TV", style = MaterialTheme.typography.displaySmall)
        Text(
          if (feedFailed) "Home is temporarily unavailable."
          else "Loading your home…",
          style = MaterialTheme.typography.titleLarge,
          modifier = Modifier.padding(top = 12.dp, bottom = 32.dp),
        )
        TvFocusButton(text = "Open player", onClick = onOpenPlayer, contentDescription = "Open TV player")
      }
    } else if (feed == null) {
      Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text("Preparing your home…", style = MaterialTheme.typography.displaySmall)
      }
    } else {
      TvHomeFeed(
        feed = feed!!,
        regionOverride = regionOverride,
        onRegionChange = { showRegionDialog = true },
        accountEmail = accountEmail,
        onAccountAction = {
          if (accountEmail == null) {
            authError = null
            showAuthDialog = true
          } else {
            homeScope.launch {
              authManager?.signOut()
              accountEmail = null
              reloadHome()
            }
          }
        },
        onLinkAnime = ::openAnimeLink,
        linkMessage = linkMessage,
        animeNotifications = animeNotifications,
        onMarkAnimeNotificationsRead = {
          homeScope.launch {
            val token = authManager?.accessToken()
            if (token != null && notificationClient?.markAllRead(token) == true) {
              animeNotifications = animeNotifications?.copy(
                notifications = animeNotifications?.notifications.orEmpty().map { it.copy(readAt = "read") },
                unreadCount = 0,
              )
            }
          }
        },
        onLoadMore = { row ->
          if (row.kind == "continue") row.nextCursor?.let(::loadMoreContinue)
        },
        onOpenTour = {
          tourStep = 0
          showTour = true
        },
        onCheckForUpdates = ::checkForUpdate,
        onOpenTitle = onOpenTitle,
      )
    }
  }
  if (showRegionDialog) {
    TvRegionChooserDialog(
      selected = regionOverride,
      onDismiss = { showRegionDialog = false },
      onSelected = { selected ->
        homeScope.launch {
          if (selected == null) regionPreferenceStore?.clear() else regionPreferenceStore?.set(selected)
          showRegionDialog = false
          reloadHome()
        }
      },
    )
  }
  if (showAuthDialog) {
    AlertDialog(
      onDismissRequest = { if (!authBusy) showAuthDialog = false },
      title = { Text("Sign in to sync") },
      text = {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
          Text("Use your StreamFree account to sync Continue Watching and history.")
          OutlinedTextField(
            value = authEmail,
            onValueChange = { authEmail = it; authError = null },
            label = { Text("Email") },
            singleLine = true,
            enabled = !authBusy,
          )
          OutlinedTextField(
            value = authPassword,
            onValueChange = { authPassword = it; authError = null },
            label = { Text("Password") },
            singleLine = true,
            enabled = !authBusy,
            visualTransformation = PasswordVisualTransformation(),
          )
          authError?.let { Text(it, color = MaterialTheme.colorScheme.error) }
        }
      },
      confirmButton = {
        TvFocusButton(
          text = if (authBusy) "Signing in…" else "Sign in",
          onClick = {
            homeScope.launch {
              authBusy = true
              authError = null
              when (val result = authManager?.signIn(authEmail, authPassword)) {
                is AuthResult.Success -> {
                  accountEmail = result.session.email ?: authEmail.trim()
                  showAuthDialog = false
                  authPassword = ""
                  reloadHome()
                }
                is AuthResult.Failure -> authError = result.message
                null -> authError = "Account services are unavailable."
              }
              authBusy = false
            }
          },
          contentDescription = "Sign in to StreamFree",
        )
      },
      dismissButton = {
        TvFocusButton(text = "Cancel", onClick = { showAuthDialog = false }, contentDescription = "Cancel sign in")
      },
    )
  }
  if (showTour) {
    TvOnboardingDialog(
      step = tourStep,
      onSkip = {
        showTour = false
        homeScope.launch { onboardingPreferenceStore?.markCompleted() }
      },
      onBack = { tourStep = (tourStep - 1).coerceAtLeast(0) },
      onNext = {
        if (tourStep == TV_TOUR_STEPS.lastIndex) {
          showTour = false
          homeScope.launch { onboardingPreferenceStore?.markCompleted() }
        } else {
          tourStep += 1
        }
      },
    )
  }
  updateCheck?.let { result ->
    TvUpdateDialog(
      result = result,
      busy = updateBusy,
      onDismiss = { if (!updateBusy) updateCheck = null },
      onDownloadAndInstall = download@{
        val manifest = result.manifest ?: return@download
        homeScope.launch {
          updateBusy = true
          runCatching { updateClient?.downloadAndVerify(context, manifest) }
            .onSuccess { apk ->
              updateCheck = null
              if (apk != null) onInstallUpdate(apk)
            }
            .onFailure { error ->
              updateCheck = NativeUpdateCheck(
                status = NativeUpdateStatus.Error,
                message = error.message ?: "Update verification failed",
              )
            }
          updateBusy = false
        }
      },
    )
  }
}

private const val NOTIFICATION_PERMISSION_REQUEST_CODE = 4108

@Composable
internal fun TvHomeFeed(
  feed: NativeHomeFeed,
  regionOverride: String? = null,
  onRegionChange: (() -> Unit)? = null,
  accountEmail: String? = null,
  onAccountAction: (() -> Unit)? = null,
  onLinkAnime: ((NativeAnimeProvider) -> Unit)? = null,
  linkMessage: String? = null,
  animeNotifications: NativeAnimeNotifications? = null,
  onMarkAnimeNotificationsRead: (() -> Unit)? = null,
  onOpenTour: (() -> Unit)? = null,
  onCheckForUpdates: (() -> Unit)? = null,
  onLoadMore: (NativeHomeRow) -> Unit = {},
  onOpenTitle: (PlaybackRequest) -> Unit,
) {
  LazyColumn(
    modifier = Modifier.fillMaxSize(),
    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 72.dp, vertical = 48.dp),
    verticalArrangement = Arrangement.spacedBy(24.dp),
  ) {
    item {
      Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically,
      ) {
        Column {
          Text("StreamFree TV", style = MaterialTheme.typography.displaySmall)
          Text("${feed.region.countryName} · ${feed.provenance.replace('_', ' ')}", style = MaterialTheme.typography.titleLarge)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
          if (onRegionChange != null) {
            TvFocusButton(
              text = "Region: ${regionOverride ?: "Automatic"}",
              onClick = onRegionChange,
              contentDescription = "Choose recommendation region",
              modifier = Modifier.widthIn(min = 260.dp, max = 380.dp),
            )
          }
          if (onAccountAction != null) {
            TvFocusButton(
              text = accountEmail?.let { "Sign out" } ?: "Sign in",
              onClick = onAccountAction,
              contentDescription = accountEmail?.let { "Sign out of StreamFree" } ?: "Sign in to StreamFree",
              modifier = Modifier.widthIn(min = 220.dp, max = 300.dp),
            )
          }
          if (onOpenTour != null) {
            TvFocusButton(
              text = "Help & tour",
              onClick = onOpenTour,
              contentDescription = "Open the StreamFree help and app tour",
              modifier = Modifier.widthIn(min = 220.dp, max = 300.dp),
            )
          }
        }
        if (accountEmail != null && onLinkAnime != null) {
          Row(horizontalArrangement = Arrangement.spacedBy(16.dp), modifier = Modifier.padding(top = 12.dp)) {
            TvFocusButton(
              text = "Link AniList",
              onClick = { onLinkAnime(NativeAnimeProvider.AniList) },
              contentDescription = "Link AniList account",
              modifier = Modifier.widthIn(min = 220.dp, max = 300.dp),
            )
            TvFocusButton(
              text = "Link MAL",
              onClick = { onLinkAnime(NativeAnimeProvider.MyAnimeList) },
              contentDescription = "Link MyAnimeList account",
              modifier = Modifier.widthIn(min = 220.dp, max = 300.dp),
            )
          }
        }
        linkMessage?.let { Text(it, style = MaterialTheme.typography.bodyMedium, modifier = Modifier.padding(top = 8.dp)) }
        if (animeNotifications != null && animeNotifications.unreadCount > 0) {
          Column(modifier = Modifier.padding(top = 16.dp)) {
            Text("${animeNotifications.unreadCount} new anime episode${if (animeNotifications.unreadCount == 1) "" else "s"}", style = MaterialTheme.typography.titleLarge)
            animeNotifications.notifications.firstOrNull()?.let { notification ->
              Text("${notification.title} · Episode ${notification.episode}", style = MaterialTheme.typography.bodyMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
            }
            onMarkAnimeNotificationsRead?.let { onRead ->
              TvFocusButton(text = "Mark anime notifications read", onClick = onRead, contentDescription = "Mark anime episode notifications as read", modifier = Modifier.padding(top = 8.dp))
            }
          }
        }
      }
      if (onCheckForUpdates != null) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
          TvFocusButton(
            text = "Check for updates",
            onClick = onCheckForUpdates,
            contentDescription = "Check for secure StreamFree updates",
          )
        }
      }
    }
    feed.hero?.let { hero ->
      item {
        TvFocusButton(
          text = "${if (hero.intent == "resume") "Resume" else "Featured"}: ${hero.media.title}",
          onClick = { onOpenTitle(hero.media.toPlaybackRequest(hero.progress)) },
          contentDescription = "Open ${hero.media.title}",
          modifier = Modifier.widthIn(min = 460.dp, max = 720.dp),
        )
      }
    }
    items(feed.rows, key = { it.id }) { row ->
      Column {
        Text(row.title, style = MaterialTheme.typography.headlineSmall)
        val listState = rememberLazyListState()
        LaunchedEffect(row.id, row.nextCursor, listState) {
          if (row.nextCursor == null) return@LaunchedEffect
          snapshotFlow { listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: -1 }
            .distinctUntilChanged()
            .collect { lastVisible ->
              if (lastVisible >= (row.items.lastIndex - 2).coerceAtLeast(0)) onLoadMore(row)
            }
        }
        LazyRow(
          state = listState,
          modifier = Modifier.fillMaxWidth().padding(top = 10.dp),
          horizontalArrangement = Arrangement.spacedBy(18.dp),
        ) {
          items(row.items, key = { "${it.mediaType}:${it.id}" }) { media ->
            TvFocusButton(
              text = media.title,
              onClick = { onOpenTitle(media.toPlaybackRequest()) },
              contentDescription = "Open ${media.title}",
              modifier = Modifier.widthIn(min = 240.dp, max = 360.dp),
            )
          }
        }
      }
    }
  }
}

private data class TvTourStep(val title: String, val body: String)

private val TV_TOUR_STEPS = listOf(
  TvTourStep("Find something to watch", "Browse movies, TV, and anime from Home. Region controls tune recommendations without changing playback settings."),
  TvTourStep("Choose how you watch", "Open a title to choose a playback source. Anime keeps Sub and Dub sources clearly separated."),
  TvTourStep("Pick up where you left off", "Continue Watching and trusted playback progress keep your place across sessions when you sign in."),
  TvTourStep("Stay in control", "Use Help & tour any time. Check the app for secure updates and retry sync when your connection returns."),
)

@Composable
private fun TvOnboardingDialog(
  step: Int,
  onSkip: () -> Unit,
  onBack: () -> Unit,
  onNext: () -> Unit,
) {
  val current = TV_TOUR_STEPS[step.coerceIn(TV_TOUR_STEPS.indices)]
  AlertDialog(
    onDismissRequest = onSkip,
    title = { Text(current.title) },
    text = {
      Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text("${step + 1} of ${TV_TOUR_STEPS.size}", style = MaterialTheme.typography.titleMedium)
        Text(current.body, style = MaterialTheme.typography.titleLarge)
      }
    },
    confirmButton = {
      TvFocusButton(
        text = if (step == TV_TOUR_STEPS.lastIndex) "Done" else "Next",
        onClick = onNext,
        contentDescription = if (step == TV_TOUR_STEPS.lastIndex) "Finish app tour" else "Go to next tour step",
      )
    },
    dismissButton = {
      Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        if (step > 0) {
          TvFocusButton(text = "Back", onClick = onBack, contentDescription = "Go to previous tour step")
        }
        TvFocusButton(text = "Skip", onClick = onSkip, contentDescription = "Skip app tour")
      }
    },
  )
}

@Composable
private fun TvUpdateDialog(
  result: NativeUpdateCheck,
  busy: Boolean,
  onDismiss: () -> Unit,
  onDownloadAndInstall: () -> Unit,
) {
  val title = when (result.status) {
    NativeUpdateStatus.Available -> "Update available"
    NativeUpdateStatus.Current -> "You’re up to date"
    NativeUpdateStatus.Error -> "Update check failed"
  }
  AlertDialog(
    onDismissRequest = onDismiss,
    title = { Text(title) },
    text = {
      Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        Text(result.message, style = MaterialTheme.typography.titleMedium)
        result.manifest?.releaseNotes?.takeIf { it.isNotEmpty() }?.let { notes ->
          Text("What’s new", style = MaterialTheme.typography.titleLarge)
          notes.take(4).forEach { Text("• $it", style = MaterialTheme.typography.bodyLarge) }
        }
        if (busy) Text("Verifying the signed APK…", style = MaterialTheme.typography.titleMedium)
      }
    },
    confirmButton = {
      when (result.status) {
        NativeUpdateStatus.Available -> TvFocusButton(
          text = if (busy) "Working…" else "Download & install",
          onClick = onDownloadAndInstall,
          contentDescription = "Download and install the verified StreamFree update",
          enabled = !busy,
        )
        else -> TvFocusButton(text = "Close", onClick = onDismiss, contentDescription = "Close update dialog")
      }
    },
    dismissButton = if (result.status == NativeUpdateStatus.Available) {
      { TvFocusButton(text = "Later", onClick = onDismiss, contentDescription = "Install the update later", enabled = !busy) }
    } else null,
  )
}

@Composable
private fun TvRegionChooserDialog(
  selected: String?,
  onDismiss: () -> Unit,
  onSelected: (String?) -> Unit,
) {
  AlertDialog(
    onDismissRequest = onDismiss,
    title = { Text("Choose recommendation region") },
    text = {
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Automatic uses your current network region. A choice only changes recommendations.")
        listOf("IN", "US", "GB", "CA", "AU", "JP", "DE", "FR").forEach { country ->
          TvFocusButton(
            text = if (country == selected) "$country · Selected" else country,
            onClick = { onSelected(country) },
            contentDescription = "Use $country recommendations",
            modifier = Modifier.fillMaxWidth(),
          )
        }
        TvFocusButton(
          text = "Reset to automatic",
          onClick = { onSelected(null) },
          contentDescription = "Reset recommendation region to automatic",
          modifier = Modifier.fillMaxWidth(),
        )
      }
    },
    confirmButton = {
      TvFocusButton(text = "Close", onClick = onDismiss, contentDescription = "Close region chooser")
    },
  )
}

private fun NativeMediaSummary.toPlaybackRequest(progress: online.streamfree.nativeapp.model.NativeContinueProgress? = null): PlaybackRequest =
  PlaybackRequest(
    mediaType = mediaType,
    titleId = id.toString(),
    title = title,
    tmdbId = id.takeIf { mediaType != MediaType.Anime },
    anilistId = id.takeIf { mediaType == MediaType.Anime },
    season = progress?.season,
    episode = progress?.episode,
    resumePositionMs = progress?.lastPositionMs ?: 0L,
  )

@Composable
fun TvPlayerScreen(
  controller: PlaybackSessionController,
  displayModeStore: PlaybackDisplayModeStore,
  onExit: () -> Unit,
  sourcePreferenceStore: SourcePreferenceStore,
  authManager: AuthSessionManager? = null,
  historySyncClient: HistorySyncClient? = null,
  initialRequest: PlaybackRequest? = null,
  sourceOrchestrator: ResolutionOrchestrator? = null,
  episodeCatalogResolver: EpisodeCatalogResolver? = null,
) {
  val displayMode by displayModeStore.mode.collectAsStateWithLifecycle(
    initialValue = PlaybackDisplayMode.Fit,
  )
  val state by controller.state.collectAsStateWithLifecycle()
  val firstControl = remember { FocusRequester() }
  val scope = androidx.compose.runtime.rememberCoroutineScope()
  var isOverlayVisible by rememberSaveable { mutableStateOf(true) }
  var showSourcePicker by rememberSaveable { mutableStateOf(false) }
  var resolvedSources by remember { mutableStateOf<List<ResolvedSource>>(emptyList()) }
  var activeEmbedSource by remember { mutableStateOf<ResolvedSource?>(null) }
  var pendingEmbedSource by remember { mutableStateOf<ResolvedSource?>(null) }
  var episodeCatalog by remember { mutableStateOf<EpisodeCatalog?>(null) }
  var nextCountdown by remember { mutableStateOf<Int?>(null) }
  var countdownCancelled by rememberSaveable { mutableStateOf(false) }
  var remoteSyncAttemptedKeys by remember { mutableStateOf<Set<String>>(emptySet()) }

  fun applyResolvedSources(sources: List<ResolvedSource>) {
    val usable = sources.filter { it.kind == SourceKind.NativeDirect || EmbedSourcePolicy.isEligible(it) }
    resolvedSources = usable
    if (usable.any { it.kind == SourceKind.NativeDirect }) {
      activeEmbedSource = null
      pendingEmbedSource = null
    } else {
      pendingEmbedSource = usable.firstOrNull(EmbedSourcePolicy::isEligible)
    }
  }

  LaunchedEffect(initialRequest, sourceOrchestrator) {
    val request = initialRequest ?: return@LaunchedEffect
    val orchestrator = sourceOrchestrator ?: return@LaunchedEffect
    val rememberedSourceId = sourcePreferenceStore.get(request.mediaType, request.audioVariant)
    val result = orchestrator.resolve(
      request = request,
      preferences = ResolutionPreferences(rememberedSourceId = rememberedSourceId),
    )
    applyResolvedSources(result.sources)
    resolvedSources.firstOrNull { it.kind == SourceKind.NativeDirect }?.let { source -> controller.load(request, source) }
  }

  LaunchedEffect(initialRequest, episodeCatalogResolver) {
    val request = initialRequest ?: return@LaunchedEffect
    val resolver = episodeCatalogResolver ?: return@LaunchedEffect
    episodeCatalog = resolver.resolve(request)
  }

  LaunchedEffect(state.request?.season, state.request?.episode) {
    countdownCancelled = false
    nextCountdown = null
  }

  LaunchedEffect(state.request, state.hasTrustedPlayback, state.phase, state.positionMs, state.durationMs, authManager, historySyncClient) {
    val request = state.request ?: return@LaunchedEffect
    if (!state.hasTrustedPlayback || state.durationMs <= 0L) return@LaunchedEffect
    val progress = state.positionMs.toDouble() / state.durationMs.toDouble()
    if (state.phase != PlaybackPhase.Ended && progress < 0.85) return@LaunchedEffect
    val key = listOf(request.mediaType.name, request.titleId, request.season, request.episode, request.audioVariant).joinToString(":")
    if (key in remoteSyncAttemptedKeys) return@LaunchedEffect
    remoteSyncAttemptedKeys = remoteSyncAttemptedKeys + key
    val token = authManager?.accessToken() ?: return@LaunchedEffect
    val type = when (request.mediaType) {
      MediaType.Movie -> "movie"
      MediaType.Tv -> "tv"
      MediaType.Anime -> "anime"
    }
    historySyncClient?.sync(token, type, request.titleId, state.positionMs / 1000.0, state.durationMs / 1000.0, request.season, request.episode, progress >= 0.85)
  }

  fun playEpisode(request: PlaybackRequest) {
    val orchestrator = sourceOrchestrator ?: return
    scope.launch {
      val rememberedSourceId = sourcePreferenceStore.get(request.mediaType, request.audioVariant)
      val result = orchestrator.resolve(
        request = request,
        preferences = ResolutionPreferences(rememberedSourceId = rememberedSourceId),
      )
      applyResolvedSources(result.sources)
      resolvedSources.firstOrNull { it.kind == SourceKind.NativeDirect }?.let { source -> controller.load(request, source) }
    }
  }

  val nextEpisode = state.request?.let { request ->
    val season = request.season
    val episode = request.episode
    val catalog = episodeCatalog
    if (season == null || episode == null || catalog == null) null else {
      runCatching { EpisodeRef(season, episode) }.getOrNull()?.let {
        AdjacentEpisodeResolver.resolve(it, catalog.seasons, EpisodeDirection.Next)
      }
    }
  }

  LaunchedEffect(state.phase, state.request, episodeCatalog, countdownCancelled) {
    if (state.phase != PlaybackPhase.Ended || nextEpisode == null || countdownCancelled) {
      if (state.phase != PlaybackPhase.Ended) nextCountdown = null
      return@LaunchedEffect
    }
    for (remaining in 10 downTo 1) {
      nextCountdown = remaining
      delay(1_000L)
    }
    nextCountdown = null
    state.request?.let { request ->
      playEpisode(request.copy(season = nextEpisode.season, episode = nextEpisode.episode))
    }
  }

  LaunchedEffect(Unit) { firstControl.requestFocus() }
  DisposableEffect(Unit) {
    onDispose { controller.pause() }
  }
  BackHandler {
    if (activeEmbedSource != null) activeEmbedSource = null else onExit()
  }

  BoxWithConstraints(
    modifier = Modifier
      .fillMaxSize()
      .background(Color.Black),
  ) {
    val safeMargin = (maxWidth * 0.04f).coerceIn(32.dp, 84.dp)
    if (activeEmbedSource != null) {
      EmbedPlaybackView(source = activeEmbedSource!!, modifier = Modifier.fillMaxSize())
    } else {
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
    }
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
            onClick = { showSourcePicker = true },
            contentDescription = "Choose playback server",
            modifier = Modifier.weight(1f),
          )
          pendingEmbedSource?.let { source ->
            TvFocusButton(
              text = "Use embed",
              onClick = {
                pendingEmbedSource = null
                activeEmbedSource = source
              },
              contentDescription = "Use the approved embedded player",
              modifier = Modifier.weight(1f),
            )
          }
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
            onClick = {
              val request = state.request
              val next = nextEpisode
              if (request != null && next != null) {
                countdownCancelled = true
                nextCountdown = null
                playEpisode(request.copy(season = next.season, episode = next.episode))
              }
            },
            contentDescription = "Play next episode",
            modifier = Modifier.weight(1f),
            enabled = nextEpisode != null,
          )
        }
      }
    }
    if (nextCountdown != null && nextEpisode != null) {
      Row(
        modifier = Modifier
          .align(Alignment.BottomCenter)
          .padding(bottom = safeMargin)
          .background(Color.Black.copy(alpha = 0.92f))
          .padding(horizontal = 20.dp, vertical = 12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
      ) {
        Text("Next episode in ${nextCountdown}s", color = Color.White, style = MaterialTheme.typography.titleMedium)
        TvFocusButton(
          text = "Play now",
          onClick = {
            val request = state.request
            if (request != null) {
              countdownCancelled = true
              nextCountdown = null
              playEpisode(request.copy(season = nextEpisode.season, episode = nextEpisode.episode))
            }
          },
          contentDescription = "Play next episode now",
          modifier = Modifier.sizeIn(minWidth = 150.dp),
        )
        TvFocusButton(
          text = "Cancel",
          onClick = {
            countdownCancelled = true
            nextCountdown = null
          },
          contentDescription = "Cancel next episode",
          modifier = Modifier.sizeIn(minWidth = 140.dp),
        )
      }
    }
  }

  if (showSourcePicker) {
    TvSourcePickerDialog(
      sources = resolvedSources,
      selectedProviderId = state.source?.providerId,
      onDismiss = { showSourcePicker = false },
      onSelected = { source ->
        state.request?.let { request ->
          scope.launch {
            sourcePreferenceStore.set(request.mediaType, request.audioVariant, source.providerId)
          }
          if (EmbedSourcePolicy.isEligible(source)) {
            controller.pause()
            activeEmbedSource = source
            pendingEmbedSource = null
          } else {
            activeEmbedSource = null
            pendingEmbedSource = null
            controller.switchSource(request, source)
          }
        }
        showSourcePicker = false
      },
    )
  }
}

@Composable
internal fun TvSourcePickerDialog(
  sources: List<ResolvedSource>,
  selectedProviderId: String?,
  onDismiss: () -> Unit,
  onSelected: (ResolvedSource) -> Unit,
) {
  AlertDialog(
    onDismissRequest = onDismiss,
    title = { Text("Choose a server") },
    text = {
      if (sources.isEmpty()) {
        Text("No native direct sources are available for this episode yet. Embed sources need the consent-based web fallback.")
      } else {
        androidx.compose.foundation.lazy.LazyColumn(
          modifier = Modifier.fillMaxWidth().heightIn(max = 500.dp),
          verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
          items(sources, key = { "${it.providerId}:${it.playbackUrl}" }) { source ->
            OutlinedButton(
              onClick = { onSelected(source) },
              modifier = Modifier.fillMaxWidth().sizeIn(minHeight = 64.dp),
            ) {
              Text(
                buildString {
                  append(if (source.providerId == selectedProviderId) "${source.label} · Selected" else source.label)
                  append(" · ")
                  append(if (EmbedSourcePolicy.isEligible(source)) "Embedded player" else source.format.name.uppercase())
                },
              )
            }
          }
        }
      }
    },
    confirmButton = { OutlinedButton(onClick = onDismiss) { Text("Close") } },
  )
}

@Composable
private fun TvFocusButton(
  text: String,
  onClick: () -> Unit,
  contentDescription: String,
  modifier: Modifier = Modifier,
  enabled: Boolean = true,
) {
  var focused by remember { mutableStateOf(false) }
  Button(
    onClick = onClick,
    enabled = enabled,
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
