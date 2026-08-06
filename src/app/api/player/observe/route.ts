import "@/lib/sources/bootstrap";

import { getAdapter } from "@/lib/sources/registry";
import type { SourceRequest } from "@/lib/sources/types";
import { callerKey, rateLimit } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ObservationStatus = "available" | "unverified" | "failed";

interface Observation {
  providerId: string;
  status: ObservationStatus;
  latencyMs: number;
  evidence: "registry-observation";
  failureReason?: string;
}

interface CacheEntry {
  expiresAt: number;
  value: Observation;
}

const observations = new Map<string, CacheEntry>();
const FAILURE_TTL_MS = 15_000;
const SUCCESS_TTL_MS = 60_000;
const TIMEOUT_MS = 4_000;

const numberValue = (value: unknown): number | undefined => {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) return value;
  if (typeof value !== "string" || !value.trim()) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
};

function parseRequest(value: unknown): SourceRequest | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const body = value as Record<string, unknown>;
  if (body.mediaType !== "anime") return null;
  const anilistId = numberValue(body.anilistId);
  const episode = numberValue(body.episode);
  if (!anilistId || !episode) return null;
  return {
    mediaType: "anime",
    anilistId,
    malId: numberValue(body.malId),
    animeTmdbId: numberValue(body.animeTmdbId),
    episode,
    startAt: numberValue(body.startAt),
    preferredAudio: typeof body.preferredAudio === "string" ? body.preferredAudio : undefined,
    preferredSubtitle:
      typeof body.preferredSubtitle === "string" ? body.preferredSubtitle : undefined,
  };
}

function cacheKey(providerId: string, request: SourceRequest): string {
  return [providerId, request.anilistId, request.episode, request.preferredAudio ?? ""].join(":");
}

/** Each accepted request costs one outbound fetch, so the ceiling is per-caller. */
const OBSERVE_LIMIT = 30;
const OBSERVE_WINDOW_MS = 60_000;

export async function POST(input: Request) {
  // Unauthenticated endpoint that makes the server perform an outbound HTTP
  // request on demand. Without a brake it is a free traffic amplifier: cheap for
  // the caller, expensive for us, and the packets leave with our IP on them.
  const limit = rateLimit("player-observe", callerKey(input), OBSERVE_LIMIT, OBSERVE_WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  let body: unknown;
  try {
    body = await input.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ error: "Invalid observation request" }, { status: 400 });
  }
  const raw = body as Record<string, unknown>;
  const providerId = typeof raw.providerId === "string" ? raw.providerId : "";
  const request = parseRequest(raw.request);
  if (!providerId || !request) {
    return NextResponse.json(
      { error: "Anime provider ID and source request are required" },
      { status: 400 },
    );
  }

  const adapter = getAdapter(providerId);
  if (!adapter || !adapter.supportedMediaTypes.includes("anime") || !adapter.supports(request)) {
    return NextResponse.json({ error: "Unsupported Anime provider" }, { status: 404 });
  }

  const key = cacheKey(providerId, request);
  const cached = observations.get(key);
  if (cached && cached.expiresAt > Date.now()) return NextResponse.json(cached.value);

  const startedAt = performance.now();
  const resolved = await adapter.resolve(request).catch(() => []);
  const source = resolved[0];
  if (!source || source.id !== providerId || source.kind !== "iframe") {
    const value: Observation = {
      providerId,
      status: "failed",
      latencyMs: Math.round(performance.now() - startedAt),
      evidence: "registry-observation",
      failureReason: "Provider could not build this episode",
    };
    observations.set(key, { value, expiresAt: Date.now() + FAILURE_TTL_MS });
    return NextResponse.json(value);
  }

  let value: Observation;
  try {
    const response = await fetch(source.url, {
      method: "GET",
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: {
        Accept: "text/html,application/xhtml+xml",
        "User-Agent": "Umbra source observer/1.0",
      },
    });
    // Do not inspect provider HTML or redirect destinations. Error/advertiser
    // pages are not reliable playback evidence, and classifying them as hard
    // failures could switch away from a stream that still works in a browser.
    // This observation is latency evidence only.
    await response.body?.cancel().catch(() => undefined);
    value = {
      providerId,
      status: "unverified",
      latencyMs: Math.round(performance.now() - startedAt),
      evidence: "registry-observation",
    };
  } catch {
    // A timeout or bot challenge cannot prove that an iframe will fail in the
    // browser, so it remains unverified rather than triggering a false switch.
    value = {
      providerId,
      status: "unverified",
      latencyMs: Math.round(performance.now() - startedAt),
      evidence: "registry-observation",
    };
  }

  observations.set(key, {
    value,
    expiresAt: Date.now() + (value.status === "failed" ? FAILURE_TTL_MS : SUCCESS_TTL_MS),
  });
  return NextResponse.json(value);
}
