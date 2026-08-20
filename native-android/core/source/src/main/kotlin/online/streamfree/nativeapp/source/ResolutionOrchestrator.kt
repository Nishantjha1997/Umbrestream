package online.streamfree.nativeapp.source

import kotlinx.coroutines.CancellationException
import kotlinx.coroutines.Job
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.joinAll
import kotlinx.coroutines.launch
import kotlinx.coroutines.withTimeout
import kotlinx.coroutines.withTimeoutOrNull
import kotlinx.coroutines.channels.Channel
data class ResolutionPreferences(
  val rememberedSourceId: String? = null,
  val allowEmbedFallback: Boolean = false,
)

interface SourceCandidateCache {
  suspend fun get(request: PlaybackRequest): ResolvedSource?
}

object EmptySourceCandidateCache : SourceCandidateCache {
  override suspend fun get(request: PlaybackRequest): ResolvedSource? = null
}

data class ResolutionPolicy(
  val nativeHedgeDelayMs: Long = 350L,
  val cloudHedgeDelayMs: Long = 800L,
  val nativeBudgetMs: Long = 4_000L,
  val cloudBudgetMs: Long = 6_000L,
  val maxDirectResolvers: Int = 2,
) {
  init {
    require(nativeHedgeDelayMs >= 0L)
    require(cloudHedgeDelayMs >= nativeHedgeDelayMs)
    require(nativeBudgetMs > 0L)
    require(cloudBudgetMs > 0L)
    require(maxDirectResolvers in 1..2)
  }
}

class ResolutionOrchestrator(
  private val registry: SourceResolverRegistry,
  private val cache: SourceCandidateCache = EmptySourceCandidateCache,
  private val policy: ResolutionPolicy = ResolutionPolicy(),
) {
  suspend fun resolve(
    request: PlaybackRequest,
    preferences: ResolutionPreferences = ResolutionPreferences(),
  ): ResolutionResult {
    val cached = cache.get(request)
    if (cached != null && registry.isCompatible(cached, request)) {
      return ResolutionResult(
        sources = listOf(cached),
        attempts = listOf(ResolutionAttempt("cache", ResolutionOutcome.Success, 0L)),
      )
    }

    val manualSourceId = request.explicitSourceId ?: preferences.rememberedSourceId
    if (manualSourceId != null) {
      val manualRequest = request.copy(explicitSourceId = manualSourceId)
      val resolver = registry.compatible(manualRequest).firstOrNull()
        ?: return ResolutionResult(
          sources = emptyList(),
          attempts = listOf(
            ResolutionAttempt(manualSourceId, ResolutionOutcome.NoCompatibleSource, 0L, "manual_source_unavailable"),
          ),
        )
      return resolveOne(resolver, manualRequest, budgetFor(resolver.descriptor.kind))
    }

    val direct = resolveDirect(request)
    if (direct.sources.isNotEmpty() || !preferences.allowEmbedFallback) return direct

    val embedResolvers = registry.compatible(request)
      .filter { it.descriptor.kind == SourceKind.Iframe }
    for (resolver in embedResolvers) {
      val result = resolveOne(resolver, request, policy.cloudBudgetMs)
      if (result.sources.isNotEmpty()) {
        return ResolutionResult(
          sources = result.sources,
          attempts = direct.attempts + result.attempts,
        )
      }
    }
    return direct
  }

  private suspend fun resolveDirect(request: PlaybackRequest): ResolutionResult = coroutineScope {
    val nativeResolvers = registry.compatible(request)
      .filter { it.descriptor.kind == SourceKind.NativeDirect }
      .take(policy.maxDirectResolvers)
    val cloudResolver = registry.compatible(request)
      .firstOrNull { it.descriptor.kind == SourceKind.CloudApi }

    if (nativeResolvers.isEmpty() && cloudResolver == null) {
      return@coroutineScope ResolutionResult(
        sources = emptyList(),
        attempts = listOf(ResolutionAttempt("registry", ResolutionOutcome.NoCompatibleSource, 0L)),
      )
    }

    val completions = Channel<Completion>(Channel.UNLIMITED)
    val jobs = mutableListOf<Job>()
    var launched = 0
    var completed = 0
    val allAttempts = mutableListOf<ResolutionAttempt>()

    fun launchResolver(resolver: SourceResolver, budgetMs: Long) {
      launched += 1
      jobs += launch {
        completions.send(resolveOne(resolver, request, budgetMs).toCompletion())
      }
    }

    val startedAt = System.nanoTime()
    nativeResolvers.firstOrNull()?.let { launchResolver(it, policy.nativeBudgetMs) }

    suspend fun receiveUntil(deadlineMs: Long): ResolutionResult? {
      while (true) {
        val elapsedMs = (System.nanoTime() - startedAt) / 1_000_000L
        val remainingMs = deadlineMs - elapsedMs
        if (remainingMs <= 0L) return null
        val completion = withTimeoutOrNull(remainingMs) { completions.receive() } ?: return null
        completed += 1
        allAttempts += completion.result.attempts
        if (completion.result.sources.isNotEmpty()) return completion.result
      }
    }

    receiveUntil(policy.nativeHedgeDelayMs)?.let { result ->
      jobs.cancelAndJoin()
      return@coroutineScope withAttempts(result, allAttempts)
    }

    if (nativeResolvers.size > 1) {
      launchResolver(nativeResolvers[1], policy.nativeBudgetMs)
    }

    receiveUntil(policy.cloudHedgeDelayMs)?.let { result ->
      jobs.cancelAndJoin()
      return@coroutineScope withAttempts(result, allAttempts)
    }

    cloudResolver?.let { launchResolver(it, policy.cloudBudgetMs) }

    // The cloud tier starts after the hedge delay, so preserve its full budget.
    val overallDeadline = policy.cloudHedgeDelayMs + policy.cloudBudgetMs
    while (completed < launched) {
      val elapsedMs = (System.nanoTime() - startedAt) / 1_000_000L
      val remainingMs = overallDeadline - elapsedMs
      if (remainingMs <= 0L) break
      val completion = withTimeoutOrNull(remainingMs) { completions.receive() } ?: break
      completed += 1
      allAttempts += completion.result.attempts
      if (completion.result.sources.isNotEmpty()) {
        jobs.cancelAndJoin()
        return@coroutineScope withAttempts(completion.result, allAttempts)
      }
    }

    jobs.cancelAndJoin()
    return@coroutineScope ResolutionResult(emptyList(), allAttempts)
  }

  private suspend fun resolveOne(
    resolver: SourceResolver,
    request: PlaybackRequest,
    budgetMs: Long,
  ): ResolutionResult {
    val startedAt = System.nanoTime()
    return try {
      val result = withTimeout(budgetMs) { resolver.resolve(request) }
      val compatibleSources = result.sources.filter { registry.isCompatible(it, request) }
      val attempt = ResolutionAttempt(
        providerId = resolver.descriptor.id,
        outcome = if (compatibleSources.isEmpty()) ResolutionOutcome.NoCompatibleSource else ResolutionOutcome.Success,
        durationMs = elapsedMs(startedAt),
        failureCategory = if (compatibleSources.isEmpty()) "no_compatible_source" else null,
      )
      ResolutionResult(dedupe(compatibleSources), result.attempts + attempt)
    } catch (error: kotlinx.coroutines.TimeoutCancellationException) {
      ResolutionResult(
        emptyList(),
        listOf(ResolutionAttempt(resolver.descriptor.id, ResolutionOutcome.Timeout, elapsedMs(startedAt), "timeout")),
      )
    } catch (error: CancellationException) {
      throw error
    } catch (error: Throwable) {
      ResolutionResult(
        emptyList(),
        listOf(
          ResolutionAttempt(
            resolver.descriptor.id,
            ResolutionOutcome.Failed,
            elapsedMs(startedAt),
            error::class.simpleName ?: "failure",
          ),
        ),
      )
    }
  }

  private fun budgetFor(kind: SourceKind): Long = when (kind) {
    SourceKind.CloudApi, SourceKind.Iframe -> policy.cloudBudgetMs
    SourceKind.NativeDirect -> policy.nativeBudgetMs
  }

  private fun dedupe(sources: List<ResolvedSource>): List<ResolvedSource> = sources.distinctBy {
    Triple(it.providerId, it.playbackUrl, it.audioVariant)
  }

  private fun elapsedMs(startedAt: Long): Long = (System.nanoTime() - startedAt) / 1_000_000L

  private fun withAttempts(result: ResolutionResult, attempts: List<ResolutionAttempt>) =
    ResolutionResult(result.sources, attempts)

  private data class Completion(val result: ResolutionResult)

  private fun ResolutionResult.toCompletion() = Completion(this)

  private suspend fun List<Job>.cancelAndJoin() {
    forEach { it.cancel() }
    joinAll()
  }
}
