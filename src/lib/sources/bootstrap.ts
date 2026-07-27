import { createDirectAdapter, type DirectEntry } from "./adapters/direct";
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
const LIBRARY: DirectEntry[] = [
  // { tmdbId: 27205, url: "http://localhost:8080/inception.mp4", quality: 1080 },
];

// Guard on the registry itself, not a module-local flag — in dev this module
// re-evaluates on HMR and a local flag would reset while the map may not.
if (!isRegistered("direct")) {
  register(createDirectAdapter(LIBRARY));
}
