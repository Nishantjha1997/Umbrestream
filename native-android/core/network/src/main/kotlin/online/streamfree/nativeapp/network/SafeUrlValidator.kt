package online.streamfree.nativeapp.network

import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import java.net.IDN
import java.net.InetAddress
import java.util.Locale

class SafeUrlValidator(private val policy: SafeUrlPolicy) {
  private val normalizedAllowedHosts = policy.allowedHosts.map(::normalizeHost).toSet()

  fun validate(rawUrl: String): HttpUrl {
    val url = rawUrl.toHttpUrlOrNull() ?: throw NetworkFailure.InvalidUrl()
    return validate(url)
  }

  fun validate(url: HttpUrl): HttpUrl {
    if (url.scheme != "https") {
      throw NetworkFailure.InsecureUrl(url.host)
    }
    val host = normalizeHost(url.host)
    if (!isAllowedHost(host)) {
      throw NetworkFailure.UnauthorizedHost(host)
    }
    return url
  }

  fun validateRedirect(from: HttpUrl, location: String): HttpUrl {
    val target = from.resolve(location) ?: throw NetworkFailure.InvalidUrl()
    return validate(target)
  }

  fun validateHost(hostname: String): String {
    val host = normalizeHost(hostname)
    if (!isAllowedHost(host)) {
      throw NetworkFailure.UnauthorizedHost(host)
    }
    return host
  }

  fun validateResolvedAddresses(hostname: String, addresses: List<InetAddress>) {
    val host = validateHost(hostname)
    if (addresses.isEmpty() || addresses.any(::isForbiddenAddress)) {
      throw NetworkFailure.UnsafeResolvedAddress(host)
    }
  }

  private fun isAllowedHost(host: String): Boolean = normalizedAllowedHosts.any { allowed ->
    host == allowed || (policy.allowSubdomains && host.endsWith(".$allowed"))
  }

  private fun normalizeHost(hostname: String): String = try {
    IDN.toASCII(hostname.trimEnd('.')).lowercase(Locale.ROOT)
  } catch (_: IllegalArgumentException) {
    throw NetworkFailure.InvalidUrl()
  }

  private fun isForbiddenAddress(address: InetAddress): Boolean {
    if (
      address.isAnyLocalAddress ||
      address.isLoopbackAddress ||
      address.isLinkLocalAddress ||
      address.isSiteLocalAddress ||
      address.isMulticastAddress
    ) {
      return true
    }

    val bytes = address.address
    if (bytes.size == 4) {
      val first = bytes[0].toInt() and 0xFF
      val second = bytes[1].toInt() and 0xFF
      return first == 0 || first == 10 || first == 127 || first >= 224 ||
        (first == 169 && second == 254) ||
        (first == 172 && second in 16..31) ||
        (first == 192 && second == 168)
    }

    if (bytes.size == 16) {
      val first = bytes[0].toInt() and 0xFF
      val second = bytes[1].toInt() and 0xFF
      return (first and 0xFE) == 0xFC ||
        (first == 0xFE && (second and 0xC0) == 0x80) ||
        first == 0xFF
    }
    return true
  }
}
