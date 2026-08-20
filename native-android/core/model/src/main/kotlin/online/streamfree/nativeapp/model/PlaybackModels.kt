package online.streamfree.nativeapp.model

enum class MediaType { Movie, Tv, Anime }

enum class AudioVariant { Sub, Dub }

/**
 * User intent is distinct from a product default. The resolver uses this to
 * preserve a deliberate source choice without turning its own fallback into
 * a sticky preference.
 */
data class PlaybackSelection(
  val mediaType: MediaType,
  val titleId: String,
  val episode: Int? = null,
  val season: Int? = null,
  val audioVariant: AudioVariant? = null,
  val explicitSourceId: String? = null,
  val resumePositionMs: Long = 0L,
)
