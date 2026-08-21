import assert from "node:assert/strict";
import {
  normalizeAllowedHttpsUrl,
  parseAllowedHttpsOrigins,
} from "../src/lib/sources/urlPolicy.ts";

const exactPolicy = parseAllowedHttpsOrigins(
  "https://api.example.test,https://cdn.example.test,https://*.media.example.test",
);
assert.equal(normalizeAllowedHttpsUrl("https://cdn.example.test/video.m3u8", exactPolicy), "https://cdn.example.test/video.m3u8");
assert.equal(normalizeAllowedHttpsUrl("https://edge.media.example.test/video.m3u8", exactPolicy), "https://edge.media.example.test/video.m3u8");
assert.equal(normalizeAllowedHttpsUrl("https://media.example.test/video.m3u8", exactPolicy), null, "wildcards must not include the parent host");
assert.equal(normalizeAllowedHttpsUrl("https://untrusted.example.test/video.m3u8", exactPolicy), null);
assert.equal(normalizeAllowedHttpsUrl("http://cdn.example.test/video.m3u8", exactPolicy), null);
assert.equal(normalizeAllowedHttpsUrl("https://user:pass@cdn.example.test/video.m3u8", exactPolicy), null);
assert.equal(normalizeAllowedHttpsUrl("https://cdn.example.test:8443/video.m3u8", exactPolicy), null);
assert.equal(normalizeAllowedHttpsUrl("https://cdn.example.test/video.m3u8#fragment", exactPolicy), null);
assert.equal(normalizeAllowedHttpsUrl("https://127.0.0.1/video.m3u8", parseAllowedHttpsOrigins("https://127.0.0.1")), null);
assert.equal(normalizeAllowedHttpsUrl("https://10.0.0.1/video.m3u8", parseAllowedHttpsOrigins("https://10.0.0.1")), null);
assert.equal(normalizeAllowedHttpsUrl("https://[::1]/video.m3u8", parseAllowedHttpsOrigins("https://[::1]")), null);
assert.equal(parseAllowedHttpsOrigins("*").exactOrigins.size, 0, "a bare wildcard must fail closed");

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
const expectedAnivexaProviders = [
  "reanime", "anikoto", "animegg", "anineko", "2dhive", "anizone", "animecg", "animenosub", "megaplay",
];
for (const provider of expectedAnivexaProviders) {
  assert.ok(
    anivexaCandidates.some((candidate) => candidate.providerId === `anivexa:${provider}`),
    `${provider} should be exposed when its watch route resolves`,
  );
}
assert.equal(
  new Set(anivexaCandidates.map((candidate) => candidate.providerId)).size,
  anivexaCandidates.length,
  "catalog and direct fast-path candidates must be deduplicated",
);
assert.ok(anivexaCandidates.some((candidate) => candidate.label.startsWith("ReAnime · Sub")));
assert.ok(anivexaCandidates.some((candidate) => candidate.label.startsWith("MegaPlay · Sub")));
assert.ok(anivexaCandidates.every((candidate) => candidate.audioVariant === "sub"));
assert.ok(anivexaCandidates.every((candidate) => !candidate.url.includes("untrusted") && candidate.url.startsWith("https://")));
const anivexaDubCandidates = await configuredAdapters[0].resolve({ mediaType: "anime", anilistId: 123, episode: 1, preferredAudio: "dub" });
for (const provider of expectedAnivexaProviders) {
  assert.ok(anivexaDubCandidates.some((candidate) => candidate.providerId === `anivexa:${provider}`));
}
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

// If the large catalogue route is unavailable, Anivexa's documented direct
// watch route remains a bounded fallback for every known provider.
process.env.ANIVEXA_API_BASE_URL = "https://anivexa-direct.example.test";
process.env.STREAMFREE_ANIME_ALLOWED_ORIGINS = "https://anivexa-direct.example.test,https://cdn.example.test";
globalThis.fetch = async (input) => {
  const url = new URL(String(input));
  const body = url.pathname.startsWith("/episodes/")
    ? {}
    : { stream_url: "https://cdn.example.test/direct.m3u8", type: "hls" };
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
};
const directFallback = (await import("../src/lib/sources/adapters/animeRemote.ts?direct-fallback")).createAnimeRemoteAdapters()[0];
const directFallbackCandidates = await directFallback.resolve({ mediaType: "anime", anilistId: 123, episode: 1, preferredAudio: "sub" });
for (const provider of [
  "anibd", "reanime", "anikoto", "animegg", "anineko", "2dhive", "anizone", "animecg",
  "animenosub", "megaplay", "mkissa", "senshi", "kickassanime", "kaa", "anidbapp", "animedunya",
]) {
  assert.ok(
    directFallbackCandidates.some((candidate) => candidate.providerId === `anivexa:${provider}`),
    `${provider} should be exposed by the direct Anivexa fallback`,
  );
}
assert.ok(directFallbackCandidates.every((candidate) => candidate.audioVariant === "sub"));
globalThis.fetch = originalFetch;

console.log("Anime integration contract checks passed.");
