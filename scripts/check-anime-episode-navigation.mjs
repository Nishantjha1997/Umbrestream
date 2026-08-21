import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [types, api, helper, episodeSheet, historyAction, detailEpisodes] = await Promise.all([
  read("src/types/anilist.ts"),
  read("src/api/anilist.ts"),
  read("src/lib/anime/episodeNavigation.ts"),
  read("src/components/sections/Anime/Player/EpisodeSheet.tsx"),
  read("src/actions/histories.ts"),
  read("src/components/sections/Anime/Detail/Episodes.tsx"),
]);
const {
  buildAnimeEpisodeProgress,
  buildAnimeEpisodeRanges,
  buildAnimeSeasonOptions,
  getAnimeEpisodeCount,
} =
  await import("../src/lib/anime/episodeNavigation.ts");

assert.match(types, /relations: AniListMediaRelation\[\]/);
assert.match(api, /relations \{[\s\S]*?edges \{ relationType node/);
assert.match(helper, /relationType === "PREQUEL" \|\| relation\.relationType === "SEQUEL"/);
assert.match(helper, /SEASON_FORMATS\.has\(relation\.media\.format\)/);
assert.match(helper, /nextAiringEpisode\.episode - 1/);
assert.doesNotMatch(episodeSheet, /anime\.episodes \|\| 12/);
assert.match(episodeSheet, /aria-label="Choose Anime season or continuation"/);
assert.match(episodeSheet, /aria-label="Choose episode range"/);
assert.doesNotMatch(episodeSheet, /overflow-x-auto/);
assert.match(episodeSheet, /setSelectedAnimeId\(Number\(event\.target\.value\)\)/);
assert.match(episodeSheet, /listAnime\?\.id === anime\.id/);
assert.match(episodeSheet, /Watched/);
assert.match(episodeSheet, /buildAnimeEpisodeProgress/);

assert.match(historyAction, /export const getAnimeEpisodeHistories/);
assert.match(historyAction, /\.eq\("type", "anime"\)/);
assert.match(historyAction, /\.eq\("media_id", normalizedMediaId\)/);
assert.match(historyAction, /const maximumRows = 2500/);
assert.match(historyAction, /\.order\("updated_at", \{ ascending: true \}\)/);
assert.match(historyAction, /\.range\(from, from \+ pageSize - 1\)/);
assert.match(detailEpisodes, /getAnimeEpisodeHistories\(anime\.id\)/);

const media = (id, title, format = "TV") => ({
  id,
  idMal: null,
  title: { english: title, romaji: title, native: null },
  coverImage: { extraLarge: null, large: null, medium: null, color: null },
  format,
  episodes: 12,
  averageScore: null,
  seasonYear: 2026,
  isAdult: false,
});
const current = {
  ...media(2, "Current"),
  relations: [
    { relationType: "PREQUEL", media: media(1, "Previous") },
    { relationType: "SEQUEL", media: media(3, "Next") },
    { relationType: "SEQUEL", media: media(4, "Movie continuation", "MOVIE") },
    { relationType: "PREQUEL", media: media(5, "Unrelated ONA", "ONA") },
  ],
};
assert.deepEqual(
  buildAnimeSeasonOptions(current).map(({ id, relation }) => [id, relation]),
  [
    [1, "previous"],
    [2, "current"],
    [3, "next"],
  ],
);
assert.equal(getAnimeEpisodeCount({ episodes: null, nextAiringEpisode: { episode: 1175 } }), 1174);
assert.equal(getAnimeEpisodeCount({ episodes: null, nextAiringEpisode: null }), 0);
const ranges = buildAnimeEpisodeRanges(1174);
assert.equal(ranges.length, 24);
assert.deepEqual(ranges[0], {
  index: 0,
  startEpisode: 1,
  endEpisode: 50,
  label: "Episodes 1–50",
});
assert.deepEqual(ranges.at(-1), {
  index: 23,
  startEpisode: 1151,
  endEpisode: 1174,
  label: "Episodes 1151–1174",
});
const progress = buildAnimeEpisodeProgress([
  { episode: 1, last_position: 950, duration: 1000, completed: false },
  { episode: 2, last_position: 350, duration: 1000, completed: false },
]);
assert.deepEqual(progress.get(1), { completed: true, percent: 95 });
assert.deepEqual(progress.get(2), { completed: false, percent: 35 });

console.log("Anime episode navigation contract passed");
