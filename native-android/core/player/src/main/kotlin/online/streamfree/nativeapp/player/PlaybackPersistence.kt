package online.streamfree.nativeapp.player

import android.content.Context
import android.util.Base64
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.emptyPreferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.flow.firstOrNull
import kotlinx.coroutines.flow.map
import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType
import java.security.MessageDigest

data class PlaybackProgressRecord(
  val mediaType: MediaType,
  val titleId: String,
  val season: Int? = null,
  val episode: Int? = null,
  val audioVariant: AudioVariant? = null,
  val sourceId: String? = null,
  val positionMs: Long = 0L,
  val durationMs: Long = 0L,
  val updatedAtEpochMs: Long,
  val completed: Boolean = false,
) {
  init {
    require(titleId.isNotBlank()) { "Playback title ID cannot be blank" }
    require(positionMs >= 0L) { "Playback position cannot be negative" }
    require(durationMs >= 0L) { "Playback duration cannot be negative" }
    require(updatedAtEpochMs >= 0L) { "Playback update time cannot be negative" }
  }

  val key: String
    get() = MessageDigest.getInstance("SHA-256")
      .digest(
        listOf(mediaType.name, titleId, season?.toString().orEmpty(), episode?.toString().orEmpty(), audioVariant?.name.orEmpty())
          .joinToString("\u001F")
          .toByteArray(Charsets.UTF_8),
      )
      .joinToString("") { "%02x".format(it) }
}

interface PlaybackStore {
  val records: Flow<List<PlaybackProgressRecord>>

  suspend fun get(key: String): PlaybackProgressRecord?

  suspend fun save(record: PlaybackProgressRecord)

  suspend fun delete(key: String)
}

class InMemoryPlaybackStore : PlaybackStore {
  private val values = linkedMapOf<String, PlaybackProgressRecord>()

  override val records: Flow<List<PlaybackProgressRecord>>
    get() = kotlinx.coroutines.flow.flowOf(values.values.sortedByDescending { it.updatedAtEpochMs })

  override suspend fun get(key: String): PlaybackProgressRecord? = values[key]

  override suspend fun save(record: PlaybackProgressRecord) {
    values[record.key] = record
  }

  override suspend fun delete(key: String) {
    values.remove(key)
  }
}

private val Context.streamFreePlaybackDataStore by preferencesDataStore(name = "streamfree_playback")

class PreferencesPlaybackStore(context: Context) : PlaybackStore {
  private val dataStore = context.applicationContext.streamFreePlaybackDataStore

  override val records: Flow<List<PlaybackProgressRecord>> = dataStore.data
    .catch { emit(emptyPreferences()) }
    .map { preferences ->
      preferences.asMap().entries
        .asSequence()
        .filter { it.key.name.startsWith(STORAGE_PREFIX) }
        .mapNotNull { decode(it.value as? String ?: return@mapNotNull null) }
        .sortedByDescending { it.updatedAtEpochMs }
        .toList()
    }

  override suspend fun get(key: String): PlaybackProgressRecord? = records
    .map { entries -> entries.firstOrNull { it.key == key } }
    .firstOrNull()

  override suspend fun save(record: PlaybackProgressRecord) {
    dataStore.edit { preferences ->
      preferences[stringPreferencesKey(STORAGE_PREFIX + record.key)] = encode(record)
    }
  }

  override suspend fun delete(key: String) {
    dataStore.edit { preferences -> preferences.remove(stringPreferencesKey(STORAGE_PREFIX + key)) }
  }

  private fun decode(value: String): PlaybackProgressRecord? = runCatching {
    val fields = value.split('|')
    require(fields.size == 11 && fields[0] == "1")
    PlaybackProgressRecord(
      mediaType = MediaType.valueOf(fields[1]),
      titleId = decodeText(fields[2]),
      season = fields[3].toIntOrNull(),
      episode = fields[4].toIntOrNull(),
      audioVariant = fields[5].takeIf(String::isNotEmpty)?.let(AudioVariant::valueOf),
      sourceId = fields[6].takeIf(String::isNotEmpty)?.let(::decodeText),
      positionMs = fields[7].toLong(),
      durationMs = fields[8].toLong(),
      updatedAtEpochMs = fields[9].toLong(),
      completed = fields[10].toBooleanStrict(),
    )
  }.getOrNull()

  private fun encode(record: PlaybackProgressRecord): String = listOf(
    "1",
    record.mediaType.name,
    encodeText(record.titleId),
    record.season?.toString().orEmpty(),
    record.episode?.toString().orEmpty(),
    record.audioVariant?.name.orEmpty(),
    record.sourceId?.let(::encodeText).orEmpty(),
    record.positionMs.toString(),
    record.durationMs.toString(),
    record.updatedAtEpochMs.toString(),
    record.completed.toString(),
  ).joinToString("|")

  private companion object {
    const val STORAGE_PREFIX = "progress.v1."

    fun encodeText(value: String): String = Base64.encodeToString(
      value.toByteArray(Charsets.UTF_8),
      Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING,
    )

    fun decodeText(value: String): String = String(
      Base64.decode(value, Base64.URL_SAFE or Base64.NO_WRAP or Base64.NO_PADDING),
      Charsets.UTF_8,
    )
  }
}
