package online.streamfree.nativeapp.auth

import kotlinx.coroutines.runBlocking
import online.streamfree.nativeapp.network.HttpResponse
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.StreamFreeHttpTransport
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SupabaseAuthClientTest {
  private val config = StreamFreeRuntimeConfig(
    supabaseUrl = "https://project.supabase.co",
    supabasePublishableKey = "publishable-key",
  )

  @Test
  fun `password sign in uses approved token endpoint and parses session`() = runBlocking {
    val transport = FakeTransport(
      """{"access_token":"access","refresh_token":"refresh","expires_in":3600,"user":{"id":"user-1","email":"person@example.com"}}""",
    )
    val client = SupabaseAuthClient(
      configProvider = { config },
      transportFactory = { _: SafeUrlPolicy -> transport },
    )

    val result = client.signInWithPassword(" PERSON@example.com ", "correct horse battery staple")

    assertTrue(result is AuthResult.Success)
    val session = (result as AuthResult.Success).session
    assertEquals("access", session.accessToken)
    assertEquals("refresh", session.refreshToken)
    assertEquals("user-1", session.userId)
    assertEquals("https://project.supabase.co/auth/v1/token?grant_type=password", transport.lastUrl)
    assertEquals("publishable-key", transport.lastHeaders["apikey"])
    assertTrue(transport.lastBody.contains("person@example.com"))
    assertTrue(transport.lastBody.contains("correct horse battery staple"))
  }

  @Test
  fun `refresh uses refresh grant and keeps a usable token`() = runBlocking {
    val transport = FakeTransport(
      """{"access_token":"next-access","refresh_token":"next-refresh","expires_at":4102444800,"user":{"id":"user-1"}}""",
    )
    val client = SupabaseAuthClient(
      configProvider = { config },
      transportFactory = { _: SafeUrlPolicy -> transport },
    )

    val result = client.refresh(AuthSession("old-access", "old-refresh", 1L))

    assertTrue(result is AuthResult.Success)
    assertTrue((result as AuthResult.Success).session.isUsable(nowEpochSeconds = 1L))
    assertEquals("https://project.supabase.co/auth/v1/token?grant_type=refresh_token", transport.lastUrl)
    assertTrue(transport.lastBody.contains("old-refresh"))
  }

  @Test
  fun `invalid credentials are not reported as retryable`() = runBlocking {
    val transport = FakeTransport("""{"error":"invalid_grant"}""", statusCode = 400)
    val client = SupabaseAuthClient(
      configProvider = { config },
      transportFactory = { _: SafeUrlPolicy -> transport },
    )

    val result = client.signInWithPassword("person@example.com", "wrong password")

    assertTrue(result is AuthResult.Failure)
    assertEquals(false, (result as AuthResult.Failure).retryable)
  }

  @Test
  fun `session expiry leaves a refresh safety window`() {
    assertEquals(true, AuthSession("a", "r", 10_000L).isUsable(nowEpochSeconds = 9_000L))
    assertEquals(false, AuthSession("a", "r", 9_050L).isUsable(nowEpochSeconds = 9_000L))
  }

  private class FakeTransport(
    private val responseBody: String,
    private val statusCode: Int = 200,
  ) : StreamFreeHttpTransport {
    var lastUrl: String = ""
    var lastHeaders: Map<String, String> = emptyMap()
    var lastBody: String = ""

    override fun get(url: String, headers: Map<String, String>): HttpResponse =
      error("GET not expected")

    override fun post(url: String, body: ByteArray, headers: Map<String, String>): HttpResponse {
      lastUrl = url
      lastHeaders = headers
      lastBody = body.toString(Charsets.UTF_8)
      return HttpResponse(url, statusCode, emptyMap(), responseBody.toByteArray())
    }
  }
}
