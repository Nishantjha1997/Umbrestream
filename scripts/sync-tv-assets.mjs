import { copyFile, mkdir } from "node:fs/promises";
import { resolve, sep } from "node:path";

const root = resolve(import.meta.dirname, "..");
const source = resolve(root, "tv");
const destination = resolve(root, "android-tv", "app", "src", "main", "assets", "public");

if (!source.startsWith(`${root}${sep}`) || !destination.startsWith(`${root}${sep}`)) {
  throw new Error("TV asset sync escaped the repository root");
}

await mkdir(destination, { recursive: true });
await Promise.all(
  ["index.html", "styles.css", "app.bundle.js"].map((name) =>
    copyFile(resolve(source, name), resolve(destination, name)),
  ),
);

console.log("Synced StreamFree TV web assets into android-tv.");
