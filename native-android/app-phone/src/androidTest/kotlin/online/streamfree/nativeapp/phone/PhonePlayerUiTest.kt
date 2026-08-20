package online.streamfree.nativeapp.phone

import androidx.activity.ComponentActivity
import androidx.compose.ui.test.assertIsDisplayed
import androidx.compose.ui.test.onNodeWithText
import androidx.compose.ui.test.performClick
import androidx.compose.ui.test.junit4.v2.createAndroidComposeRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import java.util.concurrent.atomic.AtomicReference
import online.streamfree.nativeapp.designsystem.StreamFreeTheme
import online.streamfree.nativeapp.source.ResolvedSource
import online.streamfree.nativeapp.source.SourceKind
import online.streamfree.nativeapp.source.StreamFormat
import org.junit.Assert.assertEquals
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

@RunWith(AndroidJUnit4::class)
class PhonePlayerUiTest {
  @get:Rule
  val composeRule = createAndroidComposeRule<ComponentActivity>()

  @Test
  fun sourceSheetLabelsDirectAndEmbeddedCandidatesAndReturnsSelection() {
    val selected = AtomicReference<ResolvedSource?>()
    val direct = ResolvedSource(
      providerId = "filmu",
      label = "Filmu",
      playbackUrl = "https://embed.filmu.in/movie/550.m3u8",
      kind = SourceKind.NativeDirect,
      format = StreamFormat.Hls,
    )
    val embed = ResolvedSource(
      providerId = "vidking",
      label = "VidKing",
      playbackUrl = "https://www.vidking.net/embed/movie/550",
      kind = SourceKind.Iframe,
      format = StreamFormat.Embed,
    )

    composeRule.setContent {
      StreamFreeTheme {
        SourcePickerSheet(
          sources = listOf(direct, embed),
          selectedProviderId = null,
          onDismiss = {},
          onSourceSelected = { selected.set(it) },
        )
      }
    }

    composeRule.onNodeWithText("Filmu").assertIsDisplayed()
    composeRule.onNodeWithText("VidKing").assertIsDisplayed()
    composeRule.onNodeWithText("VidKing").performClick()
    assertEquals("vidking", selected.get()?.providerId)
  }

  @Test
  fun sourceSheetSeparatesAnimeAudioGroups() {
    val sub = ResolvedSource(
      providerId = "anime-sub",
      label = "Anime Sub",
      playbackUrl = "https://vidlink.pro/anime/sub.m3u8",
      kind = SourceKind.NativeDirect,
      format = StreamFormat.Hls,
      audioVariant = online.streamfree.nativeapp.model.AudioVariant.Sub,
    )
    val dub = sub.copy(
      providerId = "anime-dub",
      label = "Anime Dub",
      playbackUrl = "https://vidlink.pro/anime/dub.m3u8",
      audioVariant = online.streamfree.nativeapp.model.AudioVariant.Dub,
    )

    composeRule.setContent {
      StreamFreeTheme {
        SourcePickerSheet(
          sources = listOf(sub, dub),
          selectedProviderId = null,
          onDismiss = {},
          onSourceSelected = {},
        )
      }
    }

    composeRule.onNodeWithText("Sub servers").assertIsDisplayed()
    composeRule.onNodeWithText("Dub servers").assertIsDisplayed()
  }
}
