import assert from "node:assert/strict";

delete process.env.ANIVEXA_API_BASE_URL;
delete process.env.MIRURO_API_BASE_URL;
delete process.env.STREAMFREE_ANIME_ALLOWED_ORIGINS;

const { createAnimeRemoteAdapters } = await import("../src/lib/sources/adapters/animeRemote.ts");

const adapters = createAnimeRemoteAdapters();
assert.equal(adapters.length, 2, "both optional anime API adapters should exist");
assert.equal(adapters[0].supports({ mediaType: "anime", anilistId: 1, episode: 1 }), false, "unconfigured Anivexa must stay disabled");
assert.equal(adapters[1].supports({ mediaType: "anime", anilistId: 1, episode: 1 }), false, "unconfigured Miruro must stay disabled");

process.env.ANIVEXA_API_BASE_URL = "https://anivexa.example.test";
process.env.MIRURO_API_BASE_URL = "https://miruro.example.test";
process.env.STREAMFREE_ANIME_ALLOWED_ORIGINS = "https://anivexa.example.test,https://miruro.example.test,https://cdn.example.test";

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  const body = url.hostname === "anivexa.example.test"
    ? url.pathname.startsWith("/episodes/")
      ? { animegg: { episodes: { sub: [{ number: 1, id: "watch/animegg/123/sub/animegg-1" }] } } }
      : { streams: [{ url: "https://cdn.example.test/anivexa.m3u8", type: "hls", quality: "1080p" }] }
    : url.pathname.startsWith("/api/episodes/")
      ? { results: { providers: { kiwi: { episodes: { sub: [{ number: 1, id: "watch/kiwi/123/sub/animepahe-1" }] } } } } }
      : { results: { streams: [{ url: "https://cdn.example.test/miruro.m3u8", type: "hls", quality: "720p" }], subtitles: [{ url: "https://cdn.example.test/sub.vtt", label: "English" }] } };
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
};

const configuredAdapters = (await import("../src/lib/sources/adapters/animeRemote.ts?configured")).createAnimeRemoteAdapters();
const anivexaCandidates = await configuredAdapters[0].resolve({ mediaType: "anime", anilistId: 123, episode: 1, preferredAudio: "sub" });
assert.equal(anivexaCandidates[0]?.providerId, "anivexa:animegg");
assert.equal(anivexaCandidates[0]?.kind, "hls");
const miruroCandidates = await configuredAdapters[1].resolve({ mediaType: "anime", anilistId: 123, episode: 1, preferredAudio: "sub" });
assert.equal(miruroCandidates[0]?.providerId, "miruro:kiwi");
assert.equal(miruroCandidates[0]?.subtitleTracks?.[0]?.label, "English");
globalThis.fetch = originalFetch;

console.log("Anime integration contract checks passed.");
