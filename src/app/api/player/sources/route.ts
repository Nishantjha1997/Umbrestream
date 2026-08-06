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

export const runtime = "nodejs";

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

const ERROR_TITLE_PATTERN =
  /<title>[^<]*(?:404|410|account suspended|connection timed out|gateway time-out|error\s*-\s*megaplay)/i;
const VISIBLE_ERROR_PAGE_PATTERNS = [
  /error code:\s*(?:404|410|5\d{2})/i,
  /this account has been suspended/i,
  /we can(?:'|&apos;)t find the file you are looking for/i,
  /this page could not be found/i,
  /err_(?:name_not_resolved|connection_refused|timed_out)/i,
];

function visiblePageText(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

async function responsePreview(response: Response, maxBytes = 65_536): Promise<string> {
  if (!response.body) return "";
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0;
  let preview = "";

  try {
    while (bytes < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const remaining = Math.min(value.byteLength, maxBytes - bytes);
      preview += decoder.decode(value.subarray(0, remaining), { stream: true });
      bytes += remaining;
    }
    preview += decoder.decode();
  } finally {
    await reader.cancel().catch(() => undefined);
  }

  return preview;
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
    const preview = await responsePreview(response);
    const requestedUrl = new URL(url);
    const finalUrl = new URL(response.url);
    const redirectedToHomepage =
      requestedUrl.pathname !== "/" &&
      finalUrl.origin === requestedUrl.origin &&
      finalUrl.pathname === "/";
    const visibleText = visiblePageText(preview);
    const errorPage =
      ERROR_TITLE_PATTERN.test(preview) ||
      VISIBLE_ERROR_PAGE_PATTERNS.some((pattern) => pattern.test(visibleText));

    if (
      response.status === 404 ||
      response.status === 410 ||
      response.status >= 500 ||
      redirectedToHomepage ||
      errorPage
    ) {
      result = {
        availability: "failed",
        latencyMs,
        failureReason: redirectedToHomepage
          ? "Provider redirected away from this title"
          : errorPage
            ? "Provider returned an error page"
            : `Upstream returned ${response.status}`,
      };
    } else if ([401, 403, 405, 429].includes(response.status)) {
      result = { availability: "unverified", latencyMs };
    } else if (response.status >= 400) {
      result = {
        availability: "failed",
        latencyMs,
        failureReason: `Upstream returned ${response.status}`,
      };
    } else {
      result = { availability: latencyMs > 1200 ? "slow" : "available", latencyMs };
    }
  } catch (error) {
    cacheable = !requestSignal?.aborted;
    result = {
      availability: "failed",
      failureReason:
        error instanceof Error && error.name !== "AbortError" ? error.message : "Timed out",
    };
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
  const searchParams = new URL(request.url).searchParams;
  const sourceRequest = requestFrom(searchParams);
  if (!sourceRequest) {
    return Response.json({ message: "Invalid player source request." }, { status: 400 });
  }

  const legacyPreflight = searchParams.get("version") === "2";
  const groups = await resolveAll(sourceRequest, request.signal, legacyPreflight ? 4500 : 500);
  const candidates = fallbackChain(groups);
  const probes = legacyPreflight
    ? await Promise.all(candidates.map((candidate) => probe(candidate.url, request.signal)))
    : null;
  const sources: PlayerSource[] = candidates.map((candidate, index) =>
    probes
      ? { ...candidate, ...probes[index] }
      : { ...candidate, availability: "unverified", healthEvidence: "manifest" },
  );
  const selectedDefault = selectDefaultSource(sources, {
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
