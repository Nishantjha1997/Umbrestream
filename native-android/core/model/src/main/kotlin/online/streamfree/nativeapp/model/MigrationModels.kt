package online.streamfree.nativeapp.model

/**
 * Versioned guest-data payload used before uninstalling a legacy package.
 * Authentication/cloud sync remains the preferred migration path; this model
 * prevents future clients from silently changing the local export shape.
 */
const val GUEST_DATA_MIGRATION_SCHEMA_VERSION = 1

data class GuestDataMigrationEnvelope(
  val schemaVersion: Int = GUEST_DATA_MIGRATION_SCHEMA_VERSION,
  val exportedAtEpochMs: Long,
  val history: List<HistoryMigrationRecord> = emptyList(),
  val watchlist: List<WatchlistMigrationRecord> = emptyList(),
  val sourcePreferences: List<SourcePreferenceMigrationRecord> = emptyList(),
  val onboardingCompleted: Boolean = false,
  val regionOverride: String? = null,
)

data class HistoryMigrationRecord(
  val mediaType: MediaType,
  val mediaId: String,
  val episode: Int? = null,
  val season: Int? = null,
  val positionMs: Long = 0L,
  val durationMs: Long? = null,
  val updatedAtEpochMs: Long,
)

data class WatchlistMigrationRecord(
  val mediaType: MediaType,
  val mediaId: String,
  val addedAtEpochMs: Long,
)

data class SourcePreferenceMigrationRecord(
  val mediaType: MediaType,
  val audioVariant: AudioVariant? = null,
  val sourceId: String,
)

fun GuestDataMigrationEnvelope.isSupported(): Boolean =
  schemaVersion == GUEST_DATA_MIGRATION_SCHEMA_VERSION
