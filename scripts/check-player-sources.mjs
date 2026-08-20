import assert from "node:assert/strict";
import { createDirectAdapter } from "../src/lib/sources/adapters/direct.ts";
import {
  createEmbedAdapters,
  createPublicEmbedSources,
} from "../src/lib/sources/adapters/embed.ts";
import { legacySourceId } from "../src/lib/sources/legacy.ts";
import { fallbackChain, register, resolveAll } from "../src/lib/sources/registry.ts";
import { selectDefaultSource } from "../src/lib/sources/selectDefault.ts";
import {
  findNextFallbackSource,
  findPreferredSource,
  PLAYBACK_POLICY,
} from "../src/lib/sources/playbackPolicy.ts";

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
  (await resolveOne("anilink-sub", fixtures.anime)).url,
  "https://anilink.cc/watch/21/1?variant=sub&autoplay=false&autoNext=true&startAt=137&primaryColor=a855f7&secondaryColor=0f1014&iconColor=ffffff",
);
assert.equal(
  (await resolveOne("anilink-dub", fixtures.anime)).url,
  "https://anilink.cc/watch/21/1?variant=dub&autoplay=false&autoNext=true&startAt=137&primaryColor=a855f7&secondaryColor=0f1014&iconColor=ffffff",
);
assert.equal(
  (await resolveOne("vidnest-animepahe-sub", fixtures.anime)).url,
  "https://vidnest.fun/animepahe/21/1/sub?startAt=137",
);
assert.equal(
  (await resolveOne("vidnest-animepahe-dub", fixtures.anime)).url,
  "https://vidnest.fun/animepahe/21/1/dub?startAt=137",
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
  "vidsrc",
]);
// VidKing is the verified TV default. Experimental VidSrc is listed after the
// stable providers; Filmu remains the final TV candidate on this fixture.
assert.deepEqual(orderedIds(fixtures.tv), [
  "vidking",
  "cinezo",
  "vidlink",
  "vidlink-native",
  "vidrift",
  "vidbolt",
  "videasy",
  "vidsrc",
  "filmu",
]);
assert.deepEqual(orderedIds(fixtures.anime), [
  "vidnest-animepahe-sub",
  "vidnest-animepahe-dub",
  "cinezo-anime-sub",
  "cinezo-anime-dub",
  "anilink-sub",
  "anilink-dub",
  "vidsrc-anime-sub",
]);

const instantStartedAt = performance.now();
const instantMovie = createPublicEmbedSources(fixtures.movie);
assert(
  performance.now() - instantStartedAt < 100,
  "Public manifest should be synchronous and fast",
);
assert.equal(instantMovie[0].id, "filmu");
assert(instantMovie.every((source) => source.availability === "unverified"));
assert.equal(PLAYBACK_POLICY.timeoutMs, 20_000);
assert.equal(PLAYBACK_POLICY.fallbackMode, "prompt");
assert.equal(findPreferredSource(instantMovie, { rememberedId: "cinezo" })?.id, "cinezo");
assert.equal(findNextFallbackSource(instantMovie, "filmu", ["filmu"])?.id, "cinezo");

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

for (const anilistId of [21, 20, 101922]) {
  const fixture = { ...fixtures.anime, anilistId, malId: undefined };
  assert.equal(byId.get("anilink-sub").supports(fixture), true);
  assert.equal(byId.get("vidnest-animepahe-sub").supports(fixture), true);
}

assert.equal(legacySourceId("movie", "0"), "vidlink");
assert.equal(legacySourceId("movie", "2"), "vidking");
assert.equal(legacySourceId("anime", "0"), "anilink-sub");
assert.equal(legacySourceId("movie", "vidlink-alt"), "vidlink-native");
assert.equal(legacySourceId("anime", "vidlink"), "anilink-sub");
assert.equal(legacySourceId("anime", "cinezo-anime-dub"), "anilink-dub");

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
