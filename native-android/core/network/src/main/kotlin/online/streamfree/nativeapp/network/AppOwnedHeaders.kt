package online.streamfree.nativeapp.network

object AppOwnedHeaders {
  private val allowedNames = setOf(
    "accept",
    "accept-language",
    "authorization",
    "apikey",
    "content-type",
    "x-streamfree-region",
    "origin",
    "referer",
    "user-agent",
  )

  fun validate(input: Map<String, String>): Map<String, String> {
    input.forEach { (name, value) ->
      val normalizedName = name.lowercase()
      if (normalizedName !in allowedNames) {
        throw NetworkFailure.DisallowedHeader(name)
      }
      if (value.any { it == '\r' || it == '\n' }) {
        throw NetworkFailure.InvalidHeaderValue(name)
      }
    }
    return input.toMap()
  }
}
