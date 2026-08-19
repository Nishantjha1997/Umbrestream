import assert from "node:assert/strict";

delete process.env.ANIVEXA_API_BASE_URL;
delete process.env.MIRURO_API_BASE_URL;
delete process.env.STREAMFREE_ANIME_ALLOWED_ORIGINS;

const { createAnimeRemoteAdapters } = await import("../src/lib/sources/adapters/animeRemote.ts");

const adapters = createAnimeRemoteAdapters();
assert.equal(adapters.length, 2, "both optional anime API adapters should exist");
assert.equal(adapters[0].supports({ mediaType: "anime", anilistId: 1, episode: 1 }), false, "unconfigured Anivexa must stay disabled");
assert.equal(adapters[1].supports({ mediaType: "anime", anilistId: 1, episode: 1 }), false, "unconfigured Miruro must stay disabled");
assert.equal(adapters[0].supports({ mediaType: "movie", anilistId: 1, episode: 1 }), false, "anime adapters must reject non-anime media");

process.env.ANIVEXA_API_BASE_URL = "https://anivexa.example.test";
process.env.MIRURO_API_BASE_URL = "https://miruro.example.test";
process.env.STREAMFREE_ANIME_ALLOWED_ORIGINS = "https://anivexa.example.test,https://miruro.example.test,https://cdn.example.test";

const originalFetch = globalThis.fetch;
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  const body = url.hostname === "anivexa.example.test"
    ? url.pathname.startsWith("/episodes/")
      ? Object.fromEntries([
        ["reanime", "ReAnime"], ["anikoto", "AniKoto"], ["animegg", "AnimeGG"],
        ["anineko", "AniNeko"], ["2dhive", "2DHive"], ["anizone", "AniZone"],
        ["animecg", "AnimeCG"], ["animenosub", "AnimeNoSub"], ["megaplay", "MegaPlay"],
      ].map(([provider]) => [provider, { episodes: {
        sub: [{ number: 1, id: `watch/${provider}/123/sub/${provider}-1` }],
        dub: [{ number: 1, id: `watch/${provider}/123/dub/${provider}-1` }],
      } }]))
      : { streams: [
        { url: `https://cdn.example.test/anivexa-${url.pathname.includes("/dub/") ? "dub" : "sub"}.m3u8`, type: "hls", quality: "1080p" },
        { url: "https://untrusted.example.test/not-allowed.m3u8", type: "hls", quality: "2160p" },
        { url: "http://cdn.example.test/cleartext.m3u8", type: "hls", quality: "144p" },
      ] }
    : url.pathname.startsWith("/api/episodes/")
      ? { results: { providers: {
        kiwi: { episodes: { sub: [{ number: 1, id: "watch/kiwi/123/sub/animepahe-1" }], dub: [{ number: 1, id: "watch/kiwi/123/dub/animepahe-1" }] } },
        pewe: { episodes: { sub: [{ number: 1, id: "watch/pewe/123/sub/animepahe-1" }] } },
      } } }
      : { results: { streams: [{ url: `https://cdn.example.test/miruro-${url.pathname.includes("/dub/") ? "dub" : "sub"}.m3u8`, type: "hls", quality: "720p" }], subtitles: [{ url: "https://cdn.example.test/sub.vtt", label: "English" }] } };
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
};

const configuredAdapters = (await import("../src/lib/sources/adapters/animeRemote.ts?configured")).createAnimeRemoteAdapters();
const anivexaCandidates = await configuredAdapters[0].resolve({ mediaType: "anime", anilistId: 123, episode: 1, preferredAudio: "sub" });
assert.equal(anivexaCandidates[0]?.providerId, "anivexa:reanime");
assert.equal(anivexaCandidates[0]?.kind, "hls");
assert.equal(new Set(anivexaCandidates.map((candidate) => candidate.providerId)).size, 9, "all requested Anivexa providers should normalize");
assert.ok(anivexaCandidates.some((candidate) => candidate.label.startsWith("ReAnime · Sub")));
assert.ok(anivexaCandidates.some((candidate) => candidate.label.startsWith("MegaPlay · Sub")));
assert.ok(anivexaCandidates.every((candidate) => candidate.audioVariant === "sub"));
assert.ok(anivexaCandidates.every((candidate) => !candidate.url.includes("untrusted") && candidate.url.startsWith("https://")));
const anivexaDubCandidates = await configuredAdapters[0].resolve({ mediaType: "anime", anilistId: 123, episode: 1, preferredAudio: "dub" });
assert.equal(anivexaDubCandidates.length, 9);
assert.ok(anivexaDubCandidates.every((candidate) => candidate.audioVariant === "dub" && candidate.label.includes("Dub")));
const miruroCandidates = await configuredAdapters[1].resolve({ mediaType: "anime", anilistId: 123, episode: 1, preferredAudio: "sub" });
assert.equal(miruroCandidates[0]?.providerId, "miruro:kiwi");
assert.equal(miruroCandidates[0]?.subtitleTracks?.[0]?.label, "English");
assert.ok(miruroCandidates.some((candidate) => candidate.label.startsWith("Miruro · Pewe · Sub")));
const miruroDubCandidates = await configuredAdapters[1].resolve({ mediaType: "anime", anilistId: 123, episode: 1, preferredAudio: "dub" });
assert.equal(miruroDubCandidates.length, 1, "Miruro must keep fallback within the requested audio variant");
assert.equal(miruroDubCandidates[0]?.label, "Miruro · Kiwi · Dub · 720p");
process.env.STREAMFREE_ANIME_ALLOWED_ORIGINS = "https://anivexa.example.test";
const allowlistRestricted = (await import("../src/lib/sources/adapters/animeRemote.ts?restricted")).createAnimeRemoteAdapters();
assert.equal(allowlistRestricted[1].supports({ mediaType: "anime", anilistId: 123, episode: 1 }), false, "a missing Miruro origin must disable its adapter");
globalThis.fetch = originalFetch;

console.log("Anime integration contract checks passed.");
