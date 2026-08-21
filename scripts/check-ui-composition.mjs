import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

const [
  desktopHeader,
  desktopHome,
  shell,
  playerHeader,
  animeDetail,
  animeOverview,
  modal,
  mobileApp,
  mobileCss,
] = await Promise.all([
  read("src/components/shell/desktop/Header.tsx"),
  read("src/components/shell/desktop/home/DesktopHome.tsx"),
  read("src/components/ui/layout/ImmersiveAppShell.tsx"),
  read("src/components/shell/PlayerRouteHeader.tsx"),
  read("src/components/sections/Anime/Detail/DetailContent.tsx"),
  read("src/components/sections/Anime/Detail/Overview.tsx"),
  read("src/components/shell/DetailModal.tsx"),
  read("mobile/app.js"),
  read("mobile/styles.css"),
]);

assert.doesNotMatch(desktopHeader, /HomeHeaderBackdrop|useHomeHero|getHighResolutionImageUrl/);
assert.match(desktopHeader, /absolute top-0 right-0 left-20 z-30/);
assert.ok(
  desktopHome.indexOf("<DesktopHero />") < desktopHome.indexOf("<AnimeModeEntry />"),
  "Home artwork must start before the optional Anime announcement",
);
assert.match(shell, /pathname === "\/" && "md:pt-0"/);

assert.match(shell, /<PlayerRouteHeader \/>/);
assert.doesNotMatch(shell, /<div className="player-route-header" aria-hidden="true"/);
for (const route of ["/", "/browse", "/anime", "/search"]) {
  assert.ok(playerHeader.includes(`href: "${route}"`) || playerHeader.includes(`href="${route}"`));
}
assert.match(playerHeader, /aria-label="Player navigation"/);

assert.match(animeDetail, /anime-detail-surface/);
assert.match(animeDetail, /overflow-x-clip/);
assert.match(animeDetail, /px-5 pb-12/);
assert.match(animeOverview, /pt-\[clamp\(14rem,34svh,19rem\)\]/);
assert.match(modal, /overflow-x-clip/);

assert.match(mobileApp, /<header class="player-route-header" aria-label="Player navigation">/);
assert.doesNotMatch(mobileApp, /player-route-header" aria-hidden="true"/);
assert.match(mobileCss, /html\.player-route \.app-header,[\s\S]*?display:none/);
assert.match(mobileCss, /\.detail-content\{position:relative;z-index:2;margin-top:-104px/);
assert.match(mobileCss, /\.anime-detail \.sticky-actions\{display:grid/);

console.log("UI composition contract passed");
