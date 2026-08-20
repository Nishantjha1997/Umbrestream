import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const shell = await read("../src/components/player/PlayerShell.tsx");
const styles = await read("../src/styles/globals.css");
const movie = await read("../src/components/sections/Movie/Player/Player.tsx");
const tv = await read("../src/components/sections/TV/Player/Player.tsx");
const anime = await read("../src/components/sections/Anime/Player/Player.tsx");
const animeControls = await read("../src/components/sections/Anime/Player/AnimePlayerControls.tsx");

assert.match(shell, /PLAYER_DISPLAY_STORAGE_KEY/);
assert.match(shell, /localStorage\.getItem\(PLAYER_DISPLAY_STORAGE_KEY\)/);
assert.match(shell, /localStorage\.setItem\(PLAYER_DISPLAY_STORAGE_KEY, mode\)/);
assert.match(shell, /className=\{`player-shell player-shell-\$\{displayMode\}/);
assert.match(shell, /className="player-shell-frame absolute inset-0 h-full w-full border-0"/);
assert.match(shell, /key=\{`\$\{selectedSource\.id\}:\$\{selectedSourceUrl\}`\}/);
assert.doesNotMatch(shell, /key=\{`[^`]*displayMode/);
assert.match(shell, /requestFullscreen\?\.\(\{ navigationUI: "hide" \}\)/);
assert.match(shell, /const entering = !isFullscreen && !document\.fullscreenElement/);
assert.match(shell, /aria-label="Exit full screen"/);
assert.match(shell, /lockLandscape\?\.\(\)/);
assert.match(shell, /lockPortrait\?\.\(\)/);
assert.match(shell, /document\.addEventListener\("visibilitychange", restoreAfterBackground\)/);
assert.match(shell, /window\.addEventListener\("pagehide", restoreAfterBackground\)/);
assert.match(shell, /sourceOpenerRef\.current\?\.focus\(\)/);

assert.match(styles, /\.player-shell-frame[\s\S]*border:0!important/);
assert.match(styles, /\.player-shell-fill \.player-shell-frame[\s\S]*transform:scale\(1\.12\)/);
assert.match(styles, /\.player-shell-fit \.player-shell-frame[\s\S]*transform:none/);
assert.match(styles, /\.player-shell \{ isolation:isolate; contain:layout paint; \}/);

assert.match(movie, /mediaType: "movie"/);
assert.match(tv, /mediaType: "tv"[\s\S]*season,[\s\S]*episode:/);
assert.match(anime, /mediaType: "anime"[\s\S]*episode,[\s\S]*preferredAudio: audio/);
assert.match(animeControls, /new URLSearchParams\(\{ audio \}\)/);

console.log("Player display and episode-context checks passed");
