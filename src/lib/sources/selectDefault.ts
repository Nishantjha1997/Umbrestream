import type { PlayerSource } from "./types";

interface DefaultSourceOptions {
  requestedId?: string | null;
  defaultId?: string | null;
  preferredSubtitle?: string;
  preferredAudio?: string;
}

/**
 * Selects a playable default without overriding an explicit server choice.
 * Caption preference only changes automatic selection; users can still pin any
 * provider and hard failures continue through the normal fallback pass.
 */
export function selectDefaultSource(
  sources: PlayerSource[],
  { requestedId, defaultId, preferredSubtitle, preferredAudio }: DefaultSourceOptions,
): PlayerSource | null {
  const usable = sources.filter((source) => source.availability !== "failed");

  if (requestedId) {
    const requested = usable.find((source) => source.id === requestedId);
    if (requested) return requested;
  }

  const verified = usable.filter(
    (source) => source.availability === "available" || source.availability === "slow",
  );
  const automaticPool = verified.length ? verified : usable;

  const captionPool = preferredSubtitle
    ? automaticPool.filter((source) => source.capabilities.subtitles === "native")
    : automaticPool;
  const audioPool = preferredAudio
    ? captionPool.filter((source) => source.audioVariant === preferredAudio)
    : captionPool;
  const preferredPool = audioPool.length
    ? audioPool
    : captionPool.length
      ? captionPool
      : automaticPool;

  const configuredDefault = preferredPool.find((source) => source.id === defaultId);
  if (configuredDefault) return configuredDefault;

  return preferredPool[0] ?? null;
}
