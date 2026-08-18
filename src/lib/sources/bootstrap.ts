import { createDirectAdapter, type DirectEntry } from "./adapters/direct";
import { createEmbedAdapters } from "./adapters/embed";
import { createAnimeRemoteAdapters } from "./adapters/animeRemote";
import { isRegistered, register } from "./registry";

/**
 * Single place where source adapters are wired up.
 *
 * Import this module once from anywhere that resolves streams (the watch
 * route already does). Registration is idempotent per process because
 * `register()` throws on a duplicate id and module evaluation happens once.
 */

// Point the reference adapter at files you already have. Empty by default,
// so a fresh checkout renders the "no sources" state rather than pretending.
function directLibrary(): DirectEntry[] {
  const raw = process.env.PLAYER_DIRECT_SOURCES_JSON;
  if (!raw) return [];

  try {
    const entries: unknown = JSON.parse(raw);
    if (!Array.isArray(entries)) throw new Error("Expected a JSON array");
    return entries.filter((entry): entry is DirectEntry => {
      if (!entry || typeof entry !== "object") return false;
      const candidate = entry as Partial<DirectEntry>;
      if (typeof candidate.url !== "string") return false;
      try {
        const url = new URL(candidate.url);
        return url.protocol === "https:" || url.hostname === "localhost";
      } catch {
        return false;
      }
    });
  } catch (error) {
    console.warn(
      "Ignoring invalid PLAYER_DIRECT_SOURCES_JSON:",
      error instanceof Error ? error.message : error,
    );
    return [];
  }
}

const LIBRARY = directLibrary();

// Guard on the registry itself, not a module-local flag — in dev this module
// re-evaluates on HMR and a local flag would reset while the map may not.
if (!isRegistered("direct")) {
  register(createDirectAdapter(LIBRARY));
}

for (const adapter of createEmbedAdapters()) {
  if (!isRegistered(adapter.id)) register(adapter);
}

for (const adapter of createAnimeRemoteAdapters()) {
  if (!isRegistered(adapter.id)) register(adapter);
}
