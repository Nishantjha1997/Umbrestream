import type { SourceAdapter, SourceRequest, StreamCandidate } from "./types";

const adapters = new Map<string, SourceAdapter>();

export function register(adapter: SourceAdapter): void {
  if (adapters.has(adapter.id)) {
    throw new Error(`Source adapter "${adapter.id}" is already registered.`);
  }
  adapters.set(adapter.id, adapter);
}

export function isRegistered(id: string): boolean {
  return adapters.has(id);
}

export function listAdapters(): SourceAdapter[] {
  return [...adapters.values()].sort((a, b) => a.priority - b.priority);
}

export interface ResolvedGroup {
  adapterId: string;
  adapterLabel: string;
  candidates: StreamCandidate[];
  error?: string;
}

/**
 * Query every adapter that claims support, in parallel.
 *
 * One adapter failing must never take down the dropdown — a dead backend
 * should cost you that entry and nothing else, which is the whole reason the
 * player reads from a list rather than a single URL.
 */
export async function resolveAll(
  req: SourceRequest,
  signal?: AbortSignal,
): Promise<ResolvedGroup[]> {
  const eligible = listAdapters().filter((a) => a.supports(req));

  const groups = await Promise.all(
    eligible.map(async (adapter): Promise<ResolvedGroup> => {
      try {
        const candidates = await adapter.resolve(req, signal);
        return {
          adapterId: adapter.id,
          adapterLabel: adapter.label,
          candidates: [...candidates].sort((a, b) => (b.quality ?? 0) - (a.quality ?? 0)),
        };
      } catch (err) {
        return {
          adapterId: adapter.id,
          adapterLabel: adapter.label,
          candidates: [],
          error: err instanceof Error ? err.message : "Unknown error",
        };
      }
    }),
  );

  return groups.filter((g) => g.candidates.length > 0 || g.error);
}

/** Flattened, ordered list the player walks top-down on playback error. */
export function fallbackChain(groups: ResolvedGroup[]): StreamCandidate[] {
  return groups.flatMap((g) => g.candidates);
}
