package online.streamfree.nativeapp.player

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import online.streamfree.nativeapp.model.normalizeRegionCode

interface RegionPreferenceStore {
  suspend fun get(): String?
  suspend fun set(countryCode: String)
  suspend fun clear()
}

private val Context.regionPreferenceDataStore by preferencesDataStore(name = "streamfree_region_preferences")

class PreferencesRegionPreferenceStore(private val context: Context) : RegionPreferenceStore {
  override suspend fun get(): String? = context.regionPreferenceDataStore.data
    .catchReadFailures()
    .first()[REGION_KEY]
    ?.let(::normalizeRegionCode)

  override suspend fun set(countryCode: String) {
    val normalized = normalizeRegionCode(countryCode)
      ?: throw IllegalArgumentException("Region must be a two-letter country code")
    context.regionPreferenceDataStore.edit { it[REGION_KEY] = normalized }
  }

  override suspend fun clear() {
    context.regionPreferenceDataStore.edit { it.remove(REGION_KEY) }
  }

  private companion object {
    val REGION_KEY = stringPreferencesKey("region.override.v1")
  }
}

private fun Flow<androidx.datastore.preferences.core.Preferences>.catchReadFailures() =
  catch { emit(emptyPreferences()) }
