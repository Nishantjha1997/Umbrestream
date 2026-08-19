import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { env } from "../env";
import { Database } from "./types";
import { isSupabaseConfigured, SUPABASE_UNCONFIGURED_MESSAGE } from "./config";

/**
 * Server Supabase client.
 *
 * Throws a readable error when unconfigured instead of Supabase's generic one.
 * Callers here are server actions and route handlers that already wrap their
 * work in try/catch and return `{ success: false }`, so this degrades per
 * feature rather than taking down a page — unlike the browser client, which is
 * mounted in the root layout and therefore returns `null` instead.
 */
export async function createClient(admin?: boolean, accessToken?: string) {
  if (!isSupabaseConfigured) {
    throw new Error(SUPABASE_UNCONFIGURED_MESSAGE);
  }

  const cookieStore = await cookies();

  const key = admin ? env.SUPABASE_SERVICE_ROLE_KEY : env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  // Create a server's supabase client with newly configured cookie,
  // which could be used to maintain user's session
  return createServerClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, key, {
    ...(accessToken
      ? { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
      : {}),
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch (error) {
          // The `setAll` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
          console.error("Failed to set cookies:", error);
        }
      },
    },
  });
}
