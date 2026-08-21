@file:androidx.annotation.OptIn(androidx.media3.common.util.UnstableApi::class)

package online.streamfree.nativeapp.phone

import android.Manifest
import android.app.Activity
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioManager
import android.os.Build
import java.io.File
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.gestures.detectVerticalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.foundation.layout.sizeIn
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.Button
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.Card
import androidx.compose.material3.ExperimentalMaterial3Api
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.ModalBottomSheet
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.OutlinedTextField
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.snapshotFlow
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.core.net.toUri
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.media3.ui.AspectRatioFrameLayout
import androidx.media3.ui.PlayerView
import androidx.media3.common.C
import androidx.media3.common.Player
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.distinctUntilChanged
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import online.streamfree.nativeapp.designsystem.StreamFreeArtwork
import online.streamfree.nativeapp.auth.AuthResult
import online.streamfree.nativeapp.auth.AnimeNotificationClient
import online.streamfree.nativeapp.auth.AnimeNotificationPreferenceStore
import online.streamfree.nativeapp.auth.HistorySyncClient
import online.streamfree.nativeapp.auth.NativeAnimeNotifications
import online.streamfree.nativeapp.auth.AuthSessionManager
import online.streamfree.nativeapp.auth.NativeAnimeProvider
import online.streamfree.nativeapp.auth.NativeAnimeLinkResult
import online.streamfree.nativeapp.auth.NativeUpdateCheck
import online.streamfree.nativeapp.auth.NativeUpdateClient
import online.streamfree.nativeapp.auth.NativeUpdateStatus
import online.streamfree.nativeapp.player.PlaybackDisplayMode
import online.streamfree.nativeapp.player.PlaybackPhase
import online.streamfree.nativeapp.player.PlaybackSessionController
import online.streamfree.nativeapp.player.PlaybackUiState
import online.streamfree.nativeapp.player.PlaybackDisplayModeStore
import online.streamfree.nativeapp.player.SourcePreferenceStore
import online.streamfree.nativeapp.player.RegionPreferenceStore
import online.streamfree.nativeapp.player.OnboardingPreferenceStore
import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.AdjacentEpisodeResolver
import online.streamfree.nativeapp.model.EpisodeCatalog
import online.streamfree.nativeapp.model.EpisodeDirection
import online.streamfree.nativeapp.model.EpisodeRef
import online.streamfree.nativeapp.model.NativeHomeFeed
import online.streamfree.nativeapp.model.NativeHomeRow
import online.streamfree.nativeapp.model.NativeMediaSummary
import online.streamfree.nativeapp.model.mergeContinueWatchingPage
import online.streamfree.nativeapp.source.ResolvedSource
import online.streamfree.nativeapp.source.PlaybackRequest
import online.streamfree.nativeapp.source.EpisodeCatalogResolver
import online.streamfree.nativeapp.source.EmbedSourcePolicy
import online.streamfree.nativeapp.source.StreamFreeHomeFeedResolver
import online.streamfree.nativeapp.source.ResolutionOrchestrator
import online.streamfree.nativeapp.source.ResolutionPreferences
import online.streamfree.nativeapp.source.SourceKind

@Composable
fun PhoneHomeScreen(
  onOpenPlayer: () -> Unit,
  feedResolver: StreamFreeHomeFeedResolver? = null,
  regionPreferenceStore: RegionPreferenceStore? = null,
  onboardingPreferenceStore: OnboardingPreferenceStore? = null,
  updateClient: NativeUpdateClient? = null,
  onInstallUpdate: (File) -> Unit = {},
  authManager: AuthSessionManager? = null,
  notificationClient: AnimeNotificationClient? = null,
  notificationPreferenceStore: AnimeNotificationPreferenceStore? = null,
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
  var notificationsEnabled by remember { mutableStateOf(true) }
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
  LaunchedEffect(notificationPreferenceStore) {
    notificationsEnabled = notificationPreferenceStore?.read()?.enabled ?: true
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
  fun setNotificationsEnabled(enabled: Boolean) {
    notificationsEnabled = enabled
    homeScope.launch {
      notificationPreferenceStore?.let { store ->
        store.update(store.read().copy(enabled = enabled))
      }
    }
  }
  LaunchedEffect(feedResolver, regionPreferenceStore) { reloadHome() }
  Surface(
    modifier = Modifier.fillMaxSize(),
    color = MaterialTheme.colorScheme.background,
  ) {
    if (feedResolver == null || feedFailed) {
      Column(
        modifier = Modifier.fillMaxSize().safeDrawingPadding().padding(24.dp),
        verticalArrangement = Arrangement.Center,
        horizontalAlignment = Alignment.CenterHorizontally,
      ) {
        Text("StreamFree", style = MaterialTheme.typography.headlineMedium)
        Text(
          if (feedFailed) "Home is temporarily unavailable. You can still open playback from a title link."
          else "Loading your home…",
          style = MaterialTheme.typography.bodyLarge,
          modifier = Modifier.padding(top = 8.dp, bottom = 24.dp),
        )
        Button(onClick = onOpenPlayer, modifier = Modifier.sizeIn(minWidth = 180.dp, minHeight = 48.dp)) {
          Text("Open player")
        }
      }
    } else if (feed == null) {
      Column(modifier = Modifier.fillMaxSize(), verticalArrangement = Arrangement.Center, horizontalAlignment = Alignment.CenterHorizontally) {
        Text("Preparing your home…", style = MaterialTheme.typography.titleLarge)
      }
    } else {
      PhoneHomeFeed(
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
         notificationsEnabled = notificationsEnabled,
         onNotificationsEnabledChange = ::setNotificationsEnabled,
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
    RegionChooserDialog(
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
        Button(
          enabled = !authBusy && authEmail.isNotBlank() && authPassword.isNotBlank(),
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
        ) { Text(if (authBusy) "Signing in…" else "Sign in") }
      },
      dismissButton = {
        OutlinedButton(enabled = !authBusy, onClick = { showAuthDialog = false }) { Text("Cancel") }
      },
    )
  }
  if (showTour) {
    PhoneOnboardingDialog(
      step = tourStep,
      onSkip = {
        showTour = false
        homeScope.launch { onboardingPreferenceStore?.markCompleted() }
      },
      onBack = { tourStep = (tourStep - 1).coerceAtLeast(0) },
      onNext = {
        if (tourStep == PHONE_TOUR_STEPS.lastIndex) {
          showTour = false
          homeScope.launch { onboardingPreferenceStore?.markCompleted() }
        } else {
          tourStep += 1
        }
      },
    )
  }
  updateCheck?.let { result ->
    PhoneUpdateDialog(
      result = result,
      busy = updateBusy,
      onDismiss = { if (!updateBusy) updateCheck = null },
      onDownloadAndInstall = {
        val manifest = result.manifest ?: return@PhoneUpdateDialog
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

private const val NOTIFICATION_PERMISSION_REQUEST_CODE = 4107

@Composable
internal fun PhoneHomeFeed(
  feed: NativeHomeFeed,
  regionOverride: String? = null,
  onRegionChange: (() -> Unit)? = null,
  accountEmail: String? = null,
  onAccountAction: (() -> Unit)? = null,
  onLinkAnime: ((NativeAnimeProvider) -> Unit)? = null,
  linkMessage: String? = null,
  animeNotifications: NativeAnimeNotifications? = null,
  onMarkAnimeNotificationsRead: (() -> Unit)? = null,
  notificationsEnabled: Boolean? = null,
  onNotificationsEnabledChange: ((Boolean) -> Unit)? = null,
  onOpenTour: (() -> Unit)? = null,
  onCheckForUpdates: (() -> Unit)? = null,
  onLoadMore: (NativeHomeRow) -> Unit = {},
  onOpenTitle: (PlaybackRequest) -> Unit,
) {
  LazyColumn(
    modifier = Modifier.fillMaxSize().safeDrawingPadding(),
    contentPadding = androidx.compose.foundation.layout.PaddingValues(horizontal = 20.dp, vertical = 24.dp),
    verticalArrangement = Arrangement.spacedBy(20.dp),
  ) {
    item {
      Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
        Column {
          Text("StreamFree", style = MaterialTheme.typography.headlineMedium)
          Text(
            "${feed.region.countryName} · ${feed.provenance.replace('_', ' ')}",
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(top = 4.dp),
          )
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
          if (onRegionChange != null) {
            OutlinedButton(onClick = onRegionChange, modifier = Modifier.sizeIn(minHeight = 48.dp)) {
              Text(regionOverride ?: "Automatic")
            }
          }
          if (onAccountAction != null) {
            OutlinedButton(onClick = onAccountAction, modifier = Modifier.sizeIn(minHeight = 48.dp)) {
              Text(accountEmail?.let { "Sign out" } ?: "Sign in")
            }
          }
          if (onOpenTour != null) {
            OutlinedButton(onClick = onOpenTour, modifier = Modifier.sizeIn(minHeight = 48.dp)) {
              Text("Help & tour")
            }
          }
        }
      }
      if (onCheckForUpdates != null) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.End) {
          OutlinedButton(onClick = onCheckForUpdates, modifier = Modifier.sizeIn(minHeight = 48.dp)) {
            Text("Check for updates")
          }
        }
      }
      if (accountEmail != null && onLinkAnime != null) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), modifier = Modifier.padding(top = 8.dp)) {
          OutlinedButton(onClick = { onLinkAnime(NativeAnimeProvider.AniList) }, modifier = Modifier.sizeIn(minHeight = 44.dp)) {
            Text("Link AniList")
          }
          OutlinedButton(onClick = { onLinkAnime(NativeAnimeProvider.MyAnimeList) }, modifier = Modifier.sizeIn(minHeight = 44.dp)) {
            Text("Link MAL")
          }
        }
      }
      linkMessage?.let { Text(it, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 4.dp)) }
      if (accountEmail != null && notificationsEnabled != null && onNotificationsEnabledChange != null) {
        Row(
          modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
          horizontalArrangement = Arrangement.SpaceBetween,
          verticalAlignment = Alignment.CenterVertically,
        ) {
          Column(modifier = Modifier.weight(1f)) {
            Text("Anime episode alerts", style = MaterialTheme.typography.titleSmall)
            Text("Background alerts follow your quiet hours.", style = MaterialTheme.typography.bodySmall)
          }
          androidx.compose.material3.Switch(
            checked = notificationsEnabled,
            onCheckedChange = onNotificationsEnabledChange,
            modifier = Modifier.semantics { contentDescription = "Anime episode alerts" },
          )
        }
      }
      if (animeNotifications != null && animeNotifications.unreadCount > 0) {
        Card(modifier = Modifier.fillMaxWidth().padding(top = 12.dp)) {
          Row(
            modifier = Modifier.fillMaxWidth().padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
          ) {
            Column(modifier = Modifier.weight(1f)) {
              Text("${animeNotifications.unreadCount} new anime episode${if (animeNotifications.unreadCount == 1) "" else "s"}", style = MaterialTheme.typography.titleMedium)
              animeNotifications.notifications.firstOrNull()?.let { notification ->
                Text("${notification.title} · Episode ${notification.episode}", style = MaterialTheme.typography.bodySmall, maxLines = 1, overflow = TextOverflow.Ellipsis)
              }
            }
            onMarkAnimeNotificationsRead?.let { onRead ->
              OutlinedButton(onClick = onRead, modifier = Modifier.sizeIn(minHeight = 44.dp)) { Text("Mark read") }
            }
          }
        }
      }
    }
    feed.hero?.let { hero ->
      item {
        Card(
          modifier = Modifier.fillMaxWidth().clickable { onOpenTitle(hero.media.toPlaybackRequest(hero.progress)) },
        ) {
          Row(modifier = Modifier.padding(12.dp), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            StreamFreeArtwork(
              url = hero.media.posterUrl,
              title = hero.media.title,
              modifier = Modifier.size(width = 112.dp, height = 168.dp),
            )
            Column(modifier = Modifier.padding(vertical = 8.dp)) {
              Text(if (hero.intent == "resume") "Continue watching" else "Featured", style = MaterialTheme.typography.labelLarge)
              Text(hero.media.title, style = MaterialTheme.typography.headlineSmall, modifier = Modifier.padding(top = 8.dp))
              hero.progress?.let { Text("Season ${it.season}, episode ${it.episode}", modifier = Modifier.padding(top = 4.dp)) }
              Text("Open player", style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(top = 16.dp))
            }
          }
        }
      }
    }
    items(feed.rows, key = { it.id }) { row ->
      Column {
        Text(row.title, style = MaterialTheme.typography.titleLarge)
        val listState = androidx.compose.foundation.lazy.rememberLazyListState()
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
          modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
          horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
          items(row.items, key = { "${it.mediaType}:${it.id}" }) { media ->
            Card(
              modifier = Modifier.width(164.dp).clickable {
                onOpenTitle(media.toPlaybackRequest())
              },
            ) {
              Column {
                StreamFreeArtwork(
                  url = media.posterUrl,
                  title = media.title,
                  modifier = Modifier.fillMaxWidth().heightIn(min = 180.dp, max = 180.dp),
                )
                Column(modifier = Modifier.padding(12.dp)) {
                  Text(media.title, maxLines = 2, overflow = TextOverflow.Ellipsis, style = MaterialTheme.typography.titleMedium)
                  media.year?.let { Text(it.toString(), style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(top = 8.dp)) }
                  media.rating?.let { Text("★ ${"%.1f".format(it)}", style = MaterialTheme.typography.bodySmall) }
                }
              }
            }
          }
        }
      }
    }
  }
}

private data class PhoneTourStep(val title: String, val body: String)

private val PHONE_TOUR_STEPS = listOf(
  PhoneTourStep("Find something to watch", "Browse movies, TV, and anime from Home. Region controls tune recommendations without changing your playback settings."),
  PhoneTourStep("Choose how you watch", "Open a title to choose a playback source. Anime keeps Sub and Dub sources clearly separated."),
  PhoneTourStep("Pick up where you left off", "Continue Watching and trusted playback progress keep your place across sessions when you sign in."),
  PhoneTourStep("Stay in control", "Use Help & tour any time. Check the app for secure updates and retry sync when your connection returns."),
)

@Composable
private fun PhoneOnboardingDialog(
  step: Int,
  onSkip: () -> Unit,
  onBack: () -> Unit,
  onNext: () -> Unit,
) {
  val current = PHONE_TOUR_STEPS[step.coerceIn(PHONE_TOUR_STEPS.indices)]
  AlertDialog(
    onDismissRequest = onSkip,
    title = { Text(current.title) },
    text = {
      Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Text("${step + 1} of ${PHONE_TOUR_STEPS.size}", style = MaterialTheme.typography.labelLarge)
        Text(current.body, style = MaterialTheme.typography.bodyLarge)
      }
    },
    confirmButton = {
      Button(onClick = onNext, modifier = Modifier.sizeIn(minWidth = 96.dp, minHeight = 48.dp)) {
        Text(if (step == PHONE_TOUR_STEPS.lastIndex) "Done" else "Next")
      }
    },
    dismissButton = {
      Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        if (step > 0) {
          OutlinedButton(onClick = onBack, modifier = Modifier.sizeIn(minHeight = 48.dp)) { Text("Back") }
        }
        OutlinedButton(onClick = onSkip, modifier = Modifier.sizeIn(minHeight = 48.dp)) { Text("Skip") }
      }
    },
  )
}

@Composable
private fun PhoneUpdateDialog(
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
      Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Text(result.message)
        result.manifest?.releaseNotes?.takeIf { it.isNotEmpty() }?.let { notes ->
          Text("What’s new", style = MaterialTheme.typography.titleMedium)
          notes.take(4).forEach { Text("• $it", style = MaterialTheme.typography.bodyMedium) }
        }
        if (busy) Text("Verifying the signed APK…", style = MaterialTheme.typography.labelLarge)
      }
    },
    confirmButton = {
      when (result.status) {
        NativeUpdateStatus.Available -> Button(
          enabled = !busy,
          onClick = onDownloadAndInstall,
          modifier = Modifier.sizeIn(minWidth = 150.dp, minHeight = 48.dp),
        ) { Text(if (busy) "Working…" else "Download & install") }
        else -> Button(onClick = onDismiss, modifier = Modifier.sizeIn(minHeight = 48.dp)) { Text("Close") }
      }
    },
    dismissButton = if (result.status == NativeUpdateStatus.Available) {
      { OutlinedButton(enabled = !busy, onClick = onDismiss, modifier = Modifier.sizeIn(minHeight = 48.dp)) { Text("Later") } }
    } else null,
  )
}

@Composable
private fun RegionChooserDialog(
  selected: String?,
  onDismiss: () -> Unit,
  onSelected: (String?) -> Unit,
) {
  AlertDialog(
    onDismissRequest = onDismiss,
    title = { Text("Choose region") },
    text = {
      Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text("Automatic uses your current network region. A choice only changes recommendations.")
        listOf("IN", "US", "GB", "CA", "AU", "JP", "DE", "FR").forEach { country ->
          OutlinedButton(
            onClick = { onSelected(country) },
            modifier = Modifier.fillMaxWidth().sizeIn(minHeight = 48.dp),
          ) { Text(if (country == selected) "$country · Selected" else country) }
        }
        OutlinedButton(onClick = { onSelected(null) }, modifier = Modifier.fillMaxWidth().sizeIn(minHeight = 48.dp)) {
          Text("Reset to automatic")
        }
      }
    },
    confirmButton = { OutlinedButton(onClick = onDismiss) { Text("Close") } },
  )
}

private fun NativeMediaSummary.toPlaybackRequest(progress: online.streamfree.nativeapp.model.NativeContinueProgress? = null): PlaybackRequest =
  PlaybackRequest(
    mediaType = mediaType,
    titleId = id.toString(),
    title = title,
    tmdbId = id.takeIf { mediaType != online.streamfree.nativeapp.model.MediaType.Anime },
    anilistId = id.takeIf { mediaType == online.streamfree.nativeapp.model.MediaType.Anime },
    season = progress?.season,
    episode = progress?.episode,
    resumePositionMs = progress?.lastPositionMs ?: 0L,
  )

@Composable
fun PhonePlayerScreen(
  controller: PlaybackSessionController,
  displayModeStore: PlaybackDisplayModeStore,
  onExit: () -> Unit,
  onFullscreenChanged: (Boolean) -> Unit,
  authManager: AuthSessionManager? = null,
  historySyncClient: HistorySyncClient? = null,
  sourceCandidates: List<ResolvedSource> = emptyList(),
  sourcePreferenceStore: SourcePreferenceStore,
  initialRequest: PlaybackRequest? = null,
  sourceOrchestrator: ResolutionOrchestrator? = null,
  episodeCatalogResolver: EpisodeCatalogResolver? = null,
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
  var showSettings by rememberSaveable { mutableStateOf(false) }
  var positionMs by remember { mutableLongStateOf(0L) }
  var durationMs by remember { mutableLongStateOf(0L) }
  var resolvedSourceCandidates by remember(sourceCandidates) { mutableStateOf(sourceCandidates) }
  var activeEmbedSource by remember { mutableStateOf<ResolvedSource?>(null) }
  var pendingEmbedSource by remember { mutableStateOf<ResolvedSource?>(null) }
  var episodeCatalog by remember { mutableStateOf<EpisodeCatalog?>(null) }
  var remoteSyncAttemptedKeys by remember { mutableStateOf<Set<String>>(emptySet()) }

  fun applyResolvedSources(sources: List<ResolvedSource>) {
    val usable = sources.filter { it.kind == SourceKind.NativeDirect || EmbedSourcePolicy.isEligible(it) }
    resolvedSourceCandidates = usable
    val direct = usable.firstOrNull { it.kind == SourceKind.NativeDirect }
    if (direct != null) {
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
    resolvedSourceCandidates.firstOrNull { it.kind == SourceKind.NativeDirect }?.let { source ->
      controller.load(request, source)
    }
  }

  LaunchedEffect(initialRequest, episodeCatalogResolver) {
    val request = initialRequest ?: return@LaunchedEffect
    val resolver = episodeCatalogResolver ?: return@LaunchedEffect
    episodeCatalog = resolver.resolve(request)
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
      resolvedSourceCandidates.firstOrNull { it.kind == SourceKind.NativeDirect }?.let { source ->
        activeEmbedSource = null
        controller.load(request, source)
      }
    }
  }

  LaunchedEffect(controller.player) {
    while (isActive) {
      positionMs = controller.player.currentPosition.coerceAtLeast(0L)
      durationMs = controller.player.duration.takeIf { it > 0L } ?: 0L
      delay(500L)
    }
  }

  LaunchedEffect(state.request, state.hasTrustedPlayback, state.phase, positionMs, durationMs, authManager, historySyncClient) {
    val request = state.request ?: return@LaunchedEffect
    if (!state.hasTrustedPlayback || durationMs <= 0L) return@LaunchedEffect
    val progress = positionMs.toDouble() / durationMs.toDouble()
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
    historySyncClient?.sync(token, type, request.titleId, positionMs / 1000.0, durationMs / 1000.0, request.season, request.episode, progress >= 0.85)
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
    if (activeEmbedSource != null) {
      activeEmbedSource = null
    } else if (isFullscreen) {
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
        embedSource = activeEmbedSource,
        sourceCount = resolvedSourceCandidates.size,
        onOpenSources = { showSourcePicker = true },
        onOpenSettings = { showSettings = true },
        onDisplayModeChanged = { mode -> scope.launch { displayModeStore.set(mode) } },
        onFullscreenChanged = { fullscreen ->
          isFullscreen = fullscreen
          onFullscreenChanged(fullscreen)
        },
      )
      if (!isFullscreen) {
        Column(modifier = Modifier.fillMaxWidth()) {
          PlaybackContextPanel(
            state = state,
            embedSource = pendingEmbedSource,
            onUseEmbed = { source ->
              pendingEmbedSource = null
              activeEmbedSource = source
            },
            onExit = ::exitPlayer,
            modifier = Modifier
              .fillMaxWidth()
              .navigationBarsPadding()
              .padding(horizontal = 20.dp, vertical = 16.dp),
          )
          val request = state.request
          if (request?.mediaType == MediaType.Tv && episodeCatalog != null) {
            EpisodeListPanel(
              catalog = episodeCatalog!!,
              current = request,
              onEpisodeSelected = { ref ->
                playEpisode(request.copy(season = ref.season, episode = ref.episode))
              },
            )
          }
        }
      }
    }
  }

  if (showSourcePicker) {
    SourcePickerSheet(
      sources = resolvedSourceCandidates,
      selectedProviderId = state.source?.providerId,
      onDismiss = { showSourcePicker = false },
      onSourceSelected = { source ->
        state.request?.let { request ->
          val requestWithAudio = if (request.mediaType == MediaType.Anime && source.audioVariant != null) {
            request.copy(audioVariant = source.audioVariant)
          } else {
            request
          }
          scope.launch {
            sourcePreferenceStore.set(
              requestWithAudio.mediaType,
              requestWithAudio.audioVariant,
              source.providerId,
            )
          }
          if (EmbedSourcePolicy.isEligible(source)) {
            controller.pause()
            activeEmbedSource = source
            pendingEmbedSource = null
          } else {
            activeEmbedSource = null
            pendingEmbedSource = null
            controller.switchSource(requestWithAudio, source)
          }
        }
        showSourcePicker = false
      },
    )
  }

  if (showSettings) {
    PlayerSettingsSheet(
      player = controller.player,
      subtitles = state.source?.subtitles.orEmpty(),
      onDismiss = { showSettings = false },
    )
  }
}

@Composable
private fun EpisodeListPanel(
  catalog: EpisodeCatalog,
  current: PlaybackRequest,
  onEpisodeSelected: (EpisodeRef) -> Unit,
) {
  val currentRef = current.season?.let { season ->
    current.episode?.let { episode -> runCatching { EpisodeRef(season, episode) }.getOrNull() }
  }
  val previous = currentRef?.let {
    AdjacentEpisodeResolver.resolve(it, catalog.seasons, EpisodeDirection.Previous)
  }
  val next = currentRef?.let {
    AdjacentEpisodeResolver.resolve(it, catalog.seasons, EpisodeDirection.Next)
  }
  val currentSeason = current.season ?: catalog.seasons.firstOrNull()?.season ?: return
  val episodes = catalog.episodesForSeason(currentSeason)

  Column(
    modifier = Modifier
      .fillMaxWidth()
      .padding(horizontal = 20.dp)
      .heightIn(max = 320.dp),
  ) {
    Text("Season $currentSeason", style = MaterialTheme.typography.titleMedium, color = Color.White)
    Row(
      modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
      horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
      OutlinedButton(
        onClick = { previous?.let(onEpisodeSelected) },
        enabled = previous != null,
        modifier = Modifier.weight(1f).sizeIn(minHeight = 48.dp),
      ) { Text("Previous") }
      OutlinedButton(
        onClick = { next?.let(onEpisodeSelected) },
        enabled = next != null,
        modifier = Modifier.weight(1f).sizeIn(minHeight = 48.dp),
      ) { Text("Next") }
    }
    LazyColumn(modifier = Modifier.fillMaxWidth()) {
      items(episodes, key = { it.ref.episode }) { episode ->
        val selected = episode.ref == currentRef
        OutlinedButton(
          onClick = { onEpisodeSelected(episode.ref) },
          modifier = Modifier.fillMaxWidth().padding(vertical = 3.dp).sizeIn(minHeight = 48.dp),
        ) {
          Text(if (selected) "Episode ${episode.ref.episode} · ${episode.title} · Playing" else "Episode ${episode.ref.episode} · ${episode.title}")
        }
      }
    }
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
  embedSource: ResolvedSource?,
  sourceCount: Int,
  onOpenSources: () -> Unit,
  onOpenSettings: () -> Unit,
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
    if (embedSource != null) {
      EmbedPlaybackView(source = embedSource, modifier = Modifier.fillMaxSize())
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
      onOpenSettings = onOpenSettings,
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
  onOpenSettings: () -> Unit,
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
        maxLines = 1,
        overflow = TextOverflow.Ellipsis,
        modifier = Modifier.weight(1f).padding(horizontal = 8.dp),
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
        Button(
          onClick = onOpenSettings,
          modifier = Modifier
            .sizeIn(minWidth = 72.dp, minHeight = 48.dp)
            .semantics { contentDescription = "Open playback settings" },
        ) {
          Text("More")
        }
        Text(
          text = playbackStatus(state),
          color = Color.White,
          style = MaterialTheme.typography.labelMedium,
          maxLines = 1,
          overflow = TextOverflow.Ellipsis,
          modifier = Modifier.weight(1f).padding(horizontal = 4.dp),
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
private fun PlayerSettingsSheet(
  player: Player,
  subtitles: List<online.streamfree.nativeapp.source.SubtitleTrack>,
  onDismiss: () -> Unit,
) {
  val currentSpeed = player.playbackParameters.speed
  ModalBottomSheet(onDismissRequest = onDismiss) {
    Column(
      modifier = Modifier
        .fillMaxWidth()
        .navigationBarsPadding()
        .padding(horizontal = 20.dp, vertical = 8.dp),
    ) {
      Text("Playback settings", style = MaterialTheme.typography.headlineSmall)
      Text("Speed", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 16.dp))
      Row(
        modifier = Modifier.fillMaxWidth().padding(top = 8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
      ) {
        listOf(0.75f, 1f, 1.25f, 1.5f, 2f).forEach { speed ->
          OutlinedButton(
            onClick = { player.setPlaybackSpeed(speed) },
            modifier = Modifier.sizeIn(minWidth = 56.dp, minHeight = 48.dp),
          ) {
            Text(if (speed == currentSpeed) "${speed}x ·" else "${speed}x")
          }
        }
      }
      Text("Subtitles", style = MaterialTheme.typography.titleMedium, modifier = Modifier.padding(top = 20.dp))
      OutlinedButton(
        onClick = {
          player.trackSelectionParameters = player.trackSelectionParameters
            .buildUpon()
            .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, true)
            .build()
        },
        modifier = Modifier
          .fillMaxWidth()
          .padding(top = 8.dp)
          .sizeIn(minHeight = 48.dp),
      ) {
        Text("Subtitles off")
      }
      subtitles.forEach { subtitle ->
        OutlinedButton(
          onClick = {
            player.trackSelectionParameters = player.trackSelectionParameters
              .buildUpon()
              .setTrackTypeDisabled(C.TRACK_TYPE_TEXT, false)
              .setPreferredTextLanguage(subtitle.languageTag)
              .build()
          },
          modifier = Modifier
            .fillMaxWidth()
            .padding(top = 8.dp)
            .sizeIn(minHeight = 48.dp),
        ) {
          Text(subtitle.languageTag)
        }
      }
      if (subtitles.isEmpty()) {
        Text(
          "No subtitle tracks were returned for this source.",
          style = MaterialTheme.typography.bodyMedium,
          modifier = Modifier.padding(top = 12.dp, bottom = 20.dp),
        )
      }
    }
  }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
internal fun SourcePickerSheet(
  sources: List<ResolvedSource>,
  selectedProviderId: String?,
  onDismiss: () -> Unit,
  onSourceSelected: (ResolvedSource) -> Unit,
) {
  val hasAudioGroups = sources.any { it.audioVariant != null }
  val sourceGroups = buildList {
    if (hasAudioGroups) {
      listOf(AudioVariant.Sub, AudioVariant.Dub).forEach { variant ->
        val variantSources = sources.filter { it.audioVariant == variant }
        if (variantSources.isNotEmpty()) add(variant.name to variantSources)
      }
      val unlabeled = sources.filter { it.audioVariant == null }
      if (unlabeled.isNotEmpty()) add("Other" to unlabeled)
    } else if (sources.isNotEmpty()) {
      add("Servers" to sources)
    }
  }
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
          sourceGroups.forEach { (groupName, groupSources) ->
            item(key = "heading:$groupName") {
              Text(
                text = if (hasAudioGroups) "$groupName servers" else groupName,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(top = 8.dp, bottom = 4.dp),
              )
            }
            items(
              items = groupSources,
              key = { source -> "${source.providerId}:${source.playbackUrl}" },
            ) { source ->
              Column(modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp)) {
                Button(
                  onClick = { onSourceSelected(source) },
                  modifier = Modifier
                    .fillMaxWidth()
                    .sizeIn(minHeight = 56.dp)
                    .semantics {
                      contentDescription = "Use ${source.label} ${groupName.lowercase()} server"
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
  embedSource: ResolvedSource?,
  onUseEmbed: (ResolvedSource) -> Unit,
  onExit: () -> Unit,
  modifier: Modifier = Modifier,
) {
  Column(modifier = modifier) {
    Text(
      text = "Playback is framed by default. Use Fill to crop excess edges, or fullscreen for landscape cinema mode.",
      style = MaterialTheme.typography.bodyMedium,
      color = Color.White,
    )
    if (embedSource != null) {
      Text(
        "Direct playback is unavailable for this episode. ${embedSource.label} can open in a restricted external player.",
        style = MaterialTheme.typography.bodySmall,
        color = Color.White,
        modifier = Modifier.padding(top = 10.dp),
      )
      OutlinedButton(
        onClick = { onUseEmbed(embedSource) },
        modifier = Modifier.padding(top = 8.dp).sizeIn(minHeight = 48.dp),
      ) { Text("Use ${embedSource.label}") }
    }
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
