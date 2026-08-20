package online.streamfree.nativeapp.source

import kotlinx.coroutines.runBlocking
import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.network.HttpResponse
import online.streamfree.nativeapp.network.StreamFreeHttpTransport
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test

class StreamFreeEpisodeCatalogResolverTest {
  @Test
  fun `loads valid seasons and filters specials`() = runBlocking {
    val resolver = StreamFreeEpisodeCatalogResolver(FakeTransport())
    val catalog = resolver.resolve(
      PlaybackRequest(MediaType.Tv, "123", tmdbId = 123, season = 1, episode = 1),
    )

    requireNotNull(catalog)
    assertEquals(listOf(1, 3), catalog.seasons.flatMap { it.playableEpisodes }.distinct().sorted())
    assertEquals(listOf(1, 3), catalog.episodesForSeason(1).map { it.ref.episode })
    assertEquals("Pilot", catalog.episodesForSeason(1).first().title)
  }

  @Test
  fun `anime requests do not use the TV catalogue resolver`() = runBlocking {
    val catalog = StreamFreeEpisodeCatalogResolver(FakeTransport()).resolve(
      PlaybackRequest(MediaType.Anime, "21", anilistId = 21, episode = 1),
    )
    assertNull(catalog)
  }

  private class FakeTransport : StreamFreeHttpTransport {
    override fun get(url: String, headers: Map<String, String>): HttpResponse {
      val body = if (url.contains("/season/")) {
        """
        {"episodes":[
          {"episode_number":1,"name":"Pilot","air_date":"2025-01-01","runtime":24},
          {"episode_number":0,"name":"Special"},
          {"episode_number":3,"name":"Finale"}
        ]}
        """.trimIndent()
      } else {
        """
        {"seasons":[
          {"season_number":0,"episode_count":2},
          {"season_number":1,"episode_count":3},
          {"season_number":2,"episode_count":1}
        ]}
        """.trimIndent()
      }
      return HttpResponse(url, 200, emptyMap(), body.toByteArray())
    }
  }
}
