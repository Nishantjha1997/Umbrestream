package online.streamfree.nativeapp.source

import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType
import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class SourceContractsTest {
  private val animeSub = descriptor(
    id = "miruro-sub",
    audioVariants = setOf(AudioVariant.Sub),
  )
  private val animeDub = descriptor(
    id = "miruro-dub",
    audioVariants = setOf(AudioVariant.Dub),
  )

  @Test
  fun `registry keeps anime sub and dub candidates separate`() {
    val registry = SourceResolverRegistry(listOf(
      FakeResolver(animeSub),
      FakeResolver(animeDub),
    ))

    val subIds = registry.compatible(
      PlaybackRequest(MediaType.Anime, "anilist-1", audioVariant = AudioVariant.Sub),
    ).map { it.descriptor.id }
    val dubIds = registry.compatible(
      PlaybackRequest(MediaType.Anime, "anilist-1", audioVariant = AudioVariant.Dub),
    ).map { it.descriptor.id }

    assertEquals(listOf("miruro-sub"), subIds)
    assertEquals(listOf("miruro-dub"), dubIds)
  }

  @Test
  fun `explicit source selection narrows compatible candidates`() {
    val registry = SourceResolverRegistry(listOf(FakeResolver(animeSub), FakeResolver(animeDub)))
    val selected = registry.compatible(
      PlaybackRequest(
        mediaType = MediaType.Anime,
        titleId = "anilist-1",
        audioVariant = AudioVariant.Sub,
        explicitSourceId = "miruro-sub",
      ),
    )

    assertEquals(listOf("miruro-sub"), selected.map { it.descriptor.id })
  }

  @Test
  fun `header registry blocks token and cookie leakage`() {
    val registry = ProviderHeaderRegistry(listOf(
      ProviderHeaderPolicy(
        id = "miruro",
        providerId = "miruro-sub",
        headers = mapOf("Referer" to "https://miruro.tv/"),
      ),
    ))

    assertTrue(registry.headersFor("miruro").containsKey("Referer"))
    assertTrue(registry.headersFor("missing").isEmpty())
  }

  private fun descriptor(id: String, audioVariants: Set<AudioVariant>) = ProviderDescriptor(
    id = id,
    label = id,
    kind = SourceKind.NativeDirect,
    supportedMediaTypes = setOf(MediaType.Anime),
    hosts = setOf("miruro.tv"),
    headerPolicyId = "miruro",
    capabilities = SourceCapabilities(
      formats = setOf(StreamFormat.Hls),
      audioVariants = audioVariants,
      qualities = setOf(720, 1080),
      supportsResume = true,
      supportsSubtitles = true,
    ),
  )

  private class FakeResolver(override val descriptor: ProviderDescriptor) : SourceResolver {
    override suspend fun resolve(request: PlaybackRequest) = ResolutionResult(emptyList(), emptyList())
  }
}
