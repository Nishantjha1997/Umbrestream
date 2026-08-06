import "@/lib/sources/bootstrap";

import { getAdapter } from "@/lib/sources/registry";
import type { SourceRequest } from "@/lib/sources/types";
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

const hardFailureFrom = (status: number, html: string): string | null => {
  if (status === 404 || status === 410) return `Provider returned HTTP ${status}`;
  if (status >= 500) return `Provider returned HTTP ${status}`;
  const sample = html.slice(0, 80_000);
  const failures: Array<[RegExp, string]> = [
    [/account\s+(?:has\s+been\s+)?suspended/i, "Provider account is suspended"],
    [/episode\s+(?:was\s+)?not\s+found/i, "Episode was not found"],
    [/we\s+couldn['’]?t\s+find\s+this\s+episode/i, "Episode was not found"],
    [/error\s*410/i, "Provider stream is no longer available"],
  ];
  return failures.find(([pattern]) => pattern.test(sample))?.[1] ?? null;
};

function cacheKey(providerId: string, request: SourceRequest): string {
  return [providerId, request.anilistId, request.episode, request.preferredAudio ?? ""].join(":");
}

export async function POST(input: Request) {
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
    const html = await response.text();
    const failure = hardFailureFrom(response.status, html);
    value = {
      providerId,
      status: failure ? "failed" : response.ok ? "unverified" : "failed",
      latencyMs: Math.round(performance.now() - startedAt),
      evidence: "registry-observation",
      failureReason:
        failure ?? (response.ok ? undefined : `Provider returned HTTP ${response.status}`),
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
