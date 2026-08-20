import { loadAnimeNotifications, markAnimeNotificationsRead } from "@/lib/anime/notifications";
import { createClient } from "@/utils/supabase/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

async function authenticatedClient(request: NextRequest) {
  const token = bearerToken(request);
  if (!token) return null;
  const client = await createClient(false, token);
  const { data: { user } } = await client.auth.getUser(token);
  return user ? { client, user } : null;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await authenticatedClient(request);
    if (!auth) return NextResponse.json({ authenticated: false, notifications: [], unreadCount: 0 }, { status: 401, headers: corsHeaders() });
    const admin = process.env.SUPABASE_SERVICE_ROLE_KEY ? await createClient(true) : undefined;
    const result = await loadAnimeNotifications(auth.client, auth.user.id, admin);
    return NextResponse.json({ authenticated: true, ...result }, { headers: corsHeaders() });
  } catch (error) {
    console.error("[mobile-anime-notifications] read failed:", error);
    return NextResponse.json({ authenticated: false, notifications: [], unreadCount: 0 }, { status: 503, headers: corsHeaders() });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await authenticatedClient(request);
    if (!auth) return NextResponse.json({ ok: false }, { status: 401, headers: corsHeaders() });
    const body = await request.json().catch(() => ({})) as { id?: number; all?: boolean };
    await markAnimeNotificationsRead(auth.client, auth.user.id, body);
    return NextResponse.json({ ok: true }, { headers: corsHeaders() });
  } catch (error) {
    console.error("[mobile-anime-notifications] mark read failed:", error);
    return NextResponse.json({ ok: false }, { status: 503, headers: corsHeaders() });
  }
}
