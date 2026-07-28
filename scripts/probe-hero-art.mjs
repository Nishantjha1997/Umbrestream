// Does the hero's w500 -> w1280 string replace actually produce a valid URL?
import { readFileSync } from "node:fs";

const env = readFileSync(
  "c:/Users/ADMIN/Desktop/Projects/My Web Sites/umbra/.env.local",
  "utf8",
);
const token = env.match(/^TMDB_ACCESS_TOKEN=(.+)$/m)?.[1]?.trim();

const res = await fetch("https://api.themoviedb.org/3/trending/all/day?language=en-US", {
  headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
});
const json = await res.json();

// Mirrors getImageUrl() in src/utils/movies.ts exactly.
const getImageUrl = (path, size = "w500") =>
  path ? `https://image.tmdb.org/t/p/${size}/${path}` : "(fallback)";

// Mirrors heroArt() in src/components/media/Hero.tsx exactly.
const heroArt = (url) => url.replace("/t/p/w500/", "/t/p/w1280/");

const first = (json.results ?? [])
  .filter((r) => r.media_type !== "person" && r.backdrop_path)
  .slice(0, 3);

for (const item of first) {
  const normalized = getImageUrl(item.backdrop_path);
  const upgraded = heroArt(normalized);
  const changed = normalized !== upgraded;

  const head = await fetch(upgraded, { method: "HEAD" });
  console.log(`${item.title ?? item.name}`);
  console.log(`  raw path : ${item.backdrop_path}`);
  console.log(`  normalized: ${normalized}`);
  console.log(`  upgraded  : ${upgraded}`);
  console.log(`  replace worked: ${changed}   HTTP ${head.status}`);
}
