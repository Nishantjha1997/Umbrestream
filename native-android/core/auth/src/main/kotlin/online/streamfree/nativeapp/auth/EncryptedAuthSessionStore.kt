package online.streamfree.nativeapp.auth

import android.content.Context
import android.util.Base64
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.contentOrNull
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.longOrNull
import kotlinx.serialization.json.put
import java.security.KeyStore
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

interface AuthSessionStore {
  val session: Flow<AuthSession?>
  suspend fun current(): AuthSession?
  suspend fun save(value: AuthSession)
  suspend fun clear()
}

private val Context.authSessionDataStore by preferencesDataStore(name = "streamfree_auth_session")

/**
 * Stores only an AES-GCM ciphertext in DataStore. The AES key is generated in
 * Android Keystore and is never exportable or written to the app filesystem.
 */
class EncryptedAuthSessionStore(private val context: Context) : AuthSessionStore {
  override val session: Flow<AuthSession?> = context.authSessionDataStore.data
    .catch { emit(emptyPreferences()) }
    .map { preferences -> preferences[SESSION_KEY]?.let(::decrypt) }

  override suspend fun current(): AuthSession? = session.first()

  override suspend fun save(value: AuthSession) {
    context.authSessionDataStore.edit { preferences ->
      preferences[SESSION_KEY] = encrypt(encode(value))
    }
  }

  override suspend fun clear() {
    context.authSessionDataStore.edit { preferences -> preferences.remove(SESSION_KEY) }
  }

  private fun encode(value: AuthSession): String = buildJsonObject {
    put("accessToken", value.accessToken)
    put("refreshToken", value.refreshToken)
    put("expiresAt", value.expiresAtEpochSeconds)
    value.userId?.let { put("userId", it) }
    value.email?.let { put("email", it) }
  }.toString()

  private fun decrypt(value: String): AuthSession? = runCatching {
    val envelope = decodeEnvelope(value)
    val plaintext = cipher(Cipher.DECRYPT_MODE, envelope.iv).doFinal(envelope.ciphertext)
    val json = Json.parseToJsonElement(plaintext.toString(Charsets.UTF_8)).jsonObject
    AuthSession(
      accessToken = json["accessToken"]?.jsonPrimitive?.contentOrNull.orEmpty().takeIf { it.isNotBlank() } ?: return null,
      refreshToken = json["refreshToken"]?.jsonPrimitive?.contentOrNull.orEmpty().takeIf { it.isNotBlank() } ?: return null,
      expiresAtEpochSeconds = json["expiresAt"]?.jsonPrimitive?.longOrNull ?: return null,
      userId = json["userId"]?.jsonPrimitive?.contentOrNull,
      email = json["email"]?.jsonPrimitive?.contentOrNull,
    )
  }.getOrNull()

  private fun encrypt(plaintext: String): String {
    val cipher = cipher(Cipher.ENCRYPT_MODE)
    val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
    val iv = cipher.iv
    val envelope = java.nio.ByteBuffer.allocate(4 + iv.size + ciphertext.size)
      .putInt(iv.size)
      .put(iv)
      .put(ciphertext)
      .array()
    return Base64.encodeToString(envelope, Base64.NO_WRAP)
  }

  private fun decodeEnvelope(value: String): EncryptedEnvelope {
    val bytes = Base64.decode(value, Base64.DEFAULT)
    require(bytes.size > 4) { "Invalid encrypted session envelope" }
    val ivSize = java.nio.ByteBuffer.wrap(bytes, 0, 4).int
    require(ivSize in 12..16) { "Invalid encrypted session IV" }
    val iv = ByteArray(ivSize)
    require(bytes.size > 4 + ivSize + 16) { "Invalid encrypted session payload" }
    val payload = bytes.copyOfRange(4, bytes.size)
    payload.copyInto(iv, endIndex = iv.size)
    return EncryptedEnvelope(iv, bytes.copyOfRange(4 + ivSize, bytes.size))
  }

  private fun cipher(mode: Int, iv: ByteArray? = null): Cipher {
    val key = keyStoreKey()
    val cipher = Cipher.getInstance(TRANSFORMATION)
    if (mode == Cipher.DECRYPT_MODE) {
      cipher.init(mode, key, GCMParameterSpec(TAG_BITS, requireNotNull(iv)))
    } else {
      cipher.init(mode, key)
    }
    return cipher
  }

  private data class EncryptedEnvelope(val iv: ByteArray, val ciphertext: ByteArray)

  private fun keyStoreKey(): SecretKey {
    val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
    (keyStore.getKey(KEY_ALIAS, null) as? SecretKey)?.let { return it }
    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, ANDROID_KEYSTORE)
    generator.init(
      KeyGenParameterSpec.Builder(
        KEY_ALIAS,
        KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT,
      )
        .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
        .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
        .setKeySize(256)
        .build(),
    )
    return generator.generateKey()
  }

  private companion object {
    val SESSION_KEY = stringPreferencesKey("session.v1")
    const val ANDROID_KEYSTORE = "AndroidKeyStore"
    const val KEY_ALIAS = "streamfree.auth.session.v1"
    const val TRANSFORMATION = "AES/GCM/NoPadding"
    const val TAG_BITS = 128
  }
}
