import { loadAnimeNotifications, markAnimeNotificationsRead } from "@/lib/anime/notifications";
import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ authenticated: false, notifications: [], unreadCount: 0 }, { status: 401 });
    const admin = process.env.SUPABASE_SERVICE_ROLE_KEY ? await createClient(true) : undefined;
    const result = await loadAnimeNotifications(supabase, user.id, admin);
    return NextResponse.json({ authenticated: true, ...result }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("[anime-notifications] read failed:", error);
    return NextResponse.json({ authenticated: false, notifications: [], unreadCount: 0 }, { status: 503 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });
    const body = await request.json().catch(() => ({})) as { id?: number; all?: boolean };
    if (!body.all && !(typeof body.id === "number" && Number.isInteger(body.id))) return NextResponse.json({ ok: false }, { status: 400 });
    await markAnimeNotificationsRead(supabase, user.id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[anime-notifications] mark read failed:", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
