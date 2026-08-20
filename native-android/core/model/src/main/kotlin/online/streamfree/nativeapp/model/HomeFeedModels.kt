package online.streamfree.nativeapp.model

fun normalizeRegionCode(value: String?): String? = value
  ?.trim()
  ?.uppercase()
  ?.takeIf { it.matches(Regex("[A-Z]{2}")) }

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

/** Merge a cursor page without replacing the already-rendered regional rows. */
fun NativeHomeFeed.mergeContinueWatchingPage(page: NativeHomeFeed): NativeHomeFeed {
  val incoming = page.rows.firstOrNull { it.kind == "continue" } ?: return this
  val current = rows.firstOrNull { it.kind == "continue" }
  val mergedItems = buildList {
    current?.items.orEmpty().forEach { add(it) }
    incoming.items.forEach { item ->
      if (none { it.mediaType == item.mediaType && it.id == item.id }) add(item)
    }
  }
  if (current == null) {
    return copy(rows = rows + incoming.copy(items = mergedItems))
  }
  return copy(
    rows = rows.map { row ->
      if (row.kind == "continue") row.copy(items = mergedItems, nextCursor = incoming.nextCursor) else row
    },
  )
}
