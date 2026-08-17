import assert from "node:assert/strict";
import {
  historyDate,
  historyIdentity,
  historyProgress,
  latestHistoryTitles,
  onlyLocalAnime,
} from "../src/lib/native/history.ts";

const items = [
  { media_id: 10, type: "movie", updated_at: "2026-08-16T10:00:00Z", duration: 100, last_position: 50 },
  { media_id: 11, type: "anime", watchedAt: "2026-08-17T10:00:00Z", completed: false },
  { media_id: 10, type: "movie", updated_at: "2026-08-15T10:00:00Z", duration: 100, last_position: 10 },
];

assert.equal(historyIdentity(items[0]), "movie:10");
assert.deepEqual(latestHistoryTitles(items).map((item) => item.media_id), [11, 10]);
assert.equal(historyProgress(items[0]), 50);
assert.equal(historyProgress({ completed: true }), 100);
assert.equal(onlyLocalAnime(items).length, 1);
assert.match(historyDate(items[0], "en-US"), /^Watched Aug 16$/);
console.log("Native history sorting, dedupe, progress, date, and local-anime checks passed.");
