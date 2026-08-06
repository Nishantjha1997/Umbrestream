import "@/lib/sources/bootstrap";

import { fallbackChain, resolveAll } from "@/lib/sources/registry";
import { selectDefaultSource } from "@/lib/sources/selectDefault";
import type {
  PlayerSource,
  SourceAvailability,
  SourceRequest,
  SourceResolutionResponse,
} from "@/lib/sources/types";
import type { MediaType } from "@/types/title";
import { callerKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * One inbound request fans out to every adapter that matches the title, and in
 * preflight mode each candidate gets a real GET held open for up to 4.5s. That
 * makes the endpoint an amplifier — a few hundred concurrent callers exhaust the
 * instance's sockets and point our egress at the provider hosts — so the fan-out
 * is both rate limited per caller and capped per request.
 */
const SOURCES_LIMIT = 40;
const SOURCES_WINDOW_MS = 60_000;
const MAX_PROBES = 6;

interface ProbeResult {
  availability: SourceAvailability;
  latencyMs?: number;
  failureReason?: string;
}

interface CacheEntry extends ProbeResult {
  expiresAt: number;
}

const probeCache = new Map<string, CacheEntry>();
const MEDIA_TYPES = new Set<MediaType>(["movie", "tv", "anime"]);

const numberParam = (params: URLSearchParams, key: string): number | undefined => {
  const raw = params.get(key);
  if (!raw) return undefined;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 ? value : undefined;
};

function requestFrom(params: URLSearchParams): SourceRequest | null {
  const mediaType = params.get("mediaType") as MediaType | null;
  if (!mediaType || !MEDIA_TYPES.has(mediaType)) return null;

  const request: SourceRequest = {
    mediaType,
    title: params.get("title") ?? undefined,
    tmdbId: numberParam(params, "tmdbId"),
    imdbId: params.get("imdbId") ?? undefined,
    anilistId: numberParam(params, "anilistId"),
    malId: numberParam(params, "malId"),
    animeTmdbId: numberParam(params, "animeTmdbId"),
    season: numberParam(params, "season"),
    episode: numberParam(params, "episode"),
    startAt: numberParam(params, "startAt"),
    preferredAudio: params.get("preferredAudio") ?? undefined,
    preferredSubtitle: params.get("preferredSubtitle") ?? undefined,
  };

  if ((mediaType === "movie" || mediaType === "tv") && !request.tmdbId) return null;
  if (mediaType === "anime" && !request.anilistId) return null;
  if ((mediaType === "tv" || mediaType === "anime") && !request.episode) return null;
  if (mediaType === "tv" && !request.season) return null;
  return request;
}

async function probe(url: string, requestSignal?: AbortSignal): Promise<ProbeResult> {
  const cached = probeCache.get(url);
  if (cached && cached.expiresAt > Date.now()) return cached;

  const controller = new AbortController();
  const abort = () => controller.abort();
  requestSignal?.addEventListener("abort", abort, { once: true });
  const timeout = setTimeout(() => controller.abort(), 4500);
  const startedAt = performance.now();
  let result: ProbeResult;
  let cacheable = true;

  try {
    const response = await fetch(url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      headers: { Range: "bytes=0-65535", Accept: "text/html,application/xhtml+xml" },
      signal: controller.signal,
    });
    const latencyMs = Math.round(performance.now() - startedAt);
    await response.body?.cancel().catch(() => undefined);
    // HTTP bodies and redirect destinations are not playback evidence. Providers
    // often show a bot/error page to server-side probes while their browser iframe
    // still works, so this probe records latency without triggering fallback.
    result = { availability: latencyMs > 1200 ? "slow" : "available", latencyMs };
  } catch {
    cacheable = !requestSignal?.aborted;
    result = { availability: "unverified" };
  } finally {
    clearTimeout(timeout);
    requestSignal?.removeEventListener("abort", abort);
  }

  const ttl =
    result.availability === "available" || result.availability === "slow" ? 60_000 : 15_000;
  if (cacheable) probeCache.set(url, { ...result, expiresAt: Date.now() + ttl });
  return result;
}

export async function GET(request: Request): Promise<Response> {
  const startedAt = performance.now();

  const limit = rateLimit("player-sources", callerKey(request), SOURCES_LIMIT, SOURCES_WINDOW_MS);
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const searchParams = new URL(request.url).searchParams;
  const sourceRequest = requestFrom(searchParams);
  if (!sourceRequest) {
    return Response.json({ message: "Invalid player source request." }, { status: 400 });
  }

  const legacyPreflight = searchParams.get("version") === "2";
  const groups = await resolveAll(sourceRequest, request.signal, legacyPreflight ? 4500 : 500);
  const candidates = fallbackChain(groups);
  // Probe only the head of the fallback chain. The tail is what the user reaches
  // by switching servers manually, at which point it gets probed on demand —
  // paying for all of it up front is what makes the amplification interesting.
  const probes = legacyPreflight
    ? await Promise.all(
        candidates.slice(0, MAX_PROBES).map((candidate) => probe(candidate.url, request.signal)),
      )
    : null;
  const sources: PlayerSource[] = candidates.map((candidate, index) =>
    probes && index < probes.length
      ? { ...candidate, ...probes[index] }
      : { ...candidate, availability: "unverified", healthEvidence: "manifest" },
  );
  const selectedDefault = selectDefaultSource(sources, {
    defaultId:
      sourceRequest.mediaType === "movie" || sourceRequest.mediaType === "tv"
        ? sources[0]?.id
        : undefined,
    preferredSubtitle: sourceRequest.preferredSubtitle,
    preferredAudio: sourceRequest.mediaType === "anime" ? sourceRequest.preferredAudio : undefined,
  });
  const resolvedInMs = Math.round(performance.now() - startedAt);
  const response: SourceResolutionResponse = {
    sources,
    defaultId: selectedDefault?.id ?? null,
    errors: groups
      .filter((group) => group.error)
      .map((group) => ({ providerId: group.adapterId, message: group.error! })),
    resolvedInMs,
  };

  return Response.json(response, {
    headers: {
      "Cache-Control": "private, max-age=0, must-revalidate",
      "Server-Timing": `sources;dur=${resolvedInMs}`,
    },
  });
}
