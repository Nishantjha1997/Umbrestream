# StreamFree Live Implementation Board

Read `plan.md` first. Update this board with every state change. Only one task is `in progress` unless explicitly stated.

## Current checkpoint

- Branch: `codex/web-first-native-rebuild`
- Baseline: `28bea93`
- Active task: `SF-A1-002`
- Next command: define normalized playback/source contracts, provider descriptors, app-owned header policies, and Sub/Dub capability before registering resolvers.
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
  - Commit: `375f93b`
  - Completed: 2026-08-20

- [x] SF-W1-002 — Enforce anime source URL and redirect policy
  - Status: completed
  - Priority: P0
  - Depends on: SF-W1-001
  - Evidence: `src/lib/sources/urlPolicy.ts`; exact HTTPS origins and intentional wildcard subdomains; credentials, HTTP, fragments, nonstandard ports, private/reserved literals, and untrusted redirects rejected; anime integration contract passed
  - Commit: `375f93b`
  - Completed: 2026-08-20

- [x] SF-W1-003 — Reconcile movie/TV/anime provider ordering
  - Status: completed
  - Priority: P0
  - Depends on: SF-W1-002
  - Evidence: Filmu remains movie default; VidKing remains TV default; VidSrc is explicitly experimental and ordered after stable providers; anime catalog candidates are deduplicated and remain within selected Sub/Dub; player source contract passed
  - Commit: `375f93b`
  - Completed: 2026-08-20

- [x] SF-W1-004 — Repair anime integration test runner and aliases
  - Status: completed
  - Priority: P0
  - Depends on: SF-W1-002
  - Evidence: adapter test uses portable explicit TypeScript imports; URL, provider, audio, subtitle, dedupe, allowlist, and fallback assertions pass with Node’s strip-types runner
  - Commit: `375f93b`
  - Completed: 2026-08-20

- [x] SF-W1-005 — Make lint and verify strict
  - Status: completed
  - Priority: P0
  - Depends on: SF-W1-003, SF-W1-004
  - Evidence: lint uses `--max-warnings=0`; `package.json` verify includes web, playback, anime, native state, manifest, type, build, artifact, and leak checks; direct equivalent gate passed; `git diff --check` passed
  - Commit: `375f93b`
  - Completed: 2026-08-20

- [x] SF-W1-006 — Commit, push, deploy, and verify Web Phase W1
  - Status: completed
  - Priority: P0
  - Depends on: SF-W1-005
  - Evidence: commits `375f93b` and `4c38c63`; branch pushed; production `dpl_4fYCKjtDyJm9hPJJF5zsDFZLMJyx` returned `READY` and aliased `streamfree.online`; live `/`, `/anime/discover`, `/browse`, `/robots.txt`, `/sitemap.xml`, `/api/mobile/config`, movie/TV/anime source contracts returned HTTP 200; movie default `filmu`, TV default `vidking`, anime policy `2026-08-reliability-v1`
  - Commit: `4c38c63`
  - Deployment: `dpl_4fYCKjtDyJm9hPJJF5zsDFZLMJyx` (`READY`)
  - Completed: 2026-08-20
  - Next action: proceed with SF-W2-001

## W2 — Player and interaction certification

- [x] SF-W2-001 — Add deterministic source-sheet interaction tests
  - Status: completed
  - Priority: P0
  - Depends on: SF-W1-006
  - Evidence: shared keyboard activation and single-flight policy added across the sheet, shell, action buttons, and Movie/TV/Anime control bars; `scripts/check-source-sheet.mjs`; source-sheet test passed; ESLint zero warnings; TypeScript passed; production build passed; `git diff --check` passed
  - Commit: `751ac00`
  - Completed: 2026-08-20
  - Next action: proceed with SF-W2-002

- [x] SF-W2-002 — Certify framed playback, Fit/Fill, fullscreen, and episode context
  - Status: completed
  - Priority: P0
  - Depends on: SF-W2-001
  - Evidence: background/pagehide recovery added; player stage is isolated and black-backed; Fit/Fill remains class-only and source-key independent; `scripts/check-player-display.mjs`; player display checks passed; ESLint zero warnings; TypeScript passed; `git diff --check` passed
  - Commit: `41a858d`
  - Completed: 2026-08-20
  - Next action: proceed with SF-W2-003

- [x] SF-W2-003 — Certify Continue Watching and Watchlist remove/Undo
  - Status: completed
  - Priority: P0
  - Depends on: SF-W2-001
  - Evidence: action-level click consumption added to BookmarkButton and HistoryItemActions; optimistic cache update and Undo/rollback retained; `scripts/check-removal-interactions.mjs`; removal checks passed; ESLint zero warnings; TypeScript passed; `git diff --check` passed
  - Commit: `41a858d`
  - Completed: 2026-08-20
  - Next action: proceed with SF-W2-004

- [x] SF-W2-004 — Add Playwright matrix and accessibility scans
  - Status: completed
  - Priority: P1
  - Depends on: SF-W2-002, SF-W2-003
  - Evidence: authenticated Vercel preview `dpl_Dsyy177yZV8giEjNQhKjKNgVVm8Q` READY; desktop, 390x844 mobile, and 820x1180 tablet checks passed; Movie/TV/Anime player controls and Sub/Dub groups verified; source-picker click/Enter/Space/selection/focus checks passed; Fit/Fill iframe non-remount check passed; fullscreen exit check passed; browser console errors `[]`; removal contract checks passed
  - Commit: `d13c0b6`
  - Completed: 2026-08-20
  - Next action: proceed with SF-W2-005

- [x] SF-W2-005 — Commit, push, deploy, and verify Web Phase W2
  - Status: completed
  - Priority: P0
  - Depends on: SF-W2-004
  - Evidence: deterministic gate passed; preview `dpl_Dsyy177yZV8giEjNQhKjKNgVVm8Q` READY; production `dpl_33qEKaZ6fQStVARn1gpQmfXUp5w4` READY and aliased to `streamfree.online`; live route/source smoke passed; production browser source-picker/fullscreen smoke passed
  - Commit: `9fcdbd2`
  - Deployment: `dpl_33qEKaZ6fQStVARn1gpQmfXUp5w4` (`READY`)
  - Completed: 2026-08-20
  - Next action: proceed with SF-W3-001

## W3 — Performance, PWA, downloads, and security

- [x] SF-W3-001 — Audit bundles, images, and player-only dependencies
  - Status: completed
  - Priority: P1
  - Depends on: SF-W2-005
  - Evidence: `scripts/check-performance-contract.mjs`; standalone ESLint and TypeScript passed; production webpack build passed with explicit local Next typecheck bypass after standalone typecheck; 116 JS chunks / 4,745,850 bytes; HLS, DASH, lightbox, and query devtools remain split; movie/anime player route entries are dynamically loaded; generated worker precaches 0 APKs
  - Commit: `cb15448`
  - Completed: 2026-08-20
  - Next action: proceed with SF-W3-002

- [x] SF-W3-002 — Verify service-worker freshness and update-ready flow
  - Status: completed
  - Priority: P0
  - Depends on: SF-W3-001
  - Evidence: generated worker passed message-based `SKIP_WAITING` check, precaches 0 APKs, uses Network First for pages/API and Cache First for hashed JS; `PwaUpdateNotice` now calls `registration.update()` and observes late `updatefound`; `scripts/check-pwa-contract.mjs`; ESLint, TypeScript, PWA contract, and `git diff --check` passed
  - Commit: `3f6a202`
  - Completed: 2026-08-20
  - Next action: proceed with SF-P0-001

## P0 — Live production playback incident

- [x] SF-P0-001 — Restore movie playback with automatic stable-source failover
  - Status: completed
  - Priority: P0
  - Depends on: SF-W2-005
  - Evidence: production deployment `https://umbrestream-7pgcc3jjy-nishants-projects-7d9628b2.vercel.app` returned `Ready` and aliased `streamfree.online`; live source API reports `fallbackMode: automatic`, `timeoutMs: 20000`, `defaultId: filmu`, and VidRift `https://embed.vidrift.in/embed/movie/1212763`; corrected VidRift browser player selected Direct 1 and reached `0:32 / 82:54`; deterministic clean-launch policy verifies automatic movie/TV recovery and manual URL/remembered-source protection; automatic ordering, trusted-error recovery, timeout handling, ESLint, TypeScript, and source contracts pass
  - Commit: `b27d2fb` (automatic failover), `1e2815c` (VidRift host correction), `4f6734f` (initial-query correction), `465c834` (clean-launch contract)
  - Deployment: `https://umbrestream-7pgcc3jjy-nishants-projects-7d9628b2.vercel.app` (`READY`)
  - Completed: 2026-08-20

- [x] SF-P0-002 — Restore responsive desktop playback startup
  - Status: completed
  - Priority: P0
  - Depends on: SF-P0-001
  - Evidence: reproduction isolated product-default URL pollution; `src` now persists only deliberate manual/prompt-accepted choices, and reset/automatic paths clear it; live deployment `dpl_9J7xBsqHKnkMcSXAZs77bKX52P8d` is `READY` and aliases `streamfree.online`; production source API reports policy `2026-08-reliability-v2`, `fallbackMode: automatic`, `timeoutMs: 5000`; browser clean-launch URL remains `/movie/1212763/player` without `src`; source contracts, ESLint, TypeScript, Vercel production build, and `git diff --check` pass
  - Commit: `1c8087e`, `c7f57fa`
  - Deployment: `dpl_9J7xBsqHKnkMcSXAZs77bKX52P8d` (`READY`)
  - Completed: 2026-08-20

- [x] SF-P0-003 — Restore reliable first-click movie playback
  - Status: completed
  - Priority: P0
  - Depends on: SF-P0-002
  - Evidence: source contracts, TypeScript, targeted ESLint, production build, and `git diff --check` pass; Filmu received the full 30-second startup window; VidRift visibly advanced from `0:10` through `1:09` without a false eventless-provider warning; source picker opened/closed with focus restoration while playback continued; live API reports policy `2026-08-reliability-v4`, timeout `30000`, and order Filmu → VidRift → VidKing; production recovery reached VidRift playback at `0:23`; exact hotfix preview fixtures `/movie/315162`, `/tv/60059`, and `/movie/1212763/player?src=vidrift` passed with no browser errors or analytics RLS rejection; production detail fixture passed without the former `location` crash
  - Commit: `50e7069`, `0dcc868`, `0f49516`, `01ec5a8`
  - Deployment: `dpl_6AD7fG4ygMfMH2kMCRZih4y2NcVX` (`READY`, aliases `streamfree.online`)
  - Completed: 2026-08-20

- [x] SF-P0-004 — Audit every movie/TV provider embed contract against primary documentation
  - Status: completed
  - Priority: P0
  - Depends on: SF-P0-003
  - Evidence: official VidKing, VidLink, Cinezo, VidRift, and Videasy documentation audited; Videasy direct movie/TV playback visibly advanced, but its release-preview embed later timed out and is conservatively excluded from silent recovery; unsupported Cinezo resume metadata removed; undocumented/nonresponsive VidBolt and VidSrc quarantined; `npm run test:player-sources` passes for 14 active adapters; targeted ESLint, TypeScript, production build, and `git diff --check` pass
  - Commit: `9495054`, `f059a0d`
  - Deployment: `dpl_333xriThZmWkL3sVPua9Vq4yc86f` (`READY` preview; final production promotion will include the portrait-player follow-up)
  - Completed: 2026-08-20

- [x] SF-P0-005 — Repair phone portrait movie-player composition and control collisions
  - Status: completed
  - Priority: P0
  - Depends on: SF-P0-003
  - Evidence: iframe Fill no longer transforms/crops provider controls; native Fill uses `object-fit: cover`; production 390×844 geometry is borderless 366.4×206.1 with no horizontal overflow or inline overlay; external Back/source/framing/fullscreen controls are 44px; source sheet switched Filmu → VidRift exactly once and restored focus; fullscreen reveal is center-left, revealed Back/Sources/Exit have zero collisions, Exit preserves the player route; VidRift advanced `0:10` → `0:33 / 82:54`; browser errors `[]`; player-display contract, targeted ESLint, TypeScript, production build, and `git diff --check` pass
  - Commit: `5578fd9`, `573bb57`
  - Deployment: `dpl_3wzcvTEEeQdk2eWsghNhGVnbdikx` (`READY`, aliases `streamfree.online`)
  - Completed: 2026-08-20

- [x] SF-W3-003 — Update exact APK download headers and security checks
  - Status: completed
  - Priority: P0
  - Depends on: SF-W3-001
  - Evidence: Vercel APK headers are derived from the two signed active manifests; `scripts/check-download-headers.mjs`, update-manifest validation, release-artifact validation, ESLint, TypeScript, and `git diff --check` pass; Android promo now targets the active phone release rather than obsolete `v1.3`
  - Commit: `f9396b3`
  - Completed: 2026-08-20

- [x] SF-W3-004 — Commit, push, deploy, and certify Web Phase W3
  - Status: completed
  - Priority: P0
  - Depends on: SF-W3-002, SF-W3-003
  - Evidence: W3 commits `3f6a202`, `f9396b3`, and P0 desktop correction `1c8087e`/`c7f57fa` are pushed; Vercel production build and TypeScript passed; deployment `dpl_9J7xBsqHKnkMcSXAZs77bKX52P8d` is Ready and aliases `streamfree.online`; live player policy and APK HTTP header checks passed
  - Commit: pending (W3 release checkpoint in this changeset)
  - Deployment: `dpl_9J7xBsqHKnkMcSXAZs77bKX52P8d` (`READY`)
  - Completed: 2026-08-20

## A0 — Native scaffold and migration

- [x] SF-A0-001 — Create `native-android` Gradle Kotlin DSL project
  - Status: completed
  - Priority: P0
  - Depends on: SF-W3-004
  - Evidence: isolated JDK 17, Android API 37, Build Tools 36.0.0; AGP 9.3.1/Kotlin 2.4.10/Lifecycle 2.11/Core 1.19; Gradle 9.7.1 distribution and wrapper JAR SHA-256 verified; `scripts/verify.ps1` passed core unit test, phone/TV debug assembly, and phone/TV/design-system lint with warnings-as-errors; debug package IDs verified as `online.streamfree.app.debug` and `online.streamfree.tv.debug`; `git diff --check` passed
  - Commit: `566d26f`
  - Completed: 2026-08-20

- [ ] SF-A0-002 — Preserve signing/package identities and migration contracts
  - Status: completed
  - Priority: P0
  - Depends on: SF-A0-001
  - Evidence: published APK certificates verified against the legacy phone/TV records; native fresh-install fingerprints recorded in `release/signing-certificates.json`; private native PKCS#12 keys created outside Git with DPAPI-protected credentials; environment-only signing in both native apps; signed phone `1.4.0-native` code 10 and TV `1.3.0-native` code 8 assembled with v2/v3 verification; release build rejected without signing variables; version-1 guest-data migration envelope and tests passed; `scripts/verify.ps1`, `scripts/build-release.ps1`, and `git diff --check` passed
  - Commit: `584b64e`
  - Completed: 2026-08-20

## A1 — Core networking and source resolution

- [ ] SF-A1-001 — Implement safe native networking core
  - Status: completed
  - Priority: P0
  - Depends on: SF-A0-002
  - Evidence: `core:network` adds `StreamFreeHttpClient`, HTTPS-only `SafeUrlValidator`, approved-host/subdomain policy, `SafeDns` private/link-local/multicast/reserved-address rejection, three-redirect maximum with validated loop detection, no-cookie OkHttp dispatcher/timeouts, app-owned header allowlist, response-size bound, typed failures, host-only metrics, and policy unit tests; full `scripts/verify.ps1` passed with network tests, core tests, phone/TV debug assembly, and strict lint; `git diff --check` passed
  - Commit: `2b7cfb1`
  - Completed: 2026-08-20

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
