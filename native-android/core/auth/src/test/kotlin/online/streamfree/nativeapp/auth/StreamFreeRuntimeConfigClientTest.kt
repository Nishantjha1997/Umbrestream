package online.streamfree.nativeapp.auth

import kotlinx.coroutines.runBlocking
import online.streamfree.nativeapp.network.HttpResponse
import online.streamfree.nativeapp.network.StreamFreeHttpTransport
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class StreamFreeRuntimeConfigClientTest {
  @Test
  fun `accepts an exact https supabase origin`() = runBlocking {
    val client = StreamFreeRuntimeConfigClient(
      transport = FakeTransport(
        """{"supabaseUrl":"https://project.supabase.co","supabasePublishableKey":"publishable"}""",
      ),
    )

    val config = client.load()

    assertEquals("https://project.supabase.co", config?.supabaseUrl)
    assertEquals("project.supabase.co", config?.supabaseHost)
  }

  @Test
  fun `rejects insecure or path-bearing supabase config`() = runBlocking {
    val insecure = StreamFreeRuntimeConfigClient(
      transport = FakeTransport(
        """{"supabaseUrl":"http://project.supabase.co","supabasePublishableKey":"publishable"}""",
      ),
    )
    val pathBearing = StreamFreeRuntimeConfigClient(
      transport = FakeTransport(
        """{"supabaseUrl":"https://project.supabase.co/auth","supabasePublishableKey":"publishable"}""",
      ),
    )

    assertNull(insecure.load())
    assertNull(pathBearing.load())
  }

  private class FakeTransport(private val payload: String) : StreamFreeHttpTransport {
    override fun get(url: String, headers: Map<String, String>): HttpResponse =
      HttpResponse(url, 200, emptyMap(), payload.toByteArray())
  }
}
