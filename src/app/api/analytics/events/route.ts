import { createClient } from "@/utils/supabase/server";
import { env } from "@/utils/env";
import {
  ANALYTICS_EVENT_NAMES,
  type AnalyticsEventName,
  type AnalyticsProperties,
} from "@/lib/analytics/events";
import { isSupabaseConfigured } from "@/utils/supabase/config";
import { callerKey, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { z } from "zod";

export const runtime = "nodejs";

const ANALYTICS_LIMIT = 120;
const ANALYTICS_WINDOW_MS = 60_000;
const MAX_PAYLOAD_BYTES = 8_192;

const eventSchema = z.object({
  eventName: z.enum(ANALYTICS_EVENT_NAMES),
  sessionId: z.string().min(1).max(80),
  route: z.string().startsWith("/").max(200),
  properties: z
    .record(z.string(), z.union([z.string().max(200), z.number().finite(), z.boolean()]))
    .default({}),
});

function sanitizeProperties(properties: AnalyticsProperties): AnalyticsProperties {
  return Object.fromEntries(Object.entries(properties).slice(0, 24));
}

export async function POST(request: Request): Promise<Response> {
  const startedAt = Date.now();

  const limit = rateLimit(
    "first-party-analytics",
    callerKey(request),
    ANALYTICS_LIMIT,
    ANALYTICS_WINDOW_MS,
  );
  if (!limit.allowed) return tooManyRequests(limit.retryAfter);

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(declaredLength) && declaredLength > MAX_PAYLOAD_BYTES) {
    return Response.json({ message: "Analytics payload is too large." }, { status: 413 });
  }

  if (!isSupabaseConfigured || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(null, { status: 204 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Invalid analytics payload." }, { status: 400 });
  }

  const parsed = eventSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ message: "Invalid analytics payload." }, { status: 400 });

  try {
    const sessionClient = await createClient();
    const {
      data: { user },
    } = await sessionClient.auth.getUser();
    const supabase = await createClient(true);
    const properties = sanitizeProperties(parsed.data.properties);

    const { error } = await supabase.from("umbra_events").insert({
      event_name: parsed.data.eventName as AnalyticsEventName,
      session_id: parsed.data.sessionId,
      user_id: user?.id ?? null,
      route: parsed.data.route,
      media_type: typeof properties.mediaType === "string" ? properties.mediaType : null,
      provider_id: typeof properties.provider === "string" ? properties.provider : null,
      title_id:
        typeof properties.titleId === "number" && Number.isInteger(properties.titleId)
          ? properties.titleId
          : null,
      duration_ms:
        typeof properties.startupMs === "number" && Number.isFinite(properties.startupMs)
          ? Math.round(properties.startupMs)
          : null,
      properties,
    });

    if (error) {
      console.error(
        JSON.stringify({
          level: "error",
          message: "Analytics event insert failed",
          route: "/api/analytics/events",
          error: error.message,
          duration_ms: Date.now() - startedAt,
        }),
      );
      return new Response(null, { status: 204 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Analytics event route failed",
        route: "/api/analytics/events",
        error: error instanceof Error ? error.message : String(error),
        duration_ms: Date.now() - startedAt,
      }),
    );
    return new Response(null, { status: 204 });
  }
}
