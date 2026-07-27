# Source adapters

Everything that can produce a playable stream implements one interface. The
player, the server dropdown, and the fallback chain talk to that interface and
nothing else — so adding a backend is one new file plus one `register()` call,
with no changes anywhere else in the app.

## The contract

```ts
interface SourceAdapter {
  id: string;
  label: string;                                  // shown in the dropdown
  priority: number;                               // lower sorts first
  supports(req: SourceRequest): boolean;          // cheap, synchronous
  resolve(req: SourceRequest, signal?: AbortSignal): Promise<StreamCandidate[]>;
}
```

`SourceRequest` carries whatever identifiers are known — `tmdbId`, `imdbId`,
`anilistId`, plus `season`/`episode` for episodic content, and the user's
preferred audio and subtitle languages.

`StreamCandidate` is what you return: a `url`, a `kind` of `hls` | `mp4` |
`iframe`, a display `label`, an optional numeric `quality` used for sorting,
and optional `audioTracks` / `subtitleTracks`.

## Writing one

See [`adapters/direct.ts`](./adapters/direct.ts) for a complete worked example.
The shape is:

```ts
import type { SourceAdapter } from "../types";

export const myAdapter: SourceAdapter = {
  id: "my-source",
  label: "My Source",
  priority: 10,

  supports(req) {
    return req.mediaType === "movie" && req.tmdbId !== undefined;
  },

  async resolve(req, signal) {
    const res = await fetch(`https://example.test/api/${req.tmdbId}`, { signal });
    if (!res.ok) throw new Error(`Upstream ${res.status}`);
    const data = await res.json();

    return data.streams.map((s: { file: string; height: number }, i: number) => ({
      id: `my-source-${i}`,
      label: `${s.height}p`,
      kind: s.file.endsWith(".m3u8") ? "hls" : "mp4",
      url: s.file,
      quality: s.height,
    }));
  },
};
```

Then register it once at startup:

```ts
import { register } from "@/lib/sources/registry";
import { myAdapter } from "@/lib/sources/adapters/my-source";

register(myAdapter);
```

## Rules the registry relies on

- **Throw on failure, don't return `[]` silently.** `resolveAll()` catches per
  adapter and surfaces the message on that dropdown entry. Returning an empty
  array instead makes a broken backend look like a title with no sources.
- **Honour `signal`.** The player aborts in-flight resolution when the user
  switches title. Un-abortable adapters leak requests.
- **Keep `supports()` synchronous and cheap.** It runs for every adapter on
  every resolve; it exists to avoid firing requests that cannot succeed.
- **Never put a secret in an adapter that runs client-side.** If a backend
  needs a key, resolve it in a route handler under `src/app/api/` and have the
  adapter call your own endpoint — the same pattern as the TMDB proxy.
- **Return `kind: "iframe"` only when there is genuinely no extractable file
  URL.** Iframe sources can't participate in track selection or progress
  reporting, so the player degrades to a bare embed with none of the app's
  features working.

## What ships here

`direct` — maps a title to a file you already have (local HLS manifest, MP4 on
a NAS, anything reachable by URL). It's the reference implementation.

Any further adapters are yours to add. I've built the extension point and
documented it, but I'm not writing integrations against services that serve
unlicensed content — that's the one part of this project I'll leave to you
rather than author myself.
