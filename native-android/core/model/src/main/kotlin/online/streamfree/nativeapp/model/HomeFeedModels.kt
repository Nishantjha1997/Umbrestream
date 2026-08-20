package online.streamfree.nativeapp.model

data class NativeMediaSummary(
  val mediaType: MediaType,
  val id: Int,
  val href: String,
  val title: String,
  val posterUrl: String,
  val backdropUrl: String? = null,
  val year: Int? = null,
  val rating: Double? = null,
  val isAdult: Boolean = false,
  val format: String? = null,
)

data class NativeHomeRow(
  val id: String,
  val title: String,
  val kind: String,
  val items: List<NativeMediaSummary>,
  val nextCursor: String? = null,
)

data class NativeContinueProgress(
  val mediaId: Int,
  val mediaType: MediaType,
  val season: Int,
  val episode: Int,
  val lastPositionMs: Long,
  val durationMs: Long,
  val progressPercent: Double,
)

data class NativeHomeHero(
  val intent: String,
  val media: NativeMediaSummary,
  val progress: NativeContinueProgress? = null,
)

data class NativeHomeRegion(
  val detectedCountry: String,
  val effectiveCountry: String,
  val countryName: String,
  val source: String,
)

data class NativeHomeFeed(
  val region: NativeHomeRegion,
  val provenance: String,
  val hero: NativeHomeHero?,
  val rows: List<NativeHomeRow>,
  val generatedAt: String,
)
