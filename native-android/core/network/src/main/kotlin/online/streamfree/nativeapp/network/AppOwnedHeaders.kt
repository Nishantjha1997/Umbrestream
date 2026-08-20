package online.streamfree.nativeapp.network

import okhttp3.Headers

object AppOwnedHeaders {
  private val allowedNames = setOf(
    "accept",
    "accept-language",
    "origin",
    "referer",
    "user-agent",
  )

  fun validate(input: Map<String, String>): Headers {
    val builder = Headers.Builder()
    input.forEach { (name, value) ->
      val normalizedName = name.lowercase()
      if (normalizedName !in allowedNames) {
        throw NetworkFailure.DisallowedHeader(name)
      }
      if (value.any { it == '\r' || it == '\n' }) {
        throw NetworkFailure.InvalidHeaderValue(name)
      }
      builder.add(name, value)
    }
    return builder.build()
  }
}
