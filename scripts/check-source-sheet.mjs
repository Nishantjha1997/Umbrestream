import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  beginSourceSelection,
  finishSourceSelection,
  isSourceActivationKey,
} from "../src/lib/player/sourceInteraction.ts";

const activationKeys = ["Enter", " "];
for (const key of activationKeys) {
  assert.equal(isSourceActivationKey(key), true, `${JSON.stringify(key)} must activate a source control`);
}
for (const key of ["Escape", "Tab", "ArrowDown", "a"]) {
  assert.equal(isSourceActivationKey(key), false, `${JSON.stringify(key)} must not activate a source control`);
}

let inFlight = null;
let committed = 0;
const selectOnce = (sourceId) => {
  const nextInFlight = beginSourceSelection(inFlight, sourceId);
  if (nextInFlight !== sourceId) return;
  inFlight = nextInFlight;
  committed += 1;
};

selectOnce("filmu");
selectOnce("filmu");
selectOnce("cinezo");
assert.equal(committed, 1, "rapid activation must commit only the first source while it is pending");
assert.equal(inFlight, "filmu");

inFlight = finishSourceSelection(inFlight, "cinezo");
assert.equal(inFlight, "filmu", "a different source completion must not clear the active selection");
inFlight = finishSourceSelection(inFlight, "filmu");
assert.equal(inFlight, null);

selectOnce("cinezo");
assert.equal(committed, 2, "a new source may be selected after the previous selection completes");

const sourceSheet = await readFile(new URL("../src/components/player/PlayerSourceSheet.tsx", import.meta.url), "utf8");
const playerShell = await readFile(new URL("../src/components/player/PlayerShell.tsx", import.meta.url), "utf8");
const playerPanel = await readFile(new URL("../src/components/player/PlayerPanel.tsx", import.meta.url), "utf8");
const actionButton = await readFile(
  new URL("../src/components/ui/button/PlayerActionButton.tsx", import.meta.url),
  "utf8",
);

for (const marker of ["onPointerDown", "onClick", "onKeyDown", "selectionInFlightRef"]) {
  assert.match(sourceSheet, new RegExp(marker), `source rows must implement ${marker}`);
}
assert.match(playerShell, /sourceOpenerRef\.current\?\.focus\(\)/, "closing the source sheet must restore opener focus");
assert.match(playerShell, /sourceOpenerRef\.current\s*=\s*document\.activeElement/, "opening the source sheet must remember its opener");
assert.match(playerPanel, /role=\"dialog\"/, "desktop source sheet must expose a dialog semantics boundary");
assert.match(actionButton, /isSourceActivationKey\(event\.key\)/, "shared player action buttons must support keyboard activation");

console.log("Source-sheet interaction checks passed");
