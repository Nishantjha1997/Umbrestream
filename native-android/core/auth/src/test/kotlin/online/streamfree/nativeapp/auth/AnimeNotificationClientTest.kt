package online.streamfree.nativeapp.auth

import kotlinx.coroutines.runBlocking
import online.streamfree.nativeapp.network.HttpResponse
import online.streamfree.nativeapp.network.StreamFreeHttpTransport
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class AnimeNotificationClientTest {
  @Test
  fun `parses notification list and unread count`() = runBlocking {
    val client = AnimeNotificationClient(FakeTransport(
      """{"authenticated":true,"unreadCount":1,"notifications":[{"id":7,"anilist_id":10,"title":"Fixture","episode":4,"aired_at":"2026-08-21T00:00:00.000Z","read_at":null,"created_at":"2026-08-21T01:00:00.000Z"}]}""",
    ))

    val result = client.load("token")

    assertEquals(1, result?.unreadCount)
    assertEquals("Fixture", result?.notifications?.single()?.title)
    assertEquals(4, result?.notifications?.single()?.episode)
  }

  @Test
  fun `marks all notifications read through the authenticated endpoint`() = runBlocking {
    val transport = FakeTransport("{}")

    assertTrue(AnimeNotificationClient(transport).markAllRead("token"))
    assertEquals("https://streamfree.online/api/mobile/anime-notifications", transport.postUrl)
    assertTrue(transport.postHeaders["Authorization"] == "Bearer token")
  }

  private class FakeTransport(private val payload: String) : StreamFreeHttpTransport {
    var postUrl: String? = null
    var postHeaders: Map<String, String> = emptyMap()

    override fun get(url: String, headers: Map<String, String>): HttpResponse =
      HttpResponse(url, 200, emptyMap(), payload.toByteArray())

    override fun post(url: String, body: ByteArray, headers: Map<String, String>): HttpResponse {
      postUrl = url
      postHeaders = headers
      return HttpResponse(url, 200, emptyMap(), "{}".toByteArray())
    }
  }
}
