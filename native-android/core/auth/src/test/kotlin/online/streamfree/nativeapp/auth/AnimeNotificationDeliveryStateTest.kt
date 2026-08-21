package online.streamfree.nativeapp.auth

import org.junit.Assert.assertEquals
import org.junit.Test

class AnimeNotificationDeliveryStateTest {
  @Test
  fun `returns only unread undelivered newest notifications`() {
    val notifications = listOf(
      notification(id = 1, createdAt = "2026-08-20T10:00:00Z"),
      notification(id = 2, createdAt = "2026-08-21T10:00:00Z"),
      notification(id = 3, createdAt = "2026-08-22T10:00:00Z", readAt = "read"),
      notification(id = 2, createdAt = "2026-08-21T10:00:00Z"),
    )

    assertEquals(listOf(2L, 1L), AnimeNotificationDeliveryState.unseenUnread(notifications, setOf(4L)).map { it.id })
  }

  private fun notification(id: Long, createdAt: String, readAt: String? = null) = NativeAnimeNotification(
    id = id,
    animeId = 10,
    title = "Example",
    episode = id.toInt(),
    airedAt = createdAt,
    readAt = readAt,
    createdAt = createdAt,
  )
}
