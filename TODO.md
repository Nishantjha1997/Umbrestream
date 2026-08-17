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
  - Commit: `bcdf907`
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

- [x] SF-056 — Move player-only dependencies behind dynamic loading
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
  - Commit: `0c31720`
  - Completed: 2026-08-17

- [x] SF-058 — Lazy-load artwork and distant rails
  - Status: completed
  - Priority: P1
  - Depends on: SF-031
  - Evidence: Media rows fetch only when their sentinel enters the viewport, while poster artwork uses lazy loading and above-fold priority hints
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-059 — Reduce native full-view replacements
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
  - Commit: `8611231`
  - Completed: 2026-08-17
  - Next action: return explicit source semantics from hero hook/feed

- [x] SF-071 — Deduplicate Home titles
  - Status: completed
  - Priority: P1
  - Depends on: SF-031
  - Evidence: shared Home feed now removes repeated `kind:id` entries across ordered Continue Watching, personalized, regional, anime, and trending rows; empty rows are removed and deterministic regression coverage passes
  - Commit: `85feff8`
  - Completed: 2026-08-17

- [x] SF-072 — Define Home ordering
  - Status: completed
  - Priority: P1
  - Depends on: SF-070
  - Evidence: shared Home builder orders Continue Watching, history-aware recommendations, regional movies/series, anime, and generic trending according to signed-in/cold-start/signed-out state
  - Commit: `db6ad27`
  - Completed: 2026-08-17

- [ ] SF-073 — Verify complete Continue Watching pagination
  - Status: blocked
  - Priority: P0
  - Depends on: SF-031
  - Evidence: web phone/desktop rails now remove only the actual resume hero by identity; production SQL editor applied the RPC migration successfully and verified the function, authenticated grant, and index; production currently has 42 incomplete history rows across 35 titles, so the >100-row stress check remains open
  - Commit: `6e3083b`
  - Next action: verify the RPC through the app with an authenticated account containing more than 100 active episode rows
  - Blocker: production data has only 42 incomplete rows across 35 titles; do not fabricate test history

- [x] SF-074 — Verify Continue Watching ordering/completion rules
  - Status: completed
  - Priority: P0
  - Depends on: SF-073
  - Evidence: shared `latestIncompleteByTitle`/`pageContinueWatching` helper enforces latest incomplete row per title, newest-first ordering, cursor boundaries, and deterministic regression coverage
  - Commit: `974c738`
  - Completed: 2026-08-17

- [x] SF-075 — Stop removal actions from navigation
  - Status: completed
  - Priority: P0
  - Depends on: SF-073
  - Evidence: HistoryItemActions and BookmarkButton consume pointer, touch, click, and keyboard activation events before parent-card navigation; final browser regression remains SF-151
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-076 — Add optimistic removal Undo/rollback
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

- [x] SF-079 — Add account destinations
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
  - Status: blocked
  - Priority: P0
  - Depends on: SF-080, SF-081
  - Evidence: local production browser run verified Search input and keyboard submission at desktop and 390×844 mobile; suggestion selection remains blocked because the local TMDB proxy returned 503
  - Commit: —
  - Next action: rerun pointer/touch/suggestion selection with TMDB or deterministic catalog fixtures available
  - Blocker: local TMDB proxy returned 503, so no suggestions were rendered for pointer/touch selection

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

- [x] SF-088 — Keep Nishant branding tasteful
  - Status: completed
  - Priority: P2
  - Depends on: SF-072
  - Evidence: Nishant attribution is confined to splash, footer, About/app trust surfaces, and native branding; player controls/title metadata remain unbranded
  - Commit: `c6579bc`
  - Completed: 2026-08-17

- [x] SF-089 — Replace vendor-specific TV copy
  - Status: completed
  - Priority: P1
  - Depends on: SF-011
  - Evidence: Android TV app/About/help copy uses device-neutral Android TV language and accurately states provider protection is disabled
  - Commit: `e565137`
  - Completed: 2026-08-17

## Phase 5 — Playback/native behavior

- [ ] SF-100 — Regression-test source picker across surfaces
  - Status: blocked
  - Priority: P0
  - Depends on: SF-011
  - Evidence: source picker interaction/focus fixes are implemented; source-dependent browser exercise is blocked because the local TMDB proxy returned 503 for the known movie fixture; shared web-player fullscreen entry keeps successful entry in landscape intent
  - Commit: `b6dbcbb`
  - Next action: run desktop/mobile/PWA source-picker regression with a playable title or deterministic player fixture
  - Blocker: local TMDB proxy returned 503 for the known playable movie fixture

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

- [x] SF-104 — Preserve source preferences by media/audio
  - Status: completed
  - Priority: P0
  - Depends on: SF-101
  - Evidence: playback policy stores preferences by media type and anime audio variant, with explicit URL choice taking precedence over device preference and product default
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-105 — Label anime Sub/Dub groups
  - Status: completed
  - Priority: P0
  - Depends on: SF-104
  - Evidence: web source sheets and phone/TV server sheets render separate labelled Sub servers and Dub servers, with episode actions carrying the audio query
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-106 — Preserve audio/episode/progress context
  - Status: completed
  - Priority: P1
  - Depends on: SF-105
  - Evidence: anime audio changes clear incompatible source identity while retaining episode/progress context; compatible source and audio are carried through episode links
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-107 — Preserve consent-based fallback
  - Status: completed
  - Priority: P0
  - Depends on: SF-100
  - Evidence: trusted-event sources receive the 20-second recovery timer, recovery is presented as a user-choice panel, and no provider is switched silently
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-108 — Prevent silent manual-source replacement
  - Status: completed
  - Priority: P0
  - Depends on: SF-107
  - Evidence: manual source selection is persisted separately and recovery/reset paths do not overwrite it without an explicit menu action
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-109 — Keep eventless providers neutral
  - Status: completed
  - Priority: P1
  - Depends on: SF-107
  - Evidence: eventless providers receive neutral “Having trouble? Choose another server” messaging and are never declared offline from cross-origin inspection limits
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-110 — Verify trusted playback events before history
  - Status: completed
  - Priority: P0
  - Depends on: SF-107
  - Evidence: history begins only after origin-validated play/timeupdate events or meaningful native-player progress; player-page open alone does not write history
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [ ] SF-111 — Fix phone fullscreen orientation and Back
  - Status: blocked
  - Priority: P0
  - Depends on: SF-038
  - Evidence: phone shell locks landscape on fullscreen entry, restores portrait on exit/back/unmount, and now re-applies the lock when a fullscreen player is rebuilt for a source switch or next episode
  - Commit: `84fa01d`
  - Next action: connect a physical phone with ADB and verify orientation and first/second Back behavior
  - Blocker: `adb` and an Android SDK are unavailable in this workspace

- [ ] SF-112 — Restore phone portrait after playback
  - Status: blocked
  - Priority: P0
  - Depends on: SF-111
  - Evidence: exit/fullscreenchange, player route cleanup, and the normal player render all call the portrait restore path when fullscreen is false
  - Commit: `84fa01d`
  - Next action: connect a physical phone with ADB and verify route/background/resume paths
  - Blocker: `adb` and an Android SDK are unavailable in this workspace

- [ ] SF-113 — Verify TV immersive landscape playback
  - Status: not started
  - Priority: P0
  - Depends on: SF-038
  - Evidence: —
  - Commit: —
  - Next action: add emulator flow

- [x] SF-114 — Add TV D-pad focus behavior
  - Status: completed
  - Priority: P1
  - Depends on: SF-113
  - Evidence: TV shell provides deterministic directional focus, Enter/OK activation, strong focus rings, and focus restoration after the server sheet closes; emulator acceptance remains SF-154
  - Commit: `a10e2b1`
  - Completed: 2026-08-17

- [x] SF-115 — Add TV next-episode countdown
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

- [x] SF-117 — Preserve source/audio on next episode
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
  - Status: blocked
  - Priority: P1
  - Depends on: SF-084
  - Evidence: local browser observed retryable “Couldn’t reach TMDB” state on movie detail and actionable “Movies are taking a break” state on Browse; `/api/mobile/home` now returns HTTP 200 with a schema-valid fallback feed when TMDB is unavailable, including validated region override behavior; full offline/reconnect matrix remains open
  - Commit: `223ba6f`
  - Next action: complete offline/reconnect and retry matrix across Home, Browse, Search, details, player, and native shells
  - Blocker: catalog-backed player/native fixtures are unavailable; only local retry states were observed

- [ ] SF-126 — Verify focus restoration
  - Status: blocked
  - Priority: P1
  - Depends on: SF-103, SF-121
  - Evidence: Browse filter selection returned focus to the active filter control in the local browser snapshot; modal/source-sheet, route, and Android Back focus paths remain open
  - Commit: —
  - Next action: test source sheet, onboarding, modal, route, and Back focus flows when a playable fixture and device bridge are available
  - Blocker: source sheet needs a playable title and Android Back needs an ADB-connected device

- [x] SF-127 — Remove decorative signatures from player semantics
  - Status: completed
  - Priority: P2
  - Depends on: SF-088
  - Evidence: source audit found no Nishant/signature branding in web player controls, player notification text, or Movie/TV/Anime player semantics; branding remains outside playback controls; final accessibility scan is SF-152
  - Commit: `c751aef`
  - Completed: 2026-08-17

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
  - Status: blocked
  - Priority: P0
  - Depends on: SF-130, SF-131, SF-135, SF-139
  - Evidence: portable JDK 21 and Android SDK 36 were installed without ADB; Gradle reached `:app:packageRelease` for the phone but correctly stopped because the canonical release keystore is unavailable; existing public phone/TV APKs remain v2-signed with the pinned certificates
  - Commit: —
  - Next action: recover the existing phone and TV release keystores and rerun both release builds
  - Blocker: generating a replacement key would invalidate upgrades for existing installs

- [ ] SF-138 — Verify release APK metadata and signatures
  - Status: blocked
  - Priority: P0
  - Depends on: SF-137
  - Evidence: existing `StreamFree-Android-v1.3.apk` and `StreamFree-TV-v1.2.apk` pass v2 signature verification with the pinned manifest certificates; newly rebuilt APK metadata cannot be verified until the canonical keys are recovered
  - Commit: —
  - Next action: verify v2/v3 signatures, package IDs, version codes, certificates, hashes, MIME types, filenames, and headers after rebuilding with the recovered keys
  - Blocker: canonical release keystores are unavailable

- [ ] SF-139 — Validate TV release on emulator
  - Status: not started
  - Priority: P0
  - Depends on: SF-113, SF-115, SF-116
  - Evidence: —
  - Commit: —
  - Next action: run Android TV emulator matrix

## Final test and rollout

- [x] SF-150 — Run authored-source lint/typecheck/source contracts
  - Status: completed
  - Priority: P0
  - Depends on: all implementation tasks
  - Evidence: authored ESLint, TypeScript, player-source, episode-resolver, Continue Watching, Home feed, native cache/history/update-state, update-manifest, release-artifact, leak scan, production webpack build, and `git diff --check` all passed
  - Commit: `491f42d`
  - Completed: 2026-08-17

- [ ] SF-151 — Run Playwright web/PWA matrix
  - Status: in progress
  - Priority: P0
  - Depends on: SF-082, SF-100, SF-125
  - Evidence: local production browser verified Home/About shells at default and 820×1180, Home at 390×844, Browse filter selection/reset at desktop and mobile, Search keyboard submit, and retryable catalog states; `/api/mobile/home` returns HTTP 200 with `schemaVersion: 1` fallback data and accepts an `IN` region override; source-picker, authenticated library, PWA update, and real-title flows remain blocked by missing catalog/auth fixtures
  - Commit: `223ba6f`
  - Next action: run source picker, removal/Undo, authenticated Continue Watching, PWA update, and mocked provider flows with deterministic fixtures

- [ ] SF-152 — Run accessibility and reduced-motion matrix
  - Status: in progress
  - Priority: P1
  - Depends on: SF-086, SF-087, SF-121
  - Evidence: DOM snapshots expose named navigation, searchbox, tabs, filter group, retry buttons, live-region alerts, and focusable actions across Home/Search/Browse/About; automated axe/reduced-motion and player/device scans remain open
  - Commit: pending
  - Next action: run automated accessibility scan and reduced-motion screenshots across core routes

- [ ] SF-153 — Run physical Android phone matrix
  - Status: blocked
  - Priority: P0
  - Depends on: SF-135
  - Evidence: —
  - Commit: —
  - Next action: connect the physical Android phone with ADB, then run cold/warm, playback, orientation, Back, and updater checks
  - Blocker: no `adb` or Android SDK is available in this workspace

- [ ] SF-154 — Run Android TV emulator matrix
  - Status: blocked
  - Priority: P0
  - Depends on: SF-139
  - Evidence: —
  - Commit: —
  - Next action: provision or connect an Android TV emulator, then run D-pad/player/update flows
  - Blocker: no Android emulator or SDK is available; physical TV testing is intentionally deferred

- [ ] SF-155 — Run real-provider smoke tests last
  - Status: blocked
  - Priority: P0
  - Depends on: SF-150, SF-151, SF-153, SF-154
  - Evidence: —
  - Commit: —
  - Next action: execute movie/TV/anime matrix after SF-150, SF-151, SF-153, and SF-154 pass
  - Blocker: source-picker and device prerequisites are not available; HTTP reachability is not playback evidence

- [ ] SF-156 — Build private signed APK candidates
  - Status: blocked
  - Priority: P0
  - Depends on: SF-155
  - Evidence: Gradle tooling is now available through portable JDK 21 and Android SDK 36, but the phone release build stopped at signing because the canonical keystore is missing
  - Commit: —
  - Next action: recover canonical signing keys, then build and verify private release artifacts with portable JDK 21/SDK 36
  - Blocker: canonical signing keystores are unavailable; JDK/SDK tooling is now present

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
