import { readdir, readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";

const root = process.cwd();
const failures = [];

const read = (path) => readFile(resolve(root, path), "utf8");
const requireText = (text, pattern, message) => {
  if (!pattern.test(text)) failures.push(message);
};
const forbidText = (text, pattern, message) => {
  if (pattern.test(text)) failures.push(message);
};

const [layout, providers, nativePlayer, photos, movieClient, animePage, config] = await Promise.all([
  read("src/app/layout.tsx"),
  read("src/app/providers.tsx"),
  read("src/components/player/NativePlayer.tsx"),
  read("src/components/ui/other/PhotosSection.tsx"),
  read("src/app/movie/[id]/player/MoviePlayerClient.tsx"),
  read("src/app/anime/[id]/player/[episode]/page.tsx"),
  read("next.config.ts"),
]);

// Player-only engines must not become root-layout dependencies. The native
// player keeps the heavy media engines behind the actual source-kind branch.
forbidText(layout, /(?:hls\.js|dashjs|yet-another-react-lightbox|NativePlayer|PlayerShell)/, "root layout imports player-only code");
requireText(nativePlayer, /await import\("hls\.js"\)/, "HLS must load dynamically");
requireText(nativePlayer, /await import\("dashjs"\)/, "DASH must load dynamically");
forbidText(nativePlayer, /from ["'](?:hls\.js|dashjs)["']/, "native player has a static media-engine import");
requireText(photos, /dynamic\(\(\) => import\("@\/components\/ui\/overlay\/Gallery"\), \{ ssr: false \}\)/, "gallery must remain a client-only feature split");
requireText(providers, /process\.env\.NODE_ENV === "development"/, "query devtools are not development-gated");
requireText(providers, /dynamic\(\s*\(\) => import\("@tanstack\/react-query-devtools"\)/s, "query devtools must load dynamically");
// The movie route intentionally keeps metadata/resume loading in the Server
// Component and places the browser-only player boundary in its client wrapper.
// Validate the actual dynamic boundary rather than requiring it in the page
// file, which would either duplicate the wrapper or violate Next's server
// component constraints.
requireText(movieClient, /dynamic\(\(\) => import\("@\/components\/sections\/Movie\/Player\/Player"\)/, "movie player is not route-split");
requireText(animePage, /dynamic\(\(\) => import\("@\/components\/sections\/Anime\/Player\/Player"\)/, "anime player is not route-split");

// The PWA must wait for explicit user acceptance, and downloads must never be
// included in the application-shell precache.
requireText(config, /skipWaiting: false/, "PWA worker is configured to auto-activate");
requireText(config, /!downloads\/\*\.apk/, "APK downloads are not excluded from precache");

const chunksDir = resolve(root, ".next/static/chunks");
let chunkFiles = [];
try {
  chunkFiles = (await readdir(chunksDir)).filter((file) => file.endsWith(".js"));
} catch {
  failures.push(".next/static/chunks is missing; run the production build before the performance audit");
}

const chunkStats = await Promise.all(
  chunkFiles.map(async (file) => ({ file, bytes: (await stat(resolve(chunksDir, file))).size })),
);
const totalBytes = chunkStats.reduce((sum, item) => sum + item.bytes, 0);
const largest = [...chunkStats].sort((a, b) => b.bytes - a.bytes).slice(0, 5);

if (!chunkFiles.length || totalBytes <= 0) failures.push("production JavaScript bundle is empty");

if (failures.length) {
  for (const failure of failures) console.error(`[performance-contract] ${failure}`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      chunkCount: chunkFiles.length,
      totalJavaScriptBytes: totalBytes,
      largestChunks: largest,
      verified: [
        "player-only media engines are dynamically loaded",
        "gallery and query devtools remain feature/development split",
        "PWA update activation is user-controlled",
        "APK downloads are excluded from precache",
        "active movie/anime player routes are dynamically split",
      ],
    },
    null,
    2,
  ),
);
