package online.streamfree.nativeapp.model

import org.junit.Assert.assertEquals
import org.junit.Test

class HomeFeedModelsTest {
  @Test
  fun `cursor pages append continue titles without duplicating existing items`() {
    val first = media(1, "First")
    val second = media(2, "Second")
    val pageOne = feed(
      NativeHomeRow("continue", "Continue Watching", "continue", listOf(first), "cursor-1"),
    )
    val pageTwo = feed(
      NativeHomeRow("continue", "Continue Watching", "continue", listOf(first, second), "cursor-2"),
    )

    val merged = pageOne.mergeContinueWatchingPage(pageTwo)
    val row = merged.rows.single()

    assertEquals(listOf(1, 2), row.items.map { it.id })
    assertEquals("cursor-2", row.nextCursor)
  }

  private fun feed(row: NativeHomeRow) = NativeHomeFeed(
    region = NativeHomeRegion("IN", "IN", "India", "edge"),
    provenance = "history",
    hero = null,
    rows = listOf(row),
    generatedAt = "now",
  )

  private fun media(id: Int, title: String) = NativeMediaSummary(
    mediaType = MediaType.Movie,
    id = id,
    href = "/movie/$id",
    title = title,
    posterUrl = "https://image.tmdb.org/t/p/w500/$id.jpg",
  )
}
