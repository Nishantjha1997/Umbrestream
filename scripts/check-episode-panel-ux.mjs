import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const [tvSelection, tvCards, tvPlayer, animeSheet, animeNavigation] = await Promise.all([
  read("src/components/sections/TV/Player/EpisodeSelection.tsx"),
  read("src/components/sections/TV/Details/Episodes.tsx"),
  read("src/components/sections/TV/Player/Player.tsx"),
  read("src/components/sections/Anime/Player/EpisodeSheet.tsx"),
  read("src/lib/anime/episodeNavigation.ts"),
]);

assert.match(tvSelection, /aria-label="Choose TV season"/);
assert.match(tvSelection, /tmdbBrowser\.tvShows\.season\(id, selectedSeason\)/);
assert.match(tvSelection, /selectedSeason !== currentSeason/);
assert.match(tvSelection, /setSelectedSeason\(Number\(event\.target\.value\)\)/);
assert.match(tvSelection, /sourceId=\{selectedSourceId\}/);
assert.match(tvSelection, /compact/);
assert.match(tvSelection, /isCurrent=\{selectedSeason === currentSeason/);

assert.match(tvCards, /grid-cols-\[minmax\(108px,42%\)_minmax\(0,1fr\)\]/);
assert.match(tvCards, /line-clamp-2 min-w-0 font-semibold/);
assert.match(tvCards, /aria-current=\{isCurrent \? "page" : undefined\}/);

assert.equal((tvPlayer.match(/seasons=\{tv\.seasons\}/g) ?? []).length, 3);
assert.equal((tvPlayer.match(/currentSeason=\{season\}/g) ?? []).length, 3);
assert.equal((tvPlayer.match(/currentEpisode=\{episodeNumber\}/g) ?? []).length, 3);
assert.match(tvPlayer, /SelectedSourceObserver/);

assert.match(animeSheet, /aria-label="Choose episode range"/);
assert.match(animeSheet, /buildAnimeEpisodeRanges\(totalEpisodes, CHUNK_SIZE\)/);
assert.doesNotMatch(animeSheet, /overflow-x-auto/);
assert.match(animeNavigation, /new Set\(\["TV", "TV_SHORT"\]\)/);
assert.doesNotMatch(animeNavigation, /"ONA"/);

console.log("Cross-media episode panel UX checks passed");
