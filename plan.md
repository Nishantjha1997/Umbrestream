# StreamFree World-Class Implementation Plan

This file is the durable implementation contract for the StreamFree web, mobile web/PWA, Android phone, and Android TV release. `TODO.md` is the live execution board. Every completed task must update `TODO.md`, run its relevant validation, and be committed with the implementation.

## Product and release principles

- Preserve the existing StreamFree visual identity while improving clarity, speed, accessibility, and reliability.
- Keep Bollywood, Indian TV, and Indian web-series-specific shelves removed.
- Use reliable TMDB/AniList regional data; never imply Netflix, Hotstar, or another service supplied data unless it actually did.
- Filmu remains the recommended movie source. TV and anime source ordering remains policy-driven.
- Fallback is consent-based after 20 seconds. A manually selected source is never silently replaced.
- Anime Sub and Dub remain explicit, separately labelled choices.
- Do not record history merely because a player route opened.
- Physical Android phone testing is available. Physical Android TV testing is unavailable; TV is validated with an emulator and documented as deferred hardware certification.
- Do not publish debug APKs, signing keys, secrets, or local environment files.

## Git and task protocol

1. Work only on `codex/streamfree-worldclass-hardening`.
2. Keep `main` untouched.
3. Complete one task or tightly coupled task group at a time.
4. Update `TODO.md` before committing a completed task.
5. Each commit includes code, relevant checks, and the TODO state update.
6. Run `git diff --check` and `git status` after each commit.
7. At phase boundaries update `STREAMFREE_HANDOFF.md` with evidence, known limitations, and the next phase.
8. If paused, record the last completed action, exact next action, blocker, and latest commit in `TODO.md` and the handoff.

## Phase 0 — Baseline and controlled execution

- Create this file and the live task board.
- Record the baseline commit, Vercel project, production URL, manifests, APK hashes, package IDs, certificates, and known limitations.
- Capture or retain baseline performance, bundle, startup, accessibility, and production UI evidence.
- Do not deploy or publish APKs during baseline work.

## Phase 1 — Release hygiene and quality gates

- Narrow ESLint to authored source and ignore generated assets.
- Fix authored lint errors and warnings; make verification run lint and typecheck.
- Make Next type validation enforceable in CI/Vercel, with only an explicit local escape hatch if required.
- Remove the public debug APK and its download header.
- Reject debug/unsigned/development APKs in release checks.
- Add explicit debug/release Android build commands.
- Replace placeholder Android tests with canonical package tests.
- Disable Android TV ad filtering by default and add strict official-host configuration validation for any future enablement.
- Remove obsolete updater code comments while preserving native manifest fetching and validation.

## Phase 2 — Shared data and playback contracts

- Define `HomeFeedResponseV1` and a shared home-feed builder.
- Add `/api/mobile/home` using the same builder as web.
- Validate optional Supabase bearer tokens through Supabase Auth.
- Separate public regional caching from private personalized caching.
- Add validated region overrides with “Reset to automatic.”
- Implement one adjacent-episode resolver that skips specials and crosses season boundaries.
- Route web, phone, and TV episode navigation through it.
- Extract shared native API/cache/media/history/auth/playback/update modules while keeping phone and TV presentation layers separate.

## Phase 3 — Startup and performance

- Replace the blocking web splash with a session-limited, readiness-based splash capped at 700 ms.
- Remove the long custom native splash overlay and use Android SplashScreen for cold starts.
- Prevent auth hydration from replacing the entire native Home view.
- Load React Query Devtools only in development.
- Keep player-only dependencies out of Home.
- Audit HeroUI/icon/lightbox imports, image loading, rail mounting, and query waterfalls.
- Reduce full native `innerHTML` replacements.
- Add a PWA update-ready prompt and verify Network First HTML/API caching with immutable asset caching.
- Target LCP ≤ 2.5s p75, INP ≤ 200ms p75, CLS ≤ 0.1, navigation feedback ≤ 100ms, phone cold shell ≤ 2.5s, phone warm shell ≤ 1s, and at least 25% lower Home JS transfer than baseline.

## Phase 4 — Home, search, browse, and library UX

- Correct hero provenance and labels for resume, personalized, trending, signed-out, and fallback states.
- Deduplicate hero and shelf content and define honest signed-in/cold/signed-out ordering.
- Ensure Continue Watching uses cursor pagination, shows every incomplete title, sorts by latest update, and removes completed titles.
- Preserve remove/Undo behavior without opening details or starting playback.
- Remove or feature-flag unavailable Watch Party content.
- Make Home section numbering contiguous.
- Add Space, Library, History, Settings, and Logout to the account menu.
- Repair Search as a keyboard/pointer/touch accessible combobox with `aria-expanded`, `aria-controls`, and `aria-activedescendant`.
- Improve Browse labels, URL-synchronized filters, reset behavior, focus restoration, loading, offline, empty, and retry states.
- Add automatic/manual region settings.
- Apply 44x44 touch targets, WCAG AA contrast, reduced motion, focus restoration, and announcements for source/audio changes, removals, errors, and updates.
- Keep Nishant branding tasteful and outside player/title metadata and accessibility labels.
- Replace vendor-specific TV copy with device-neutral Android TV wording.

## Phase 5 — Player and native behavior

- Regression-test source picker on desktop, mobile web, phone, and TV.
- Make source rows fully clickable/touchable/focusable and restore focus after close.
- Preserve source preferences independently by media type and anime audio variant.
- Keep Sub/Dub groups explicit and preserve episode/progress context when compatible.
- Keep consent-based recovery, trusted event validation, neutral eventless-provider messaging, and no silent manual-source replacement.
- Fix phone fullscreen landscape lock, Back behavior, and portrait restoration.
- Verify TV immersive landscape startup, D-pad focus, 10-second next-episode countdown, Cancel/Play now, and cross-season progression.

## Phase 6 — Onboarding, accessibility, and product polish

- Reduce onboarding to four focused, skippable, replayable, reduced-motion-aware steps.
- Explain update security and app capabilities on About/download pages.
- Ensure About contains web, Android phone, Android TV, creator Nishant, provider transparency, and support guidance.
- Verify offline/error/retry states and focus restoration across modal, sheet, route, and Back operations.

## Phase 7 — Android release and updater

- Phone release target: `online.streamfree.app`, version `1.3.1`, code `5`.
- TV release target: `online.streamfree.tv`, version `1.2.1`, code `4`.
- Native updater fetches the official manifest itself and validates HTTPS host, redirects, schema, package, version, size, SHA-256, signing certificate, and APK parseability before installation.
- Invalid downloads are deleted and never passed to the installer.
- Verify phone upgrade from code 4 to code 5 on the physical phone.
- Verify legacy migration behavior without pretending a certificate reset is an in-place update.
- Build signed, non-debuggable release APKs and verify v2/v3 signatures, IDs, versions, certificates, hashes, MIME types, filenames, headers, and manifests.
- Validate TV on an Android TV emulator and document missing physical-TV certification.

## Interfaces

`HomeFeedResponseV1` contains `schemaVersion`, detected/effective region, provenance, hero intent, normalized media, progress, ordered rows, cursors, and `generatedAt`.

`/api/mobile/home` accepts an optional Supabase bearer token and returns the same model used by web. Public regional data and private personalized data use separate cache policies.

`/api/mobile/config` exposes versioned feature flags. Ad protection defaults to disabled and fails closed if configuration is unavailable or invalid.

All clients use the same pure adjacent-episode resolver. No client keeps an independent season-boundary algorithm.

Analytics retains existing player events and adds `home_feed_ready`, `search_suggestion_selected`, `source_sheet_opened`, `source_sheet_selection_completed`, `app_shell_ready`, `pwa_update_ready`, and `pwa_update_accepted`, without titles, provider URLs, account IDs, IP addresses, or free-form data.

## Final test order

Testing runs after implementation tasks:

- Authored-source lint, TypeScript, source contracts, unit/component tests, Android tests, production build, leak scan, and `git diff --check`.
- Playwright desktop, mobile, and tablet flows for search, Browse, Home provenance/dedupe, Continue Watching over 100 titles, removal/Undo, regional modes, source picker, PWA updates, and mocked provider recovery.
- Accessibility scans, keyboard-only flows, reduced motion, zoom, narrow widths, focus restoration, and screen-reader announcements.
- Physical Android phone tests for startup, onboarding, login, playback, Sub/Dub, source picker, fullscreen/orientation, Back, history, offline recovery, and updates.
- Android TV emulator tests for D-pad/focus, immersive player, source picker, Back, countdown, cross-season progression, and updates.
- Real-provider smoke tests last for two movies, two multi-season TV series, two Sub/Dub anime titles, Filmu/default/fallback flows, reload persistence, and reconnect behavior.

## Deployment and handoff

1. Build a Vercel preview.
2. Run browser and accessibility QA.
3. Build private signed APK candidates.
4. Complete phone and TV-emulator QA.
5. Publish verified manifests and APKs.
6. Deploy the existing `umbrestream` Vercel project.
7. Confirm Vercel status is `Ready` and production routes, APIs, service worker, playback, manifests, APK hashes, and analytics.
8. Preserve the previous Vercel deployment and APKs for rollback.
9. Update `TODO.md` and `STREAMFREE_HANDOFF.md` with final evidence, release hashes, deployment ID, known provider limits, and deferred TV hardware certification.

## Anime Mode expansion (2026-08-18)

- Add a dedicated Anime Mode entry point from Home and a route-level anime shell with its own visual language while preserving the existing shared playback core.
- Do not copy Anilili source or assets unless a source-bearing, appropriately licensed repository is provided. The inspected checkout contains documentation/showcase material only, so StreamFree implements the requested interaction model natively.
- Integrate Anivexa and Miruro only through documented, configurable server-side API contracts. No reverse-engineered secure-pipe bypass, HTML extraction, or arbitrary client-supplied stream URL is permitted.
- Normalize provider episodes and watch responses into the existing source registry with explicit `sub`/`dub` labels, same-audio fallback, exact HTTPS allowlists, and neutral unavailable states.
- Add optional AniList and MyAnimeList OAuth account connections using secure state/PKCE, server-side token exchange, and configuration-gated UI. Do not store provider tokens in client storage or commit credentials.
- Add an in-app new-episode notification foundation based on Continue Watching and Watch History. External push delivery and scheduled polling remain configuration-gated until VAPID/FCM or another authorized delivery path is supplied.
- Add deterministic tests and run real-provider smoke tests last. Do not publish claims that a provider is guaranteed available.
