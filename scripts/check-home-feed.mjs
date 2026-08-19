import assert from "node:assert/strict";
import { dedupeHomeRows } from "../src/lib/homeFeed/dedupe.ts";

const media = (kind, id, title) => ({
  kind,
  id,
  title,
  href: `/${kind}/${id}`,
  posterUrl: `https://image.test/${kind}-${id}.jpg`,
  isAdult: false,
});

const rows = dedupeHomeRows([
  {
    id: "continue",
    title: "Continue Watching",
    kind: "continue",
    items: [media("movie", 1, "Resume first"), media("tv", 7, "Resume series")],
  },
  {
    id: "regional-movies",
    title: "Regional movies",
    kind: "regional_movie",
    items: [media("movie", 1, "Resume first"), media("movie", 2, "Fresh movie")],
  },
  {
    id: "anime",
    title: "Trending anime",
    kind: "anime",
    items: [media("tv", 7, "Resume series"), media("anime", 3, "New anime")],
  },
]);

assert.deepEqual(rows.map((row) => row.items.map((item) => item.title)), [
  ["Resume first", "Resume series"],
  ["Fresh movie"],
  ["New anime"],
]);
assert.equal(rows.length, 3);
console.log("Home feed cross-row dedupe checks passed.");
