import "server-only";

const TMDB_BASE = "https://api.themoviedb.org/3";

export class TmdbNotConfiguredError extends Error {
  constructor() {
    super("TMDB_READ_TOKEN is not set. Copy .env.example to .env.local.");
    this.name = "TmdbNotConfiguredError";
  }
}

export function isTmdbConfigured(): boolean {
  return Boolean(process.env.TMDB_READ_TOKEN);
}

/**
 * Server-only TMDB fetch. The `server-only` import above makes the build fail
 * if this module is ever pulled into a Client Component, which is the real
 * guard against the token leaking — not discipline.
 */
export async function tmdb<T = unknown>(
  endpoint: string,
  params: Record<string, string | number | undefined> = {},
  revalidateSeconds = 3600,
): Promise<T> {
  const token = process.env.TMDB_READ_TOKEN;
  if (!token) throw new TmdbNotConfiguredError();

  const url = new URL(`${TMDB_BASE}/${endpoint.replace(/^\//, "")}`);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  if (!url.searchParams.has("language")) {
    url.searchParams.set("language", "en-US");
  }

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    next: { revalidate: revalidateSeconds },
  });

  if (!res.ok) {
    throw new Error(`TMDB ${endpoint} failed: ${res.status} ${res.statusText}`);
  }
  return res.json() as Promise<T>;
}

const IMG = "https://image.tmdb.org/t/p";

export function posterUrl(path?: string | null, size: "w342" | "w500" = "w500") {
  return path ? `${IMG}/${size}${path}` : undefined;
}

export function backdropUrl(path?: string | null, size: "w780" | "w1280" | "original" = "w1280") {
  return path ? `${IMG}/${size}${path}` : undefined;
}
