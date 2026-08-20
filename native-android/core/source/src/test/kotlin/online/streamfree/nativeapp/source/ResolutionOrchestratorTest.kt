package online.streamfree.nativeapp.source

import kotlinx.coroutines.delay
import kotlinx.coroutines.runBlocking
import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class ResolutionOrchestratorTest {
  @Test
  fun `fast native result wins before cloud hedge`() = runBlocking {
    val fast = fakeResolver("fast", SourceKind.NativeDirect, 20, source("fast"))
    val slow = fakeResolver("slow", SourceKind.NativeDirect, 1_000, source("slow"))
    val cloud = fakeResolver("cloud", SourceKind.CloudApi, 1_000, source("cloud"))
    val startedAt = System.nanoTime()

    val result = ResolutionOrchestrator(
      SourceResolverRegistry(listOf(fast, slow, cloud)),
      policy = ResolutionPolicy(nativeHedgeDelayMs = 80, cloudHedgeDelayMs = 160, nativeBudgetMs = 500, cloudBudgetMs = 500),
    ).resolve(PlaybackRequest(MediaType.Movie, "movie-1"))

    val elapsed = (System.nanoTime() - startedAt) / 1_000_000L
    assertEquals(listOf("fast"), result.sources.map { it.providerId })
    assertTrue(elapsed < 500)
  }

  @Test
  fun `explicit source failure does not silently fall back`() = runBlocking {
    val explicit = fakeResolver("selected", SourceKind.NativeDirect, 20, null)
    val backup = fakeResolver("backup", SourceKind.NativeDirect, 20, source("backup"))

    val result = ResolutionOrchestrator(SourceResolverRegistry(listOf(explicit, backup))).resolve(
      PlaybackRequest(MediaType.Movie, "movie-1", explicitSourceId = "selected"),
      ResolutionPreferences(allowEmbedFallback = true),
    )

    assertTrue(result.sources.isEmpty())
    assertEquals(listOf("selected"), result.attempts.map { it.providerId }.distinct())
  }

  @Test
  fun `remembered anime dub source stays in the requested audio variant`() = runBlocking {
    val sub = fakeResolver("sub", SourceKind.NativeDirect, 10, source("sub", AudioVariant.Sub))
    val dub = fakeResolver("dub", SourceKind.NativeDirect, 10, source("dub", AudioVariant.Dub))

    val result = ResolutionOrchestrator(SourceResolverRegistry(listOf(sub, dub))).resolve(
      PlaybackRequest(MediaType.Anime, "anime-1", audioVariant = AudioVariant.Dub),
      ResolutionPreferences(rememberedSourceId = "dub"),
    )

    assertEquals(listOf("dub"), result.sources.map { it.providerId })
    assertEquals(AudioVariant.Dub, result.sources.single().audioVariant)
  }

  private fun fakeResolver(
    id: String,
    kind: SourceKind,
    delayMs: Long,
    resultSource: ResolvedSource?,
  ): SourceResolver {
    val descriptor = ProviderDescriptor(
      id = id,
      label = id,
      kind = kind,
      supportedMediaTypes = setOf(MediaType.Movie, MediaType.Anime),
      hosts = setOf("streamfree.online"),
      capabilities = SourceCapabilities(
        formats = setOf(StreamFormat.Hls),
        audioVariants = setOf(AudioVariant.Sub, AudioVariant.Dub),
      ),
    )
    return object : SourceResolver {
      override val descriptor = descriptor

      override suspend fun resolve(request: PlaybackRequest): ResolutionResult {
        delay(delayMs)
        return ResolutionResult(resultSource?.let(::listOf).orEmpty(), emptyList())
      }
    }
  }

  private fun source(providerId: String, audioVariant: AudioVariant? = null) = ResolvedSource(
    providerId = providerId,
    label = providerId,
    playbackUrl = "https://streamfree.online/$providerId.m3u8",
    kind = SourceKind.NativeDirect,
    format = StreamFormat.Hls,
    audioVariant = audioVariant,
  )
}
