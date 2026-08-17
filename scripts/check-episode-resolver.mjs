import { resolveAdjacentEpisode } from "../src/lib/tv/adjacentEpisode.ts";

const seasons = [
  { season_number: 0, episode_count: 2 },
  { season_number: 1, episode_count: 2 },
  { season_number: 2, episode_count: 3 },
];
const seasonOne = [
  { season_number: 1, episode_number: 0 },
  { season_number: 1, episode_number: 1 },
  { season_number: 1, episode_number: 2 },
];

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

assert(
  JSON.stringify(resolveAdjacentEpisode(seasons, 1, 2, seasonOne, "next")) ===
    JSON.stringify({ season: 2, episode: 1 }),
  "final episode should advance to the first episode of the next valid season",
);
assert(
  JSON.stringify(resolveAdjacentEpisode(seasons, 2, 1, [{ episode_number: 1 }, { episode_number: 2 }], "previous")) ===
    JSON.stringify({ season: 1, episode: 2 }),
  "first episode should move back to the final episode of the previous valid season",
);
assert(resolveAdjacentEpisode(seasons, 2, 3, [{ episode_number: 1 }, { episode_number: 2 }, { episode_number: 3 }], "next") === null,
  "final episode of the final valid season should stop",
);

console.log("Episode resolver checks passed.");
