import assert from "node:assert/strict";
import { latestIncompleteByTitle, pageContinueWatching } from "../src/lib/history/continueWatching.ts";

const rows = [
  { id: 1, media_id: 10, type: "tv", completed: false, updated_at: "2026-08-17T10:00:00.000Z" },
  { id: 2, media_id: 20, type: "movie", completed: false, updated_at: "2026-08-17T12:00:00.000Z" },
  { id: 3, media_id: 10, type: "tv", completed: false, updated_at: "2026-08-17T13:00:00.000Z" },
  { id: 4, media_id: 30, type: "anime", completed: true, updated_at: "2026-08-17T14:00:00.000Z" },
  { id: 5, media_id: 30, type: "anime", completed: false, updated_at: "2026-08-17T11:00:00.000Z" },
];

assert.deepEqual(latestIncompleteByTitle(rows).map((row) => row.id), [3, 2, 5]);
const first = pageContinueWatching(rows, null, 2);
assert.deepEqual(first.items.map((row) => row.id), [3, 2]);
assert.deepEqual(first.nextCursor, { updatedAt: rows[1].updated_at, id: 2 });
assert.deepEqual(pageContinueWatching(rows, first.nextCursor, 2).items.map((row) => row.id), [5]);
console.log("Continue Watching ordering and cursor checks passed.");
