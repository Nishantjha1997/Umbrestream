import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const shell = await read("../src/components/player/PlayerShell.tsx");
const styles = await read("../src/styles/globals.css");
const movie = await read("../src/components/sections/Movie/Player/Player.tsx");
const tv = await read("../src/components/sections/TV/Player/Player.tsx");
const anime = await read("../src/components/sections/Anime/Player/Player.tsx");
const animeControls = await read("../src/components/sections/Anime/Player/AnimePlayerControls.tsx");
const movieControls = await read("../src/components/sections/Movie/Player/MoviePlayerControls.tsx");
const displayToggle = await read("../src/components/player/PlayerDisplayModeToggle.tsx");

assert.match(shell, /PLAYER_DISPLAY_STORAGE_KEY/);
assert.match(shell, /localStorage\.getItem\(PLAYER_DISPLAY_STORAGE_KEY\)/);
assert.match(shell, /localStorage\.setItem\(PLAYER_DISPLAY_STORAGE_KEY, mode\)/);
assert.match(shell, /const canUseFillMode = Boolean\(selectedSource && selectedSource\.kind !== "iframe"\)/);
assert.match(shell, /const effectiveDisplayMode:[\s\S]*canUseFillMode \? displayMode : "fit"/);
assert.match(shell, /if \(mode === "fill" && !canUseFillMode\) return/);
assert.match(shell, /className=\{`player-shell player-shell-\$\{effectiveDisplayMode\}/);
assert.match(shell, /className="player-shell-frame absolute inset-0 h-full w-full border-0"/);
assert.match(shell, /key=\{`\$\{selectedSource\.id\}:\$\{selectedSourceUrl\}`\}/);
assert.doesNotMatch(shell, /key=\{`[^`]*displayMode/);
assert.match(shell, /requestFullscreen\?\.\(\{ navigationUI: "hide" \}\)/);
assert.match(shell, /const entering = !isFullscreen && !document\.fullscreenElement/);
assert.match(shell, /aria-label="Exit full screen"/);
assert.match(shell, /aria-hidden=\{chromeHidden \|\| undefined\}[\s\S]*inert=\{chromeHidden \|\| undefined\}/);
assert.match(shell, /\(!inlineLayout \|\| isFullscreen\)/);
assert.match(shell, /lockLandscape\?\.\(\)/);
assert.match(shell, /lockPortrait\?\.\(\)/);
assert.match(shell, /document\.addEventListener\("visibilitychange", restoreAfterBackground\)/);
assert.match(shell, /window\.addEventListener\("pagehide", restoreAfterBackground\)/);
assert.match(shell, /sourceOpenerRef\.current\?\.focus\(\)/);

assert.match(styles, /\.player-shell-frame[\s\S]*border:\s*0\s*!important/);
assert.match(styles, /\.player-shell-frame[\s\S]*transform:\s*none\s*!important/);
assert.doesNotMatch(styles, /\.player-shell-fill \.player-shell-frame/);
assert.doesNotMatch(styles, /transform:scale\(/);
assert.match(
  styles,
  /\.player-shell-fill video \{[\s\S]*?object-fit:\s*cover\s*!important;[\s\S]*?transform:\s*none\s*!important;[\s\S]*?\}/,
);
assert.match(
  styles,
  /\.player-shell-fit video \{[\s\S]*?object-fit:\s*contain\s*!important;[\s\S]*?transform:\s*none\s*!important;[\s\S]*?\}/,
);
assert.match(styles, /\.player-shell-fullscreen \.player-content-header/);
assert.match(styles, /\.player-controls-reveal \{[\s\S]*top: 50%;[\s\S]*transform: translateY\(-50%\)/);
assert.match(
  styles,
  /\.player-shell \{[\s\S]*?isolation:\s*isolate;[\s\S]*?contain:\s*layout paint;[\s\S]*?\}/,
);

assert.match(movie, /mediaType: "movie"/);
assert.match(tv, /mediaType: "tv"[\s\S]*season,[\s\S]*episode:/);
assert.match(anime, /mediaType: "anime"[\s\S]*episode,[\s\S]*preferredAudio: audio/);
assert.match(animeControls, /new URLSearchParams\(\{ audio \}\)/);
assert.match(displayToggle, /disabled=\{disabled\}/);
assert.match(displayToggle, /min-h-11 min-w-11/);
assert.match(displayToggle, /Fill is unavailable for this embedded server/);
assert.match(movieControls, /href=\{`\/movie\/\$\{movie\.id\}`\}/);
assert.match(movieControls, /max-sm:basis-full/);
assert.match(movieControls, /min-h-11 min-w-11/);

console.log("Player display and episode-context checks passed");
