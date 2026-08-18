import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

type HistoryRow = { media_id: number; title: string; episode: number; updated_at: string };
type AniListMedia = { id: number; episodes: number | null; status: string | null; nextAiringEpisode: { episode: number; airingAt: number } | null };

async function fetchMedia(id: number): Promise<AniListMedia | null> {
  const response = await fetch("https://graphql.anilist.co", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: "query($id:Int){Media(id:$id,type:ANIME){id episodes status nextAiringEpisode{episode airingAt}}}",
      variables: { id },
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = await response.json() as { data?: { Media?: AniListMedia } };
  return payload.data?.Media ?? null;
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ authenticated: false, notifications: [], unreadCount: 0 }, { status: 401 });
    const { data: history, error: historyError } = await supabase
      .from("histories")
      .select("media_id, title, episode, updated_at")
      .eq("user_id", user.id)
      .eq("type", "anime")
      .order("updated_at", { ascending: false })
      .limit(100);
    if (historyError) throw historyError;

    const latest = new Map<number, HistoryRow>();
    for (const row of (history ?? []) as HistoryRow[]) {
      const current = latest.get(row.media_id);
      if (!current || row.episode > current.episode) latest.set(row.media_id, row);
    }
    const media = (await Promise.all([...latest.keys()].slice(0, 30).map(fetchMedia))).filter((value): value is AniListMedia => Boolean(value));
    const pending = media.flatMap((item) => {
      const watched = latest.get(item.id);
      const released = item.episodes ?? item.nextAiringEpisode?.episode ?? 0;
      // Notify once for the newest released episode. Do not flood a returning
      // user with every historical episode in a backlog, and do not notify for
      // finished shows that simply have unwatched episodes remaining.
      if (!watched || item.status !== "RELEASING" || released <= watched.episode) return [];
      return [{
        user_id: user.id,
        anilist_id: item.id,
        title: watched.title,
        episode: released,
        aired_at: item.nextAiringEpisode?.airingAt ? new Date(item.nextAiringEpisode.airingAt * 1000).toISOString() : null,
      }];
    });

    if (pending.length && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const admin = await createClient(true);
      const { error } = await admin.from("anime_episode_notifications").upsert(pending, { onConflict: "user_id,anilist_id,episode", ignoreDuplicates: true });
      if (error) console.error("[anime-notifications] upsert failed:", error.code ?? "unknown");
    }

    const { data: notifications, error } = await supabase
      .from("anime_episode_notifications")
      .select("id, anilist_id, title, episode, aired_at, read_at, created_at")
      .order("created_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return NextResponse.json({ authenticated: true, notifications: notifications ?? [], unreadCount: (notifications ?? []).filter((item) => !item.read_at).length }, { headers: { "Cache-Control": "private, no-store" } });
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
    let query = supabase.from("anime_episode_notifications").update({ read_at: new Date().toISOString() }).eq("user_id", user.id);
    if (body.all) query = query.is("read_at", null);
    else if (typeof body.id === "number" && Number.isInteger(body.id)) query = query.eq("id", body.id);
    else return NextResponse.json({ ok: false }, { status: 400 });
    const { error } = await query;
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[anime-notifications] mark read failed:", error);
    return NextResponse.json({ ok: false }, { status: 503 });
  }
}
