import { NextRequest, NextResponse } from "next/server";

const TMDB_BASE = "https://api.themoviedb.org/3";

/**
 * Allowlist by shape. Without this the route is an open relay: anyone could
 * drive arbitrary TMDB endpoints through our key, and a path like
 * `../../..` would let them reach further still.
 */
const ALLOWED: RegExp[] = [
  /^trending\/(all|movie|tv)\/(day|week)$/,
  /^discover\/(movie|tv)$/,
  /^(movie|tv)\/\d+$/,
  /^(movie|tv)\/\d+\/(recommendations|similar|credits|videos|images|keywords|external_ids)$/,
  /^tv\/\d+\/season\/\d+$/,
  /^search\/(multi|movie|tv)$/,
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

// Per-instance only. On serverless this resets per cold start — back it with
// Redis before this is exposed to anyone but you.
const hits = new Map<string, { count: number; resetAt: number }>();
const LIMIT = 60;
const WINDOW_MS = 60_000;

function underLimit(key: string): boolean {
  const now = Date.now();
  const entry = hits.get(key);
  if (!entry || now > entry.resetAt) {
    hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= LIMIT) return false;
  entry.count += 1;
  return true;
}

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  const { path } = await ctx.params;
  const endpoint = path.join("/");

  if (!ALLOWED.some((re) => re.test(endpoint))) {
    return NextResponse.json({ error: "Endpoint not allowed" }, { status: 403 });
  }

  const token = process.env.TMDB_READ_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "Server not configured" }, { status: 503 });
  }

  const caller = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (!underLimit(caller)) {
    return NextResponse.json(
      { error: "Rate limit exceeded" },
      { status: 429, headers: { "Retry-After": "60" } },
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
