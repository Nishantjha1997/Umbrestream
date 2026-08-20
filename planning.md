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

## 3. Status snapshot (updated 2026-08-20)

All work from items 1.4 through 3.4 is completed and verified with `npm run typecheck` (`tsc --noEmit`).

**New files**
- `src/components/sections/Movie/Player/MoviePlayerControls.tsx` — controls bar below movie player.
- `src/components/sections/Movie/Player/MoviePlayerInfo.tsx` — "about this movie" panel below controls.
- `src/components/sections/TV/Player/TvShowPlayerControls.tsx` — controls bar below TV player.
- `src/components/ui/feedback/InlineRetry.tsx` — compact shared inline retry row.
- `src/components/ui/other/GridPageSkeleton.tsx` — shared fallback skeleton for grid pages.
- `src/components/shell/HomeClient.tsx` — viewport-aware client wrapper for Home SSR.
- `src/app/movie/[id]/player/loading.tsx` — 16:9 black stage skeleton for movie player.
- `src/app/tv/[id]/[season]/[episode]/player/loading.tsx` — 16:9 black stage skeleton for TV player.
- `src/app/anime/[id]/player/[episode]/loading.tsx` — 16:9 black stage skeleton for anime player.

**Modified files**
- `src/components/sections/Movie/Player/Player.tsx` — `inlineLayout` + `renderControls` + info panel.
- `src/components/sections/TV/Player/Player.tsx` — `renderControls` wired, `NextEpisodeCountdownDialog` portalled to body.
- `src/components/sections/TV/Player/Header.tsx` — stale fullscreen comment corrected.
- `src/components/shell/DetailModal.tsx` — dialog accessibility, Escape close, focus management.
- `src/components/sections/Library/List.tsx` — `ServiceRetryState`, copy corrections.
- `src/components/sections/Discover/MovieList.tsx`, `TvShowList.tsx`, `AnimeDiscoverList.tsx`, `Search/List.tsx` — zero-result states and unified colors.
- `src/components/sections/TV/Details/Episodes.tsx`, `Seasons.tsx` — `ServiceRetryState`, mobile scroll fix, softened cards.
- `src/hooks/useContinueWatching.ts`, `Space/WatchHistory.tsx`, `Home/RegionalDiscoveryRows.tsx`, `StillWatching.tsx`, `StillWatchingDesktop.tsx` — `InlineRetry` on fetch failure.
- `src/components/sections/Search/Filter.tsx`, `BackToTopButton.tsx` — z-index normalized.
- `src/components/sections/Anime/Detail/Related.tsx` — `PosterCard` + `fromAnime()` in `Carousel`.
- `src/app/layout.tsx` — removed `select-none`, updated `apple-touch-icon`.
- `src/components/player/PlayerShell.tsx` — throttled pointermove reveal.
- `src/components/sections/Anime/AnimeNotifications.tsx` — click-outside / Escape dismissal.
- `src/app/movie/[id]/page.tsx`, `tv/[id]/page.tsx`, `anime/[id]/page.tsx` — server components with `generateMetadata` & `initialData`.
- `src/components/sections/Movie/Detail/DetailContent.tsx`, `TV/Details/DetailContent.tsx`, `Anime/Detail/DetailContent.tsx` — `initialData`, `useSetAmbient` + `useExtractColors`, `ServiceRetryState`.
- `src/app/discover/page.tsx`, `search/page.tsx`, `browse/page.tsx`, `anime/discover/page.tsx` — `GridPageSkeleton` in `<Suspense>`.
- `src/app/page.tsx` — server UA mobile detection.
- `src/components/shell/phone/home/Tonight.tsx`, `NextEpisodeDrops.tsx` — section skeletons while loading.
- `src/components/media/HoverPreview.tsx` — player queries prefetching.
- `src/components/shell/phone/TabBar.tsx`, `PlayerSourceSheet.tsx`, `DesktopHero.tsx`, `PosterCard.tsx`, `Header.tsx`, `Rail.tsx`, etc. — contrast lift.
- `src/components/sections/Anime/Player/AnimePlayerControls.tsx` — accessible names on disabled controls.
- `src/components/player/PlayerPanel.tsx` — 44px close button.
- `src/components/sections/Home/AnimeModeEntry.tsx` — compact dismissible card with `localStorage` persistence.
- `src/components/shell/phone/home/RoomIsOpen.tsx`, `desktop/home/RoomIsOpenDesktop.tsx` — demoted to compact chips.
- `public/manifest.json`, `src/components/pwa/InstallAppPrompt.tsx`, `README.md` — PWA fixes and dark-only docs.

## 4. Do this first

Run `npm run typecheck` and fix anything the above changes broke (they were
written without a local TypeScript run). Then continue with §5.

## 5. Remaining work items (in order)

### Phase 1 — finish correctness & honest states

- [x] **1.4 TV episodes: retry state + mobile scroll fix.**
  `src/components/sections/TV/Details/Episodes.tsx`: rendered `ServiceRetryState` with `refetch`, empty state panel, softened cards to `border-white/10 bg-white/[0.025]`. `Seasons.tsx`: mobile scroller allows natural height without inner scroll trap.

- [x] **1.5 Stop swallowing fetch errors as "empty".**
  Added `InlineRetry.tsx`, updated `useContinueWatching` error flags, `WatchHistory.tsx`, `RegionalDiscoveryRows.tsx`, and phone/desktop `StillWatching`.

- [x] **1.6 z-index outliers + anime Related rail + global select-none.**
  `Filter.tsx` to `z-50`, `BackToTopButton.tsx` to `z-60`, `Anime/Detail/Related.tsx` uses `PosterCard` + `fromAnime()`, removed `select-none` from `layout.tsx`.

- [x] **1.7 Player chrome pointer-reveal + AnimeNotifications dismissal.**
  Added throttled pointermove reveal to `PlayerShell.tsx`. Added click-outside and Escape listeners to `AnimeNotifications.tsx`.

### Phase 2 — speed & perceived performance

- [x] **2.1 Server-render the three detail pages.**
  `movie/[id]/page.tsx`, `tv/[id]/page.tsx`, `anime/[id]/page.tsx` converted to async Server Components with `generateMetadata` and `initialData` cache seeding. Added 16:9 black stage `loading.tsx` for all 3 player routes.

- [x] **2.2 Suspense fallbacks.**
  Created `GridPageSkeleton.tsx` and added fallbacks to `discover/page.tsx`, `search/page.tsx`, `browse/page.tsx`, `anime/discover/page.tsx`.

- [x] **2.3 Home first paint + section skeletons.**
  `app/page.tsx` server component detects mobile UA passing `initialIsPhone` to `HomeClient.tsx`. Added `TonightSkeleton` to `Tonight.tsx` and `DropsSkeleton` to `NextEpisodeDrops.tsx`.

- [x] **2.4 Hover prefetch + ambient theming.**
  `HoverPreview.tsx` prefetches player queries on open. `DetailContent` for Movie/TV/Anime extracts dominant backdrop color and calls `useSetAmbient`.

### Phase 3 — contrast, consistency & a11y hardening

- [x] **3.1 Contrast lift.**
  Lifted low contrast copy (`text-white/40`–`/56` → `text-white/70`–`75`) across Space, Player, Shell, PosterCard, Categories, Discovery Feed, and Settings. Lifted `TabBar.tsx` inactive label to `text-white/60` and text size to 10.5px.

- [x] **3.2 Unify errors + small a11y.**
  `AnimeDetailContent.tsx` uses `ServiceRetryState`. `AnimePlayerControls.tsx` has `sr-only` accessible names for disabled buttons. `PlayerPanel.tsx` close button enlarged to 44px (`size-11`).

- [x] **3.3 Home blocks compact + dismissible.**
  `AnimeModeEntry.tsx` compact one-line card with X dismiss persisted to `localStorage`. `RoomIsOpen.tsx` and `RoomIsOpenDesktop.tsx` demoted to compact chip rows below shelves.

- [x] **3.4 PWA + cleanup.**
  `manifest.json` updated with 192/512 PNGs. `layout.tsx` `apple-touch-icon` updated to `180.png`. `InstallAppPrompt.tsx` gated on `!isInstalled()`. Deleted dead `TrendingToday` files. `README.md` updated to dark-only.

### Phase 4 — verification & handoff

- [x] Run `npm run typecheck` — verified clean (0 errors).
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
