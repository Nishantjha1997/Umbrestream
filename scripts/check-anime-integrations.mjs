import assert from "node:assert/strict";

delete process.env.ANIVEXA_API_BASE_URL;
delete process.env.MIRURO_API_BASE_URL;
delete process.env.STREAMFREE_ANIME_ALLOWED_ORIGINS;

const { createAnimeRemoteAdapters } = await import("../src/lib/sources/adapters/animeRemote.ts");

const adapters = createAnimeRemoteAdapters();
assert.equal(adapters.length, 2, "both optional anime API adapters should exist");
assert.equal(adapters[0].supports({ mediaType: "anime", anilistId: 1, episode: 1 }), false, "unconfigured Anivexa must stay disabled");
assert.equal(adapters[1].supports({ mediaType: "anime", anilistId: 1, episode: 1 }), false, "unconfigured Miruro must stay disabled");

console.log("Anime integration contract checks passed.");
