import "server-only";

import { env } from "@/utils/env";
import { TMDB } from "tmdb-ts";

let instance: TMDB | null = null;

function getClient(): TMDB {
  if (!instance) {
    const token = env.TMDB_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "TMDB_ACCESS_TOKEN is not set. Add it to your environment " +
          "(Vercel: Project Settings -> Environment Variables; local: .env.local). " +
          "It must NOT have a NEXT_PUBLIC_ prefix.",
      );
    }
    instance = new TMDB(token);
  }
  return instance;
}

/**
 * Server-only TMDB client, lazily initialized.
 *
 * The laziness is load-bearing, not stylistic. Next imports every route module
 * during the "Collecting page data" build phase, so a module-level throw here
 * fails the entire build — even for routes that never call TMDB. (That's
 * exactly how a missing token broke the first Vercel deploy, via
 * /api/player/save-history -> actions/histories -> this module.)
 *
 * Deferring construction to first property access keeps the build green and
 * surfaces a clear, actionable error at request time instead.
 *
 * The `server-only` import above is the real secret guard: a Client Component
 * importing this module fails the build rather than silently shipping the
 * token. Client-side callers use `@/api/tmdb-browser`, which proxies through
 * /api/tmdb.
 */
export const tmdb = new Proxy({} as TMDB, {
  get(_target, prop) {
    const client = getClient();
    return client[prop as keyof TMDB];
  },
});
