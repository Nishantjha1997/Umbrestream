# StreamFree Live Implementation Board

Read `plan.md` first. Update this board with every state change. Only one task is `in progress` unless explicitly stated.

## Current checkpoint

- Branch: `codex/web-first-native-rebuild`
- Baseline: `28bea93`
- Active task: `SF-W1-006`
- Next command: run the W1 gate, commit and push the repaired web phase, deploy through the `umbrestream` Vercel project, and verify production routes.
- Reference policy: Media3 and Now in Android are approved architecture references; Aniyomi is pattern-only because it is archived; Dantotsu is excluded pending license/source verification.

## W0 — Governance and baseline

- [x] SF-W0-001 — Replace conflicting plans and establish live tracking
  - Status: completed
  - Priority: P0
  - Depends on: none
  - Evidence: branch `codex/web-first-native-rebuild`; canonical `plan.md`; reset `TODO.md`; superseded plans removed; `.zcode/` ignored
  - Commit: `73c492c`
  - Completed: 2026-08-20

- [x] SF-W0-002 — Record release and deployment baseline
  - Status: completed
  - Priority: P0
  - Depends on: SF-W0-001
  - Evidence: baseline `28bea93`; phone `1.3.3` code `7`, APK SHA-256 `571FA4CB…D444`, certificate `4218B5F7…8EF4`; TV `1.2.3` code `6`, APK SHA-256 `06E4C403…7683`, certificate `7D5C1BB4…79D7`; local Vercel project `umbrestream` (`prj_jF4itYCa4JrGVioyt4uEz3hVQh58`); connector deployment listing returned 403 and will be retried with deployment credentials during W1
  - Commit: `73c492c`
  - Completed: 2026-08-20

## W1 — Web release blockers

- [x] SF-W1-001 — Repair `/anime/discover` production prerender
  - Status: completed
  - Priority: P0
  - Depends on: SF-W0-002
  - Evidence: moved generated `.next` outside the repository; direct client import plus CSS-only server-safe skeletons; fresh `next build --webpack` passed for all 38 routes
  - Commit: pending W1 phase commit
  - Completed: 2026-08-20

- [x] SF-W1-002 — Enforce anime source URL and redirect policy
  - Status: completed
  - Priority: P0
  - Depends on: SF-W1-001
  - Evidence: `src/lib/sources/urlPolicy.ts`; exact HTTPS origins and intentional wildcard subdomains; credentials, HTTP, fragments, nonstandard ports, private/reserved literals, and untrusted redirects rejected; anime integration contract passed
  - Commit: pending W1 phase commit
  - Completed: 2026-08-20

- [x] SF-W1-003 — Reconcile movie/TV/anime provider ordering
  - Status: completed
  - Priority: P0
  - Depends on: SF-W1-002
  - Evidence: Filmu remains movie default; VidKing remains TV default; VidSrc is explicitly experimental and ordered after stable providers; anime catalog candidates are deduplicated and remain within selected Sub/Dub; player source contract passed
  - Commit: pending W1 phase commit
  - Completed: 2026-08-20

- [x] SF-W1-004 — Repair anime integration test runner and aliases
  - Status: completed
  - Priority: P0
  - Depends on: SF-W1-002
  - Evidence: adapter test uses portable explicit TypeScript imports; URL, provider, audio, subtitle, dedupe, allowlist, and fallback assertions pass with Node’s strip-types runner
  - Commit: pending W1 phase commit
  - Completed: 2026-08-20

- [x] SF-W1-005 — Make lint and verify strict
  - Status: completed
  - Priority: P0
  - Depends on: SF-W1-003, SF-W1-004
  - Evidence: lint uses `--max-warnings=0`; `package.json` verify includes web, playback, anime, native state, manifest, type, build, artifact, and leak checks; direct equivalent gate passed; `git diff --check` passed
  - Commit: pending W1 phase commit
  - Completed: 2026-08-20

- [ ] SF-W1-006 — Commit, push, deploy, and verify Web Phase W1
  - Status: in progress
  - Priority: P0
  - Depends on: SF-W1-005
  - Evidence: implementation and deterministic gate complete; production deployment and live smoke checks pending
  - Commit: —
  - Deployment: —
  - Next action: commit W1, push branch, deploy `umbrestream`, confirm `Ready`, and smoke-test `/`, `/anime/discover`, `/browse`, and representative player/API routes

## W2 — Player and interaction certification

- [ ] SF-W2-001 — Add deterministic source-sheet interaction tests
  - Status: not started
  - Priority: P0
  - Depends on: SF-W1-006
  - Evidence: —
  - Commit: —
  - Next action: cover mouse, touch, keyboard, focus restoration, and one selection

- [ ] SF-W2-002 — Certify framed playback, Fit/Fill, fullscreen, and episode context
  - Status: not started
  - Priority: P0
  - Depends on: SF-W2-001
  - Evidence: —
  - Commit: —
  - Next action: test movie, TV, anime Sub/Dub on desktop/mobile/tablet

- [ ] SF-W2-003 — Certify Continue Watching and Watchlist remove/Undo
  - Status: not started
  - Priority: P0
  - Depends on: SF-W2-001
  - Evidence: —
  - Commit: —
  - Next action: verify removal consumes every activation path and never navigates

- [ ] SF-W2-004 — Add Playwright matrix and accessibility scans
  - Status: not started
  - Priority: P1
  - Depends on: SF-W2-002, SF-W2-003
  - Evidence: —
  - Commit: —
  - Next action: desktop 1440×900, phone 390×844, tablet 820×1180

- [ ] SF-W2-005 — Commit, push, deploy, and verify Web Phase W2
  - Status: not started
  - Priority: P0
  - Depends on: SF-W2-004
  - Evidence: —
  - Commit: —
  - Deployment: —
  - Next action: run phase gate and production player smoke tests

## W3 — Performance, PWA, downloads, and security

- [ ] SF-W3-001 — Audit bundles, images, and player-only dependencies
  - Status: not started
  - Priority: P1
  - Depends on: SF-W2-005
  - Evidence: —
  - Commit: —
  - Next action: capture bundle and Core Web Vitals baseline

- [ ] SF-W3-002 — Verify service-worker freshness and update-ready flow
  - Status: not started
  - Priority: P0
  - Depends on: SF-W3-001
  - Evidence: —
  - Commit: —
  - Next action: test Network First navigation and new deployment activation

- [ ] SF-W3-003 — Update exact APK download headers and security checks
  - Status: not started
  - Priority: P0
  - Depends on: SF-W3-001
  - Evidence: current header rules target old filenames
  - Commit: —
  - Next action: derive headers from active manifest targets and verify responses

- [ ] SF-W3-004 — Commit, push, deploy, and certify Web Phase W3
  - Status: not started
  - Priority: P0
  - Depends on: SF-W3-002, SF-W3-003
  - Evidence: —
  - Commit: —
  - Deployment: —
  - Next action: run full web gate and record rollback deployment

## A0 — Native scaffold and migration

- [ ] SF-A0-001 — Create `native-android` Gradle Kotlin DSL project
  - Status: not started
  - Priority: P0
  - Depends on: SF-W3-004
  - Evidence: —
  - Commit: —
  - Next action: add phone/TV apps, version catalog, core modules, static analysis, and tests

- [ ] SF-A0-002 — Preserve signing/package identities and migration contracts
  - Status: not started
  - Priority: P0
  - Depends on: SF-A0-001
  - Evidence: —
  - Commit: —
  - Next action: port environment signing and define versioned guest-data migration

## A1 — Core networking and source resolution

- [ ] SF-A1-001 — Implement safe native networking core
  - Status: not started
  - Priority: P0
  - Depends on: SF-A0-002
  - Evidence: —
  - Commit: —
  - Next action: OkHttp, safe URL/DNS/redirect policy, typed failures, bounded responses

- [ ] SF-A1-002 — Implement normalized source contracts and resolver registry
  - Status: not started
  - Priority: P0
  - Depends on: SF-A1-001
  - Evidence: —
  - Commit: —
  - Next action: models, provider descriptors, header policies, Sub/Dub capability

- [ ] SF-A1-003 — Implement hedged multi-tier resolution engine
  - Status: not started
  - Priority: P0
  - Depends on: SF-A1-002
  - Evidence: —
  - Commit: —
  - Next action: cache validation, preference, bounded hedging, consent-based embed fallback

## A2 — Media3 playback

- [ ] SF-A2-001 — Implement Media3 data-source and media-source pipeline
  - Status: not started
  - Priority: P0
  - Depends on: SF-A1-003
  - Evidence: —
  - Commit: —
  - Next action: HLS/DASH/MP4 and per-request header/redirect safety

- [ ] SF-A2-002 — Implement MediaSessionService and playback persistence
  - Status: not started
  - Priority: P0
  - Depends on: SF-A2-001
  - Evidence: —
  - Commit: —
  - Next action: player ownership, StateFlow, resume, history, recovery

- [ ] SF-A2-003 — Build native phone player UI parity
  - Status: not started
  - Priority: P0
  - Depends on: SF-A2-002
  - Evidence: —
  - Commit: —
  - Next action: framed stage, Fit/Fill, fullscreen, gestures, tracks, episodes, countdown

## A3 — Offline, auth, sync, and product parity

- [ ] SF-A3-001 — Add bounded stream cache and permitted offline downloads
  - Status: not started
  - Priority: P1
  - Depends on: SF-A2-003
  - Evidence: —
  - Commit: —
  - Next action: separate LRU and persistent download caches

- [ ] SF-A3-002 — Add AniList and MAL secure linking
  - Status: not started
  - Priority: P1
  - Depends on: SF-A2-003
  - Evidence: —
  - Commit: —
  - Next action: backend broker, App Links, encrypted token handling

- [ ] SF-A3-003 — Add scrobbling and new-episode notifications
  - Status: not started
  - Priority: P1
  - Depends on: SF-A3-002
  - Evidence: —
  - Commit: —
  - Next action: idempotent 85% sync, WorkManager retry, FCM controls

- [ ] SF-A3-004 — Complete native Home/details/library/settings/onboarding parity
  - Status: not started
  - Priority: P1
  - Depends on: SF-A3-001, SF-A3-003
  - Evidence: —
  - Commit: —
  - Next action: Compose surfaces using shared APIs and design tokens

## A4 — TV and release

- [ ] SF-A4-001 — Build remote-first native TV presentation
  - Status: not started
  - Priority: P1
  - Depends on: SF-A3-004
  - Evidence: —
  - Commit: —
  - Next action: D-pad focus, immersive mode, 720p/1080p/4K scaling, countdown

- [ ] SF-A4-002 — Build and verify signed release APKs
  - Status: not started
  - Priority: P0
  - Depends on: SF-A4-001
  - Evidence: —
  - Commit: —
  - Next action: release builds, signatures, packages, versions, hashes, updater tests

- [ ] SF-A4-003 — Publish manifests/APKs and certify production
  - Status: not started
  - Priority: P0
  - Depends on: SF-A4-002
  - Evidence: —
  - Commit: —
  - Deployment: —
  - Next action: phone hardware, TV emulator, real-provider smoke tests, Vercel publication

- [ ] SF-A4-004 — Final handoff and rollback documentation
  - Status: not started
  - Priority: P0
  - Depends on: SF-A4-003
  - Evidence: —
  - Commit: —
  - Next action: update architecture, commands, fingerprints, limitations, rollback, physical-TV check
