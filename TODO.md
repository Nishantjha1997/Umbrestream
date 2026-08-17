# StreamFree World-Class Implementation Board

Last updated: 2026-08-17

Branch: `codex/streamfree-worldclass-hardening`

Rule: complete one task at a time, update this file with evidence and commit hash, then commit the implementation and task update together.

## Phase 0 — Baseline

- [x] SF-001 — Create controlled branch, plan.md, and TODO.md
  - Status: completed
  - Priority: P0
  - Depends on: none
  - Evidence: branch `codex/streamfree-worldclass-hardening`; `plan.md`; `TODO.md`
  - Commit: `45f6ef6`
  - Completed: 2026-08-17

- [x] SF-002 — Record baseline deployment, manifests, APK hashes, package IDs, and signing fingerprints
  - Status: completed
  - Priority: P0
  - Depends on: SF-001
  - Evidence: Vercel project `umbrestream`; phone `online.streamfree.app` 1.3.0/code 4; TV `online.streamfree.tv` 1.2.0/code 3; manifest certificate fingerprints and APK hashes recorded in `STREAMFREE_HANDOFF.md`
  - Commit: `45f6ef6`
  - Completed: 2026-08-17

- [x] SF-003 — Record known release limitations and existing evidence
  - Status: completed
  - Priority: P0
  - Depends on: SF-001
  - Evidence: authored lint failures; slow web/native splash; Search keyboard-selection bug; debug APK exposure; placeholder Android tests; always-on TV filter; season-boundary progression gap; physical phone only
  - Commit: `45f6ef6`
  - Completed: 2026-08-17

- [x] SF-004 — Capture baseline performance, bundle, startup, accessibility, and production UI evidence
  - Status: completed
  - Priority: P1
  - Depends on: SF-002, SF-003
  - Evidence: typecheck/build/player-source/leak checks passed; Home bundle baseline approximately 174 JS chunks/4.97MB uncompressed and 383KB global CSS; production source picker opens and switches providers; web splash remains visible for approximately 3.25s
  - Commit: `45f6ef6`
  - Completed: 2026-08-17

## Phase 1 — Release hygiene

- [x] SF-010 — Narrow ESLint to authored source
  - Status: completed
  - Priority: P0
  - Depends on: SF-001
  - Evidence: generated Android/build assets and design mockups are ignored by the authored-source lint command
  - Commit: `d98e2b7`
  - Completed: 2026-08-17

- [x] SF-011 — Fix authored lint errors and unexpected warnings
  - Status: completed
  - Priority: P0
  - Depends on: SF-010
  - Evidence: ESLint passes with zero errors and zero warnings; typed Search results, corrected hook dependencies, and repaired authored diagnostics
  - Commit: `d98e2b7`
  - Completed: 2026-08-17

- [x] SF-012 — Add lint to verification
  - Status: completed
  - Priority: P0
  - Depends on: SF-011
  - Evidence: `verify` now runs `npm run lint` before source contracts/typecheck/build/leak scan
  - Commit: `d98e2b7`
  - Completed: 2026-08-17

- [x] SF-013 — Enforce type validation in CI/Vercel
  - Status: completed
  - Priority: P0
  - Depends on: SF-012
  - Evidence: Next build type suppression is now opt-in through `STREAMFREE_SKIP_NEXT_TYPECHECK=1`; default builds enforce validation
  - Commit: `d98e2b7`
  - Completed: 2026-08-17

- [x] SF-014 — Remove public debug APK and header
  - Status: completed
  - Priority: P0
  - Depends on: SF-001
  - Evidence: `public/downloads/StreamFree-local-debug.apk` removed; matching Next header removed; quarantined copy retained outside the repository for recovery
  - Commit: `d4bd2fa`
  - Completed: 2026-08-17

- [x] SF-015 — Reject debug/unsigned/development APKs
  - Status: completed
  - Priority: P0
  - Depends on: SF-014
  - Evidence: `scripts/check-release-artifacts.mjs`; `npm run check:release-artifacts` validates APK names, manifest paths, sizes, and SHA-256 values
  - Commit: `d4bd2fa`
  - Completed: 2026-08-17

- [x] SF-016 — Add explicit debug/release Android scripts
  - Status: completed
  - Priority: P1
  - Depends on: SF-015
  - Evidence: package scripts expose `android:apk:debug`, `android:apk:release`, `android-tv:apk:debug`, and `android-tv:apk:release`; default APK aliases now build release variants
  - Commit: `d4bd2fa`
  - Completed: 2026-08-17

- [x] SF-017 — Replace placeholder Android tests
  - Status: completed
  - Priority: P0
  - Depends on: SF-016
  - Evidence: phone and TV unit/instrumentation tests now target `online.streamfree.app` and `online.streamfree.tv`; Gradle execution remains environment-blocked because `JAVA_HOME`/Java is unavailable
  - Commit: `d4bd2fa`
  - Completed: 2026-08-17

- [x] SF-018 — Disable Android TV ad filtering by default
  - Status: completed
  - Priority: P0
  - Depends on: SF-001
  - Evidence: `AD_PROTECTION_ENABLED` is false; TV Settings and Help copy no longer claim filtering is active
  - Commit: `d4bd2fa`
  - Completed: 2026-08-17

- [x] SF-019 — Add strict official-host configuration validation
  - Status: completed
  - Priority: P1
  - Depends on: SF-018
  - Evidence: `/api/mobile/config` now exposes schema-versioned, disabled-by-default ad-protection policy with an empty host list; native TV filtering remains fail-closed until a validated policy exists
  - Commit: `d4bd2fa`
  - Completed: 2026-08-17

- [x] SF-020 — Remove obsolete updater comments
  - Status: completed
  - Priority: P2
  - Depends on: SF-017
  - Evidence: obsolete commented updater implementations removed from both native MainActivity files; active updater behavior unchanged
  - Commit: `d4bd2fa`
  - Completed: 2026-08-17

## Phase 2 — Shared contracts

- [x] SF-030 — Define HomeFeedResponseV1
  - Status: completed
  - Priority: P1
  - Depends on: SF-011
  - Evidence: `src/lib/homeFeed/types.ts` defines the versioned schema, provenance, region, hero, rows, and Continue Watching progress contract
  - Commit: `be9a73c`
  - Completed: 2026-08-17

- [x] SF-031 — Implement shared home-feed builder
  - Status: completed
  - Priority: P1
  - Depends on: SF-030
  - Evidence: `buildHomeFeed` composes region-aware TMDB rows, AniList anime, authenticated title-level Continue Watching, history-aware/cold-start provenance, hero selection, and deduplication
  - Commit: `db6ad27`
  - Completed: 2026-08-17

- [x] SF-032 — Add /api/mobile/home
  - Status: completed
  - Priority: P1
  - Depends on: SF-031
  - Evidence: GET/OPTIONS route exposes the versioned feed with CORS and cache headers for native clients
  - Commit: `be9a73c`
  - Completed: 2026-08-17

- [x] SF-033 — Validate optional Supabase bearer tokens
  - Status: completed
  - Priority: P0
  - Depends on: SF-032
  - Evidence: server Supabase client accepts a bearer token, calls `auth.getUser`, and only includes Continue Watching for a validated user
  - Commit: `be9a73c`
  - Completed: 2026-08-17

- [x] SF-034 — Separate public and private feed caching
  - Status: completed
  - Priority: P1
  - Depends on: SF-033
  - Evidence: signed-out route responses use short shared edge caching; bearer-authenticated responses are `private, no-store`
  - Commit: `be9a73c`
  - Completed: 2026-08-17

- [x] SF-035 — Add region override and reset
  - Status: completed
  - Priority: P1
  - Depends on: SF-031
  - Evidence: validated region choices persist on web, phone, and TV; shared mobile feed accepts `X-StreamFree-Region`, preserves detected/effective country separately, and uses private caching for overrides
  - Commit: `728550c`
  - Completed: 2026-08-17

- [x] SF-036 — Implement shared adjacent-episode resolver
  - Status: completed
  - Priority: P0
  - Depends on: SF-030
  - Evidence: pure `src/lib/tv/adjacentEpisode.ts` resolver skips season/episode zero and crosses valid season boundaries; `test:episode-resolver` covers forward, backward, and final-stop cases
  - Commit: `c56b8f2`
  - Completed: 2026-08-17

- [x] SF-037 — Route all clients through episode resolver
  - Status: completed
  - Priority: P0
  - Depends on: SF-036
  - Evidence: web, phone, and TV now import the same pure resolver; native TV progression fetches series summaries plus the current season and crosses valid season boundaries without specials
  - Commit: `a8cb8f6`
  - Completed: 2026-08-17

- [x] SF-038 — Extract shared native modules
  - Status: completed
  - Priority: P1
  - Depends on: SF-032, SF-036
  - Evidence: shared `nativeAdapter.ts`, `nativeClient.ts`, adjacent-episode resolver, playback policy, `region.ts`, `cache.ts`, `history.ts`, and `update.ts` are consumed by both shells; `test:native-cache`, `test:native-history`, `test:native-update-state`, `test:episode-resolver`, and `test:home-feed` pass; touch and remote presentation remain separate
  - Commit: `90a6f57`
  - Completed: 2026-08-17

- [x] SF-039 — Keep phone/TV presentation layers separate
  - Status: completed
  - Priority: P1
  - Depends on: SF-038
  - Evidence: phone and TV retain separate `mobile/app.js` and `tv/app.js` presentation shells, while only pure policy/feed/cache/history modules are shared; TV-only focus/back handlers remain isolated from phone touch navigation
  - Commit: `0f94c19`
  - Completed: 2026-08-17

## Phase 3 — Performance

- [x] SF-050 — Replace web splash
  - Status: completed
  - Priority: P0
  - Depends on: SF-004
  - Evidence: session-limited readiness splash hides after two ready frames or the 700ms cap and is shown once per browser session
  - Commit: `ec51633`
  - Completed: 2026-08-17

- [x] SF-051 — Cap web splash at 700ms
  - Status: completed
  - Priority: P0
  - Depends on: SF-050
  - Evidence: splash timers and exit animation are bounded to 700ms and respect reduced motion
  - Commit: `ec51633`
  - Completed: 2026-08-17

- [x] SF-052 — Remove long native splash overlay
  - Status: completed
  - Priority: P0
  - Depends on: SF-004
  - Evidence: phone and TV use the platform SplashScreen API with a short static theme instead of a custom full-screen drawable hold
  - Commit: `656d87e`
  - Completed: 2026-08-17

- [x] SF-053 — Use Android SplashScreen for cold starts
  - Status: completed
  - Priority: P1
  - Depends on: SF-052
  - Evidence: both MainActivity classes call `SplashScreen.installSplashScreen(this)` before Activity initialization and use `postSplashScreenTheme`
  - Commit: `656d87e`
  - Completed: 2026-08-17

- [x] SF-054 — Stabilize native auth hydration
  - Status: completed
  - Priority: P1
  - Depends on: SF-038
  - Evidence: authenticated account refresh updates the shared Home feed without entering the full loading renderer; a full render is now only the recovery path
  - Commit: `04518c6`
  - Completed: 2026-08-17

- [x] SF-055 — Load React Query Devtools only in development
  - Status: completed
  - Priority: P1
  - Depends on: SF-011
  - Evidence: devtools are dynamically imported with `ssr:false` and rendered only when `NODE_ENV` is development
  - Commit: `ec51633`
  - Completed: 2026-08-17

- [ ] SF-056 — Move player-only dependencies behind dynamic loading
  - Status: completed
  - Priority: P1
  - Depends on: SF-004
  - Evidence: Native HLS/DASH dependencies are imported only inside the player load effect; Home does not eagerly load them
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-057 — Audit UI dependency imports
  - Status: completed
  - Priority: P2
  - Depends on: SF-056
  - Evidence: the heavy lightbox/plugin graph is now client-only and dynamically loaded from Photos; player-only HLS/DASH dependencies remain route-level and Home does not import them; typecheck and authored lint pass
  - Commit: `51f1b1e`
  - Completed: 2026-08-17

- [ ] SF-058 — Lazy-load artwork and distant rails
  - Status: completed
  - Priority: P1
  - Depends on: SF-031
  - Evidence: Media rows fetch only when their sentinel enters the viewport, while poster artwork uses lazy loading and above-fold priority hints
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [ ] SF-059 — Reduce native full-view replacements
  - Status: completed
  - Priority: P1
  - Depends on: SF-038
  - Evidence: authenticated native Home refresh updates the shared feed in place and reserves full render for recovery; phone/TV bundles were rebuilt
  - Commit: `04518c6`
  - Completed: 2026-08-17

- [x] SF-060 — Add PWA update-ready prompt
  - Status: completed
  - Priority: P1
  - Depends on: SF-004
  - Evidence: `PwaUpdateNotice` presents one Later/Reload prompt, posts `SKIP_WAITING`, reloads on controller change, and tracks ready/accepted events
  - Commit: `ec51633`
  - Completed: 2026-08-17

- [x] SF-061 — Verify service-worker caching policy
  - Status: completed
  - Priority: P1
  - Depends on: SF-060
  - Evidence: `next.config.ts` disables aggressive front-end navigation caching and configures NetworkFirst for API/page/RSC requests; generated precache no longer contains the removed debug APK
  - Commit: `ec51633`
  - Completed: 2026-08-17

## Phase 4 — Product UX

- [x] SF-070 — Correct hero provenance
  - Status: completed
  - Priority: P0
  - Depends on: SF-031
  - Evidence: hero and recommendation feed now carry explicit `personalized` vs `trending` provenance; cold-start and signed-out shelves are labelled `Trending now`
  - Commit: `d3b7f1a`
  - Completed: 2026-08-17
  - Next action: return explicit source semantics from hero hook/feed

- [x] SF-071 — Deduplicate Home titles
  - Status: completed
  - Priority: P1
  - Depends on: SF-031
  - Evidence: shared Home feed now removes repeated `kind:id` entries across ordered Continue Watching, personalized, regional, anime, and trending rows; empty rows are removed and deterministic regression coverage passes
  - Commit: `85feff8`
  - Completed: 2026-08-17

- [ ] SF-072 — Define Home ordering
  - Status: completed
  - Priority: P1
  - Depends on: SF-070
  - Evidence: shared Home builder orders Continue Watching, history-aware recommendations, regional movies/series, anime, and generic trending according to signed-in/cold-start/signed-out state
  - Commit: `db6ad27`
  - Completed: 2026-08-17

- [ ] SF-073 — Verify complete Continue Watching pagination
  - Status: in progress
  - Priority: P0
  - Depends on: SF-031
  - Evidence: web phone/desktop rails now remove only the actual resume hero by identity; cursor pagination remains active and the Supabase RPC still needs production application/high-volume verification
  - Commit: `6e3083b`
  - Next action: apply the Supabase RPC migration and verify an authenticated account with more than 100 active episode rows

- [x] SF-074 — Verify Continue Watching ordering/completion rules
  - Status: completed
  - Priority: P0
  - Depends on: SF-073
  - Evidence: shared `latestIncompleteByTitle`/`pageContinueWatching` helper enforces latest incomplete row per title, newest-first ordering, cursor boundaries, and deterministic regression coverage
  - Commit: `974c738`
  - Completed: 2026-08-17

- [ ] SF-075 — Stop removal actions from navigation
  - Status: completed
  - Priority: P0
  - Depends on: SF-073
  - Evidence: HistoryItemActions and BookmarkButton consume pointer, touch, click, and keyboard activation events before parent-card navigation; final browser regression remains SF-151
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [ ] SF-076 — Add optimistic removal Undo/rollback
  - Status: completed
  - Priority: P1
  - Depends on: SF-075
  - Evidence: Continue Watching and watchlist removals update query caches optimistically, expose Undo restoration, and roll back when the server mutation fails; final browser regression remains SF-151
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-077 — Remove or feature-flag Watch Parties teaser
  - Status: completed
  - Priority: P2
  - Depends on: SF-072
  - Evidence: the unavailable Watch Parties concept is an explicitly inert “Coming soon” teaser with no fabricated presence data, no actionable link, and matching honest copy on phone and desktop
  - Commit: `6ab7d79`
  - Completed: 2026-08-17

- [x] SF-078 — Make section numbering contiguous
  - Status: completed
  - Priority: P2
  - Depends on: SF-072
  - Evidence: visible Home section headers use contiguous 01–06 numbering on phone and desktop; the regional discovery block is intentionally unnumbered and does not create a duplicate or skipped numbered section
  - Commit: `6ab7d79`
  - Completed: 2026-08-17

- [ ] SF-079 — Add account destinations
  - Status: completed
  - Priority: P1
  - Depends on: SF-011
  - Evidence: authenticated and guest account menus expose Library, Watch History, Playback Settings, Help/About, Profile where available, and Sign out
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-080 — Repair Search combobox keyboard behavior
  - Status: completed
  - Priority: P0
  - Depends on: SF-011
  - Evidence: Arrow Up/Down, Escape, Enter, pointer selection, and suggestion highlighting share one navigation callback
  - Commit: `a0eaed3`
  - Completed: 2026-08-17

- [x] SF-081 — Add Search ARIA relationships
  - Status: completed
  - Priority: P0
  - Depends on: SF-080
  - Evidence: SearchInput receives `aria-controls`, `aria-expanded`, and `aria-activedescendant`; the listbox and option ids are stable and active state is exposed
  - Commit: `a0eaed3`
  - Completed: 2026-08-17

- [ ] SF-082 — Verify Search pointer/touch/keyboard paths
  - Status: not started
  - Priority: P0
  - Depends on: SF-080, SF-081
  - Evidence: implementation is complete; final desktop/mobile browser verification remains in the final testing phase
  - Commit: —
  - Next action: add deterministic browser tests

- [x] SF-083 — Improve Browse filters and focus restoration
  - Status: completed
  - Priority: P1
  - Depends on: SF-011
  - Evidence: Browse normalizes stale movie/series query types, resets incompatible filters on segment changes, labels filter controls, disables an unnecessary reset action, and restores focus to the results region
  - Commit: `cd99c9e`
  - Completed: 2026-08-17

- [x] SF-084 — Add complete loading/offline/empty/retry states
  - Status: completed
  - Priority: P1
  - Depends on: SF-072
  - Evidence: Home shelves, recommendations, Browse, Search, movie detail, TV detail, and anime discovery now expose bounded loading plus explicit retryable failure states; player recovery, native offline banners, auth errors, and empty library/Home states remain actionable; final cross-surface verification is SF-125/SF-151
  - Commit: `a349a7f`
  - Completed: 2026-08-17

- [x] SF-085 — Add region override controls
  - Status: completed
  - Priority: P1
  - Depends on: SF-035
  - Evidence: web My Space, phone Settings, and Android TV Settings expose Automatic plus validated country choices and Reset to automatic; changes invalidate regional discovery/feed caches
  - Commit: `728550c`
  - Completed: 2026-08-17

- [x] SF-086 — Apply touch targets and contrast
  - Status: completed
  - Priority: P1
  - Depends on: SF-072
  - Evidence: high-frequency player actions, phone header controls, desktop search, and standalone fullscreen controls now expose at least 44px interaction surfaces; contrast/focus tokens remain intact; final WCAG scan is SF-152
  - Commit: `8814f3e`
  - Completed: 2026-08-17

- [x] SF-087 — Add accessibility announcements
  - Status: completed
  - Priority: P1
  - Depends on: SF-075, SF-100
  - Evidence: player source/recovery notifications announce politely and atomically, audio variant is included in source-change feedback, TV Up Next countdown is announced assertively, PWA update readiness is announceable, and native toast/network surfaces already use live regions; final accessibility scan remains SF-152
  - Commit: `4698146`
  - Completed: 2026-08-17

- [ ] SF-088 — Keep Nishant branding tasteful
  - Status: completed
  - Priority: P2
  - Depends on: SF-072
  - Evidence: Nishant attribution is confined to splash, footer, About/app trust surfaces, and native branding; player controls/title metadata remain unbranded
  - Commit: `c6579bc`
  - Completed: 2026-08-17

- [ ] SF-089 — Replace vendor-specific TV copy
  - Status: completed
  - Priority: P1
  - Depends on: SF-011
  - Evidence: Android TV app/About/help copy uses device-neutral Android TV language and accurately states provider protection is disabled
  - Commit: `e565137`
  - Completed: 2026-08-17

## Phase 5 — Playback/native behavior

- [ ] SF-100 — Regression-test source picker across surfaces
  - Status: in progress
  - Priority: P0
  - Depends on: SF-011
  - Evidence: source picker interaction/focus fixes are implemented; shared web-player fullscreen entry now keeps successful entry in landscape intent instead of inverting the browser fullscreen state
  - Commit: `b6dbcbb`
  - Next action: run deterministic desktop/mobile/PWA source-picker regression before final real-provider smoke tests

- [x] SF-101 — Make source rows fully interactive
  - Status: completed
  - Priority: P0
  - Depends on: SF-100
  - Evidence: desktop panel and mobile drawer now mount only after the client viewport is known; source rows consume pointer/click events, are touch-manipulation buttons, and preserve the visible panel above the provider frame
  - Commit: `c56b8f2`
  - Completed: 2026-08-17

- [x] SF-102 — Ensure source selection changes once
  - Status: completed
  - Priority: P0
  - Depends on: SF-101
  - Evidence: source-sheet activation is guarded against duplicate selection while a switch is in flight; parent swaps the iframe synchronously and persists the provider id once
  - Commit: `c56b8f2`
  - Completed: 2026-08-17

- [x] SF-103 — Restore source-picker focus
  - Status: completed
  - Priority: P1
  - Depends on: SF-101
  - Evidence: PlayerShell remembers the invoking control and restores focus after close, selection, and reset; desktop panel is an explicit modal dialog
  - Commit: `c56b8f2`
  - Completed: 2026-08-17

- [ ] SF-104 — Preserve source preferences by media/audio
  - Status: completed
  - Priority: P0
  - Depends on: SF-101
  - Evidence: playback policy stores preferences by media type and anime audio variant, with explicit URL choice taking precedence over device preference and product default
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [ ] SF-105 — Label anime Sub/Dub groups
  - Status: completed
  - Priority: P0
  - Depends on: SF-104
  - Evidence: web source sheets and phone/TV server sheets render separate labelled Sub servers and Dub servers, with episode actions carrying the audio query
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [ ] SF-106 — Preserve audio/episode/progress context
  - Status: completed
  - Priority: P1
  - Depends on: SF-105
  - Evidence: anime audio changes clear incompatible source identity while retaining episode/progress context; compatible source and audio are carried through episode links
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [ ] SF-107 — Preserve consent-based fallback
  - Status: completed
  - Priority: P0
  - Depends on: SF-100
  - Evidence: trusted-event sources receive the 20-second recovery timer, recovery is presented as a user-choice panel, and no provider is switched silently
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [ ] SF-108 — Prevent silent manual-source replacement
  - Status: completed
  - Priority: P0
  - Depends on: SF-107
  - Evidence: manual source selection is persisted separately and recovery/reset paths do not overwrite it without an explicit menu action
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [ ] SF-109 — Keep eventless providers neutral
  - Status: completed
  - Priority: P1
  - Depends on: SF-107
  - Evidence: eventless providers receive neutral “Having trouble? Choose another server” messaging and are never declared offline from cross-origin inspection limits
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [ ] SF-110 — Verify trusted playback events before history
  - Status: completed
  - Priority: P0
  - Depends on: SF-107
  - Evidence: history begins only after origin-validated play/timeupdate events or meaningful native-player progress; player-page open alone does not write history
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [ ] SF-111 — Fix phone fullscreen orientation and Back
  - Status: in progress
  - Priority: P0
  - Depends on: SF-038
  - Evidence: phone shell locks landscape on fullscreen entry, restores portrait on exit/back/unmount, and now re-applies the lock when a fullscreen player is rebuilt for a source switch or next episode
  - Commit: `84fa01d`
  - Next action: verify orientation and first/second Back behavior on the connected physical phone

- [ ] SF-112 — Restore phone portrait after playback
  - Status: in progress
  - Priority: P0
  - Depends on: SF-111
  - Evidence: exit/fullscreenchange, player route cleanup, and the normal player render all call the portrait restore path when fullscreen is false
  - Commit: `84fa01d`
  - Next action: verify route/background/resume paths on the connected physical phone

- [ ] SF-113 — Verify TV immersive landscape playback
  - Status: not started
  - Priority: P0
  - Depends on: SF-038
  - Evidence: —
  - Commit: —
  - Next action: add emulator flow

- [ ] SF-114 — Add TV D-pad focus behavior
  - Status: completed
  - Priority: P1
  - Depends on: SF-113
  - Evidence: TV shell provides deterministic directional focus, Enter/OK activation, strong focus rings, and focus restoration after the server sheet closes; emulator acceptance remains SF-154
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [ ] SF-115 — Add TV next-episode countdown
  - Status: completed
  - Priority: P0
  - Depends on: SF-037
  - Evidence: trusted ended events resolve the next valid episode, present a focusable ten-second Play now/Cancel countdown, and preserve compatible source/audio choices; emulator acceptance remains SF-154
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-116 — Fix cross-season TV progression
  - Status: completed
  - Priority: P0
  - Depends on: SF-037
  - Evidence: web TV player uses the shared resolver for previous/next navigation and a trusted 10-second Up Next countdown; final valid episode stops without looping
  - Commit: `c56b8f2`
  - Completed: 2026-08-17

- [ ] SF-117 — Preserve source/audio on next episode
  - Status: completed
  - Priority: P1
  - Depends on: SF-116
  - Evidence: TV next-episode preparation carries the current provider and audio preference into the resolver/open-player path when compatible
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

## Phase 6 — Onboarding and polish

- [x] SF-120 — Reduce onboarding to four steps
  - Status: completed
  - Priority: P1
  - Depends on: SF-054
  - Evidence: phone and TV tours contain exactly four focused steps covering discovery, Sub/Dub and servers, library/resume, and verified updates
  - Commit: `7c9116c`
  - Completed: 2026-08-17

- [x] SF-121 — Make onboarding skippable/replayable/accessibility-ready
  - Status: completed
  - Priority: P1
  - Depends on: SF-120
  - Evidence: Skip remains available, Help & about can replay the tour, Escape/Android Back/TV Back dismiss it, and the focused Next action is remote/keyboard reachable
  - Commit: `7c9116c`
  - Completed: 2026-08-17

- [x] SF-122 — Respect reduced motion
  - Status: completed
  - Priority: P1
  - Depends on: SF-120
  - Evidence: tour transitions are disabled for the app Reduce motion setting and `prefers-reduced-motion`; existing shell transitions use the same preference
  - Commit: `7c9116c`
  - Completed: 2026-08-17

- [x] SF-123 — Add update-security explanation
  - Status: completed
  - Priority: P2
  - Depends on: SF-132
  - Evidence: phone and Android TV download pages explain native manifest fetching, package/version/certificate/hash validation, and normal sideload prompts
  - Commit: `e565137`
  - Completed: 2026-08-17

- [x] SF-124 — Complete About/app pages
  - Status: completed
  - Priority: P2
  - Depends on: SF-123
  - Evidence: About and both app pages identify the web, phone, and Android TV products, creator Nishant, provider transparency, current release details, and support/install guidance; stale Mi TV/ad-protection claims removed
  - Commit: `e565137`
  - Completed: 2026-08-17

- [ ] SF-125 — Verify core offline/error/retry states
  - Status: not started
  - Priority: P1
  - Depends on: SF-084
  - Evidence: —
  - Commit: —
  - Next action: build route state matrix

- [ ] SF-126 — Verify focus restoration
  - Status: not started
  - Priority: P1
  - Depends on: SF-103, SF-121
  - Evidence: —
  - Commit: —
  - Next action: test modal/sheet/route/Back flows

- [ ] SF-127 — Remove decorative signatures from player semantics
  - Status: not started
  - Priority: P2
  - Depends on: SF-088
  - Evidence: —
  - Commit: —
  - Next action: accessibility audit

## Phase 7 — Android release

- [ ] SF-130 — Set phone release version 1.3.1/code 5
  - Status: not started
  - Priority: P0
  - Depends on: SF-135
  - Evidence: —
  - Commit: —
  - Next action: finalize only after phone validation

- [ ] SF-131 — Set TV release version 1.2.1/code 4
  - Status: not started
  - Priority: P0
  - Depends on: SF-139
  - Evidence: —
  - Commit: —
  - Next action: finalize only after TV emulator validation

- [x] SF-132 — Make updater fetch and validate manifest itself
  - Status: completed
  - Priority: P0
  - Depends on: SF-017
  - Evidence: native `checkOfficialUpdate` and `installOfficialUpdate` now fetch the hardcoded official manifest directly; the WebView only requests the native status/install operation
  - Commit: `a407b69`
  - Completed: 2026-08-17

- [x] SF-133 — Validate manifest identity/hash/signature/origin
  - Status: completed
  - Priority: P0
  - Depends on: SF-132
  - Evidence: native validation checks schema/platform, package, version, official HTTPS origin, size, SHA-256, certificate fingerprint, APK parseability, and release metadata; `test:update-manifests` validates checked-in artifacts
  - Commit: `a407b69`
  - Completed: 2026-08-17

- [x] SF-134 — Delete invalid APKs before install
  - Status: completed
  - Priority: P0
  - Depends on: SF-133
  - Evidence: native installer deletes the downloaded file on failed size/hash/package/signature/parse validation and never invokes the installer
  - Commit: `a407b69`
  - Completed: 2026-08-17

- [ ] SF-135 — Verify phone upgrade on physical device
  - Status: not started
  - Priority: P0
  - Depends on: SF-111, SF-133
  - Evidence: —
  - Commit: —
  - Next action: wait for connected phone at final gate

- [ ] SF-136 — Verify legacy migration behavior
  - Status: not started
  - Priority: P1
  - Depends on: SF-133
  - Evidence: —
  - Commit: —
  - Next action: test side-by-side migration path

- [ ] SF-137 — Build signed release APKs only
  - Status: not started
  - Priority: P0
  - Depends on: SF-130, SF-131, SF-135, SF-139
  - Evidence: —
  - Commit: —
  - Next action: build after final QA

- [ ] SF-138 — Verify release APK metadata and signatures
  - Status: not started
  - Priority: P0
  - Depends on: SF-137
  - Evidence: —
  - Commit: —
  - Next action: run package/signature/hash checks

- [ ] SF-139 — Validate TV release on emulator
  - Status: not started
  - Priority: P0
  - Depends on: SF-113, SF-115, SF-116
  - Evidence: —
  - Commit: —
  - Next action: run Android TV emulator matrix

## Final test and rollout

- [ ] SF-150 — Run authored-source lint/typecheck/source contracts
  - Status: not started
  - Priority: P0
  - Depends on: all implementation tasks
  - Evidence: —
  - Commit: —
  - Next action: run final automated checks

- [ ] SF-151 — Run Playwright web/PWA matrix
  - Status: not started
  - Priority: P0
  - Depends on: SF-082, SF-100, SF-125
  - Evidence: —
  - Commit: —
  - Next action: run desktop/mobile/tablet flows

- [ ] SF-152 — Run accessibility and reduced-motion matrix
  - Status: not started
  - Priority: P1
  - Depends on: SF-086, SF-087, SF-121
  - Evidence: —
  - Commit: —
  - Next action: scan core routes and controls

- [ ] SF-153 — Run physical Android phone matrix
  - Status: not started
  - Priority: P0
  - Depends on: SF-135
  - Evidence: —
  - Commit: —
  - Next action: request/connect phone at final gate

- [ ] SF-154 — Run Android TV emulator matrix
  - Status: not started
  - Priority: P0
  - Depends on: SF-139
  - Evidence: —
  - Commit: —
  - Next action: run D-pad/player/update flows

- [ ] SF-155 — Run real-provider smoke tests last
  - Status: not started
  - Priority: P0
  - Depends on: SF-150, SF-151, SF-153, SF-154
  - Evidence: —
  - Commit: —
  - Next action: execute movie/TV/anime matrix

- [ ] SF-156 — Build private signed APK candidates
  - Status: not started
  - Priority: P0
  - Depends on: SF-155
  - Evidence: —
  - Commit: —
  - Next action: build and verify release artifacts

- [ ] SF-157 — Deploy Vercel preview and verify readiness
  - Status: not started
  - Priority: P0
  - Depends on: SF-155
  - Evidence: —
  - Commit: —
  - Next action: deploy preview and run production smoke checks

- [ ] SF-158 — Publish manifests/APKs and deploy production
  - Status: not started
  - Priority: P0
  - Depends on: SF-156, SF-157
  - Evidence: —
  - Commit: —
  - Next action: publish only after all gates pass

- [ ] SF-159 — Update handoff and release evidence
  - Status: not started
  - Priority: P0
  - Depends on: SF-158
  - Evidence: —
  - Commit: —
  - Next action: document deployment, hashes, tests, limitations, and rollback
