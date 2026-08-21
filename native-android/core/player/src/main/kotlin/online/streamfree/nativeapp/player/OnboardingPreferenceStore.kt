package online.streamfree.nativeapp.player

import android.content.Context
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.booleanPreferencesKey
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first

/** Stores only whether the local, skippable product tour has been completed. */
interface OnboardingPreferenceStore {
  suspend fun hasCompleted(): Boolean

  suspend fun markCompleted()

  suspend fun reset()
}

private val Context.onboardingPreferenceDataStore by preferencesDataStore(
  name = "streamfree_onboarding_preferences",
)

class PreferencesOnboardingPreferenceStore(
  private val context: Context,
) : OnboardingPreferenceStore {
  override suspend fun hasCompleted(): Boolean = context.onboardingPreferenceDataStore.data
    .catchReadFailures()
    .first()[COMPLETED_KEY] == true

  override suspend fun markCompleted() {
    context.onboardingPreferenceDataStore.edit { preferences ->
      preferences[COMPLETED_KEY] = true
    }
  }

  override suspend fun reset() {
    context.onboardingPreferenceDataStore.edit { preferences ->
      preferences.remove(COMPLETED_KEY)
    }
  }

  private companion object {
    val COMPLETED_KEY = booleanPreferencesKey("completed.v1")
  }
}

private fun Flow<Preferences>.catchReadFailures() =
  catch { emit(emptyPreferences()) }
