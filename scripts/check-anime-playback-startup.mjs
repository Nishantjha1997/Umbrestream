import assert from "node:assert/strict";
import { createPublicEmbedSources } from "../src/lib/sources/adapters/embed.ts";

const anime = {
  mediaType: "anime",
  title: "One Piece",
  anilistId: 21,
  malId: 21,
  episode: 1,
  preferredAudio: "sub",
};

const sources = createPublicEmbedSources(anime);
const sourceIds = new Set(sources.map((source) => source.id));
const source = (id) => {
  const value = sources.find((candidate) => candidate.id === id);
  assert(value, `Missing anime startup source: ${id}`);
  return value;
};

assert.equal(
  sources.some((candidate) => candidate.id.startsWith("cinezo-anime-")),
  false,
  "Cinezo must not leak into the anime picker",
);
for (const id of ["vidrift-anime", "vidbolt-anime", "videasy-anime", "filmu-anime"]) {
  assert.equal(
    sources.some((candidate) => candidate.id === id),
    false,
    `${id} must not leak into the anime picker`,
  );
}
for (const id of [
  "vidnest-animepahe-sub",
  "vidnest-animepahe-dub",
  "vidlink-anime-sub",
  "vidlink-anime-dub",
  "anilink-sub",
  "anilink-dub",
  "vidsrc-anime-sub",
]) {
  assert(sourceIds.has(id), `Expected restored anime source ${id}`);
}

for (const id of [
  "vidnest-animepahe-sub",
  "vidnest-animepahe-dub",
  "vidlink-anime-sub",
  "vidlink-anime-dub",
  "anilink-sub",
  "anilink-dub",
  "vidsrc-anime-sub",
]) {
  const candidate = source(id);
  assert.equal(new URL(candidate.url).searchParams.get("autoplay"), "true", `${id} autoplay`);
  assert.equal(
    candidate.capabilities.iframe?.allow.includes("autoplay"),
    true,
    `${id} iframe autoplay`,
  );
}

assert.equal(source("vidnest-animepahe-sub").audioVariant, "sub");
assert.equal(source("vidnest-animepahe-dub").audioVariant, "dub");
assert.equal(source("anilink-sub").audioVariant, "sub");
assert.equal(source("anilink-dub").audioVariant, "dub");
assert.equal(source("vidlink-anime-sub").audioVariant, "sub");
assert.equal(source("vidlink-anime-dub").audioVariant, "dub");

const movieSources = createPublicEmbedSources({ mediaType: "movie", tmdbId: 1212763 });
const cinezoMovie = movieSources.find((candidate) => candidate.id === "cinezo");
const vidkingMovie = movieSources.find((candidate) => candidate.id === "vidking");
assert(cinezoMovie, "Cinezo movie source is missing");
assert(vidkingMovie, "VidKing movie source is missing");
assert.equal(new URL(cinezoMovie.url).searchParams.get("autoplay"), "true");
assert.equal(new URL(vidkingMovie.url).searchParams.get("autoPlay"), "true");

console.log(`Anime startup contract passed (${sources.length} anime sources).`);
