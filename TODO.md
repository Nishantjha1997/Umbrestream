# StreamFree World-Class Implementation Board

Last updated: 2026-08-17

Branch: `codex/streamfree-worldclass-hardening`

Rule: complete one task at a time, update this file with evidence and commit hash, then commit the implementation and task update together.

## Phase 0 — Baseline

- [ ] SF-001 — Create controlled branch, plan.md, and TODO.md
  - Status: completed
  - Priority: P0
  - Depends on: none
  - Evidence: branch `codex/streamfree-worldclass-hardening`; `plan.md`; `TODO.md`
  - Commit: `45f6ef6`
  - Completed: 2026-08-17

- [ ] SF-002 — Record baseline deployment, manifests, APK hashes, package IDs, and signing fingerprints
  - Status: completed
  - Priority: P0
  - Depends on: SF-001
  - Evidence: Vercel project `umbrestream`; phone `online.streamfree.app` 1.3.0/code 4; TV `online.streamfree.tv` 1.2.0/code 3; manifest certificate fingerprints and APK hashes recorded in `STREAMFREE_HANDOFF.md`
  - Commit: `45f6ef6`
  - Completed: 2026-08-17

- [ ] SF-003 — Record known release limitations and existing evidence
  - Status: completed
  - Priority: P0
  - Depends on: SF-001
  - Evidence: authored lint failures; slow web/native splash; Search keyboard-selection bug; debug APK exposure; placeholder Android tests; always-on TV filter; season-boundary progression gap; physical phone only
  - Commit: `45f6ef6`
  - Completed: 2026-08-17

- [ ] SF-004 — Capture baseline performance, bundle, startup, accessibility, and production UI evidence
  - Status: completed
  - Priority: P1
  - Depends on: SF-002, SF-003
  - Evidence: typecheck/build/player-source/leak checks passed; Home bundle baseline approximately 174 JS chunks/4.97MB uncompressed and 383KB global CSS; production source picker opens and switches providers; web splash remains visible for approximately 3.25s
  - Commit: `45f6ef6`
  - Completed: 2026-08-17

## Phase 1 — Release hygiene

- [ ] SF-010 — Narrow ESLint to authored source
  - Status: completed
  - Priority: P0
  - Depends on: SF-001
  - Evidence: generated Android/build assets and design mockups are ignored by the authored-source lint command
  - Commit: `d98e2b7`
  - Completed: 2026-08-17

- [ ] SF-011 — Fix authored lint errors and unexpected warnings
  - Status: completed
  - Priority: P0
  - Depends on: SF-010
  - Evidence: ESLint passes with zero errors and zero warnings; typed Search results, corrected hook dependencies, and repaired authored diagnostics
  - Commit: `d98e2b7`
  - Completed: 2026-08-17

- [ ] SF-012 — Add lint to verification
  - Status: completed
  - Priority: P0
  - Depends on: SF-011
  - Evidence: `verify` now runs `npm run lint` before source contracts/typecheck/build/leak scan
  - Commit: `d98e2b7`
  - Completed: 2026-08-17

- [ ] SF-013 — Enforce type validation in CI/Vercel
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
  - Evidence: `buildHomeFeed` composes region-aware TMDB rows, AniList anime, authenticated title-level Continue Watching, honest provenance, hero selection, and deduplication
  - Commit: `be9a73c`
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

- [ ] SF-035 — Add region override and reset
  - Status: not started
  - Priority: P1
  - Depends on: SF-031
  - Evidence: —
  - Commit: —
  - Next action: add effective-region preference

- [x] SF-036 — Implement shared adjacent-episode resolver
  - Status: completed
  - Priority: P0
  - Depends on: SF-030
  - Evidence: pure `src/lib/tv/adjacentEpisode.ts` resolver skips season/episode zero and crosses valid season boundaries; `test:episode-resolver` covers forward, backward, and final-stop cases
  - Commit: `c56b8f2`
  - Completed: 2026-08-17

- [ ] SF-037 — Route all clients through episode resolver
  - Status: not started
  - Priority: P0
  - Depends on: SF-036
  - Evidence: —
  - Commit: —
  - Next action: replace client season-boundary logic

- [ ] SF-038 — Extract shared native modules
  - Status: in progress
  - Priority: P1
  - Depends on: SF-032, SF-036
  - Evidence: shared `src/lib/homeFeed/nativeAdapter.ts` now feeds both phone and TV presentation shells from `/api/mobile/home`; API/cache/history/playback module extraction remains
  - Commit: `74352ea`
  - Next action: route shared cache, history, and playback helpers without changing touch/remote presentation

- [ ] SF-039 — Keep phone/TV presentation layers separate
  - Status: not started
  - Priority: P1
  - Depends on: SF-038
  - Evidence: —
  - Commit: —
  - Next action: verify no focus/touch regressions from extraction

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

- [ ] SF-052 — Remove long native splash overlay
  - Status: not started
  - Priority: P0
  - Depends on: SF-004
  - Evidence: —
  - Commit: —
  - Next action: update phone and TV CSS/native startup

- [ ] SF-053 — Use Android SplashScreen for cold starts
  - Status: not started
  - Priority: P1
  - Depends on: SF-052
  - Evidence: —
  - Commit: —
  - Next action: verify existing dependency and theme

- [ ] SF-054 — Stabilize native auth hydration
  - Status: not started
  - Priority: P1
  - Depends on: SF-038
  - Evidence: —
  - Commit: —
  - Next action: render cached shell before auth refresh

- [x] SF-055 — Load React Query Devtools only in development
  - Status: completed
  - Priority: P1
  - Depends on: SF-011
  - Evidence: devtools are dynamically imported with `ssr:false` and rendered only when `NODE_ENV` is development
  - Commit: `ec51633`
  - Completed: 2026-08-17

- [ ] SF-056 — Move player-only dependencies behind dynamic loading
  - Status: not started
  - Priority: P1
  - Depends on: SF-004
  - Evidence: —
  - Commit: —
  - Next action: inspect Home route dependency graph

- [ ] SF-057 — Audit UI dependency imports
  - Status: not started
  - Priority: P2
  - Depends on: SF-056
  - Evidence: —
  - Commit: —
  - Next action: measure route bundles

- [ ] SF-058 — Lazy-load artwork and distant rails
  - Status: not started
  - Priority: P1
  - Depends on: SF-031
  - Evidence: —
  - Commit: —
  - Next action: add visibility-driven rendering

- [ ] SF-059 — Reduce native full-view replacements
  - Status: not started
  - Priority: P1
  - Depends on: SF-038
  - Evidence: —
  - Commit: —
  - Next action: preserve shell and update rails in place

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
  - Evidence: desktop hero aria label now follows resume/recommended/trending source; signed-out recommendation shelf is labelled `Trending now` instead of `Picked for you`
  - Commit: `6feb2b5`
  - Completed: 2026-08-17
  - Next action: return explicit source semantics from hero hook/feed

- [ ] SF-071 — Deduplicate Home titles
  - Status: not started
  - Priority: P1
  - Depends on: SF-031
  - Evidence: —
  - Commit: —
  - Next action: apply cross-row seen-set

- [ ] SF-072 — Define Home ordering
  - Status: not started
  - Priority: P1
  - Depends on: SF-070
  - Evidence: —
  - Commit: —
  - Next action: implement state-specific row ordering

- [ ] SF-073 — Verify complete Continue Watching pagination
  - Status: not started
  - Priority: P0
  - Depends on: SF-031
  - Evidence: —
  - Commit: —
  - Next action: run high-volume authenticated query checks

- [ ] SF-074 — Verify Continue Watching ordering/completion rules
  - Status: not started
  - Priority: P0
  - Depends on: SF-073
  - Evidence: —
  - Commit: —
  - Next action: add ordering and completion tests

- [ ] SF-075 — Stop removal actions from navigation
  - Status: not started
  - Priority: P0
  - Depends on: SF-073
  - Evidence: —
  - Commit: —
  - Next action: test event propagation in all card surfaces

- [ ] SF-076 — Add optimistic removal Undo/rollback
  - Status: not started
  - Priority: P1
  - Depends on: SF-075
  - Evidence: —
  - Commit: —
  - Next action: verify failed deletion restoration

- [ ] SF-077 — Remove or feature-flag Watch Parties teaser
  - Status: not started
  - Priority: P2
  - Depends on: SF-072
  - Evidence: —
  - Commit: —
  - Next action: gate unavailable feature

- [ ] SF-078 — Make section numbering contiguous
  - Status: not started
  - Priority: P2
  - Depends on: SF-072
  - Evidence: —
  - Commit: —
  - Next action: derive numbers from rendered sections

- [ ] SF-079 — Add account destinations
  - Status: not started
  - Priority: P1
  - Depends on: SF-011
  - Evidence: —
  - Commit: —
  - Next action: connect existing Space routes

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

- [ ] SF-083 — Improve Browse filters and focus restoration
  - Status: not started
  - Priority: P1
  - Depends on: SF-011
  - Evidence: —
  - Commit: —
  - Next action: label controls and preserve URL state

- [ ] SF-084 — Add complete loading/offline/empty/retry states
  - Status: not started
  - Priority: P1
  - Depends on: SF-072
  - Evidence: —
  - Commit: —
  - Next action: audit all core routes

- [ ] SF-085 — Add region override controls
  - Status: not started
  - Priority: P1
  - Depends on: SF-035
  - Evidence: —
  - Commit: —
  - Next action: expose preference in web/native settings

- [ ] SF-086 — Apply touch targets and contrast
  - Status: not started
  - Priority: P1
  - Depends on: SF-072
  - Evidence: —
  - Commit: —
  - Next action: run accessibility audit

- [ ] SF-087 — Add accessibility announcements
  - Status: not started
  - Priority: P1
  - Depends on: SF-075, SF-100
  - Evidence: —
  - Commit: —
  - Next action: add live regions/native announcements

- [ ] SF-088 — Keep Nishant branding tasteful
  - Status: not started
  - Priority: P2
  - Depends on: SF-072
  - Evidence: —
  - Commit: —
  - Next action: audit brand placements

- [ ] SF-089 — Replace vendor-specific TV copy
  - Status: not started
  - Priority: P1
  - Depends on: SF-011
  - Evidence: —
  - Commit: —
  - Next action: update TV copy and help content

## Phase 5 — Playback/native behavior

- [ ] SF-100 — Regression-test source picker across surfaces
  - Status: not started
  - Priority: P0
  - Depends on: SF-011
  - Evidence: —
  - Commit: —
  - Next action: build deterministic source-picker coverage

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
  - Status: not started
  - Priority: P0
  - Depends on: SF-101
  - Evidence: —
  - Commit: —
  - Next action: verify local preference keys and precedence

- [ ] SF-105 — Label anime Sub/Dub groups
  - Status: not started
  - Priority: P0
  - Depends on: SF-104
  - Evidence: —
  - Commit: —
  - Next action: audit web, phone, and TV source UI

- [ ] SF-106 — Preserve audio/episode/progress context
  - Status: not started
  - Priority: P1
  - Depends on: SF-105
  - Evidence: —
  - Commit: —
  - Next action: test audio changes and navigation

- [ ] SF-107 — Preserve consent-based fallback
  - Status: not started
  - Priority: P0
  - Depends on: SF-100
  - Evidence: —
  - Commit: —
  - Next action: verify timer and user-choice behavior

- [ ] SF-108 — Prevent silent manual-source replacement
  - Status: not started
  - Priority: P0
  - Depends on: SF-107
  - Evidence: —
  - Commit: —
  - Next action: test preference precedence

- [ ] SF-109 — Keep eventless providers neutral
  - Status: not started
  - Priority: P1
  - Depends on: SF-107
  - Evidence: —
  - Commit: —
  - Next action: test no-CORS/eventless behavior

- [ ] SF-110 — Verify trusted playback events before history
  - Status: not started
  - Priority: P0
  - Depends on: SF-107
  - Evidence: —
  - Commit: —
  - Next action: audit event source/origin checks

- [ ] SF-111 — Fix phone fullscreen orientation and Back
  - Status: not started
  - Priority: P0
  - Depends on: SF-038
  - Evidence: —
  - Commit: —
  - Next action: inspect native bridge and player flow

- [ ] SF-112 — Restore phone portrait after playback
  - Status: not started
  - Priority: P0
  - Depends on: SF-111
  - Evidence: —
  - Commit: —
  - Next action: verify route/background/resume paths

- [ ] SF-113 — Verify TV immersive landscape playback
  - Status: not started
  - Priority: P0
  - Depends on: SF-038
  - Evidence: —
  - Commit: —
  - Next action: add emulator flow

- [ ] SF-114 — Add TV D-pad focus behavior
  - Status: not started
  - Priority: P1
  - Depends on: SF-113
  - Evidence: —
  - Commit: —
  - Next action: audit focus graph

- [ ] SF-115 — Add TV next-episode countdown
  - Status: not started
  - Priority: P0
  - Depends on: SF-037
  - Evidence: —
  - Commit: —
  - Next action: verify trusted ended event and remote actions

- [x] SF-116 — Fix cross-season TV progression
  - Status: completed
  - Priority: P0
  - Depends on: SF-037
  - Evidence: web TV player uses the shared resolver for previous/next navigation and a trusted 10-second Up Next countdown; final valid episode stops without looping
  - Commit: `c56b8f2`
  - Completed: 2026-08-17

- [ ] SF-117 — Preserve source/audio on next episode
  - Status: not started
  - Priority: P1
  - Depends on: SF-116
  - Evidence: —
  - Commit: —
  - Next action: verify compatible preference transfer

## Phase 6 — Onboarding and polish

- [ ] SF-120 — Reduce onboarding to four steps
  - Status: not started
  - Priority: P1
  - Depends on: SF-054
  - Evidence: —
  - Commit: —
  - Next action: unify tour copy and state

- [ ] SF-121 — Make onboarding skippable/replayable/accessibility-ready
  - Status: not started
  - Priority: P1
  - Depends on: SF-120
  - Evidence: —
  - Commit: —
  - Next action: add Help replay and remote/keyboard handling

- [ ] SF-122 — Respect reduced motion
  - Status: not started
  - Priority: P1
  - Depends on: SF-120
  - Evidence: —
  - Commit: —
  - Next action: verify web/phone/TV transitions

- [ ] SF-123 — Add update-security explanation
  - Status: not started
  - Priority: P2
  - Depends on: SF-132
  - Evidence: —
  - Commit: —
  - Next action: update About/download copy

- [ ] SF-124 — Complete About/app pages
  - Status: not started
  - Priority: P2
  - Depends on: SF-123
  - Evidence: —
  - Commit: —
  - Next action: audit content and creator signature placement

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

- [ ] SF-132 — Make updater fetch and validate manifest itself
  - Status: not started
  - Priority: P0
  - Depends on: SF-017
  - Evidence: —
  - Commit: —
  - Next action: inspect existing native bridge and validator

- [ ] SF-133 — Validate manifest identity/hash/signature/origin
  - Status: not started
  - Priority: P0
  - Depends on: SF-132
  - Evidence: —
  - Commit: —
  - Next action: add rejection tests

- [ ] SF-134 — Delete invalid APKs before install
  - Status: not started
  - Priority: P0
  - Depends on: SF-133
  - Evidence: —
  - Commit: —
  - Next action: test failure cleanup

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
