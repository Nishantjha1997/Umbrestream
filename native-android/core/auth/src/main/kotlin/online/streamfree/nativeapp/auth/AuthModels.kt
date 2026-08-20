package online.streamfree.nativeapp.auth

data class AuthSession(
  val accessToken: String,
  val refreshToken: String,
  val expiresAtEpochSeconds: Long,
  val userId: String? = null,
  val email: String? = null,
) {
  fun isUsable(nowEpochSeconds: Long = System.currentTimeMillis() / 1_000L): Boolean =
    accessToken.isNotBlank() && expiresAtEpochSeconds > nowEpochSeconds + 60L
}

sealed interface AuthResult {
  data class Success(val session: AuthSession) : AuthResult
  data class Failure(val message: String, val retryable: Boolean = true) : AuthResult
}
