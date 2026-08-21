package online.streamfree.nativeapp.player

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class OnboardingPreferenceStoreTest {
  @Test
  fun contractStartsIncompleteAndCanBeCompletedAndReset() {
    val store = FakeOnboardingPreferenceStore()

    assertFalse(store.completed)
    store.completed = true
    assertTrue(store.completed)
    store.completed = false
    assertFalse(store.completed)
  }

  private class FakeOnboardingPreferenceStore : OnboardingPreferenceStore {
    var completed = false

    override suspend fun hasCompleted(): Boolean = completed

    override suspend fun markCompleted() {
      completed = true
    }

    override suspend fun reset() {
      completed = false
    }
  }
}
