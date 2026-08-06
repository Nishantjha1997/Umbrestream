import assert from "node:assert/strict";
import { createDirectAdapter } from "../src/lib/sources/adapters/direct.ts";
import {
  createEmbedAdapters,
  createPublicEmbedSources,
} from "../src/lib/sources/adapters/embed.ts";
import { legacySourceId } from "../src/lib/sources/legacy.ts";
import { fallbackChain, register, resolveAll } from "../src/lib/sources/registry.ts";
import { selectDefaultSource } from "../src/lib/sources/selectDefault.ts";

const fixtures = {
  movie: { mediaType: "movie", tmdbId: 1212763, startAt: 137, preferredSubtitle: "en" },
  tv: {
    mediaType: "tv",
    tmdbId: 97546,
    season: 1,
    episode: 1,
    startAt: 137,
    preferredSubtitle: "en",
  },
  anime: {
    mediaType: "anime",
    title: "One Piece",
    anilistId: 21,
    malId: 21,
    episode: 1,
    startAt: 137,
    preferredAudio: "sub",
    preferredSubtitle: "en",
  },
};

const adapters = createEmbedAdapters();
const byId = new Map(adapters.map((adapter) => [adapter.id, adapter]));
const priorityFor = (adapter, request) =>
  typeof adapter.priority === "number" ? adapter.priority : adapter.priority(request);

async function resolveOne(id, request) {
  const adapter = byId.get(id);
  assert(adapter, `Missing adapter ${id}`);
  assert.equal(adapter.supports(request), true, `${id} should support ${request.mediaType}`);
  const [source] = await adapter.resolve(request);
  assert(source, `${id} did not build a source`);
  assert.equal(source.id, id);
  assert.equal(source.mediaType, request.mediaType);
  assert.equal(new URL(source.url).origin, source.providerOrigin);
  return source;
}

for (const adapter of adapters) {
  for (const mediaType of adapter.supportedMediaTypes) {
    if (mediaType === "anime" && adapter.identifierRequirements.anime?.includes("animeTmdbId")) {
      assert.equal(
        adapter.supports(fixtures.anime),
        false,
        `${adapter.id} needs an Anime TMDB map`,
      );
      continue;
    }
    const request = fixtures[mediaType];
    for (const requirement of adapter.identifierRequirements[mediaType] ?? []) {
      assert.notEqual(
        request[requirement],
        undefined,
        `${adapter.id} fixture lacks ${requirement}`,
      );
    }
    await resolveOne(adapter.id, request);
  }
}

assert.equal(
  (await resolveOne("cinezo", fixtures.movie)).url,
  "https://player.cinezo.live/embed/movie/1212763?autoplay=false&poster=true&servericon=true&setting=true&pip=true&primarycolor=006fee&secondarycolor=0a0a12&iconcolor=ffffff",
);
assert.equal(
  (await resolveOne("cinezo", fixtures.tv)).url,
  "https://player.cinezo.live/embed/tv/97546/1/1?autoplay=false&poster=true&servericon=true&setting=true&pip=true&primarycolor=f5a524&secondarycolor=0a0a12&iconcolor=ffffff",
);
assert.equal(
  (await resolveOne("vidlink-anime-sub", fixtures.anime)).url,
  "https://vidlink.pro/anime/21/1/sub?fallback=true&autoplay=false",
);
assert.equal(
  (await resolveOne("cinezo-anime-dub", fixtures.anime)).url,
  "https://player.cinezo.live/embed/anime/21/1?dub=true&autoplay=false&servericon=true&setting=true&pip=true",
);
assert.equal((await resolveOne("vidking", fixtures.movie)).capabilities.subtitles, "none");
assert.equal((await resolveOne("cinezo", fixtures.movie)).capabilities.subtitles, "native");
assert.equal((await resolveOne("vidlink-native", fixtures.movie)).providerId, "vidlink");

const orderedIds = (request) =>
  adapters
    .filter((adapter) => adapter.supports(request))
    .sort((a, b) => priorityFor(a, request) - priorityFor(b, request))
    .map((adapter) => adapter.id);

assert.deepEqual(orderedIds(fixtures.movie), [
  "filmu",
  "cinezo",
  "vidlink",
  "vidlink-native",
  "vidking",
  "vidrift",
  "vidbolt",
  "videasy",
]);
assert.deepEqual(orderedIds(fixtures.tv), orderedIds(fixtures.movie));
assert.deepEqual(orderedIds(fixtures.anime), [
  "vidlink-anime-sub",
  "vidlink-anime-dub",
  "cinezo-anime-sub",
  "cinezo-anime-dub",
]);

const instantStartedAt = performance.now();
const instantMovie = createPublicEmbedSources(fixtures.movie);
assert(
  performance.now() - instantStartedAt < 100,
  "Public manifest should be synchronous and fast",
);
assert.equal(instantMovie[0].id, "filmu");
assert(instantMovie.every((source) => source.availability === "unverified"));

const cinezoMovie = { ...(await resolveOne("cinezo", fixtures.movie)), availability: "unverified" };
const filmuMovie = { ...(await resolveOne("filmu", fixtures.movie)), availability: "unverified" };
const vidkingMovie = {
  ...(await resolveOne("vidking", fixtures.movie)),
  availability: "unverified",
};
assert.equal(
  selectDefaultSource([vidkingMovie, cinezoMovie], { preferredSubtitle: "en" }).id,
  "cinezo",
);
assert.equal(
  selectDefaultSource([filmuMovie, cinezoMovie], {
    defaultId: "filmu",
    preferredSubtitle: "en",
  }).id,
  "filmu",
);
assert.equal(
  selectDefaultSource([vidkingMovie, cinezoMovie], {
    requestedId: "vidking",
    preferredSubtitle: "en",
  }).id,
  "vidking",
);

const mappedAnime = { ...fixtures.anime, animeTmdbId: 37854 };
assert.equal(byId.get("vidrift-anime").supports(mappedAnime), true);
assert.equal(
  (await resolveOne("vidrift-anime", mappedAnime)).url,
  "https://vidrift.in/embed/anime/37854/1",
);

assert.equal(legacySourceId("movie", "0"), "vidlink");
assert.equal(legacySourceId("movie", "2"), "vidking");
assert.equal(legacySourceId("anime", "0"), "vidlink-anime-sub");
assert.equal(legacySourceId("movie", "vidlink-alt"), "vidlink-native");
assert.equal(legacySourceId("anime", "vidlink"), "vidlink-anime-sub");

const direct = createDirectAdapter([
  {
    tmdbId: 1212763,
    url: "https://media.example.com/movie.mpd",
    subtitleTracks: [
      { id: "en", language: "en", label: "English", url: "https://subs.example.com/movie.srt" },
    ],
  },
]);
const [directSource] = await direct.resolve(fixtures.movie);
assert.equal(directSource.kind, "dash");
assert.equal(directSource.providerTier, "direct");
assert.equal(directSource.capabilities.subtitles, "native");
assert.match(directSource.subtitleTracks[0].url, /^\/api\/player\/subtitles\?url=/);

register({
  id: "test-fast-v3",
  label: "Test fast",
  supportedMediaTypes: ["movie"],
  identifierRequirements: { movie: ["tmdbId"] },
  priority: 2,
  supports: (request) => request.mediaType === "movie" && request.tmdbId !== undefined,
  resolve: async (request) => [
    {
      id: "test-fast-v3",
      providerId: "test-fast-v3",
      label: "Test fast",
      kind: "iframe",
      url: `https://example.com/movie/${request.tmdbId}`,
      providerOrigin: "https://example.com",
      providerTier: "experimental",
      mediaType: request.mediaType,
      priority: 2,
      capabilities: {},
    },
  ],
});

register({
  id: "test-timeout-v3",
  label: "Test timeout",
  supportedMediaTypes: ["movie"],
  identifierRequirements: { movie: ["tmdbId"] },
  priority: 1,
  supports: (request) => request.mediaType === "movie" && request.tmdbId !== undefined,
  resolve: (_request, signal) =>
    new Promise((_, reject) => {
      signal?.addEventListener("abort", () => reject(new Error("aborted")), { once: true });
    }),
});

const startedAt = Date.now();
const groups = await resolveAll(fixtures.movie, undefined, 25);
assert(Date.now() - startedAt < 1000, "Provider timeout did not abort promptly");
assert(groups.some((group) => group.adapterId === "test-timeout-v3" && group.error));
assert.deepEqual(
  fallbackChain(groups).map((source) => source.id),
  ["test-fast-v3"],
);

console.log(`Player source checks passed (${adapters.length} adapters).`);
