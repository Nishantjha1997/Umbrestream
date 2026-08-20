package online.streamfree.nativeapp.player

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.map

enum class PlaybackDisplayMode {
  Fit,
  Fill,
}

interface PlaybackDisplayModeStore {
  val mode: Flow<PlaybackDisplayMode>

  suspend fun set(mode: PlaybackDisplayMode)
}

private val Context.displayModeDataStore by preferencesDataStore(name = "streamfree_player_display")

class PreferencesPlaybackDisplayModeStore(
  private val context: Context,
) : PlaybackDisplayModeStore {
  override val mode: Flow<PlaybackDisplayMode> = context.displayModeDataStore.data
    .catch { emit(androidx.datastore.preferences.core.emptyPreferences()) }
    .map { preferences ->
      when (preferences[DISPLAY_MODE_KEY]) {
        PlaybackDisplayMode.Fill.name -> PlaybackDisplayMode.Fill
        else -> PlaybackDisplayMode.Fit
      }
    }

  override suspend fun set(mode: PlaybackDisplayMode) {
    context.displayModeDataStore.edit { preferences ->
      preferences[DISPLAY_MODE_KEY] = mode.name
    }
  }

  private companion object {
    val DISPLAY_MODE_KEY = stringPreferencesKey("display_mode.v1")
  }
}
