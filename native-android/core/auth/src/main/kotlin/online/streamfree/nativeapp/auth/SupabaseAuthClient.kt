package online.streamfree.nativeapp.auth

import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.put
import online.streamfree.nativeapp.network.SafeUrlPolicy
import online.streamfree.nativeapp.network.StreamFreeHttpClient
import online.streamfree.nativeapp.network.StreamFreeHttpTransport

class SupabaseAuthClient(
  private val configClient: StreamFreeRuntimeConfigClient = StreamFreeRuntimeConfigClient(),
  private val configProvider: (suspend () -> StreamFreeRuntimeConfig?)? = null,
  private val transportFactory: (SafeUrlPolicy) -> StreamFreeHttpTransport = { policy -> StreamFreeHttpClient(policy) },
  private val json: Json = Json { ignoreUnknownKeys = true },
) {
  suspend fun signInWithPassword(email: String, password: String): AuthResult = withContext(Dispatchers.IO) {
    val normalizedEmail = email.trim().lowercase()
    if (!EMAIL_PATTERN.matches(normalizedEmail) || password.length < 8) {
      return@withContext AuthResult.Failure("Enter a valid email and password.", retryable = false)
    }
    postToken(
      grantType = "password",
      body = buildJsonObject {
        put("email", normalizedEmail)
        put("password", password)
      }.toString(),
    )
  }

  suspend fun refresh(session: AuthSession): AuthResult = withContext(Dispatchers.IO) {
    if (session.refreshToken.isBlank()) return@withContext AuthResult.Failure("Your session has expired. Please sign in again.", retryable = false)
    postToken(
      grantType = "refresh_token",
      body = buildJsonObject { put("refresh_token", session.refreshToken) }.toString(),
    )
  }

  suspend fun signOut(session: AuthSession): Boolean = withContext(Dispatchers.IO) {
    val config = (configProvider?.invoke() ?: configClient.load()) ?: return@withContext false
    val transport = transportFactory(
      SafeUrlPolicy(allowedHosts = setOf(config.supabaseHost), allowSubdomains = false),
    )
    runCatching {
      val response = transport.post(
        url = "${config.supabaseUrl}/auth/v1/logout",
        body = ByteArray(0),
        headers = authHeaders(config, session.accessToken),
      )
      response.statusCode in 200..299
    }.getOrDefault(false)
  }

  private suspend fun postToken(grantType: String, body: String): AuthResult {
    val config = (configProvider?.invoke() ?: configClient.load())
      ?: return AuthResult.Failure("Account services are temporarily unavailable.")
    val transport = transportFactory(
      SafeUrlPolicy(allowedHosts = setOf(config.supabaseHost), allowSubdomains = false),
    )
    val response = runCatching {
      transport.post(
        url = "${config.supabaseUrl}/auth/v1/token?grant_type=$grantType",
        body = body.toByteArray(Charsets.UTF_8),
        headers = authHeaders(config),
      )
    }.getOrElse {
      return AuthResult.Failure("Could not reach account services.")
    }
    if (response.statusCode !in 200..299) {
      return AuthResult.Failure("The email or password was not accepted.", retryable = response.statusCode >= 500)
    }
    return parseSession(response.text)
  }

  private fun parseSession(text: String): AuthResult = runCatching {
    val root = json.parseToJsonElement(text).jsonObject
    val accessToken = root["access_token"]?.jsonPrimitive?.contentOrNull.orEmpty()
    val refreshToken = root["refresh_token"]?.jsonPrimitive?.contentOrNull.orEmpty()
    if (accessToken.isBlank() || refreshToken.isBlank()) return AuthResult.Failure("Account session was incomplete.")
    val expiresAt = root["expires_at"]?.jsonPrimitive?.longOrNull
      ?: ((System.currentTimeMillis() / 1_000L) + (root["expires_in"]?.jsonPrimitive?.longOrNull ?: 3_600L))
    val user = root["user"]?.jsonObject
    AuthResult.Success(
      AuthSession(
        accessToken = accessToken,
        refreshToken = refreshToken,
        expiresAtEpochSeconds = expiresAt,
        userId = user?.get("id")?.jsonPrimitive?.contentOrNull,
        email = user?.get("email")?.jsonPrimitive?.contentOrNull,
      ),
    )
  }.getOrElse { AuthResult.Failure("Account session could not be read.") }

  private fun authHeaders(config: StreamFreeRuntimeConfig, accessToken: String? = null): Map<String, String> = buildMap {
    put("Accept", "application/json")
    put("Content-Type", "application/json")
    put("apikey", config.supabasePublishableKey)
    accessToken?.takeIf { it.isNotBlank() }?.let { put("Authorization", "Bearer $it") }
  }

  private companion object {
    val EMAIL_PATTERN = Regex("^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$")
  }
}

class AuthSessionManager(
  private val client: SupabaseAuthClient,
  private val store: AuthSessionStore,
  private val animeLinkClient: NativeAnimeLinkClient = NativeAnimeLinkClient(),
) {
  val session = store.session

  suspend fun signIn(email: String, password: String): AuthResult {
    return when (val result = client.signInWithPassword(email, password)) {
      is AuthResult.Success -> {
        store.save(result.session)
        result
      }
      is AuthResult.Failure -> result
    }
  }

  suspend fun accessToken(): String? {
    val current = store.current() ?: return null
    if (current.isUsable()) return current.accessToken
    return when (val result = client.refresh(current)) {
      is AuthResult.Success -> {
        store.save(result.session)
        result.session.accessToken
      }
      is AuthResult.Failure -> {
        if (!result.retryable) store.clear()
        null
      }
    }
  }

  suspend fun hasSession(): Boolean = store.current() != null

  suspend fun signOut() {
    store.current()?.let { client.signOut(it) }
    store.clear()
  }

  suspend fun beginAnimeLink(provider: NativeAnimeProvider): String? {
    val token = accessToken() ?: return null
    return animeLinkClient.start(provider, token)
  }
}
