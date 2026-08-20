import assert from "node:assert/strict";
import { latestAiredEpisode, latestHistoryByMedia, notificationCandidate } from "../src/lib/anime/notifications.ts";

const nowMs = Date.UTC(2026, 7, 21, 12, 0, 0);
const past = Math.floor((nowMs - 60_000) / 1000);
const future = Math.floor((nowMs + 60_000) / 1000);
const media = {
  id: 10,
  status: "RELEASING",
  airingSchedule: { nodes: [
    { episode: 4, airingAt: past - 10_000 },
    { episode: 5, airingAt: future },
  ] },
};

assert.equal(latestAiredEpisode(media, nowMs)?.episode, 4, "future episodes must not notify early");
assert.equal(notificationCandidate(media, { media_id: 10, title: "Fixture", episode: 3, updated_at: "2026-08-20T00:00:00.000Z" }, "user", nowMs)?.episode, 4);
assert.equal(notificationCandidate(media, { media_id: 10, title: "Fixture", episode: 4, updated_at: "2026-08-20T00:00:00.000Z" }, "user", nowMs), null);
assert.equal(notificationCandidate({ ...media, status: "FINISHED" }, { media_id: 10, title: "Fixture", episode: 3, updated_at: "2026-08-20T00:00:00.000Z" }, "user", nowMs), null);

const latest = latestHistoryByMedia([
  { media_id: 10, title: "Fixture", episode: 2, updated_at: "2026-08-21T01:00:00.000Z" },
  { media_id: 10, title: "Fixture", episode: 4, updated_at: "2026-08-20T01:00:00.000Z" },
  { media_id: 10, title: "Fixture", episode: 4, updated_at: "2026-08-21T02:00:00.000Z" },
]);
assert.equal(latest.get(10)?.episode, 4);
assert.equal(latest.get(10)?.updated_at, "2026-08-21T02:00:00.000Z");

console.log("Anime notification contract checks passed.");
