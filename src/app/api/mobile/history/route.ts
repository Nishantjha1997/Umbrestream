import { syncHistory } from "@/actions/histories";
import type { UnifiedPlayerEventData } from "@/hooks/usePlayerEvents";
import { createClient } from "@/utils/supabase/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_EVENTS = new Set(["timeupdate", "ended"]);
const ALLOWED_TYPES = new Set(["movie", "tv", "anime"]);

function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Authorization, Content-Type",
    "Cache-Control": "private, no-store",
  };
}

function bearerToken(request: NextRequest): string | null {
  return request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim() || null;
}

function isValidPayload(value: unknown): value is UnifiedPlayerEventData & { completed?: boolean } {
  if (!value || typeof value !== "object") return false;
  const body = value as Record<string, unknown>;
  return ALLOWED_EVENTS.has(String(body.event))
    && ALLOWED_TYPES.has(String(body.mediaType))
    && (typeof body.mediaId === "string" || typeof body.mediaId === "number")
    && typeof body.currentTime === "number"
    && Number.isFinite(body.currentTime)
    && body.currentTime >= 0
    && typeof body.duration === "number"
    && Number.isFinite(body.duration)
    && body.duration > 0
    && (body.season === undefined || (typeof body.season === "number" && Number.isInteger(body.season) && body.season >= 0))
    && (body.episode === undefined || (typeof body.episode === "number" && Number.isInteger(body.episode) && body.episode > 0))
    && (body.completed === undefined || typeof body.completed === "boolean");
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function POST(request: NextRequest) {
  try {
    const token = bearerToken(request);
    if (!token) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401, headers: corsHeaders() });
    const supabase = await createClient(false, token);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401, headers: corsHeaders() });
    const body = await request.json().catch(() => null);
    if (!isValidPayload(body)) return NextResponse.json({ success: false, message: "Invalid history payload" }, { status: 400, headers: corsHeaders() });
    const result = await syncHistory(body, body.completed ?? body.event === "ended", token);
    return NextResponse.json(result, { headers: corsHeaders() });
  } catch (error) {
    console.error("[mobile-history] save failed:", error);
    return NextResponse.json({ success: false, message: "Unable to sync history" }, { status: 503, headers: corsHeaders() });
  }
}
