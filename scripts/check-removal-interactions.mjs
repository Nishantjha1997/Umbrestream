import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const read = (path) => readFile(new URL(path, import.meta.url), "utf8");
const bookmark = await read("../src/components/ui/button/BookmarkButton.tsx");
const historyActions = await read("../src/components/ui/button/HistoryItemActions.tsx");
const phoneContinue = await read("../src/components/shell/phone/home/StillWatching.tsx");
const desktopContinue = await read("../src/components/shell/desktop/home/StillWatchingDesktop.tsx");
const phoneHero = await read("../src/components/shell/phone/home/ResumeHero.tsx");
const desktopHero = await read("../src/components/shell/desktop/home/DesktopHero.tsx");

for (const source of [bookmark, historyActions]) {
  assert.match(source, /onPointerDown=\{\(event\) => event\.stopPropagation\(\)\}/);
  assert.match(source, /onClick=\{\(event\) => \{[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);[\s\S]*\}\}/);
}

assert.match(bookmark, /updateWatchlistCache\(true\)/, "watchlist removal must update visible cache optimistically");
assert.match(bookmark, /Restored to watchlist/, "watchlist removal must offer Undo");
assert.match(historyActions, /querySnapshots/, "history removal must snapshot cache for rollback");
assert.match(historyActions, /setQueryData\(queryKey, old\)/, "history removal must roll back on server failure");
assert.match(historyActions, /restoreHistories/, "history removal must offer Undo when rows were deleted");

for (const source of [phoneContinue, desktopContinue, phoneHero, desktopHero]) {
  assert.match(source, /HistoryItemActions/, "every Continue Watching surface must use the guarded action control");
}

console.log("Removal interaction checks passed");
