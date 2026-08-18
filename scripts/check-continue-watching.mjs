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

// The Home rail must not inherit the historical 100-row cap. This synthetic
// fixture represents a large account and walks every cursor page to verify
// that title-level dedupe and newest-first ordering remain complete beyond
// the old limit without requiring test data in production.
const stressRows = Array.from({ length: 150 }, (_, index) => ({
  id: index + 1,
  media_id: 1000 + index,
  type: "movie",
  completed: false,
  updated_at: new Date(Date.UTC(2026, 0, 1, 0, index, 0)).toISOString(),
}));
const stressItems = [];
let stressCursor = null;
do {
  const page = pageContinueWatching(stressRows, stressCursor, 50);
  stressItems.push(...page.items);
  stressCursor = page.nextCursor ?? null;
} while (stressCursor);

assert.equal(stressItems.length, 150);
assert.deepEqual(stressItems.map((row) => row.id), Array.from({ length: 150 }, (_, i) => 150 - i));
assert.equal(new Set(stressItems.map((row) => `${row.type}:${row.media_id}`)).size, 150);
console.log("Continue Watching ordering and cursor checks passed.");
