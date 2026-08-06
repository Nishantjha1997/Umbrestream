import { NextRequest, NextResponse } from "next/server";
import { callerKey, rateLimit } from "@/lib/rate-limit";

const TMDB_BASE = "https://api.themoviedb.org/3";

/**
 * Allowlist by shape. Without this the route is an open relay: anyone could
 * drive arbitrary TMDB endpoints through our token, and traversal segments
 * would let them reach further still.
 */
const ALLOWED: RegExp[] = [
  /^trending\/(all|movie|tv)\/(day|week)$/,
  /^discover\/(movie|tv)$/,
  /^movie\/(popular|top_rated|now_playing|upcoming)$/,
  /^tv\/(popular|top_rated|airing_today|on_the_air)$/,
  /^(movie|tv)\/\d+$/,
  /^(movie|tv)\/\d+\/(recommendations|similar|credits|videos|images|keywords|external_ids)$/,
  /^tv\/\d+\/season\/\d+$/,
  /^search\/(multi|movie|tv|person)$/,
  /^genre\/(movie|tv)\/list$/,
];

/** Params a caller may forward. Everything else is dropped, not passed through. */
const SAFE_PARAMS = new Set([
  "page",
  "query",
  "language",
  "region",
  "include_adult",
  "sort_by",
  "with_genres",
  "without_genres",
  "with_keywords",
  "primary_release_year",
  "first_air_date_year",
  "vote_count.gte",
  "vote_average.gte",
  "with_original_language",
  "append_to_response",
]);

// Per-instance only. Resets on cold start; back it with Redis before this is
// reachable by anyone but you. See src/lib/rate-limit.ts.
const LIMIT = 60;
const WINDOW_MS = 60_000;

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  // Next 16: params is a Promise. Synchronous access was removed.
  const { path } = await ctx.params;
  const endpoint = path.join("/");

  if (!ALLOWED.some((re) => re.test(endpoint))) {
    return NextResponse.json({ error: "Endpoint not allowed" }, { status: 403 });
  }

  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  // `x-forwarded-for`'s *first* entry is whatever the client typed, so keying on
  // it meant an attacker rotated the header for unlimited quota while every
  // legitimate request that arrived without the header shared one "local" bucket
  // and locked itself out. callerKey() prefers edge-set headers and otherwise
  // takes the nearest (last) hop.
  const limit = rateLimit("tmdb-proxy", callerKey(req), LIMIT, WINDOW_MS);
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
    );
  }

  const url = new URL(`${TMDB_BASE}/${endpoint}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    if (SAFE_PARAMS.has(key)) url.searchParams.set(key, value);
  });
  if (!url.searchParams.has("language")) url.searchParams.set("language", "en-US");

  const upstream = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: endpoint.startsWith("trending") ? 3600 : 86400 },
  });

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "Upstream error" },
      { status: upstream.status === 404 ? 404 : 502 },
    );
  }

  return NextResponse.json(await upstream.json(), {
    headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" },
  });
}
