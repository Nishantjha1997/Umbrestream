import { createBrowserClient } from "@supabase/ssr";
import { env } from "../env";
import { Database } from "./types";
import { isSupabaseConfigured } from "./config";

export type SupabaseBrowserClient = ReturnType<typeof createBrowserClient<Database>>;

let cached: SupabaseBrowserClient | null = null;

/**
 * Browser Supabase client, or `null` when credentials are absent.
 *
 * Returning `null` rather than throwing is deliberate: this is reached from
 * `useSupabaseUser`, which is mounted in the root layout via
 * `UserProfileButton`. A throw here crashes the entire page during hydration
 * ("This page couldn't load"), including routes that need no auth at all.
 * Callers must handle `null` by treating the user as signed out.
 *
 * Memoized because `createBrowserClient` was previously called on every
 * render, which also caused the auth listener in `useSupabaseUser` to
 * resubscribe on every render.
 */
export function createClient(): SupabaseBrowserClient | null {
  if (!isSupabaseConfigured) return null;
  cached ??= createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  );
  return cached;
}
