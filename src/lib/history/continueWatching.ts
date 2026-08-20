export interface ContinueWatchingRow {
  id: number;
  media_id: number;
  type: string;
  completed?: boolean;
  updated_at: string;
}

export interface ContinueWatchingCursor {
  updatedAt: string;
  id: number;
}

/**
 * The Home API carries this cursor as an opaque query value. Keep the wire
 * format URL-safe and validate it again when it returns from a client.
 */
export function encodeContinueWatchingCursor(cursor: ContinueWatchingCursor): string {
  return encodeURIComponent(`${cursor.updatedAt}|${cursor.id}`);
}

export function decodeContinueWatchingCursor(value: string | null | undefined): ContinueWatchingCursor | undefined {
  if (!value) return undefined;
  try {
    const decoded = decodeURIComponent(value);
    const separator = decoded.lastIndexOf("|");
    if (separator <= 0) return undefined;
    const updatedAt = decoded.slice(0, separator);
    const id = Number(decoded.slice(separator + 1));
    if (!Number.isSafeInteger(id) || id <= 0 || !Number.isFinite(Date.parse(updatedAt))) return undefined;
    return { updatedAt, id };
  } catch {
    return undefined;
  }
}

function compareNewest(a: ContinueWatchingRow, b: ContinueWatchingRow): number {
  const updated = Date.parse(b.updated_at) - Date.parse(a.updated_at);
  return updated || b.id - a.id;
}

/** Returns one latest incomplete episode row for each title, newest first. */
export function latestIncompleteByTitle<T extends ContinueWatchingRow>(rows: T[]): T[] {
  const seen = new Set<string>();
  return [...rows]
    .filter((row) => !row.completed)
    .sort(compareNewest)
    .filter((row) => {
      const key = `${row.type}:${row.media_id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export function pageContinueWatching<T extends ContinueWatchingRow>(
  rows: T[],
  cursor: ContinueWatchingCursor | null | undefined,
  limit: number,
): { items: T[]; nextCursor?: ContinueWatchingCursor } {
  const ordered = latestIncompleteByTitle(rows);
  const afterCursor = cursor
    ? ordered.filter(
        (row) =>
          row.updated_at < cursor.updatedAt ||
          (row.updated_at === cursor.updatedAt && row.id < cursor.id),
      )
    : ordered;
  const items = afterCursor.slice(0, limit);
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      items.length === limit && last
        ? { updatedAt: last.updated_at, id: last.id }
        : undefined,
  };
}
