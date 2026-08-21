import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const info = await read("../src/components/sections/Movie/Player/MoviePlayerInfo.tsx");
const player = await read("../src/components/sections/Movie/Player/Player.tsx");
const suggestions = await read("../src/components/sections/Movie/Player/MoviePlayerSuggestions.tsx");
const header = await read("../src/components/shell/desktop/Header.tsx");
const shell = await read("../src/components/ui/layout/ImmersiveAppShell.tsx");

assert.match(info, /aria-controls="movie-player-details"/);
assert.match(info, /setDetailsExpanded/);
assert.doesNotMatch(info, /<Link[\s\S]*movie\.id/);
assert.match(player, /MoviePlayerSuggestions/);
assert.match(player, /lg:grid-cols-\[minmax\(0,1fr\)_clamp\(280px,24vw,360px\)\]/);
assert.match(suggestions, /Promise\.all/);
assert.match(suggestions, /More like this/);
assert.match(suggestions, /Trending now/);
assert.match(suggestions, /never enters the fullscreen element/);
assert.match(header, /HomeHeaderBackdrop/);
assert.match(shell, /<DesktopHeader isHome=\{pathname === "\/"\} \/>/);

console.log("Movie player workspace checks passed");
