import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/**
 * Fails the build if a server-only secret reached the client bundle.
 *
 * `server-only` in lib/tmdb/client.ts already prevents the common mistake,
 * but a stray NEXT_PUBLIC_ prefix or a hand-rolled fetch would slip past it,
 * and the failure is silent — the app works fine while shipping your key to
 * every visitor. This makes it loud.
 */
const NEEDLES = [/TMDB_READ_TOKEN/, /api\.themoviedb\.org/, /\beyJ[A-Za-z0-9_-]{20,}/];
const ROOT = ".next/static";

async function* walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else if (entry.name.endsWith(".js")) yield path;
  }
}

const leaks = [];
for await (const file of walk(ROOT)) {
  const text = await readFile(file, "utf8");
  for (const needle of NEEDLES) {
    if (needle.test(text)) leaks.push(`${file}  ←  ${needle}`);
  }
}

if (leaks.length > 0) {
  console.error("\n  SECRET LEAKED INTO CLIENT BUNDLE:\n");
  for (const leak of leaks) console.error(`   ${leak}`);
  console.error("");
  process.exit(1);
}

console.log("  No secrets found in client bundle.");
