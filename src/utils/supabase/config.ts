import { env } from "../env";

/**
 * Whether Supabase credentials are actually present.
 *
 * `createBrowserClient` / `createServerClient` throw outright on empty
 * strings ("Your project's URL and API key are required to create a Supabase
 * client!"), and `env.ts` defaults these to "" when unset. Anything that runs
 * unconditionally — middleware, or a hook mounted in the root layout — must
 * check this first, or a missing env var becomes a site-wide failure instead
 * of a disabled feature.
 *
 * Auth degrades to "nobody is signed in". It never takes the app down.
 */
export const isSupabaseConfigured: boolean = Boolean(
  env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
);

/** Message shown to developers when auth is unavailable. */
export const SUPABASE_UNCONFIGURED_MESSAGE =
  "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and " +
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (plus SUPABASE_SERVICE_ROLE_KEY " +
  "server-side). Note NEXT_PUBLIC_* values are inlined at build time, so a " +
  "rebuild is required after adding them — not just a redeploy.";
