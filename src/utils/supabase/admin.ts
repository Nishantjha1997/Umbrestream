import "server-only";

import { createClient } from "@supabase/supabase-js";
import { env } from "../env";
import type { Database } from "./types";
import { isSupabaseConfigured, SUPABASE_UNCONFIGURED_MESSAGE } from "./config";

/**
 * Cookie-free Supabase service client for trusted server-only operations.
 *
 * A request-scoped SSR client can inherit a user's Authorization header from
 * cookies, which makes PostgREST apply that user's RLS policies even when the
 * service-role key is supplied as the API key. Administrative writes must not
 * share the browser session transport.
 */
export function createAdminClient() {
  if (!isSupabaseConfigured || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(SUPABASE_UNCONFIGURED_MESSAGE);
  }

  return createClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    },
  );
}
