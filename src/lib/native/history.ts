export type NativeHistoryItem = {
  id?: number | string;
  media_id?: number | string;
  media_type?: string;
  type?: string;
  updated_at?: string | number;
  watchedAt?: string | number;
  created_at?: string | number;
  duration?: number | string;
  last_position?: number | string;
  completed?: boolean;
};

function historyTimestamp(item: NativeHistoryItem): number {
  const value = item.updated_at ?? item.watchedAt ?? item.created_at ?? 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function historyMediaType(item: NativeHistoryItem, fallback = "movie"): string {
  return item.media_type || item.type || fallback;
}

export function historyMediaId(item: NativeHistoryItem): number {
  return Number(item.media_id ?? item.id);
}

export function historyIdentity(item: NativeHistoryItem): string {
  return `${historyMediaType(item)}:${historyMediaId(item)}`;
}

export function sortHistoryItems<T extends NativeHistoryItem>(items: T[]): T[] {
  return [...items].sort((a, b) => historyTimestamp(b) - historyTimestamp(a));
}

/** Keep the latest episode record for each title, preserving recent-first order. */
export function latestHistoryTitles<T extends NativeHistoryItem>(items: T[]): T[] {
  const seen = new Set<string>();
  return sortHistoryItems(items).filter((item) => {
    const key = historyIdentity(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function historyProgress(item: NativeHistoryItem): number {
  const duration = Number(item.duration || 0);
  const position = Number(item.last_position || 0);
  if (!duration) return item.completed ? 100 : 8;
  return Math.round((position / duration) * 100);
}

export function historyDate(item: NativeHistoryItem, locale?: string): string {
  const value = item.updated_at ?? item.watchedAt ?? item.created_at;
  if (!value) return "Recently watched";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Recently watched";
  return `Watched ${new Intl.DateTimeFormat(locale, { month: "short", day: "numeric" }).format(date)}`;
}

export function onlyLocalAnime<T extends NativeHistoryItem>(items: T[]): T[] {
  return items.filter((item) => historyMediaType(item, item.type) === "anime");
}
