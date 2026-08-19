# Umbrestream (StreamFree) — Site-wide UI/UX Refinement: Master Plan & Handoff

> **For the next agent:** This document is the single source of truth for an
> approved, in-progress UI/UX refinement. Read it fully before writing code.
> Work items in §5 are ordered — do them in order, top to bottom. After
> finishing each item, tick its checkbox and add a one-line note of what
> changed. Do not commit or push without the owner's explicit approval.

---

## 1. Context

- **Repo:** `C:\Users\HP_5C\OneDrive\Desktop\Stream\Umbrestream` (Windows, Git Bash).
- **Stack:** Next.js App Router (`next 16.2.1`), React 19, Tailwind CSS v4
  (`@theme` tokens in `src/styles/globals.css`), HeroUI (`@heroui/react`
  2.8.3), `motion/react` (framer-motion successor), react-query, nuqs,
  Supabase, TMDB + AniList APIs. Dark-only design (`#0a090d`).
- **Design docs:** `docs/design/DESKTOP_SPEC.md`, `docs/design/PHONE_SPEC.md`,
  `docs/design/mockups/UI Analysis.dc.html` (the "eight findings" audit).
  Design phases 1–4 + 6 landed; Phase 5 (ambient theming) is plumbed but
  **unwired** (see item 2.4).
- **Verification gate:** `npm run typecheck` (`tsc --noEmit`). NOTE: `next
  build` on the owner's machine segfaults in its forked tsc worker — that is
  why `next.config.ts` has the `STREAMFREE_SKIP_NEXT_TYPECHECK` escape hatch.
  A green build is NOT a green typecheck; always run typecheck.
- **Previous agent could not run Node in its shell** (no node on PATH), so all
  work so far is verified by manual review only. The first thing you should do
  is run `npm run typecheck` and fix any fallout from §4 before continuing.

## 2. Conventions every change must respect (non-negotiable)

1. **Tokens only.** Durations/easings/glass blurs/elevation/radius/accent come
   from `globals.css` `@theme` tokens and their `@utility` wrappers
   (`glass-chrome` / `glass-panel` / `glass-control`). Never hand-roll
   blur/opacity pairs. JS motion mirrors live in `src/utils/motion.ts`.
2. **One accent** (violet `#c4b5fd` family = HeroUI `primary`). No
   color-as-media-taxonomy: `SectionTitle`'s `color` prop is deprecated — stop
   passing it anywhere it still appears. No `text-warning`/`text-secondary`
   result-count colors etc.
3. **Phone/desktop are separate trees** (`src/components/shell/phone/*`,
   `shell/desktop/*`). Never branch one component on an `isMobile` prop for
   shell-level UI. CSS breakpoints (`md` = 768px) decide visibility.
4. **Reduced motion everywhere.** Any animation you add or touch must honor
   `useReducedMotion` / `motion-reduce:` variants.
5. **Focus-visible rings** on all interactive chrome
   (`focus-visible:ring-2 focus-visible:ring-white/50-80`).
6. **Standard patterns:** error states → `ServiceRetryState`
   (`src/components/ui/feedback/ServiceRetryState.tsx`) or `DiscoverLoadState`
   for list pages; cards → `PosterCard`; section headings → `SectionTitle`;
   shelves → `Shelf.tsx` + `shelf-reveal`; player icon buttons →
   `PlayerActionButton`.
7. **z-scale (documented in `VaulDrawer.tsx`):** drawers z-90/91, detail modal
   z-80, notifications z-95. Nothing above z-95.
8. **Player invariant:** StreamFree buttons must never overlay the embedded
   provider's video viewport. The Movie/Anime/TV players all now use
   `PlayerShell`'s `inlineLayout` + `renderControls` (controls bar below the
   video). Keep it that way.
9. **Site stays dark-only.** Do not add light-mode styling.
10. **Touch targets ≥ 44px** (`min-h-11` or `size-11`).

## 3. Status snapshot (updated 2026-08-19)

All work so far is **uncommitted in the working tree** (plus the earlier
movie-player refactor from the same working tree). Files touched so far:

**New files**
- `src/components/sections/Movie/Player/MoviePlayerControls.tsx` — controls bar below movie player.
- `src/components/sections/Movie/Player/MoviePlayerInfo.tsx` — "about this movie" panel below controls.
- `src/components/sections/TV/Player/TvShowPlayerControls.tsx` — controls bar below TV player.

**Modified files**
- `src/components/sections/Movie/Player/Player.tsx` — `inlineLayout` + `renderControls` + info panel (fixes phone overlay bug).
- `src/components/sections/TV/Player/Player.tsx` — `renderControls` wired; "Up next" countdown extracted to `NextEpisodeCountdownDialog`, portalled to `document.body` (containing-block fix), focus on mount, Escape cancels, focus-visible rings.
- `src/components/sections/TV/Player/Header.tsx` — stale "no fullscreen for TV" comment corrected.
- `src/components/shell/DetailModal.tsx` — `role="dialog"` + `aria-modal`, Escape closes, initial focus on X, focus restored to opener, scrim out of tab order, focus-visible ring on X.
- `src/components/sections/Library/List.tsx` — error state now `ServiceRetryState`; anime/all empty-state + confirm-modal copy fixed via new `contentLabel`/`contentTitle` helpers; empty state is a `glass-panel` with Browse CTA; per-content-type spinner colors removed.
- `src/components/sections/Discover/MovieList.tsx` — zero-results `glass-panel` with "Clear filters" (`resetFilters`).
- `src/components/sections/Discover/TvShowList.tsx` — same for series.
- `src/components/sections/Anime/Discover/AnimeDiscoverList.tsx` — zero-results panel with Link to `/anime/discover`; `color="secondary"` no-ops removed.
- `src/components/sections/Search/List.tsx` — no-results is a styled panel; per-type result-count colors and `getColor()` removed; unused `cn` import dropped.
- `src/components/sections/Auth/Forms.tsx` — AniList banner copy no longer shows literal "/space".
- `src/components/sections/Settings/AnimeConnections.tsx` — raw OAuth callback URL no longer rendered to end users.

## 4. Do this first

Run `npm run typecheck` and fix anything the above changes broke (they were
written without a local TypeScript run). Then continue with §5.

## 5. Remaining work items (in order)

### Phase 1 — finish correctness & honest states

- [ ] **1.4 TV episodes: retry state + mobile scroll fix.**
  `src/components/sections/TV/Details/Episodes.tsx` (~line 55): `if (!data)
  return null` on a failed season fetch leaves an empty 600px box — render a
  compact `ServiceRetryState` with `refetch` instead, and a real "No episodes
  found" empty state. `src/components/sections/TV/Details/Seasons.tsx`
  (~line 96): the `ScrollShadow className="h-[600px]"` creates a nested
  scroller inside page scroll — on phone (<768px) let the list grow naturally
  (no fixed height / no inner scroll); keep a `max-h` + inner scroll only on
  desktop if needed. Also `Episodes.tsx` uses heavy `border-2
  border-foreground-200 bg-foreground-100` card styling that clashes with the
  dark glass language — soften to `border-white/10 bg-white/[0.025]`.

- [ ] **1.5 Stop swallowing fetch errors as "empty".**
  - `src/components/sections/Space/WatchHistory.tsx` (~lines 44–45, 74–77):
    `success ? data : undefined` renders zeroed stats + "Nothing watched yet"
    on failure. Track the error and show a small retry row instead.
  - `src/hooks/useContinueWatching.ts` (~lines 26–32): same pattern — return
    an error flag alongside items so `StillWatching` /
    `NextEpisodeDrops` callers can render a retry affordance instead of
    vanishing.
  - `src/components/sections/Home/RegionalDiscoveryRows.tsx` (~line 44):
    `if (!region) return null` silently drops the regional block — same
    treatment (small "Couldn't load — Try again" row).
  Use one tiny shared inline pattern (a `Shelf`-height row with a text button)
  — do not invent a new component hierarchy; a small local component in each
  file or one shared `src/components/ui/feedback/InlineRetry.tsx` is fine.

- [ ] **1.6 z-index outliers + anime Related rail + global select-none.**
  - `src/components/sections/Search/Filter.tsx` (~line 184): `z-999` → use
    `z-50` (above content, below drawers).
  - `src/components/ui/button/BackToTopButton.tsx` (~line 19): `z-9999` →
    `z-60`.
  - `src/components/sections/Anime/Detail/Related.tsx`: replace the bespoke
    `RecommendationCard` (wrong radius, fuchsia `hover:border-secondary`,
    hardcoded `https://dancyflix.com/placeholder.png` fallback) with
    `PosterCard` + the existing `RelatedList`/`Shelf` pattern used by
    `Movie/Detail/Related.tsx`. Map AniList recs with `fromAnime`
    (`src/utils/normalize-media.ts`).
  - `src/app/layout.tsx` (~line 121): remove `select-none` from `<body>` so
    titles/synopses/error text are selectable. Do not add it back on content
    areas.

- [ ] **1.7 Player chrome pointer-reveal + AnimeNotifications dismissal.**
  - `src/components/player/PlayerShell.tsx` (~lines 149–155): chrome currently
    returns only on keydown or the small left-edge target. Add a throttled
    (~350ms) `pointermove` listener on the player root that calls
    `revealChrome()` when hidden — the standard streaming-app behavior for
    mouse users. Must not fight the existing 3s idle hide (the hook already
    re-arms its timer on every reveal).
  - `src/components/sections/Anime/AnimeNotifications.tsx`: the dropdown
    (~lines 34–47) has no Escape / outside-click close. Add a ref + effect
    (mousedown outside → close, keydown Escape → close), focus the trigger on
    close.

### Phase 2 — speed & perceived performance

- [ ] **2.1 Server-render the three detail pages.**
  Today `src/app/movie/[id]/page.tsx`, `tv/[id]/page.tsx`, `anime/[id]/page.tsx`
  are `"use client"` wrappers; content shows a bare spinner until hydration +
  API round-trip, and no route exports metadata (tab titles flash generic).
  Convert each `page.tsx` to an async **server component** that fetches the
  same detail payload server-side (TMDB via the server-safe API used by
  `src/api/tmdb-browser`'s server sibling — check `src/api/` for the server
  client; AniList via `src/api/anilist`), exports `generateMetadata` (title +
  OpenGraph using poster/backdrop via `getImageUrl`), and passes the data down
  as `initialData` to the existing client `DetailContent` components'
  `useQuery` (seed the cache — either via props into `initialData` per query
  or by hydrating a `QueryClient` the way react-query SSR docs describe; props
  + `initialData` is the least invasive). The intercepted `@modal` variants
  (`src/app/@modal/(.)movie/[id]/page.tsx` etc.) render the same
  `DetailContent` — keep them working (they can pass `undefined` initialData
  and stay client-fetched, or also be server-seeded; prefer parity).
  Also add `loading.tsx` for the three player routes
  (`src/app/movie/[id]/player/`, `src/app/tv/[id]/[season]/[episode]/player/`,
  `src/app/anime/[id]/player/[episode]/`) rendering a 16:9 black stage
  skeleton (`aspect-video w-full bg-black` centered) instead of nothing.

- [ ] **2.2 Suspense fallbacks.**
  `src/app/discover/page.tsx`, `search/page.tsx`, `browse/page.tsx`,
  `anime/discover/page.tsx` wrap `dynamic()` imports in `<Suspense>` with no
  fallback. Give each a lightweight fallback: a filter-bar-height block plus a
  `movie-grid` of 8–12 `PosterCardSkeleton`s (see `Discover/MovieList.tsx`
  for the skeleton pattern).

- [ ] **2.3 Home first paint + section skeletons.**
  - `src/app/page.tsx`: the phone/desktop fork uses
    `useSyncExternalStore` with `getServerSnapshot = () => false`, so phones
    render and hydrate the whole `DesktopHome` then swap. Make `page.tsx` a
    server component that reads `headers()` user-agent, detects mobile, and
    passes `initialIsPhone` to a small client wrapper that seeds the store
    snapshot (`useSyncExternalStore(subscribe, getSnapshot,
    () => initialIsPhone)`).
  - `src/components/shell/phone/home/Tonight.tsx` (~line 87) and
    `NextEpisodeDrops.tsx` (~line 94) render `null` while loading then pop
    in. Reserve their layout with a section-height skeleton (match
    `ResumeHero.tsx:39-50`'s bespoke-skeleton approach).

- [ ] **2.4 Hover prefetch + ambient theming.**
  - `src/components/media/HoverPreview.tsx`: when a preview opens, also
    `queryClient.prefetchQuery` the player page's queries (`["movie-player-detail",
    id]`, `["movie-player-start-at", id]`, and the TV/anime equivalents used
    by the player pages) so clicking Play doesn't cold-start. Hover-intent
    only; never on link hover en masse.
  - Wire Phase 5 ambient theming: in each `DetailContent` (Movie/TV/Anime),
    call `useSetAmbient` (from `src/components/media/AmbientProvider.tsx`)
    with the dominant backdrop color (extract with the existing
    `useExtractColors` hook if present in `src/hooks/`; the provider re-emits
    at 0.32 alpha and crossfades). Reset happens automatically on unmount.

### Phase 3 — contrast, consistency & a11y hardening

- [ ] **3.1 Contrast lift.** Body/label copy at `text-white/40`–`/56` →
  ≥ `text-white/70` across ~21 files (grep `text-white/\(4[0-9]\|5[0-6]\)`).
  Known spots: `src/app/space/page.tsx:80` (`text-white/45`),
  `src/components/player/PlayerSourceSheet.tsx:96` (`/48`),
  `shell/desktop/home/DesktopHero.tsx:166` (`/56`), `media/PosterCard.tsx:183`
  (`/50`). Decorative micro-labels may keep lower opacity where it's clearly
  non-essential, but labels/meta must be ≥ /70.
  `src/components/shell/phone/TabBar.tsx`: inactive label `text-white/42`
  (line 64) → `text-white/60`; label size 9.5px (line 86) → 10.5px. Audit
  `text-[9px]`/`text-[10px]` occurrences and lift to ≥10.5px.

- [ ] **3.2 Unify errors + small a11y.**
  - `src/components/sections/Anime/Detail/DetailContent.tsx` (~lines 47–59):
    replace hand-rolled error UI with `ServiceRetryState`. (Library already
    done.)
  - `src/components/sections/Anime/Player/AnimePlayerControls.tsx`
    (~lines 70–76, 95–101): disabled Prev/Next `<span aria-disabled>` lose
    their accessible name on mobile because label text is `hidden sm:inline`.
    Keep the icon + add `sr-only` text (or `aria-label`) so the name survives.
  - `src/components/player/PlayerPanel.tsx` (~line 68): close button 32px →
    `size-11` (44px).

- [ ] **3.3 Home blocks compact + dismissible.**
  - `src/components/sections/Home/AnimeModeEntry.tsx`: large non-dismissible
    banner above the resume hero. Make it a compact one-line card (icon +
    copy + single action), dismissible with an X; persist dismissal in
    `localStorage` (key e.g. `streamfree:anime-entry-dismissed:v1`), and
    never show it again until the key is cleared. Wire into both
    `PhoneHome`/`DesktopHome` where it's mounted.
  - `src/components/shell/phone/home/RoomIsOpen.tsx` (and any desktop
    equivalent): demote from a big teaser to a small chip/row placed below
    the primary shelves so home leads with content.

- [ ] **3.4 PWA + cleanup.**
  - `public/manifest.json`: three identical SVG icons with `purpose:"any"` —
    add real 192/512 PNGs (maskable, safe-zone padded) generated from the
    brand monogram, plus keep the SVG for `any`. `src/app/layout.tsx`
    (~line 58): `apple-touch-icon` points at an SVG (iOS ignores it) — point
    it at `public/icons/ios/120.png` (exists) or generate 180px.
  - `src/components/pwa/InstallAppPrompt.tsx` (~lines 53–61): the Android
    branch runs before the `isInstalled()` check — standalone users still get
    the install ad. Gate the whole prompt on `!isInstalled()`.
  - Delete dead files: `src/components/shell/phone/home/TrendingToday.tsx`,
    `src/components/shell/desktop/home/TrendingTodayDesktop.tsx` (verified
    unreferenced — re-grep before deleting).
  - `README.md` (~line 11): claims "Light and Dark Mode" — correct to
    dark-only.
  - Do NOT remove the legacy `UMBRA_UI_V2` shell fallback in
    `src/app/layout.tsx`.

### Phase 4 — verification & handoff

- [ ] Run `npm run typecheck` — must be clean.
- [ ] `npm run dev` and walk the QA checklist below; fix what's broken.
- [ ] Update this file's §3 snapshot and tick everything.
- [ ] Ask the owner before any commit/push.

**QA checklist (phone 402×874, tablet 768, desktop 1280):**
1. Movie/TV/Anime players: controls bar below video, nothing overlays the
   provider's controls; fullscreen enter/exit; source sheet switch; TV
   "Up next" appears pinned to viewport bottom, Escape cancels, Play now
   navigates.
2. Detail modal (from a shelf card): Escape closes, focus returns to the
   card, tab order stays inside the modal on desktop, scrim click closes.
3. Discover + Anime Discover with a zero-result genre filter: panel with
   Clear filters; Search with a gibberish query: styled no-results panel.
4. Library: anime tab empty state says "anime"; Clear-all confirm copy
   correct; error state is the shared retry panel (can simulate by going
   offline).
5. Home: phone tree renders on first paint (no desktop flash), Tonight /
   NextEpisodeDrops skeletons, dismissible anime card stays dismissed after
   reload.
6. Text is selectable (titles/synopsis); tab bar labels legible.
7. PWA: install prompt absent when already installed; manifest icons valid
   (Lighthouse PWA section).

## 6. Explicitly out of scope

Light theme · legacy shell removal · `/spark` + `/sports` redesigns · native
Capacitor UI parity · hero auto-rotation redesign · provider/backend changes ·
any new color accents.
