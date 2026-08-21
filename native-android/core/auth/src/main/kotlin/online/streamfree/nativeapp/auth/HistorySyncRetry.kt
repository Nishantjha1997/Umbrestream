package online.streamfree.nativeapp.auth

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import androidx.work.BackoffPolicy
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingWorkPolicy
import androidx.work.NetworkType
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import kotlinx.serialization.json.Json
import kotlinx.serialization.json.buildJsonArray
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.doubleOrNull
import kotlinx.serialization.json.intOrNull
import kotlinx.serialization.json.jsonArray
import kotlinx.serialization.json.jsonObject
import kotlinx.serialization.json.jsonPrimitive
import kotlinx.serialization.json.put
import java.nio.ByteBuffer
import java.security.KeyStore
import java.util.concurrent.TimeUnit
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

data class PendingHistorySync(
  val mediaType: String,
  val mediaId: String,
  val currentTimeSeconds: Double,
  val durationSeconds: Double,
  val season: Int?,
  val episode: Int?,
  val completed: Boolean,
) {
  val dedupeKey: String
    get() = listOf(mediaType, mediaId, season ?: "", episode ?: "", completed).joinToString("|")
}

interface HistorySyncRetryQueue {
  suspend fun peek(): List<PendingHistorySync>
  suspend fun enqueue(event: PendingHistorySync)
  suspend fun remove(event: PendingHistorySync)
  suspend fun replace(events: List<PendingHistorySync>)
  suspend fun clear()
}

private val Context.historySyncDataStore by preferencesDataStore(name = "streamfree_history_sync_queue")

/**
 * Persists only encrypted playback metadata. Access and refresh tokens are
 * intentionally never included in this queue or in WorkManager input data.
 */
class EncryptedHistorySyncQueue(private val context: Context) : HistorySyncRetryQueue {
  private val json = Json { ignoreUnknownKeys = true }

  override suspend fun peek(): List<PendingHistorySync> = context.historySyncDataStore.data
    .map { preferences -> preferences[QUEUE_KEY]?.let(::decrypt).orEmpty() }
    .first()

  override suspend fun enqueue(event: PendingHistorySync) {
    context.historySyncDataStore.edit { preferences ->
      val merged = (preferences[QUEUE_KEY]?.let(::decrypt).orEmpty() + event)
        .distinctBy(PendingHistorySync::dedupeKey)
        .takeLast(MAX_QUEUE_SIZE)
      preferences[QUEUE_KEY] = encrypt(encode(merged))
    }
  }

  override suspend fun remove(event: PendingHistorySync) {
    context.historySyncDataStore.edit { preferences ->
      val remaining = preferences[QUEUE_KEY]?.let(::decrypt).orEmpty()
        .filterNot { it.dedupeKey == event.dedupeKey }
      if (remaining.isEmpty()) preferences.remove(QUEUE_KEY)
      else preferences[QUEUE_KEY] = encrypt(encode(remaining))
    }
  }

  override suspend fun replace(events: List<PendingHistorySync>) {
    context.historySyncDataStore.edit { preferences ->
      if (events.isEmpty()) preferences.remove(QUEUE_KEY)
      else preferences[QUEUE_KEY] = encrypt(encode(events.distinctBy(PendingHistorySync::dedupeKey).takeLast(MAX_QUEUE_SIZE)))
    }
  }

  override suspend fun clear() {
    context.historySyncDataStore.edit { preferences -> preferences.remove(QUEUE_KEY) }
  }

  private fun encode(events: List<PendingHistorySync>): String = buildJsonArray {
    events.forEach { event ->
      add(buildJsonObject {
        put("mediaType", event.mediaType)
        put("mediaId", event.mediaId)
        put("currentTime", event.currentTimeSeconds)
        put("duration", event.durationSeconds)
        event.season?.let { put("season", it) }
        event.episode?.let { put("episode", it) }
        put("completed", event.completed)
      })
    }
  }.toString()

  private fun decrypt(value: String): List<PendingHistorySync> = runCatching {
    val envelope = decodeEnvelope(value)
    val plaintext = cipher(Cipher.DECRYPT_MODE, envelope.iv).doFinal(envelope.ciphertext)
    json.parseToJsonElement(plaintext.toString(Charsets.UTF_8)).jsonArray.mapNotNull { value ->
      val item = value.jsonObject
      val mediaType = item["mediaType"]?.jsonPrimitive?.content
      val mediaId = item["mediaId"]?.jsonPrimitive?.content
      val currentTime = item["currentTime"]?.jsonPrimitive?.doubleOrNull
      val duration = item["duration"]?.jsonPrimitive?.doubleOrNull
      if (mediaType.isNullOrBlank() || mediaId.isNullOrBlank() || currentTime == null || duration == null) return@mapNotNull null
      PendingHistorySync(
        mediaType = mediaType,
        mediaId = mediaId,
        currentTimeSeconds = currentTime,
        durationSeconds = duration,
        season = item["season"]?.jsonPrimitive?.intOrNull,
        episode = item["episode"]?.jsonPrimitive?.intOrNull,
        completed = item["completed"]?.jsonPrimitive?.content == "true",
      )
    }
  }.getOrDefault(emptyList())

  private fun encrypt(plaintext: String): String {
    val cipher = cipher(Cipher.ENCRYPT_MODE)
    val ciphertext = cipher.doFinal(plaintext.toByteArray(Charsets.UTF_8))
    val envelope = ByteBuffer.allocate(4 + cipher.iv.size + ciphertext.size)
      .putInt(cipher.iv.size)
      .put(cipher.iv)
      .put(ciphertext)
      .array()
    return Base64.encodeToString(envelope, Base64.NO_WRAP)
  }

  private fun decodeEnvelope(value: String): EncryptedEnvelope {
    val bytes = Base64.decode(value, Base64.DEFAULT)
    require(bytes.size > 4) { "Invalid encrypted history queue envelope" }
    val ivSize = ByteBuffer.wrap(bytes, 0, 4).int
    require(ivSize in 12..16 && bytes.size > 4 + ivSize + 16) { "Invalid encrypted history queue payload" }
    val iv = bytes.copyOfRange(4, 4 + ivSize)
    return EncryptedEnvelope(iv, bytes.copyOfRange(4 + ivSize, bytes.size))
  }

  private fun cipher(mode: Int, iv: ByteArray? = null): Cipher {
    val cipher = Cipher.getInstance(TRANSFORMATION)
    if (mode == Cipher.DECRYPT_MODE) cipher.init(mode, keyStoreKey(), GCMParameterSpec(TAG_BITS, requireNotNull(iv)))
    else cipher.init(mode, keyStoreKey())
    return cipher
  }

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

  private data class EncryptedEnvelope(val iv: ByteArray, val ciphertext: ByteArray)

  private companion object {
    val QUEUE_KEY = stringPreferencesKey("queue.v1")
    const val MAX_QUEUE_SIZE = 50
    const val ANDROID_KEYSTORE = "AndroidKeyStore"
    const val KEY_ALIAS = "streamfree.history.queue.v1"
    const val TRANSFORMATION = "AES/GCM/NoPadding"
    const val TAG_BITS = 128
  }
}

object HistorySyncScheduler {
  private const val WORK_NAME = "streamfree-history-sync"

  fun enqueue(context: Context) {
    val request = OneTimeWorkRequestBuilder<HistorySyncWorker>()
      .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
      .setBackoffCriteria(BackoffPolicy.EXPONENTIAL, 30, TimeUnit.SECONDS)
      .build()
    WorkManager.getInstance(context.applicationContext)
      .enqueueUniqueWork(WORK_NAME, ExistingWorkPolicy.KEEP, request)
  }
}

class HistorySyncWorker(
  appContext: Context,
  workerParams: WorkerParameters,
) : CoroutineWorker(appContext, workerParams) {
  override suspend fun doWork(): Result {
    val queue = EncryptedHistorySyncQueue(applicationContext)
    val pending = queue.peek()
    if (pending.isEmpty()) return Result.success()

    val auth = AuthSessionManager(
      SupabaseAuthClient(),
      EncryptedAuthSessionStore(applicationContext),
    )
    if (!auth.hasSession()) {
      queue.clear()
      return Result.success()
    }
    val token = auth.accessToken() ?: return Result.retry()
    val client = HistorySyncClient()
    val remaining = pending.toMutableList()
    for (event in pending) {
      val synced = client.sync(
        bearerToken = token,
        mediaType = event.mediaType,
        mediaId = event.mediaId,
        currentTimeSeconds = event.currentTimeSeconds,
        durationSeconds = event.durationSeconds,
        season = event.season,
        episode = event.episode,
        completed = event.completed,
      )
      if (!synced) break
      remaining.remove(event)
    }
    queue.replace(remaining)
    return if (remaining.isEmpty()) Result.success() else Result.retry()
  }
}
