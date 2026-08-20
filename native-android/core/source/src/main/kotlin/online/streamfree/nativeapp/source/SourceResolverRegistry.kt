package online.streamfree.nativeapp.source

import online.streamfree.nativeapp.model.MediaType
import online.streamfree.nativeapp.network.AppOwnedHeaders

interface SourceResolver {
  val descriptor: ProviderDescriptor

  suspend fun resolve(request: PlaybackRequest): ResolutionResult
}

class SourceResolverRegistry(resolvers: List<SourceResolver>) {
  private val resolversById: Map<String, SourceResolver> = resolvers
    .also { list ->
      require(list.map { it.descriptor.id }.distinct().size == list.size) {
        "Source resolver IDs must be unique"
      }
    }
    .associateBy { it.descriptor.id }

  fun descriptor(id: String): ProviderDescriptor? = resolversById[id]?.descriptor

  fun compatible(request: PlaybackRequest): List<SourceResolver> = resolversById.values
    .filter { resolver ->
      resolver.descriptor.supports(request) &&
        (request.explicitSourceId == null || request.explicitSourceId == resolver.descriptor.id)
    }

  fun isCompatible(source: ResolvedSource, request: PlaybackRequest): Boolean {
    val descriptor = descriptor(source.providerId) ?: return false
    if (!descriptor.supports(request)) return false
    if (source.kind != descriptor.kind) return false
    if (source.format !in descriptor.capabilities.formats) return false
    if (request.audioVariant != null && source.audioVariant != request.audioVariant) return false
    if (request.explicitSourceId != null && request.explicitSourceId != source.providerId) return false
    return true
  }

  fun idsFor(mediaType: MediaType): List<String> = resolversById.values
    .filter { mediaType in it.descriptor.supportedMediaTypes }
    .map { it.descriptor.id }
    .sorted()
}

data class ProviderHeaderPolicy(
  val id: String,
  val providerId: String,
  val headers: Map<String, String>,
) {
  init {
    require(id.isNotBlank()) { "Header policy ID cannot be blank" }
    require(providerId.isNotBlank()) { "Header policy provider ID cannot be blank" }
  }
}

class ProviderHeaderRegistry(policies: List<ProviderHeaderPolicy>) {
  private val policiesById = policies
    .also { list ->
      require(list.map { it.id }.distinct().size == list.size) {
        "Header policy IDs must be unique"
      }
    }
    .associateBy { it.id }

  fun headersFor(policyId: String): Map<String, String> {
    val policy = policiesById[policyId] ?: return emptyMap()
    // Reuse the transport boundary so source adapters cannot add cookies or tokens.
    return AppOwnedHeaders.validate(policy.headers)
  }
}
