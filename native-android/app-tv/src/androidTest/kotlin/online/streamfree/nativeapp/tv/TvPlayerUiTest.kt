package online.streamfree.nativeapp.tv

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.util.concurrent.atomic.AtomicReference
import online.streamfree.nativeapp.designsystem.StreamFreeTheme
import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.model.NativeHomeFeed
import online.streamfree.nativeapp.model.NativeHomeRegion
import online.streamfree.nativeapp.model.NativeHomeRow
import online.streamfree.nativeapp.model.NativeMediaSummary
import online.streamfree.nativeapp.source.ResolvedSource
import online.streamfree.nativeapp.source.SourceKind
import online.streamfree.nativeapp.source.StreamFormat
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class TvPlayerUiTest {
  @get:Rule
  val composeRule = createAndroidComposeRule<ComponentActivity>()

  @Test
  fun sourceDialogLabelsEmbeddedProviderAndReturnsSelection() {
    val selected = AtomicReference<ResolvedSource?>()
    val source = ResolvedSource(
      providerId = "vidking",
      label = "VidKing",
      playbackUrl = "https://www.vidking.net/embed/movie/550",
      kind = SourceKind.Iframe,
      format = StreamFormat.Embed,
    )

    composeRule.setContent {
      StreamFreeTheme {
        TvSourcePickerDialog(
          sources = listOf(source),
          selectedProviderId = null,
          onDismiss = {},
          onSelected = { selected.set(it) },
        )
      }
    }

    composeRule.onNodeWithText("VidKing · Embedded player").assertIsDisplayed().performClick()
    assertEquals("vidking", selected.get()?.providerId)
  }

  @Test
  fun homeOffersRemoteFocusablePlayerEntry() {
    var opened = false
    composeRule.setContent {
      StreamFreeTheme { TvHomeScreen(onOpenPlayer = { opened = true }) }
    }

    composeRule.onNodeWithText("Open player").assertIsDisplayed().performClick()
    assertEquals(true, opened)
  }

  @Test
  fun homeFeedRendersRegionalRowAndTitleAction() {
    val media = NativeMediaSummary(
      mediaType = MediaType.Tv,
      id = 1399,
      href = "/tv/1399",
      title = "The Last Kingdom",
      posterUrl = "https://image.tmdb.org/t/p/w500/poster.jpg",
    )
    val feed = NativeHomeFeed(
      region = NativeHomeRegion("US", "US", "United States", "edge"),
      provenance = "cold_start",
      hero = null,
      rows = listOf(NativeHomeRow("regional-tv", "Trending series", "regional_tv", listOf(media))),
      generatedAt = "now",
    )

    composeRule.setContent {
      StreamFreeTheme { TvHomeFeed(feed = feed, onOpenTitle = {}) }
    }

    composeRule.onNodeWithText("United States · cold start").assertIsDisplayed()
    composeRule.onNodeWithText("Trending series").assertIsDisplayed()
    composeRule.onNodeWithText("The Last Kingdom").assertIsDisplayed()
  }

  @Test
  fun homeFeedExposesRemoteRegionOverrideAction() {
    var opened = false
    val feed = NativeHomeFeed(
      region = NativeHomeRegion("US", "US", "United States", "edge"),
      provenance = "cold_start",
      hero = null,
      rows = emptyList(),
      generatedAt = "now",
    )

    composeRule.setContent {
      StreamFreeTheme {
        TvHomeFeed(
          feed = feed,
          onRegionChange = { opened = true },
          onOpenTitle = {},
        )
      }
    }

    composeRule.onNodeWithText("Region: Automatic").assertIsDisplayed().performClick()
    assertEquals(true, opened)
  }
}
