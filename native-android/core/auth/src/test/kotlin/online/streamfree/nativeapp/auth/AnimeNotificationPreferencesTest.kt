package online.streamfree.nativeapp.auth

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class AnimeNotificationPreferencesTest {
  @Test
  fun overnightQuietHoursSuppressOnlyTheConfiguredWindow() {
    val preferences = AnimeNotificationPreferences(
      quietStartMinute = 22 * 60,
      quietEndMinute = 8 * 60,
    )

    assertFalse(preferences.allows(23 * 60))
    assertFalse(preferences.allows(7 * 60 + 59))
    assertTrue(preferences.allows(8 * 60))
    assertTrue(preferences.allows(12 * 60))
  }

  @Test
  fun sameStartAndEndMeansQuietHoursAreDisabled() {
    assertTrue(AnimeNotificationQuietHours.isQuiet(60, 60, 60).not())
    assertTrue(AnimeNotificationPreferences(quietStartMinute = 60, quietEndMinute = 60).allows(60))
  }

  @Test
  fun disabledNotificationsAlwaysSuppressDelivery() {
    assertFalse(AnimeNotificationPreferences(enabled = false).allows(12 * 60))
  }

  @Test
  fun invalidMinutesFailOpenRatherThanSilentlyDroppingAlerts() {
    assertTrue(AnimeNotificationQuietHours.isQuiet(-1, 22 * 60, 8 * 60).not())
    assertTrue(AnimeNotificationQuietHours.isQuiet(12 * 60, -1, 8 * 60).not())
  }
}
