package online.streamfree.nativeapp.network

import java.net.InetAddress
import org.junit.Assert.assertEquals
import org.junit.Assert.assertThrows
import org.junit.Assert.assertTrue
import org.junit.Test

class SafeNetworkPolicyTest {
  private val policy = SafeUrlPolicy(
    allowedHosts = setOf("streamfree.online"),
  )
  private val validator = SafeUrlValidator(policy)

  @Test
  fun `only approved https hosts are accepted`() {
    assertEquals("api.streamfree.online", validator.validate("https://api.streamfree.online/v1").host)
    assertThrows(NetworkFailure.InsecureUrl::class.java) {
      validator.validate("http://streamfree.online/v1")
    }
    assertThrows(NetworkFailure.UnauthorizedHost::class.java) {
      validator.validate("https://example.com/v1")
    }
  }

  @Test
  fun `redirects must resolve within approved https hosts`() {
    val start = validator.validate("https://streamfree.online/start")
    assertEquals(
      "https://cdn.streamfree.online/video",
      validator.validateRedirect(start, "https://cdn.streamfree.online/video").toString(),
    )
    assertThrows(NetworkFailure.UnauthorizedHost::class.java) {
      validator.validateRedirect(start, "https://example.com/video")
    }
    assertThrows(NetworkFailure.InsecureUrl::class.java) {
      validator.validateRedirect(start, "http://streamfree.online/video")
    }
  }

  @Test
  fun `loopback and private addresses are rejected`() {
    val loopback = InetAddress.getByName("127.0.0.1")
    val privateAddress = InetAddress.getByName("192.168.1.12")
    assertThrows(NetworkFailure.UnsafeResolvedAddress::class.java) {
      validator.validateResolvedAddresses("streamfree.online", listOf(loopback))
    }
    assertThrows(NetworkFailure.UnsafeResolvedAddress::class.java) {
      validator.validateResolvedAddresses("streamfree.online", listOf(privateAddress))
    }
  }

  @Test
  fun `unsafe headers cannot cross the networking boundary`() {
    assertThrows(NetworkFailure.DisallowedHeader::class.java) {
      AppOwnedHeaders.validate(mapOf("Cookie" to "session=secret"))
    }
    assertThrows(NetworkFailure.InvalidHeaderValue::class.java) {
      AppOwnedHeaders.validate(mapOf("User-Agent" to "bad\r\nX-Leak: value"))
    }
    assertTrue(AppOwnedHeaders.validate(mapOf("Accept" to "application/json")).size == 1)
  }

  @Test
  fun `allows authenticated native feed region header`() {
    val headers = AppOwnedHeaders.validate(
      mapOf("Authorization" to "Bearer token", "X-StreamFree-Region" to "IN"),
    )
    assertEquals("IN", headers["X-StreamFree-Region"])
  }
}
