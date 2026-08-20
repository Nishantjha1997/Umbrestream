package online.streamfree.nativeapp.player

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.Preferences
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType

interface SourcePreferenceStore {
  suspend fun get(mediaType: MediaType, audioVariant: AudioVariant? = null): String?

  suspend fun set(mediaType: MediaType, audioVariant: AudioVariant? = null, providerId: String)

  suspend fun clear(mediaType: MediaType, audioVariant: AudioVariant? = null)
}

enum class SourcePreferenceScope {
  Movie,
  Tv,
  AnimeSub,
  AnimeDub,
}

fun sourcePreferenceScope(mediaType: MediaType, audioVariant: AudioVariant?): SourcePreferenceScope = when (mediaType) {
  MediaType.Movie -> SourcePreferenceScope.Movie
  MediaType.Tv -> SourcePreferenceScope.Tv
  MediaType.Anime -> if (audioVariant == AudioVariant.Dub) {
    SourcePreferenceScope.AnimeDub
  } else {
    SourcePreferenceScope.AnimeSub
  }
}

private val Context.sourcePreferenceDataStore by preferencesDataStore(name = "streamfree_source_preferences")

class PreferencesSourcePreferenceStore(
  private val context: Context,
) : SourcePreferenceStore {
  override suspend fun get(mediaType: MediaType, audioVariant: AudioVariant?): String? =
    context.sourcePreferenceDataStore.data
      .catchReadFailures()
      .first()[keyFor(mediaType, audioVariant)]

  override suspend fun set(mediaType: MediaType, audioVariant: AudioVariant?, providerId: String) {
    require(providerId.matches(PROVIDER_ID_PATTERN)) { "Provider IDs must be stable lowercase identifiers" }
    context.sourcePreferenceDataStore.edit { preferences ->
      preferences[keyFor(mediaType, audioVariant)] = providerId
    }
  }

  override suspend fun clear(mediaType: MediaType, audioVariant: AudioVariant?) {
    context.sourcePreferenceDataStore.edit { preferences ->
      preferences.remove(keyFor(mediaType, audioVariant))
    }
  }

  private fun keyFor(mediaType: MediaType, audioVariant: AudioVariant?) =
    stringPreferencesKey("source.${sourcePreferenceScope(mediaType, audioVariant).name.lowercase()}.v1")

  private companion object {
    val PROVIDER_ID_PATTERN = Regex("[a-z0-9]+(?:-[a-z0-9]+)*")
  }
}

private fun Flow<Preferences>.catchReadFailures() =
  catch { emit(emptyPreferences()) }
