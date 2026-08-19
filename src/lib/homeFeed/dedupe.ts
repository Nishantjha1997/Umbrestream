import type { MediaSummary } from "@/types/media";
import type { HomeFeedRowKind } from "./types";

export interface HomeFeedRowForDedupe {
  id: string;
  title: string;
  kind: HomeFeedRowKind;
  items: MediaSummary[];
  nextCursor?: string;
}

/**
 * Keep the first occurrence of a title across the ordered Home rows. The
 * caller controls precedence by ordering rows from most useful to least
 * useful (Continue Watching before personalized, then regional and trending).
 * Media kind is part of the key because TMDB movie and TV ids share a space.
 */
export function dedupeHomeRows<T extends HomeFeedRowForDedupe>(rows: T[]): T[] {
  const seen = new Set<string>();

  return rows
    .map((row) => {
      const items = row.items.filter((item) => {
        const key = `${item.kind}:${item.id}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
      return { ...row, items };
    })
    .filter((row) => row.items.length > 0);
}
