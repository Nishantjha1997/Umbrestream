import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/utils/supabase/types";

type HistoryRow = { media_id: number; title: string; episode: number; updated_at: string };

export type AniListAiringNode = { episode: number; airingAt: number };

export type AniListAiringMedia = {
  id: number;
  status: string | null;
  airingSchedule: { nodes: AniListAiringNode[] } | null;
};

export type AnimeNotification = {
  id: number;
  anilist_id: number;
  title: string;
  episode: number;
  aired_at: string | null;
  read_at: string | null;
  created_at: string;
};

type NotificationInsert = {
  user_id: string;
  anilist_id: number;
  title: string;
  episode: number;
  aired_at: string | null;
};

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export function latestHistoryByMedia(rows: HistoryRow[]): Map<number, HistoryRow> {
  const latest = new Map<number, HistoryRow>();
  for (const row of rows) {
    const current = latest.get(row.media_id);
    if (!current || row.episode > current.episode || (row.episode === current.episode && row.updated_at > current.updated_at)) {
      latest.set(row.media_id, row);
    }
  }
  return latest;
}

export function latestAiredEpisode(media: AniListAiringMedia, nowMs = Date.now()): AniListAiringNode | null {
  return (media.airingSchedule?.nodes ?? [])
    .filter((node) => Number.isInteger(node.episode) && node.episode > 0 && Number.isFinite(node.airingAt) && node.airingAt * 1000 <= nowMs)
    .sort((left, right) => right.episode - left.episode || right.airingAt - left.airingAt)[0] ?? null;
}

export function notificationCandidate(
  media: AniListAiringMedia,
  watched: HistoryRow | undefined,
  userId: string,
  nowMs = Date.now(),
): NotificationInsert | null {
  if (!watched || media.status !== "RELEASING") return null;
  const aired = latestAiredEpisode(media, nowMs);
  if (!aired || aired.episode <= watched.episode) return null;
  return {
    user_id: userId,
    anilist_id: media.id,
    title: watched.title,
    episode: aired.episode,
    aired_at: new Date(aired.airingAt * 1000).toISOString(),
  };
}

async function fetchMedia(id: number, fetcher: typeof fetch = fetch): Promise<AniListAiringMedia | null> {
  const response = await fetcher(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      query: "query($id:Int){Media(id:$id,type:ANIME){id status airingSchedule(notYetAired:false,page:1,perPage:25,sort:TIME_DESC){nodes{episode airingAt}}}}",
      variables: { id },
    }),
    cache: "no-store",
  });
  if (!response.ok) return null;
  const payload = await response.json() as { data?: { Media?: AniListAiringMedia } };
  return payload.data?.Media ?? null;
}

type AppSupabaseClient = SupabaseClient<Database>;

export async function loadAnimeNotifications(
  userClient: AppSupabaseClient,
  userId: string,
  adminClient?: AppSupabaseClient,
): Promise<{ notifications: AnimeNotification[]; unreadCount: number }> {
  const { data: history, error: historyError } = await userClient
    .from("histories")
    .select("media_id, title, episode, updated_at")
    .eq("user_id", userId)
    .eq("type", "anime")
    .order("updated_at", { ascending: false })
    .limit(100);
  if (historyError) throw historyError;

  const latest = latestHistoryByMedia((history ?? []) as HistoryRow[]);
  const media = (await Promise.all([...latest.keys()].slice(0, 30).map((id) => fetchMedia(id))))
    .filter((value): value is AniListAiringMedia => Boolean(value));
  const pending = media
    .map((item) => notificationCandidate(item, latest.get(item.id), userId))
    .filter((value): value is NotificationInsert => Boolean(value));

  if (pending.length && adminClient) {
    const { error } = await adminClient
      .from("anime_episode_notifications")
      .upsert(pending, { onConflict: "user_id,anilist_id,episode", ignoreDuplicates: true });
    if (error) console.error("[anime-notifications] upsert failed:", error.code ?? "unknown");
  }

  const { data: notifications, error } = await userClient
    .from("anime_episode_notifications")
    .select("id, anilist_id, title, episode, aired_at, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  const safeNotifications = (notifications ?? []) as AnimeNotification[];
  return {
    notifications: safeNotifications,
    unreadCount: safeNotifications.filter((item) => !item.read_at).length,
  };
}

export async function markAnimeNotificationsRead(
  userClient: AppSupabaseClient,
  userId: string,
  body: { id?: number; all?: boolean },
): Promise<void> {
  let query = userClient
    .from("anime_episode_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", userId);
  if (body.all) query = query.is("read_at", null);
  else if (typeof body.id === "number" && Number.isInteger(body.id)) query = query.eq("id", body.id);
  else throw new Error("A notification id or all=true is required.");
  const { error } = await query;
  if (error) throw error;
}
