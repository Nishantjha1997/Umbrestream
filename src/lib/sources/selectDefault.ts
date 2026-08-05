import type { PlayerSource } from "./types";

interface DefaultSourceOptions {
  requestedId?: string | null;
  defaultId?: string | null;
  preferredSubtitle?: string;
}

/**
 * Selects a playable default without overriding an explicit server choice.
 * Caption preference only changes automatic selection; users can still pin any
 * provider and hard failures continue through the normal fallback pass.
 */
export function selectDefaultSource(
  sources: PlayerSource[],
  { requestedId, defaultId, preferredSubtitle }: DefaultSourceOptions,
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

  if (preferredSubtitle) {
    const captionCapable = automaticPool.find(
      (source) => source.capabilities.subtitles === "native",
    );
    if (captionCapable) return captionCapable;
  }

  return automaticPool.find((source) => source.id === defaultId) ?? automaticPool[0] ?? null;
}
