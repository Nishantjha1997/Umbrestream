import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFile(resolve(root, path), "utf8");
const [worker, config, notice] = await Promise.all([
  read("public/sw.js"),
  read("next.config.ts"),
  read("src/components/pwa/PwaUpdateNotice.tsx"),
]);

const failures = [];
const requireText = (text, pattern, message) => {
  if (!pattern.test(text)) failures.push(message);
};
const forbidText = (text, pattern, message) => {
  if (pattern.test(text)) failures.push(message);
};

// A worker must wait for an explicit user decision. The minified Workbox
// message listener is expected; the old unconditional form is not.
requireText(worker, /addEventListener\("message".*SKIP_WAITING/s, "worker has no explicit update activation message");
forbidText(worker, /self\.skipWaiting\(\),e\.clientsClaim\(\)/, "worker still auto-activates unconditionally");
forbidText(worker, /\/downloads\/[^"']+\.apk/i, "APK is included in the PWA precache");

// Data and documents must prefer fresh deployments, while immutable hashed
// JavaScript remains cache-first. These are generated-workbox smoke contracts.
requireText(worker, /cacheName:"apis".*NetworkFirst/s, "API requests are not Network First");
requireText(worker, /cacheName:"pages".*NetworkFirst/s, "document navigation is not Network First");
requireText(worker, /cacheName:"next-static-js-assets".*CacheFirst/s, "hashed Next assets are not Cache First");

requireText(config, /cacheOnFrontEndNav: false/, "front-end navigation caching is enabled");
requireText(config, /aggressiveFrontEndNavCaching: false/, "aggressive front-end navigation caching is enabled");
requireText(notice, /navigator\.serviceWorker\.getRegistration\(\)/, "update notice does not inspect the active registration");
requireText(notice, /next\.update\(\)/, "update notice does not request a fresh worker check");
requireText(notice, /addEventListener\("updatefound"/, "update notice does not observe late worker discovery");
requireText(notice, /postMessage\(\{ type: "SKIP_WAITING" \}\)/, "update notice cannot activate an accepted update");

if (failures.length) {
  for (const failure of failures) console.error(`[pwa-contract] ${failure}`);
  process.exit(1);
}

console.log("[pwa-contract] generated worker freshness, caching, and update-ready flow passed");
