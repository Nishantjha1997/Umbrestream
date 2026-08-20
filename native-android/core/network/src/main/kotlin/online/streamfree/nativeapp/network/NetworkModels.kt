package online.streamfree.nativeapp.network

import java.io.IOException

data class SafeUrlPolicy(
  val allowedHosts: Set<String>,
  val allowSubdomains: Boolean = true,
  val maxRedirects: Int = 3,
  val maxResponseBytes: Long = 2L * 1024L * 1024L,
) {
  init {
    require(allowedHosts.isNotEmpty()) { "At least one allowed host is required" }
    require(maxRedirects in 0..3) { "Redirect policy must allow at most three redirects" }
    require(maxResponseBytes > 0L) { "Response limit must be positive" }
  }
}

sealed class NetworkFailure(message: String, cause: Throwable? = null) : IOException(message, cause) {
  class InvalidUrl : NetworkFailure("The request URL is invalid")

  class InsecureUrl(host: String) : NetworkFailure("HTTPS is required for host $host")

  class UnauthorizedHost(host: String) : NetworkFailure("Host is not approved: $host")

  class UnsafeResolvedAddress(host: String) : NetworkFailure("Host resolves to a private or reserved address: $host")

  class RedirectLimit(host: String) : NetworkFailure("Redirect limit reached for host $host")

  class RedirectLoop(host: String) : NetworkFailure("Redirect loop detected for host $host")

  class MissingRedirectLocation(host: String) : NetworkFailure("Redirect has no location for host $host")

  class DisallowedHeader(name: String) : NetworkFailure("Header is not app-owned: $name")

  class InvalidHeaderValue(name: String) : NetworkFailure("Header contains invalid characters: $name")

  class ResponseTooLarge(host: String) : NetworkFailure("Response exceeds the configured limit for host $host")

  class HttpStatus(val code: Int, host: String) : NetworkFailure("HTTP $code returned by host $host")

  class Timeout(host: String, cause: Throwable) : NetworkFailure("Request timed out for host $host", cause)

  class Transport(host: String, cause: Throwable) : NetworkFailure("Transport failed for host $host", cause)
}

data class HttpResponse(
  val finalUrl: String,
  val statusCode: Int,
  val headers: Map<String, String>,
  val body: ByteArray,
) {
  val text: String get() = body.toString(Charsets.UTF_8)
}

data class NetworkMetric(
  val host: String,
  val statusCode: Int?,
  val durationMs: Long,
  val outcome: String,
)

fun interface NetworkMetrics {
  fun record(metric: NetworkMetric)
}

object NoopNetworkMetrics : NetworkMetrics {
  override fun record(metric: NetworkMetric) = Unit
}
