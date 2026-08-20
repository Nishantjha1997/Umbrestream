package online.streamfree.nativeapp.model

import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class MigrationModelsTest {
  @Test
  fun `version one envelope preserves source and audio choices`() {
    val envelope = GuestDataMigrationEnvelope(
      exportedAtEpochMs = 100L,
      sourcePreferences = listOf(
        SourcePreferenceMigrationRecord(
          mediaType = MediaType.Anime,
          audioVariant = AudioVariant.Dub,
          sourceId = "anivexa",
        ),
      ),
    )

    assertTrue(envelope.isSupported())
    assertTrue(envelope.sourcePreferences.single().audioVariant == AudioVariant.Dub)
  }

  @Test
  fun `unknown envelope version is rejected`() {
    val envelope = GuestDataMigrationEnvelope(
      schemaVersion = GUEST_DATA_MIGRATION_SCHEMA_VERSION + 1,
      exportedAtEpochMs = 100L,
    )

    assertFalse(envelope.isSupported())
  }
}
