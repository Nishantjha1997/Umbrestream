# Umbra — Build Plan

**Scope:** Personal hobby project. TMDB metadata, AMOLED UI, local-first, not publicly hosted.
**Project name:** Umbra
**Repo root:** this directory — `My Web Sites/umbra/`

## Where everything lives

```
My Web Sites/                    <- workspace, NOT the repo
├── umbra/                       <- THE PROJECT. git repo root. all work happens here.
│   ├── PROJECT_PLAN.md          <- this file
│   ├── CONTRIBUTING.md          <- git workflow + known environment faults
│   ├── src/ scripts/ public/
│   └── .git/
└── _reference_do_not_ship/      <- HTTrack mirror of a third party's site.
                                    Visual reference only. Outside the repo on
                                    purpose so `git add -A` can never catch it.
                                    Do not copy code or CSS out of it, and never
                                    move it inside umbra/.
```

Anything you create for this project goes under `umbra/`. Nothing is written to
the workspace root.
**Audience:** Implementing engineers and coding agents (Codex, Claude subagents).
**Last updated:** 2026-07-27

---

## 0. Read this first

**The stack is Next.js 16.2.12 + React 19.2 + Tailwind v4.** Not 15. The
scaffold ships an `AGENTS.md` instructing you to read
`node_modules/next/dist/docs/` before writing code. **Do that.** Version 16
has breaking changes that will silently produce wrong code if you work from
Next 14/15 memory:

| Change | Impact |
|---|---|
| `params` / `searchParams` are Promises | `await props.params` — sync access is **removed**, not deprecated |
| `middleware.ts` → `proxy.ts` | Named export must be `proxy`. Edge runtime unsupported in `proxy` |
| `revalidateTag(tag)` → `revalidateTag(tag, profile)` | Single-arg form is a TS error |
| `images.domains` removed | Use `images.remotePatterns` |
| `next lint` removed | Run ESLint directly; `next build` no longer lints |
| Turbopack is default | No `--turbopack` flag needed |
| PPR flag removed | Use top-level `cacheComponents: true` |

Run `npx next typegen` to get `PageProps<'/route'>` and `RouteContext` helpers
for type-safe async params.

`fetch(url, { next: { revalidate: n } })` **is still valid** — verified against
the bundled docs. Don't migrate it to `use cache` unless you also enable
`cacheComponents`.

---

## 1. What already exists

Scaffolded, typechecked, and committed to disk:

```
umbra/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Sidebar shell, Inter, AMOLED viewport
│   │   ├── page.tsx                # Home — 5 TMDB rows + setup fallback
│   │   ├── globals.css             # AMOLED design tokens (§3)
│   │   └── api/tmdb/[...path]/
│   │       └── route.ts            # Key-hiding proxy — allowlist + rate limit
│   ├── components/
│   │   ├── layout/Sidebar.tsx      # Persistent nav, active-route highlight
│   │   └── media/
│   │       ├── PosterCard.tsx      # 2:3 poster, rating, progress bar
│   │       └── ContentRow.tsx      # Scroll-snap tray + hover arrows
│   ├── lib/
│   │   ├── tmdb/
│   │   │   ├── client.ts           # server-only fetch wrapper
│   │   │   └── normalize.ts        # TMDB shape → Title
│   │   └── sources/
│   │       ├── types.ts            # SourceAdapter contract
│   │       ├── registry.ts         # register / resolveAll / fallbackChain
│   │       ├── README.md           # How to write an adapter
│   │       └── adapters/direct.ts  # Reference implementation
│   └── types/title.ts              # Unified domain model
├── next.config.ts                  # remotePatterns for image.tmdb.org
└── .env.example
```

**To run it:** copy `.env.example` → `.env.local`, paste your TMDB **API Read
Access Token** (the long JWT, not the short v3 key), `npm run dev`.

---

## 2. The two load-bearing abstractions

Understand these before changing anything, because everything else is
downstream of them.

### `Title` (`src/types/title.ts`)

Every source normalizes into this one shape. Cards, rows, grids, and detail
pages are source-agnostic because they only ever see a `Title`. When you add
AniList, write `lib/anilist/normalize.ts` that emits `Title` — do not leak
AniList's field names into components.

### `SourceAdapter` (`src/lib/sources/types.ts`)

Anything that can produce a playable stream implements this. The player, the
server dropdown, and the fallback chain talk to this interface and nothing
else, so adding a backend is **one file plus one `register()` call**, wired in
[`src/lib/sources/bootstrap.ts`](src/lib/sources/bootstrap.ts).

```ts
interface SourceAdapter {
  id: string;
  label: string;
  priority: number;                               // lower sorts first
  supports(req: SourceRequest): boolean;          // cheap, synchronous
  resolve(req: SourceRequest, signal?: AbortSignal): Promise<StreamCandidate[]>;
}
```

`resolveAll()` queries every supporting adapter in parallel and catches
per-adapter, so one dead backend costs you that dropdown entry and nothing
else. Full contract and worked example: [`src/lib/sources/README.md`](src/lib/sources/README.md).

---

## 3. AMOLED design system

Tokens live in `src/app/globals.css` under Tailwind v4's `@theme`. Base is
true `#000`. Two consequences that trip people up:

- **Drop-shadows are invisible on pure black.** Depth comes from
  `--color-border` hairlines and accent glow, not from `box-shadow`.
- **Dark posters bleed into the page.** Hence `.poster-frame`'s inset
  hairline. Keep it on every poster.

Accent is `#8b5cf6`. Surfaces step `#0a0a0c` → `#131316` → `#1c1c21` for
card / hover / modal.

---

## 4. Roadmap

Phases are independently shippable. Each has a concrete acceptance test —
don't advance until it passes.

### ✅ Phase 0 — Foundation *(done)*
Scaffold, AMOLED tokens, Inter, sidebar shell.

### ✅ Phase 1 — TMDB proxy + typed client *(done)*
**Acceptance — run this, it is the most important check in the build:**
```powershell
npm run build
Select-String -Path .next\static\**\*.js -Pattern "TMDB_READ_TOKEN" -ErrorAction SilentlyContinue
```
Must return **nothing**. `src/lib/tmdb/client.ts` imports `server-only`, so a
Client Component importing it fails the build rather than leaking the token.

### Phase 2 — Detail pages
- `src/app/title/[mediaType]/[id]/page.tsx` — hero, overview, cast, similar
- TV: season selector + episode list
- `PosterCard` already links here; the route is the missing half.
- **Accept:** every card navigates to a populated page; no 404s from rows.

### Phase 3 — Search & Discover
- `/discover` with genre chips (multi-select), year range, sort
- `/search` against `search/multi`, debounced 300ms
- Infinite scroll via TanStack Query `useInfiniteQuery` → `/api/tmdb/...`
- **Accept:** filters compose into one `discover` call and survive a reload
  (state in the URL, not component state).

### Phase 4 — Persistence
Hobby scope, not hosted, but you said you don't want data lost on cache clear.
Two options — pick one:
- **SQLite + Drizzle** (simplest for local-only; no account, no network)
- **Supabase** (if you ever want phone↔desktop sync; free tier, RLS)

Schema either way:
```sql
watch_progress(user_id, title_key, season, episode, position_sec,
               duration_sec, percent, completed, play_count, last_played_at)
watchlist(user_id, title_key, kind, added_at)
playback_prefs(user_id, preferred_audio, preferred_subtitle, autoplay_next)
titles_cache(title_key, media_type, tmdb_id, genre_ids, keyword_ids, ...)
```
`titles_cache` is not optional — without it the recommendation engine needs a
TMDB call per history row to learn genres. With it, Phase 6 is one query.

- **Accept:** progress survives a hard cache clear and a browser restart.

### Phase 5 — Player + source dropdown
- `/watch/[titleKey]` — `<video>` + `hls.js` (skip Vidstack: 0.6.x pins React
  18 types and conflicts with React 19)
- Dropdown reads `resolveAll()`; on `error` event advance the `fallbackChain`
- `TrackSelector` for audio dub + subtitles from `StreamCandidate` tracks
- Throttled progress reporter: 1 write / 10s, plus `sendBeacon` on `pagehide`
  (a plain `fetch` gets cancelled on tab close and you lose the position)
- **Accept:** play a file via the `direct` adapter end to end; kill the source
  mid-playback and watch it fall through to the next candidate; close the tab
  at 8:32 and confirm it resumes there.

### Phase 6 — Recommendations
Weight history by recency and replay, build a genre/keyword affinity vector,
query `discover` weighted by it, blend with `/recommendations` of top seeds,
dedupe against watched.

```ts
const recency    = Math.pow(0.5, ageDays / 30);        // 30-day half-life
const completion = Math.min(1, percent / 80);          // abandoned ≠ watched
const replay     = 1 + Math.log2(Math.max(1, playCount));
const weight     = recency * completion * replay;
```
- **Accept:** 10 watched sci-fi titles produce a visibly sci-fi row; zero
  already-watched titles appear; a cold-start user falls back to Trending
  without erroring.

### Phase 7 — Anime via AniList
GraphQL at `https://graphql.anilist.co`, no key. **[VERIFY]** current rate
limit before building; back off on `429`. Cross-map AniList↔TMDB on title+year
so one work is one `Title`, not two.

### Phase 8 — Polish
PWA manifest, keyboard nav across trays, skeleton loaders, error boundaries.

---

## 5. Notes for whoever picks this up

- **The `_reference_do_not_ship/` directory is a HTTrack mirror of another
  live site.** It is there as a visual reference only. Do not import from it,
  copy CSS out of it, or ship any part of it. Its component chunks were never
  downloaded anyway — HTTrack can't follow Vite dynamic imports, so only the
  entry bundle and React runtime are present. There is nothing extractable
  there even setting the licensing question aside.
- **UI conventions are fair game.** Persistent left sidebar, horizontal
  poster trays, near-black theme, 2:3 posters with hover lift — these are the
  shared idiom of the entire category (Netflix, Crunchyroll, Plex, Jellyfin).
  Build in that idiom freely. What's off the table is reproducing one
  particular site's code or presenting its design as ours.
- **TMDB attribution is required** and already rendered in the home footer:
  *"This product uses the TMDB API but is not endorsed or certified by TMDB."*
  Keep it.
- **Adapters for services that serve unlicensed content are not in this repo
  and won't be added by me.** The extension point is built and documented; the
  reference `direct` adapter shows exactly how the contract works. Anything
  further is the owner's call to write.

---

## 6. Reference projects worth reading

| Project | Why |
|---|---|
| `jellyfin/jellyfin-vue` | Complete modern client — playback, track selection, progress reporting |
| `jellyfin/jellyfin-sdk-typescript` | Official typed client, if you add a Jellyfin adapter |
| `video-dev/hls.js` | The examples cover level switching and audio-track APIs properly |
| `shadcn/ui` | Source-in-repo components; fastest path to the remaining UI |
| `jarnedemeulemeester/findroid` | Android/Media3 reference if you ever wrap this natively |
