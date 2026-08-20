package online.streamfree.nativeapp.source

import online.streamfree.nativeapp.model.AudioVariant
import online.streamfree.nativeapp.model.MediaType

enum class SourceKind {
  NativeDirect,
  CloudApi,
  Iframe,
}

enum class StreamFormat {
  Hls,
  Dash,
  Mp4,
  Embed,
}

data class SourceCapabilities(
  val formats: Set<StreamFormat>,
  val audioVariants: Set<AudioVariant> = emptySet(),
  val qualities: Set<Int> = emptySet(),
  val supportsResume: Boolean = false,
  val supportsSubtitles: Boolean = false,
) {
  init {
    require(formats.isNotEmpty()) { "A source must advertise at least one format" }
    require(qualities.all { it > 0 }) { "Source qualities must be positive" }
  }
}

data class ProviderDescriptor(
  val id: String,
  val label: String,
  val kind: SourceKind,
  val supportedMediaTypes: Set<MediaType>,
  val hosts: Set<String>,
  val headerPolicyId: String? = null,
  val capabilities: SourceCapabilities,
) {
  init {
    require(ID_PATTERN.matches(id)) { "Provider IDs must be stable lowercase identifiers" }
    require(label.isNotBlank()) { "Provider labels must be visible and non-empty" }
    require(supportedMediaTypes.isNotEmpty()) { "A provider must support a media type" }
    require(hosts.all { it.isNotBlank() }) { "Provider hosts cannot be blank" }
  }

  fun supports(request: PlaybackRequest): Boolean {
    if (request.mediaType !in supportedMediaTypes) return false
    if (request.audioVariant != null && request.audioVariant !in capabilities.audioVariants) return false
    return true
  }

  private companion object {
    val ID_PATTERN = Regex("[a-z0-9]+(?:-[a-z0-9]+)*")
  }
}

data class PlaybackRequest(
  val mediaType: MediaType,
  val titleId: String,
  val season: Int? = null,
  val episode: Int? = null,
  val audioVariant: AudioVariant? = null,
  val explicitSourceId: String? = null,
  val resumePositionMs: Long = 0L,
) {
  init {
    require(titleId.isNotBlank()) { "Playback title ID cannot be blank" }
    require(season == null || season >= 0) { "Season cannot be negative" }
    require(episode == null || episode > 0) { "Episode must be positive" }
    require(resumePositionMs >= 0L) { "Resume position cannot be negative" }
  }
}

data class SubtitleTrack(
  val id: String,
  val languageTag: String,
  val url: String,
  val format: String,
  val isDefault: Boolean = false,
)

data class ResolvedSource(
  val providerId: String,
  val label: String,
  val playbackUrl: String,
  val kind: SourceKind,
  val format: StreamFormat,
  val audioVariant: AudioVariant? = null,
  val quality: Int? = null,
  val headerPolicyId: String? = null,
  val subtitles: List<SubtitleTrack> = emptyList(),
) {
  init {
    require(providerId.isNotBlank()) { "Resolved source provider ID cannot be blank" }
    require(label.isNotBlank()) { "Resolved source label cannot be blank" }
    require(playbackUrl.startsWith("https://")) { "Resolved source URLs must use HTTPS" }
    require(quality == null || quality > 0) { "Resolved source quality must be positive" }
  }
}

enum class ResolutionOutcome {
  Success,
  NoCompatibleSource,
  Timeout,
  Rejected,
  Failed,
}

data class ResolutionAttempt(
  val providerId: String,
  val outcome: ResolutionOutcome,
  val durationMs: Long,
  val failureCategory: String? = null,
)

data class ResolutionResult(
  val sources: List<ResolvedSource>,
  val attempts: List<ResolutionAttempt>,
)
