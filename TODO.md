# StreamFree Live Implementation Board

Read `plan.md` first. Update this board with every state change. Only one task is `in progress` unless explicitly stated.

## Current checkpoint

- Branch: `main`
- Baseline: `28bea93`
- Active task: `SF-A4-003`
- Next command: push the completed web workspace commit and verify its Vercel production deployment; native publication remains gated on the physical phone, TV-emulator, and real-provider checks.
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

- [x] SF-P0-006 — Reconfirm live production source contracts after native changes
  - Status: completed
  - Priority: P0
  - Depends on: SF-P0-005
  - Evidence: live `streamfree.online` smoke returned HTTP 200 for `/`, `/api/mobile/config`, `/robots.txt`, `/sitemap.xml`, movie fixture `tmdbId=1212763`, TV fixture `tmdbId=1399/1/1`, and anime fixture `anilistId=21/episode=1`; production policy is `2026-08-reliability-v5`, defaults are Filmu/movie, VidKing/TV, and labelled anime Sub/Dub candidates; this confirms the API contract and source metadata only, not real-provider playback certification
  - Commit: `0d4245d`
  - Completed: 2026-08-21

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

- [x] SF-W3-004a — Align the performance gate with the movie route boundary
  - Status: completed
  - Priority: P1
  - Depends on: SF-W3-004
  - Evidence: the movie route keeps server-side metadata/resume work in `src/app/movie/[id]/player/page.tsx` and the browser-only dynamic player import in `MoviePlayerClient.tsx`; `scripts/check-performance-contract.mjs` now validates that actual boundary; the full bundled web gate passed including lint, source/player/history/anime/update contracts, TypeScript, performance, PWA, release-artifact, leak, and production build checks
  - Commit: `9011278`
  - Completed: 2026-08-21

## A0 — Native scaffold and migration

- [x] SF-A0-001 — Create `native-android` Gradle Kotlin DSL project
  - Status: completed
  - Priority: P0
  - Depends on: SF-W3-004
  - Evidence: isolated JDK 17, Android API 37, Build Tools 36.0.0; AGP 9.3.1/Kotlin 2.4.10/Lifecycle 2.11/Core 1.19; Gradle 9.7.1 distribution and wrapper JAR SHA-256 verified; `scripts/verify.ps1` passed core unit test, phone/TV debug assembly, and phone/TV/design-system lint with warnings-as-errors; debug package IDs verified as `online.streamfree.app.debug` and `online.streamfree.tv.debug`; `git diff --check` passed
  - Commit: `566d26f`
  - Completed: 2026-08-20

- [x] SF-A0-002 — Preserve signing/package identities and migration contracts
  - Status: completed
  - Priority: P0
  - Depends on: SF-A0-001
  - Evidence: published APK certificates verified against the legacy phone/TV records; native fresh-install fingerprints recorded in `release/signing-certificates.json`; private native PKCS#12 keys created outside Git with DPAPI-protected credentials; environment-only signing in both native apps; signed phone `1.4.0-native` code 10 and TV `1.3.0-native` code 8 assembled with v2/v3 verification; release build rejected without signing variables; version-1 guest-data migration envelope and tests passed; `scripts/verify.ps1`, `scripts/build-release.ps1`, and `git diff --check` passed
  - Commit: `584b64e`
  - Completed: 2026-08-20

## A1 — Core networking and source resolution

- [x] SF-A1-001 — Implement safe native networking core
  - Status: completed
  - Priority: P0
  - Depends on: SF-A0-002
  - Evidence: `core:network` adds `StreamFreeHttpClient`, HTTPS-only `SafeUrlValidator`, approved-host/subdomain policy, `SafeDns` private/link-local/multicast/reserved-address rejection, three-redirect maximum with validated loop detection, no-cookie OkHttp dispatcher/timeouts, app-owned header allowlist, response-size bound, typed failures, host-only metrics, and policy unit tests; full `scripts/verify.ps1` passed with network tests, core tests, phone/TV debug assembly, and strict lint; `git diff --check` passed
  - Commit: `2b7cfb1`
  - Completed: 2026-08-20

- [x] SF-A1-002 — Implement normalized source contracts and resolver registry
  - Status: completed
  - Priority: P0
  - Depends on: SF-A1-001
  - Evidence: `core:source` adds typed playback requests, provider descriptors/capabilities, HLS/DASH/MP4/embed formats, normalized resolved sources/subtitle tracks, resolution attempts/outcomes, resolver registry, provider header registry, explicit-source narrowing, and separate Anime Sub/Dub compatibility; `SourceContractsTest` passed; full `scripts/verify.ps1` passed with network/model/source tests, phone/TV debug assembly, and strict lint; `git diff --check` passed
  - Commit: `53db743`
  - Completed: 2026-08-20

- [x] SF-A1-003 — Implement hedged multi-tier resolution engine
    - Status: completed
  - Priority: P0
  - Depends on: SF-A1-002
  - Evidence: `ResolutionOrchestrator` validates the cache, preserves explicit/remembered source precedence without silent fallback, hedges up to two native resolvers at 350 ms, starts the cloud tier at 800 ms, enforces 4-second native and 6-second cloud budgets, tracks typed attempts, cancels losing work, and only permits consent-based iframe fallback; `ResolutionOrchestratorTest` covers fast native wins, manual failure protection, and Anime Dub compatibility; focused `:core:source:test`, full `scripts/verify.ps1`, and `git diff --check` passed
  - Commit: `6cb0058`
  - Completed: 2026-08-21

## A2 — Media3 playback

- [x] SF-A2-001 — Implement Media3 data-source and media-source pipeline
  - Status: completed
  - Priority: P0
  - Depends on: SF-A1-003
  - Evidence: new `core:player` Android library pins Media3 `1.11.0`, maps HLS/DASH/MP4 to Media3 MIME types, builds `DefaultMediaSourceFactory` from OkHttp, injects validated provider header policies into every HTTP request, uses no-cookie safe DNS, caps and validates HTTPS redirects, validates provider/source/subtitle hosts, supports VTT/SSA/SRT subtitles, and rejects iframe sources before native factory work; `Media3PlaybackContractsTest` and source compatibility tests passed; forced phone/TV lint and full `scripts/verify.ps1` passed; `git diff --check` passed
  - Commit: `6da512d`
  - Completed: 2026-08-21

- [x] SF-A2-002 — Implement MediaSessionService and playback persistence
  - Status: completed
  - Priority: P0
  - Depends on: SF-A2-001
  - Evidence: `core:player` now owns `PlaybackSessionController` with ExoPlayer and MediaSession lifecycle, a trusted-event reducer, versioned DataStore-backed progress records, 15-second/pause/terminal/destroy persistence, 85% completion marking, and separate Anime Sub/Dub identity keys; phone and TV expose thin MediaSessionService implementations; `PlaybackStateTest`, full `scripts/verify.ps1`, strict lint, APK assemblies, and `git diff --check` passed
  - Commit: `bc219cb`
  - Completed: 2026-08-21

- [x] SF-A2-003 — Build native phone player UI parity
  - Status: completed
  - Priority: P0
  - Depends on: SF-A2-002
  - Evidence: phone Compose player shell now owns a black 16:9 cinema stage around the existing `Player` instance, lifecycle-aware state collection, persistent Fit/Fill `resizeMode` changes without remounting, explicit landscape fullscreen and portrait restoration, first-Back fullscreen exit, double-tap seek, brightness/volume vertical gestures, accessible 48dp controls, an honest no-source state, an explicit resolver-backed server sheet with format/quality/audio/caption labels, separate anime Sub/Dub groups with audio carried into source switching, explicit movie/TV/Anime Sub/Anime Dub source-preference storage, controller-level cancellation/position-preserving source switching, a compact Media3 settings sheet for speed and resolver-provided subtitle tracks, a production `/api/player/sources` resolver that validates API/source HTTPS hosts, preserves explicit provider/audio selection, parses direct HLS/DASH/MP4 plus labelled embeds/subtitles, and is registered in both native apps, request-driven intent launch state that resolves and loads the first compatible source while honoring remembered provider scope, and a blocking-safe TMDB episode catalogue resolver with a phone Season list plus Previous/Next controls driven by `AdjacentEpisodeResolver`. The mixed API resolver now accepts validated iframe outputs separately from Media3 playback; approved iframe candidates are presented in the source sheet and can be intentionally opened in a restricted WebView, while direct candidates remain on Media3. TV exposes the same embed consent path, remote source sheet, shared episode catalogue, cross-season Next resolution, and 10-second Play now/Cancel end countdown. Focused source/network/model tests, both app compiles, strict phone/TV lint, and `git diff --check` pass.
  - Commit: `62948ab`, `e072d6d`, `6b8b05a`
  - Completed: 2026-08-21

- [ ] SF-A2-007 — Wire native shared Home feed shell
  - Status: pending device verification
  - Priority: P0
  - Depends on: SF-A2-003
  - Evidence: `StreamFreeHomeFeedResolver` strictly parses the versioned `/api/mobile/home` contract, carries optional bearer and validated `X-StreamFree-Region` headers, accepts a URL-safe Continue Watching cursor, and has region/provenance/hero/row/cursor-request tests; phone and TV Home load the shared feed, display provenance and rows, launch request-driven playback intents, render bounded trusted TMDB/AniList artwork with loading/failure states, persist a validated country override in DataStore, and automatically request/merge cursor pages as the Continue Watching rail is traversed; the web builder uses a 25-row look-ahead so exactly 24 active titles do not create a false page; phone/TV Compose Android tests cover regional rows, region actions, and source controls; production `/api/mobile/home` previously returned HTTP 200 with schemaVersion 1 and the expected India regional feed; web cursor checks, TypeScript, native core tests, app compilation, Android-test compilation, strict lint, and `git diff --check` pass
  - Commit: `pending`
  - Next action: after the connected-phone gate, connect the resolver to the authenticated native session token in SF-A3-002 and execute cursor loading on a device with more than 24 incomplete titles.

- [x] SF-A3-004a — Add persistent, replayable native onboarding tour
  - Status: completed
  - Priority: P1
  - Depends on: SF-A2-007
  - Evidence: shared DataStore-backed completion contract, four-step phone/TV Compose tour, Skip/Back/Next/Done actions, and replayable Home `Help & tour` action; `:core:player:test`, both app Kotlin compiles, `native-android/scripts/verify.ps1`, strict lint, debug APK assembly, and `git diff --check` passed
  - Commit: `ba6f6a2`
  - Completed: 2026-08-21

- [x] SF-A2-004 — Build independent native TV playback shell foundation
  - Status: completed
  - Priority: P0
  - Depends on: SF-A2-002
  - Evidence: TV playback is a distinct root mode that removes normal navigation from composition and focus, uses a full black stage, caps 10-foot safe margins at 720p/1080p/4K widths, exposes 64dp remote controls, requests deterministic initial Back focus, restores home on Back, and keeps Fit/Fill on the same PlayerView; the combined `scripts/verify.ps1` gate passed with all core tests, both debug APK assemblies, and strict phone/TV/player/design-system lint, plus `git diff --check`
  - Commit: `6a13e06`
  - Completed: 2026-08-21

- [x] SF-A2-006 — Define shared adjacent-episode navigation contract
  - Status: completed
  - Priority: P0
  - Depends on: SF-A2-002
  - Evidence: `AdjacentEpisodeResolver` ignores season zero and episode zero specials, removes duplicate episode metadata, sorts valid seasons/episodes, crosses season boundaries in both directions, and returns null only at true catalogue boundaries; `:core:model:test` and `git diff --check` pass
  - Commit: `918c810`
  - Completed: 2026-08-21

## A3 — Offline, auth, sync, and product parity

- [ ] SF-A3-001 — Add bounded stream cache and permitted offline downloads
  - Status: pending provider authorization
  - Priority: P1
  - Depends on: SF-A2-003
  - Evidence: bounded on-the-fly LRU stream cache is complete in `core:player`; permanent downloads remain disabled until a provider-authorized contract is available
  - Commit: —
  - Next action: implement Media3 DownloadService only after a source is explicitly approved for offline storage; do not enable third-party downloads by default

- [x] SF-A3-001a — Add bounded native stream cache with an offline-download gate
  - Status: completed
  - Priority: P1
  - Depends on: SF-A2-003
  - Evidence: `StreamCachePolicy` limits the app-private cache to 16–512 MiB, defaults to a 256 MiB LRU cache for native direct sources, excludes iframe sources, shares one process-wide `SimpleCache` instance across activity/service players, falls back to upstream on cache initialization failure, and keeps permanent offline playback behind an empty provider allowlist; `:core:player:test`, `:core:player:lintDebug`, and `git diff --check` passed
  - Commit: `2c87537`
  - Completed: 2026-08-21

- [ ] SF-A3-002 — Add AniList and MAL secure linking
  - Status: pending external configuration
  - Priority: P1
  - Depends on: SF-A2-003
  - Evidence: new `core:auth` module fetches only the official runtime Supabase URL/publishable key, rejects insecure/path-bearing config, performs password and refresh-token calls against the validated Supabase origin, never accepts service-role/provider secrets, and stores only AES-GCM ciphertext in DataStore with a non-exportable Android Keystore key; phone and TV Home expose sign-in/sign-out, refresh sessions before expiry, and pass the bearer token into the shared Home feed; native AniList/MAL linking uses a server-created, hashed, ten-minute state transaction, provider authorization URL validation, fixed `streamfree://anime-link` callbacks, a strict callback parser consumed by both Activities, Home refresh after success, and no provider secret in the APK; auth/config/network/link-result tests, web TypeScript, app compilation, Android-test compilation, strict lint, and `git diff --check` pass
  - Commit: `pending`
  - Next action: register `https://streamfree.online/api/mobile/anime-links/callback/anilist` and `/mal` with the providers, apply `20260821100000_native_anime_oauth_transactions.sql`, then exercise the browser callback on the connected phone.

- [x] SF-A3-002a — Consume and validate native anime-link callbacks
  - Status: completed
  - Priority: P1
  - Depends on: SF-A3-002
  - Evidence: `NativeAnimeLinkResult` accepts only the fixed `streamfree://anime-link` scheme/host, known providers, success/error status, bounded reasons, and no unknown query fields; phone and TV handle cold-start and `onNewIntent` callbacks, show a safe result message, and refresh Home after success; 15 `core:auth` unit tests, `scripts/verify.ps1`, app compilation, strict lint, and `git diff --check` passed
  - Commit: `aa34e30`
  - Completed: 2026-08-21

- [x] SF-A3-003 — Add scrobbling and new-episode notifications
  - Status: completed
  - Priority: P1
  - Depends on: SF-A3-002
  - Evidence: shared aired-schedule resolution, authenticated web/native notification routes, trusted 85%-or-end native scrobbling, encrypted retry queue, notification permission/channel, idempotent delivery, six-hour WorkManager refresh, and local quiet-hours/preferences are implemented and covered by the completed SF-A3-003a–d subtasks; provider OAuth configuration remains tracked under SF-A3-002 and push/FCM is not required for the current periodic in-app/local-notification contract
  - Commit: `124bce9`
  - Completed: 2026-08-21

- [x] SF-A3-003a — Harden aired-episode notification sync and native in-app alerts
  - Status: completed
  - Priority: P1
  - Depends on: none
  - Evidence: shared AniList past-airing schedule resolver no longer treats total `episodes` as aired; future and finished-title false positives are covered by `scripts/check-anime-notifications.mjs`; browser and bearer-native notification routes share the sync/read contract; native notification client and signed-in phone/TV Home banners parse and mark alerts read; trusted native playback sync posts once at 85% or validated end through the bearer history route; web TypeScript, targeted ESLint, `:core:auth:test`, both app Kotlin compilation, Android-test Kotlin compilation, and `git diff --check` pass
  - Commit: `1d6a3b9`
  - Completed: 2026-08-21

- [x] SF-A3-003b — Add encrypted native history-sync retry
  - Status: completed
  - Priority: P1
  - Depends on: SF-A3-003a
  - Evidence: `EncryptedHistorySyncQueue` stores only encrypted playback metadata under an Android Keystore AES-GCM key; WorkManager uses connected-network constraints, unique work, exponential backoff, a 50-event cap, deduplication, session refresh, and no bearer token in input data; failed trusted syncs enqueue and schedule recovery, successful syncs remove their matching event; auth retry tests, `scripts/verify.ps1`, phone/TV compilation, strict lint, and `git diff --check` passed
  - Commit: `54cf078`
  - Completed: 2026-08-21

- [x] SF-A3-003c — Add idempotent native new-episode notifications
  - Status: completed
  - Priority: P1
  - Depends on: SF-A3-003b
  - Evidence: Android notification permission is declared and requested after sign-in; a dedicated episode channel, per-user delivered-ID state, unread-only dedupe, periodic connected-network WorkManager refresh, and safe permission checks are implemented; delivery-state tests, `scripts/verify.ps1`, phone/TV compilation, strict lint, and `git diff --check` passed
  - Commit: `da9f3a4`
  - Completed: 2026-08-21

- [x] SF-A3-003d — Respect local notification preferences and quiet hours
  - Status: completed
  - Priority: P1
  - Depends on: SF-A3-003c
  - Evidence: native episode delivery now reads a DataStore-backed enabled/quiet-hours policy before claiming notification IDs, so suppressed alerts remain available for a later refresh; overnight, disabled, equal-boundary, and invalid-value behavior covered by `AnimeNotificationPreferencesTest`; core auth tests and `git diff --check` passed
  - Commit: `124bce9`
  - Completed: 2026-08-21

- [ ] SF-A3-004 — Complete native Home/details/library/settings/onboarding parity
  - Status: pending implementation
  - Priority: P1
  - Depends on: SF-A3-001, SF-A3-003
  - Evidence: shared Home feed, onboarding tour, notification preference, PiP, source controls, and playback parity are implemented; native details/library/settings surfaces and device verification remain open
  - Commit: —
  - Next action: complete native details/library/settings surfaces after the provider/auth/device gates, then run phone and TV-emulator accessibility/focus checks

- [x] SF-A3-004b — Expose native anime notification preference in Home
  - Status: completed
  - Priority: P1
  - Depends on: SF-A3-003d
  - Evidence: signed-in phone Home exposes an accessible persisted alerts switch, and TV Home exposes a deterministic remote-focusable alerts toggle; both use `AnimeNotificationPreferenceStore` and preserve quiet-hour behavior; phone/TV Kotlin compilation and `git diff --check` passed
  - Commit: `052fb3f`
  - Completed: 2026-08-21

- [x] SF-A3-004c — Add explicit phone Picture-in-Picture playback action
  - Status: completed
  - Priority: P1
  - Depends on: SF-A2-003
  - Evidence: phone player exposes a 16:9 PiP action, enables the canonical Android activity PiP contract, and leaves the existing Media3 session/source state untouched; phone Kotlin compilation and `git diff --check` passed
  - Commit: `dd72fcd`
  - Completed: 2026-08-21

## A4 — TV and release

- [ ] SF-A4-001 — Build remote-first native TV presentation
  - Status: pending emulator verification
  - Priority: P1
  - Depends on: SF-A3-004
  - Evidence: TV playback mode, immersive black stage, bounded 10-foot sizing, remote source controls, focus restoration, and next-episode countdown are implemented under `SF-A2-004`; emulator behavior remains unverified because no emulator/system image is currently available
  - Commit: —
  - Next action: run the Android TV emulator gate when an emulator/system image is available; physical TV certification remains deferred

- [x] SF-A4-002 — Build and verify signed release APKs
  - Status: completed
  - Priority: P0
  - Depends on: SF-A4-001
  - Evidence: private signed candidates rebuilt with `native-android/scripts/build-release.ps1` after the notification-policy change; phone `online.streamfree.app` `1.4.1-native` code `11`, 3,204,304 bytes, SHA-256 `E8D5C4FD1B08EBECCA7968BD2B79C871C52BF99D05D71B16431B3A600EBF0DAF`, v2/v3, native certificate `8D66F79F…D7A112`; TV `online.streamfree.tv` `1.3.1-native` code `9`, 3,091,683 bytes, SHA-256 `D70030A9BBDBACC3DBF2B0F3E84168BAB62F60C3B7AC8D11FAA6C91964AEAD2B`, v2/v3, native certificate `93038E30…E4BA2A`; `aapt2 dump badging`, `apksigner verify --print-certs`, release build, and publication staging passed
  - Commit: `b89eafd`
  - Completed: 2026-08-21

- [x] SF-A4-002a — Implement native official-manifest update verification
  - Status: completed
  - Priority: P0
  - Depends on: SF-A0-002
  - Evidence: native updater hardcodes the official phone/TV manifest paths; validates schema, package, version, path, size, checksum, signing certificate, and APK parseability; deletes temporary and finalized files on any verification failure; Home exposes user-confirmed Check for updates and Download & install via private FileProvider; `:core:auth:test`, both app compiles, strict lint, debug APK assembly, and `git diff --check` passed
  - Commit: `b89eafd`
  - Completed: 2026-08-21

- [x] SF-A4-002b — Rebuild signed candidates after native source changes
  - Status: completed
  - Priority: P0
  - Depends on: SF-A4-002, SF-A3-003d
  - Evidence: fresh candidates were rebuilt after the Media3 cache/PiP changes with the protected credentials; phone `online.streamfree.app` `1.4.2-native` code `12`, 3,220,727 bytes, SHA-256 `A7C002E832C9B16525BC0D02584F934BEC52B3EE070611162F814F02900FA6BB`; TV `online.streamfree.tv` `1.3.2-native` code `10`, 3,108,065 bytes, SHA-256 `364BF7B30E3134B596439A3A0A89E498391C5FCD0D931682324C13A4629F8CB8`; both v2/v3 and native certificate pins passed independent staging; full `native-android/scripts/verify.ps1` passed with 235 tasks; public downloads and manifests were not changed
  - Commit: `2c87537`
  - Completed: 2026-08-21

- [x] SF-A4-002c — Keep native release version defaults aligned
  - Status: completed
  - Priority: P0
  - Depends on: SF-A4-002b
  - Evidence: `build-release.ps1` and both app Gradle fallbacks now default to the staged phone `1.4.2-native`/code `12` and TV `1.3.2-native`/code `10` candidates; explicit release properties remain supported; `git diff --check` passed
  - Commit: `ce6cef7`
  - Completed: 2026-08-21

- [ ] SF-A4-003 — Publish manifests/APKs and certify production
  - Status: in progress
  - Priority: P0
  - Depends on: SF-A4-002
  - Evidence: publication staging contains fresh phone/TV candidates and matching native fresh-install manifests; full deterministic native verification passed; live web/API smoke passed; `adb devices -l` currently reports no connected phone and no Android TV emulator/system image is available, so signed install/orientation/updater and real-provider playback gates remain open; no production download was changed
  - Commit: —
  - Deployment: —
  - Next action: phone hardware, TV emulator, real-provider smoke tests, Vercel publication

## W4 — Desktop shell and movie-player workspace

- [x] SF-W4-001 — Add poster-backed home chrome and inline movie-player workspace
  - Status: completed
  - Priority: P1
  - Depends on: SF-P0-006, SF-W3-004a
  - Evidence: test:movie-player-workspace, authored-source ESLint with zero warnings, TypeScript, next build --webpack, and git diff --check passed; home header now uses active hero artwork with contrast scrims; movie Details expands inline; desktop movie playback has a lazy More like this/Trending now rail while narrow layouts stack it below the player; pushed main and live production home/player routes returned HTTP 200 with the new home marker
  - Commit: 734e333
  - Completed: 2026-08-21
  - Next action: no further web action; continue native SF-A4-003 only after its external hardware/provider gates

- [x] SF-A4-003a — Prepare reproducible native publication artifacts
  - Status: completed
  - Priority: P0
  - Depends on: SF-A4-002, SF-A4-002a
  - Evidence: `native-android/scripts/prepare-native-publication.ps1` derives package/version/signature/hash/size from signed APKs, stages matching fresh-install manifests without changing `public/downloads`, requires explicit confirmation before publication, and manifest validation now distinguishes legacy and native signing identities; staged phone/TV artifacts and `node scripts/check-update-manifests.mjs` passed
  - Commit: `7164e4c`
  - Completed: 2026-08-21

- [ ] SF-A4-004 — Final handoff and rollback documentation
  - Status: not started
  - Priority: P0
  - Depends on: SF-A4-003
  - Evidence: —
  - Commit: —
  - Next action: update architecture, commands, fingerprints, limitations, rollback, physical-TV check
