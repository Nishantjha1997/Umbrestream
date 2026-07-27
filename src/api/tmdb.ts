import "server-only";

import { env } from "@/utils/env";
import { isEmpty } from "@/utils/helpers";
import { TMDB } from "tmdb-ts";

const token = env.TMDB_ACCESS_TOKEN;

if (isEmpty(token)) {
  throw new Error("TMDB_ACCESS_TOKEN is not defined");
}

/**
 * Server-only TMDB client.
 *
 * The `server-only` import is the actual guard: if a Client Component ever
 * imports this module the build fails, instead of silently shipping the token
 * to every visitor. Client-side callers use `@/api/tmdb-browser`, which goes
 * through the /api/tmdb proxy.
 */
export const tmdb = new TMDB(token);
