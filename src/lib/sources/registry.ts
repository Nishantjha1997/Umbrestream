import type { SourceAdapter, SourceRequest, StreamCandidate } from "./types";

const adapters = new Map<string, SourceAdapter>();

const priorityFor = (adapter: SourceAdapter, req?: SourceRequest): number => {
  if (typeof adapter.priority === "number") return adapter.priority;
  return req ? adapter.priority(req) : Number.MAX_SAFE_INTEGER;
};

export function register(adapter: SourceAdapter): void {
  if (adapters.has(adapter.id)) {
    throw new Error(`Source adapter "${adapter.id}" is already registered.`);
  }
  adapters.set(adapter.id, adapter);
}

export function isRegistered(id: string): boolean {
  return adapters.has(id);
}

export function listAdapters(req?: SourceRequest): SourceAdapter[] {
  return [...adapters.values()].sort((a, b) => priorityFor(a, req) - priorityFor(b, req));
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
  timeoutMs = 2500,
): Promise<ResolvedGroup[]> {
  const eligible = listAdapters(req).filter((a) => a.supports(req));

  const groups = await Promise.all(
    eligible.map(async (adapter): Promise<ResolvedGroup> => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);
      const abort = () => controller.abort();
      signal?.addEventListener("abort", abort, { once: true });

      try {
        const candidates = await adapter.resolve(req, controller.signal);
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
      } finally {
        clearTimeout(timeout);
        signal?.removeEventListener("abort", abort);
      }
    }),
  );

  return groups.filter((g) => g.candidates.length > 0 || g.error);
}

/** Flattened, ordered list the player walks top-down on playback error. */
export function fallbackChain(groups: ResolvedGroup[]): StreamCandidate[] {
  return groups.flatMap((g) => g.candidates).sort((a, b) => a.priority - b.priority);
}
