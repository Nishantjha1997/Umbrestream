package online.streamfree.nativeapp.designsystem

import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val StreamFreeDarkColors = darkColorScheme(
  primary = Color(0xFFB99CFF),
  secondary = Color(0xFFB6A9C7),
  background = Color(0xFF08070B),
  surface = Color(0xFF121017),
)

@Composable
fun StreamFreeTheme(content: @Composable () -> Unit) {
  MaterialTheme(colorScheme = StreamFreeDarkColors, content = content)
}
