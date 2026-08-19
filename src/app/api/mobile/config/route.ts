import { isSupabaseConfigured } from "@/utils/supabase/config";
import { env } from "@/utils/env";

const MOBILE_HEADERS = {
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=86400",
};

const MOBILE_CONFIG = {
  schemaVersion: 1,
  features: {
    /**
     * Provider filtering stays explicitly disabled until a separately reviewed
     * policy can be validated against every playback provider. Keeping the
     * list empty makes a malformed or stale response fail closed in clients.
     */
    adProtection: {
      enabled: false,
      policyVersion: "disabled",
      blockedHosts: [] as string[],
    },
  },
};

/**
 * Client-safe runtime configuration for the bundled Android application.
 *
 * Supabase publishable keys are designed to ship in clients. User data remains
 * protected by Supabase Auth and the database's row-level security policies;
 * the service-role key is deliberately never returned here.
 */
export async function GET() {
  if (!isSupabaseConfigured) {
    return Response.json(
      { error: "Account services are temporarily unavailable." },
      { status: 503, headers: MOBILE_HEADERS },
    );
  }

  return Response.json(
    {
      supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL,
      supabasePublishableKey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      ...MOBILE_CONFIG,
    },
    { headers: MOBILE_HEADERS },
  );
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: MOBILE_HEADERS });
}
