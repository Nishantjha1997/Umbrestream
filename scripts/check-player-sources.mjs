import assert from "node:assert/strict";
import { createEmbedAdapters } from "../src/lib/sources/adapters/embed.ts";
import { legacySourceId } from "../src/lib/sources/legacy.ts";
import { fallbackChain, register, resolveAll } from "../src/lib/sources/registry.ts";
import { selectDefaultSource } from "../src/lib/sources/selectDefault.ts";

const fixtures = {
  movie: { mediaType: "movie", tmdbId: 1212763, startAt: 137 },
  tv: { mediaType: "tv", tmdbId: 97546, season: 1, episode: 1, startAt: 137 },
  anime: {
    mediaType: "anime",
    title: "One Piece",
    anilistId: 21,
    malId: 21,
    episode: 1,
    startAt: 137,
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
  assert.equal(source.providerId, id);
  assert.equal(source.mediaType, request.mediaType);
  assert.equal(new URL(source.url).origin, source.providerOrigin);
  return source;
}

for (const adapter of adapters) {
  for (const mediaType of adapter.supportedMediaTypes) {
    const request = fixtures[mediaType];
    for (const requirement of adapter.identifierRequirements[mediaType] ?? []) {
      assert.notEqual(
        request[requirement],
        undefined,
        `${adapter.id} fixture is missing ${requirement}`,
      );
    }
    await resolveOne(adapter.id, request);
  }
}

assert.equal(
  (await resolveOne("vidking", fixtures.movie)).url,
  "https://www.vidking.net/embed/movie/1212763?color=006fee&autoPlay=false&progress=137",
);
assert.equal(
  (await resolveOne("vidking", fixtures.tv)).url,
  "https://www.vidking.net/embed/tv/97546/1/1?color=f5a524&autoPlay=false&nextEpisode=true&episodeSelector=true&progress=137",
);
assert.equal(
  (await resolveOne("vidsrc-anime-sub", fixtures.anime)).url,
  "https://vidsrc.cc/v2/embed/anime/21/1/sub?autoPlay=false&autoSkipIntro=true",
);
assert.equal(
  (await resolveOne("dropfile-dub", fixtures.anime)).url,
  "https://dropfile.cc/player/tv/mal-21/1/1?audio=dub&lang=en&autoplay=0",
);
assert.equal(
  (await resolveOne("anime-autoembed", fixtures.anime)).url,
  "https://anime.autoembed.cc/embed/one-piece-episode-1",
);

const vidkingMovie = await resolveOne("vidking", fixtures.movie);
const vidlinkMovie = await resolveOne("vidlink", fixtures.movie);
assert.equal(vidkingMovie.capabilities.subtitles, "none");
assert.equal(vidlinkMovie.capabilities.subtitles, "native");

const selectionSources = [
  { ...vidkingMovie, availability: "available" },
  { ...vidlinkMovie, availability: "available" },
];
assert.equal(selectDefaultSource(selectionSources, {}).id, "vidking");
assert.equal(selectDefaultSource(selectionSources, { preferredSubtitle: "en" }).id, "vidlink");
assert.equal(
  selectDefaultSource(selectionSources, { defaultId: "vidking", preferredSubtitle: "en" }).id,
  "vidking",
);
assert.equal(
  selectDefaultSource(selectionSources, { requestedId: "vidking", preferredSubtitle: "en" }).id,
  "vidking",
);
assert.equal(
  selectDefaultSource(
    selectionSources.map((source) =>
      source.id === "vidlink" ? { ...source, availability: "failed" } : source,
    ),
    { preferredSubtitle: "en" },
  ).id,
  "vidking",
);

const orderedIds = (request) =>
  adapters
    .filter((adapter) => adapter.supports(request))
    .sort((a, b) => priorityFor(a, request) - priorityFor(b, request))
    .map((adapter) => adapter.id);

assert.deepEqual(orderedIds(fixtures.movie).slice(0, 3), ["vidking", "vidlink", "vidlink-alt"]);
assert.deepEqual(orderedIds(fixtures.tv).slice(0, 3), ["vidking", "vidlink", "vidlink-alt"]);
assert.deepEqual(orderedIds(fixtures.anime).slice(0, 3), [
  "vidsrc-anime-sub",
  "vidsrc-anime-dub",
  "megaplay-sub",
]);
assert.equal(byId.get("vidking").supports({ mediaType: "movie" }), false);
assert.equal(
  byId.get("dropfile-sub").supports({ mediaType: "anime", anilistId: 21, episode: 1 }),
  false,
);
assert.equal(
  byId.get("megaplay-sub").supports({ mediaType: "anime", malId: 21, episode: 1 }),
  true,
);

assert.equal(legacySourceId("movie", "0"), "vidlink");
assert.equal(legacySourceId("movie", "2"), "vidking");
assert.equal(legacySourceId("tv", "0"), "vidking");
assert.equal(legacySourceId("anime", "2"), "vidking");
assert.equal(legacySourceId("movie", "vidking"), "vidking");

register({
  id: "test-fast",
  label: "Test fast",
  supportedMediaTypes: ["movie"],
  identifierRequirements: { movie: ["tmdbId"] },
  priority: 2,
  supports: (request) => request.mediaType === "movie" && request.tmdbId !== undefined,
  resolve: async (request) => [
    {
      id: "test-fast",
      providerId: "test-fast",
      label: "Test fast",
      kind: "iframe",
      url: `https://example.com/movie/${request.tmdbId}`,
      providerOrigin: "https://example.com",
      mediaType: request.mediaType,
      priority: 2,
      capabilities: {},
    },
  ],
});

register({
  id: "test-timeout",
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
assert(groups.some((group) => group.adapterId === "test-timeout" && group.error));
assert.deepEqual(
  fallbackChain(groups).map((source) => source.id),
  ["test-fast"],
);

console.log(`Player source checks passed (${adapters.length} providers).`);
