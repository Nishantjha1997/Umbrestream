# StreamFree Web-First Native Android Rebuild Plan

**Approved:** 2026-08-20
**Branch:** `codex/web-first-native-rebuild`
**Production:** `https://streamfree.online`
**Vercel project:** `umbrestream`
**Repository:** `Nishantjha1997/Umbrestream`

This is the single canonical implementation plan. `TODO.md` is the live task board. Superseded plans were removed with owner approval because they conflicted with the repository and contained unsupported provider-evasion assumptions.

## 1. Execution rules

1. Update `TODO.md` whenever task state changes; only one task is `in progress` unless tasks are explicitly independent.
2. Every completed task records commands, evidence, date, and commit hash.
3. Stage only task-owned paths. Never use `git add .`, `git add -A`, destructive reset, or checkout commands.
4. Commit and push each completed web phase. Deploy that phase to Vercel production only after its deterministic gate passes.
5. Record deployment URL, status, commit, smoke checks, and rollback deployment in `TODO.md` and `STREAMFREE_HANDOFF.md`.
6. Never commit credentials, `.env` files, private keystores, signing passwords, access tokens, raw provider URLs, or debug APKs.
7. Real-provider smoke tests run after deterministic tests and are recorded separately so third-party outages do not make CI nondeterministic.

## 2. Verified baseline — first implementation action

Baseline commit: `28bea93` (`feat(ux): site-wide refinement phases 1.4-3.4`). At audit time `main` matched `origin/main`; only `.zcode/` was untracked.

### Web

- Gemini's rollout landed below-player controls, detail SSR, route skeletons, honest retry states, Home first-paint work, contrast/a11y improvements, compact Anime Mode, and PWA refinements.
- `pnpm run typecheck`: passes.
- `pnpm run lint`: exits zero with one warning because `animeRemote.ts` does not use its `origins` safety input.
- `pnpm run build`: fails prerendering `/anime/discover` with a missing React Server Consumer Manifest module.
- `pnpm run test:player-sources`: fails because runtime policy includes `vidsrc` while the fixture does not.
- `pnpm run test:anime-integrations`: cannot start because the Node runner cannot resolve `@/utils`.
- Runtime QA from the former Gemini plan was not completed.
- No production deployment from this state was certified during the audit.

### Android

- Phone is generated from `mobile/app.js`; package `online.streamfree.app`, version `1.3.3`, code `7`.
- TV is generated from `tv/app.js`; package `online.streamfree.tv`, version `1.2.3`, code `6`.
- Web React UI does not automatically enter either APK.
- Phone has Fit/Fill and a source sheet but lacks current episode-context parity and continuous resume persistence.
- TV has a countdown, but its Java plugin maps `lockPortrait` to landscape and `exitPlayerImmersive` to immersive=true; its API 30+ exit path also keeps system bars hidden.
- Android tests are placeholder Capacitor tests under `com.getcapacitor.myapp`.
- APK download headers in `next.config.ts` point to old filenames.
- Public certificate fingerprints may remain in Git; private keys and passwords may not.

## 3. Fixed product/security decisions

1. Fix, test, and deploy web before Android implementation.
2. Long-term Android uses Kotlin, Jetpack Compose, and AndroidX Media3.
3. Use a staged migration so the current signed Capacitor apps remain rollback inputs until cutover.
4. Preserve package IDs and signing identities.
5. Native networking avoids browser CORS but does not guarantee access, quality, availability, ad-free playback, or download rights.
6. Provider integrations must be permitted, exact-host allowlisted, cancellable, testable, observable, and replaceable.
7. Do not implement hidden-iframe stream sniffing, all-host extensions, CAPTCHA/DRM bypass, or an open proxy.
8. Show quality only when verified from a manifest or track. Manual source selections are never silently replaced.
9. Offline downloads are enabled only when the provider contract and applicable rights permit them.

## 3.1 Open-source technical references

These repositories are reference material, not code to copy wholesale. Their
license, provenance, and compatibility must be checked before any reuse.

- [AndroidX Media3](https://github.com/androidx/media) is the primary reference
  for Media3/ExoPlayer data sources, per-request headers, Compose player surfaces,
  MediaSession, and permitted offline downloads.
- [Now in Android](https://github.com/android/nowinandroid) is the architecture
  reference for multi-module Gradle Kotlin DSL, Hilt, Room, DataStore, Flow,
  testing, and unidirectional Compose state. It is Apache-2.0 licensed.
- [Aniyomi extensions](https://github.com/aniyomiorg/aniyomi-extensions) may be
  consulted only for generic adapter boundaries and parsing structure. It is
  archived and Apache-2.0 licensed; provider-specific extraction, header recipes,
  anti-bot workarounds, or copied endpoints are out of scope.
- [Dantotsu](https://github.com/rebelonion/Dantotsu) was not used because the
  repository was unavailable for legal-access reasons during review and its
  reusable license/source could not be verified. Reimplement interactions from
  public Android/Media3 APIs until that verification exists.

Any future reference must pass the same license/provenance review and must not
weaken the exact-host, consent, privacy, or provider-authorization rules above.

## 4. Web phases

### W0 — Governance and baseline

- Create the implementation branch.
- Replace conflicting plans with this file and reset `TODO.md`.
- Ignore `.zcode/` after confirming it is agent-local state.
- Record baseline Git/Vercel state, manifests, APK hashes, packages, versions, and certificate pins.
- Commit and push the documentation checkpoint; do not deploy because no product code changes.

### W1 — Release blockers

#### W1.1 Production build

1. Remove generated `.next` and run a clean build.
2. If `/anime/discover` still fails, replace its unnecessary `next/dynamic` Server Component boundary with a direct client import while retaining `<Suspense>` for `useSearchParams`.
3. Audit `/discover`, `/search`, `/browse`, `/library`, and `/space/history` for the same pattern.
4. Do not mask failures with `STREAMFREE_SKIP_NEXT_TYPECHECK`.
5. Require two consecutive clean production builds.

#### W1.2 Anime URL/origin policy

1. Enforce configured HTTPS origins in `animeRemote.ts`.
2. Reject credentials, HTTP, unsupported ports, localhost, private/reserved IP literals, fragments, and non-allowlisted redirects.
3. Validate final streams, manifests, subtitles, redirects, and iframe URLs.
4. Permit subdomains only when the provider configuration intentionally covers them.
5. Keep raw provider URLs out of analytics and user-facing diagnostics.

#### W1.3 Source contract

1. Keep Filmu as movie default.
2. Keep `vidsrc` only as a labelled fallback if it remains approved.
3. Define exact movie, TV, anime Sub, and anime Dub ordering.
4. Test explicit URL choice, remembered preference, product default, and compatible fallback precedence.
5. Update fixtures to match product intent—not simply current output.

#### W1.4 Test infrastructure and strict gates

1. Use an alias-aware runner for source policy tests.
2. Cover URL policy, redirect, timeout, normalization, dedupe, audio compatibility, and quality labels.
3. Make lint fail on warnings.
4. Include all deterministic source/anime checks in `pnpm run verify`.

Gate:

```powershell
pnpm run lint -- --max-warnings=0
pnpm run typecheck
pnpm run test:player-sources
pnpm run test:anime-integrations
pnpm run build
git diff --check
```

Commit, push, deploy production, confirm Vercel `Ready`, and smoke-test `/`, `/anime/discover`, and representative player routes.

### W2 — Player and interaction certification

1. Add deterministic provider mocks for movie, TV, anime Sub, and anime Dub.
2. Open source sheet by click, tap, Enter, Space, and accessible activation.
3. Close by close button, Escape, backdrop, Android Back, and TV Back where applicable.
4. Make the full source row interactive, emit one selection, and restore invoking focus.
5. Keep StreamFree controls below the provider viewport.
6. Start web/phone playback framed; fullscreen remains explicit.
7. Preserve source/audio/episode context through previous/next navigation.
8. Keep the TV next-episode countdown at 10 seconds with Play now/Cancel.
9. Change Fit/Fill without remounting direct playback.
10. Verify Watchlist and Continue Watching removal consumes pointer/touch/keyboard events, never navigates, and supports Undo/rollback.
11. Record history only after trusted playback.
12. Add Playwright coverage for desktop 1440×900, phone 390×844, and tablet 820×1180.

Gate: component/Playwright/a11y checks and production build pass; commit, push, deploy, confirm `Ready`, and smoke-test production players.

### W3 — Performance, PWA, downloads, and security

1. Measure route bundles and Core Web Vitals before/after.
2. Keep player-only dependencies out of Home.
3. Prefer direct Server Component imports where dynamic boundaries add fragility without meaningful savings.
4. Prioritize only LCP artwork and provide correct responsive image `sizes`.
5. Verify Network First HTML/API behavior and immutable hashed-asset caching.
6. Verify update-ready prompt and no stale player after deployment.
7. Update exact APK headers to current manifest filenames.
8. Verify security headers do not break trusted playback.
9. Constrain proxy use to approved hosts; no arbitrary URL proxy.

Gate: full `pnpm run verify`, browser QA, Lighthouse/a11y, commit, push, production deployment, `Ready`, smoke checks, and rollback metadata.

## 5. Native Android project

Create a new shared Gradle root while keeping existing Capacitor projects until native cutover:

```text
native-android/
├── app-phone/
├── app-tv/
├── core/
│   ├── common/
│   ├── model/
│   ├── network/
│   ├── database/
│   ├── datastore/
│   ├── source/
│   ├── player/
│   ├── designsystem/
│   └── testing/
├── data/
│   ├── metadata/
│   ├── playback/
│   ├── history/
│   ├── library/
│   ├── auth/
│   ├── tracker/
│   └── notifications/
├── provider/
│   ├── anivexa/
│   ├── miruro/
│   └── embed-fallback/
├── feature/
│   ├── home/
│   ├── anime/
│   ├── details/
│   ├── player/
│   ├── downloads/
│   ├── library/
│   ├── auth/
│   ├── settings/
│   └── onboarding/
└── benchmark/
```

Use Kotlin DSL, version catalog, Compose, Coroutines/Flow, Hilt, OkHttp, Retrofit where appropriate, Kotlin serialization, Room, DataStore, WorkManager, Media3, static analysis, and unit/instrumentation tests.

## 5.1 Web UI composition closure (approved 2026-08-21)

Complete this web release before resuming native publication:

1. Capture the current production Home, Anime detail, Anime player, and source-picker flow at desktop and phone widths.
2. Make the desktop Home hero one continuous artwork surface from the top of the content viewport. The persistent Home actions remain readable glass controls over that same surface; do not render a second copy of the hero artwork as a separate header card.
3. Replace the empty non-fullscreen player spacer with a compact, semantic StreamFree header containing the brand and useful Home, Browse, Anime, and Search navigation. Keep it clear of provider controls and remove it from layout and accessibility in fullscreen.
4. Make intercepted Anime details a true full-bleed phone surface. Extend one backdrop to the top safe area, remove the artificial second hero/card seam, keep the title and Episode 1 actions inside the viewport, and ensure the page scrolls without horizontal clipping.
5. Upgrade the Anime player episode panel with an AniList-relation-aware season/continuation selector. AniList models seasons as separate media records, so expose validated TV/TV Short/ONA prequel, current, and sequel entries rather than guessing season numbers or mixing in movies/OVAs/specials. Selecting an entry updates the episode list in place; choosing an episode navigates to that media ID and preserves audio preference without carrying an episode-specific source ID across titles.
6. Mark episode-level watch state in the player list from authenticated StreamFree history. Completed episodes receive a subtle check and veil; partial episodes show restrained progress. Merely opening a player never marks an episode watched, and the targeted history query must cover long-running series rather than inheriting the general 100-row history cap.
7. Mirror the compact player header and full-bleed Anime detail composition in the generated mobile WebView source, then rebuild the tracked bundle from source.
8. Add deterministic composition checks, run responsive browser QA, and exercise the actual Anime source sheet for Sub and Dub. Anivexa labels count as present only when the live source API returns validated playable candidates; catalogue names must never masquerade as resolved servers.
9. Commit and push the passing web phase, wait for the exact Vercel Git deployment to report Ready, and repeat Home/detail/player/source-picker checks on `streamfree.online` before resuming Android publication.

Acceptance: no separate Home header band; no blank player spacer; no clipped Anime detail action; no Anime Cinezo; the player panel can move to an adjacent AniList season and accurately marks completed/partial episodes; and at least one live Anivexa candidate is visible for each audio variant when the upstream API returns one. Provider variability is recorded honestly rather than hidden with fake options.

## 5.2 Cross-media episode-panel correction (approved 2026-08-21)

Treat episode navigation as one product capability across TV and Anime rather than implementing isolated media-specific controls:

1. Add a TV season selector to every TV player episode surface: desktop sidebar, narrow inline panel, desktop episode sheet, and phone drawer. Use TMDB's real non-special seasons, load the chosen season in place, and retain the current source only when it remains compatible.
2. Redesign TV player episode cards for narrow sidebars. Cap artwork near 42% of the row, guarantee the copy column a real minimum width, allow a two-line episode title, retain readable date/overview lines, and highlight the playing episode without making cards oversized.
3. Replace Anime's horizontal 50-episode chip strip with a labelled episode-range selector. Long titles such as One Piece must render one compact `Episodes 1–50` control instead of dozens of compressed buttons and a horizontal scrollbar.
4. Keep Anime season/continuation and episode-range controls visually separate, keyboard/touch/remote accessible, and contained within the panel at desktop and phone widths.
5. Restrict Anime season navigation to genuine TV/TV Short entries. Do not present ONA, movie, OVA, or special relations as a season merely because AniList marks them as a prequel or sequel.
6. Preserve current episode, Sub/Dub, watched/partial state, and clean episode URLs when either selector changes. Never carry an episode-specific source ID across a different Anime media record.
7. Add deterministic contracts and responsive production-build checks for TV season switching, long titles, Anime range switching, overflow, and focusable labels before deployment.
8. Commit, push, wait for the exact Vercel deployment to be Ready, and repeat the TV and Anime panel flows on production.

Acceptance: TV users can change season without leaving the player; TV titles remain understandable in the sidebar; One Piece has no compressed range-pill overflow; Anime does not call unrelated ONA entries a season; both panels remain within the viewport and preserve compatible playback context.

## 6. Android phases

### A0 — Scaffold and migration safety

1. Create phone/TV modules and shared cores.
2. Preserve `online.streamfree.app` and `online.streamfree.tv` plus environment-based signing.
3. Define versioned migration data for guest history, watchlist, source/audio preferences, onboarding, and region.
4. If required, ship a final signed hybrid bridge build before native cutover; never read WebView SQLite internals directly.

### A1 — Safe networking and source resolution

Create `StreamFreeHttpClient`, `SafeUrlValidator`, `SafeDns`, `RedirectPolicy`, `ProviderHeaderRegistry`, `ConnectivityMonitor`, typed errors, and metrics.

Rules: HTTPS only; maximum three validated redirects; reject loopback/private/link-local/multicast/reserved/unauthorized hosts; app-owned header policies only; no cookie/token leakage; bound timeout/size/concurrency; no raw source URLs in analytics.

Define `PlaybackRequest`, `ResolvedSource`, `SubtitleTrack`, `ProviderDescriptor`, `SourceCapabilities`, `ResolutionAttempt`, `ResolutionResult`, and `AnimeSourceResolver`.

Resolution algorithm:

1. Validate a short-lived cached candidate.
2. Start explicit/remembered provider first.
3. Hedge one compatible native resolver after 350 ms; maximum two direct resolutions.
4. Start approved cloud API hedge after 800 ms.
5. Native tier budget four seconds; cloud tier six seconds.
6. Offer embed fallback after direct failure or explicit choice.
7. Preserve Sub/Dub/manual selection; cancel unnecessary work after enough candidates.
8. Show only actually resolved sources and verified quality.

### A2 — Media3 playback

Add ExoPlayer, HLS, DASH, OkHttp data source, Session, UI Compose, and offline components.

```text
OkHttpDataSource.Factory
  -> ResolvingDataSource.Factory
  -> ProviderHeaderRegistry
  -> DefaultMediaSourceFactory
  -> ExoPlayer / MediaSessionService
```

Requirements: per-request allowlisted headers for manifests/chunks, no redirect leakage, normalized format metadata, playback `StateFlow`, progress persistence every 15 seconds/pause/background/exit, trusted history, resume through compatible source change, typed recovery, and consent-based fallback.

### A3 — Native phone player UI

1. Framed 16:9 stage; fullscreen explicit.
2. Native Fit/Fill without recreating ExoPlayer.
3. Landscape fullscreen, portrait restoration, first Back exits fullscreen.
4. Source, Sub/Dub, previous/next, and episode list below the stage.
5. Double-tap seek, brightness/volume gestures, speed, quality, audio, subtitles, and subtitle delay.
6. PiP, MediaSession controls, trusted intro/outro skip, and 10-second next countdown.
7. 48dp touch targets, TalkBack semantics, reduced motion, safe areas.

### A4 — Caching/downloads

Separate bounded streaming LRU from persistent Media3 `DownloadService` storage. Support Wi-Fi-only, storage limits, pause/resume/remove, foreground notifications, and offline playback only for permitted stable sources. Never bypass DRM.

### A5 — AniList, MAL, sync, notifications

1. Keep provider secrets out of APK.
2. Use StreamFree backend broker and verified Android App Links for AniList.
3. Implement MAL against current documented native OAuth/PKCE behavior.
4. Encrypt tokens server-side or in Android Keystore as appropriate.
5. Idempotently scrobble at trusted end or at least 85% with reliable duration; WorkManager retries.
6. Add server-side airing checks, FCM, per-title controls, quiet hours, and detail-page deep links without autoplay.

### A6 — Product parity and TV

Build native Anime Mode, Home, details, search, Continue Watching, library, history, settings, onboarding, and updater. Keep remove/Undo non-navigating, region/history-aware feeds, honest source states, and tasteful Nishant branding outside player/a11y metadata. TV shares the core with deterministic D-pad focus, immersive playback, countdown, and 720p/1080p/4K sizing.

### A7 — Release

Recommended sequence:

- Hybrid migration/parity phone `1.3.4` code `8` if guest export is required.
- Full native phone `1.4.0` code `9`.
- Native TV `1.3.0` code `7` after emulator and physical acceptance.

```powershell
native-android\gradlew.bat test
native-android\gradlew.bat lintRelease
native-android\gradlew.bat :app-phone:assembleRelease
native-android\gradlew.bat :app-tv:assembleRelease
```

Verify packages, versions, non-debuggable state, v2/v3 signatures, certificate pins, hashes, sizes, manifests, MIME/headers, upgrade behavior, updater validation, and tampered-APK rejection. Physical phone testing is required; TV emulator is required and physical TV remains final acceptance.

## 7. Completion definition

Complete only when web production and tests, browser/player/remove/PWA behavior, native resolver/Media3 tests, phone hardware, TV emulator, signed artifacts, updater, manifests/hashes/downloads, rollback artifacts, and `STREAMFREE_HANDOFF.md` all pass and the worktree is clean.
