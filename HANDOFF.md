# Umbra — Outstanding Work

Handoff notes. Ordered by priority. File paths are relative to the repo root.

Repo: https://github.com/Nishantjha1997/Umbrestream

---

## 0. Read first: environment

**This machine has a system-level fault that will waste your time if you don't
know about it.** Node, Next's build workers, Turbopack, the Supabase CLI, and
even a signed Microsoft installer all crash identically with `0xC0000005`
(access violation), plus intermittent `EPERM on uv_spawn`. It is not the code —
the same commits build fine elsewhere.

Consequences already worked around in the repo:

- `package.json` pins `dev` and `build` to `--webpack`; Turbopack crashes instantly.
- `next.config.ts` sets `typescript.ignoreBuildErrors: true`, because Next runs
  `tsc` in a forked worker that segfaults.

**Therefore: a green `next build` is NOT a green typecheck here.** Always run
`npm run typecheck` separately. It runs in-process and works reliably.

If a command dies with `0xC0000005` or `EPERM`, just retry it — often it
succeeds on the second or third attempt.

**Worth fixing properly.** Check Event Viewer → Windows Logs → Application for
the Application Error entry and read the **faulting module name**. Usual
suspects, in order: security software hooking process creation, a corrupted
Visual C++ runtime (`sfc /scannow`, then
`DISM /Online /Cleanup-Image /RestoreHealth`), or failing RAM (`mdsched.exe`).
Once fixed, remove both workarounds above.

---

## 1. Deploy to Vercel

Not done. The repo is pushed and ready.

1. Import the GitHub repo at vercel.com.
2. Add these env vars in Vercel (values are in local `.env.local`, which is
   correctly gitignored — copy them across manually):
   - `TMDB_ACCESS_TOKEN` — server-only, **no** `NEXT_PUBLIC_` prefix
   - `SUPABASE_SERVICE_ROLE_KEY` — server-only
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `PROTECTED_PATHS` (optional, has a default)
3. Set the build command to `next build --webpack` **only if** Vercel's build
   also fails on Turbopack. It probably won't — the Turbopack crash is specific
   to the dev machine, so try the default first and drop the flag if it works.
4. After deploying, add the Vercel URL to Supabase → Authentication → URL
   Configuration → Site URL / Redirect URLs, or email confirmation links will
   point at localhost.

**Do not** move `TMDB_ACCESS_TOKEN` or `SUPABASE_SERVICE_ROLE_KEY` to
`NEXT_PUBLIC_`. See §6.

---

## 2. Wire anime into watch history and watchlist

The database is ready — `histories.type` and `watchlist.type` both accept
`'anime'` (migration `supabase/migrations/20260727120000_add_anime_type.sql`,
already applied to the live project). The application code is not.

### `src/actions/histories.ts`

- Line ~47 has a hard gate: `if (!["movie", "tv"].includes(data.mediaType))`.
  Add `"anime"`.
- Line ~54 fetches metadata via the server-only `tmdb` client. Anime needs a
  branch calling `anilistApi.details()` from `src/api/anilist.ts` instead.
- Add a `getAnimeLastPosition(id, episode)` alongside the existing
  `getMovieLastPosition` / `getTvShowLastPosition`. Anime has no seasons, so
  store the episode in the `episode` column and leave `season` at `0`.

**Non-obvious gotcha — this will bite you.** TMDB returns *relative* image
paths (`/abc123.jpg`) and the app prepends a base URL via `getImageUrl()` in
`src/utils/movies.ts`. AniList returns **full absolute URLs**
(`https://s4.anilist.co/...`). If you write AniList URLs straight into
`poster_path`/`backdrop_path`, every anime entry in the library and history UI
will render a broken image, because `getImageUrl()` will prefix them again.
Either store them in a distinguishable way, or make `getImageUrl()` pass
through anything already starting with `http`.

Also map: `release_date` ← `startDate` (which is `{year, month, day}` with any
field possibly null, so build the date defensively) and `vote_average` ←
`averageScore / 10` (AniList scores 0–100, the column is `numeric(4,1)`).

### Bookmark / watchlist UI

`src/components/ui/button/BookmarkButton.tsx` and the `ContentType` type in
`src/types/index.ts` are currently `"movie" | "tv"`. Widen to include
`"anime"`, then add the bookmark button to the anime detail page
(`src/components/sections/Anime/Detail/Overview.tsx`) — it was deliberately
left off pending this work.

---

## 3. Personalized recommendation engine

From the original brief; never built. Nothing exists for this yet.

Intended design: read the user's `histories` rows, weight them, derive a genre
affinity profile, and query TMDB `/discover` weighted by it.

```ts
const recency    = Math.pow(0.5, ageDays / 30);       // 30-day half-life
const completion = Math.min(1, percentWatched / 80);  // abandoned != watched
const replay     = 1 + Math.log2(Math.max(1, playCount));
const weight     = recency * completion * replay;
```

Then blend the weighted `/discover` results with `/recommendations` from the
top few seed titles, and dedupe against everything already watched.

Two practical notes:

- `histories` stores no genre data, so you either need a TMDB call per history
  row (slow) or a small `titles_cache` table storing `genre_ids` per title.
  The cache is the right call — it turns this into a single query.
- Cold start: a user with no history must fall back to Trending rather than
  erroring or rendering an empty row.

Surface it as a "For You" row on the home page, following the existing
`src/components/sections/Movie/HomeList.tsx` row pattern.

---

## 4. Audio / subtitle track selection

From the original brief; never built, and **it's blocked by an architectural
constraint worth understanding before you promise it to anyone.**

The movie/TV players are third-party `<iframe>` embeds
(`src/utils/players.ts`). You cannot reach inside a cross-origin iframe to
enumerate or switch audio and subtitle tracks — the browser's same-origin
policy prevents it, and no amount of code changes that.

Real options, in order of effort:

1. Some embed providers accept a language hint as a URL query parameter. Check
   each provider's own docs. Limited and inconsistent, but cheap.
2. Play actual video files through a real player (`hls.js` is already a
   dependency, and `src/lib/sources/` has a `SourceAdapter` interface built for
   exactly this). A real `<video>` element exposes `audioTracks` and
   `textTracks`, so full selection becomes possible.
3. Sidecar subtitles from an external subtitle API, rendered as `<track>`
   elements over your own player. Only works with option 2.

Don't attempt this against iframes. It cannot work.

---

## 5. Anime discovery page

`/anime/discover` is currently a **stub link** — the "See All" links on
`/anime` point at it and it 404s.

The existing `/discover` is TMDB-only: `useDiscoverFilters`
(`src/hooks/useDiscoverFilters.ts`) validates its `type` param against
movie/TV-specific literals in `src/types/movie.ts`. It can't be reused as-is.

Either build a parallel anime filter page using `anilistApi` (AniList supports
genre, year, season, format, and status filters), or change the "See All" links
in `src/components/sections/Anime/HomeList.tsx` to something that exists.
Either is fine — just don't leave it 404ing.

Related: global search (`/search`) is TMDB-only and doesn't return anime.
`anilistApi.search(query, page)` already exists and works; it needs wiring into
the search UI as an additional result section or tab.

---

## 6. Security — do not regress this

The TMDB access token was originally exposed to every visitor. It's now
server-side, and the guards keeping it that way are deliberate:

- `src/api/tmdb.ts` starts with `import "server-only"`. This makes the build
  **fail** if a Client Component imports it. That's the point. If you hit that
  error, the fix is to route the call through `src/api/tmdb-browser.ts` (which
  proxies via `/api/tmdb`), **not** to delete the `server-only` import.
- `src/app/api/tmdb/[...path]/route.ts` allowlists endpoints by regex. Without
  it the route is an open relay against your token. If you need a new TMDB
  endpoint client-side, add it to that allowlist.
- `npm run check:leak` (`scripts/check-leak.mjs`) fails if a secret reaches
  `.next/static`. Keep it in CI.

There were originally **ten** files leaking the token this way, including the
home page's own row config. Assume any new client-side TMDB call is a leak
until proven otherwise.

**Before production:** the rate limiter in the proxy route is an in-memory
`Map`, so it resets on every cold start and doesn't work across serverless
instances. Back it with Upstash Redis or equivalent.

---

## 7. Mobile apps (Android / iOS)

Not started. The architecture already supports it and the important thing is
not to break that.

Supabase has official SDKs for Swift, Kotlin, Flutter and React Native, so a
native app signs into the **same** project and reads the same `histories` and
`watchlist` rows. There's no sync layer to build.

**The rule that keeps this true:** all data must come from either Supabase
(native SDKs exist) or `/api/tmdb` (plain HTTP any client can call). The moment
business logic lives only inside a Server Component, mobile has to reimplement
it.

Recommended shell: **Capacitor**, pointing at the deployed Vercel URL rather
than trying to static-export a Server Components app.

```bash
npm install @capacitor/core @capacitor/cli
npx cap init Umbra com.yourname.umbra
npx cap add android    # needs Android Studio
npx cap add ios        # needs a Mac + Xcode
```

Cost asymmetry worth knowing: Android sideloading is free, Play Store is a
one-time $25. iOS needs a Mac plus $99/year. Do Android first.

---

## 8. Smaller items

- **Google OAuth** — not configured. Supabase → Authentication → Providers,
  then add the client ID/secret (see `.env.example`) and register the callback
  URL in Google Cloud Console.
- **Verify anime UI in a browser.** The anime pages are client-rendered via
  react-query, so their server HTML is only a loading shell. Routes were
  confirmed to compile and serve 200 with no runtime errors, but nobody has
  visually confirmed the hydrated cards and layout. Load `/anime`,
  `/anime/21`, and `/anime/21/player/1` and actually look.
- **`_reference_do_not_ship/`** in the parent directory is an HTTrack mirror of
  a third party's live website, kept only as a visual reference. It sits outside
  the repo on purpose. Never move it inside, and don't copy code or CSS from it.
- **`npx update-browserslist-db@latest`** — the build warns that caniuse data
  is 13 months stale.
- **Duplicate anime poster card.** `Anime/Detail/Related.tsx` has its own
  inline card because it was built in parallel with
  `Anime/Cards/Poster.tsx` and couldn't see it. Worth consolidating.
- **Sidebar active-tab accent.** `NavbarMenuItems.tsx` wraps HeroUI `Tabs` and
  forwards no `color` prop, so the sidebar's active indicator can't be tinted
  primary without editing that component. Pre-existing, cosmetic.

---

## 9. Attribution — do not remove

This project is built on [cinextma](https://github.com/wisnuwirayuda15/cinextma),
MIT licensed, **Copyright (c) 2025 Wisnu Wirayuda**.

MIT permits essentially everything — modify, rebrand, sell, keep your additions
closed — on **one** condition: the copyright notice and license text must be
preserved. `LICENSE` in the repo root carries both the original notice and the
project's own.

Do not delete or edit `LICENSE`. Deleting it during a rebrand is the single
action that would turn a fully legitimate fork into infringement, and keeping it
costs nothing. Rebrand everything else freely.
