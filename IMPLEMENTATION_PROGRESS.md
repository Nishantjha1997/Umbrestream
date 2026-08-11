# Umbra implementation progress

Last updated: 2026-08-10

## Active fix: player server selection and provider-control overlap (2026-08-10)

- User-reported production regression: the StreamFree source list opens, but selecting another provider closes the list without reliably demonstrating or retaining the new selection. Provider-owned region/server controls can also sit underneath StreamFree's always-visible top-right chrome and lose pointer input.
- Implemented: the phone source list now uses explicit native radio buttons in a bottom sheet; selection commits the new iframe synchronously before the overlay closes, persists `src=<provider-id>` independently of a delayed Safari History API update, records a privacy-safe manual-switch event, and shows `Switching to` / `Now using` feedback. Desktop uses the same button path.
- Implemented: StreamFree's player header fades and becomes inert after three idle seconds so provider-owned region/server/caption/fullscreen controls receive pointer input. A 44px left-edge reveal control restores StreamFree controls; reduced-motion users retain persistent controls. The former persistent no-caption switch prompt was removed because it could cover provider controls during playback; caption capability remains labelled in the server picker.
- Validation: TypeScript, focused ESLint, all 12 source-registry fixtures, leak scan, React quality review, and `git diff --check` pass. The production build and local browser route compile both exceeded the OneDrive workspace command window without a compile error; verify the interaction again on the Vercel deployment after push.
- Scope guard: do not reorder providers, add ad blocking, scrape provider internals, or infer provider playback from an opaque iframe load. This pass is limited to reliable user selection and unobstructed provider controls.

## Current handoff: StreamFree is live; Nishant.top portfolio is in implementation (2026-08-10)

- StreamFree rebrand/domain work is complete and pushed to `main` in commit `241ab20`. Live checks passed for `https://streamfree.online/`, `https://www.streamfree.online/` (permanent redirect to the apex), and `https://umbrestream.vercel.app/`.
- Namecheap now points `streamfree.online` to Vercel with `A @ -> 216.198.79.1` and `CNAME www -> e8fa04909d424665.vercel-dns-017.com`. The old `umbrestream.vercel.app` hostname remains reachable.
- The portfolio source is maintained at `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\nishant-portfolio` and pushed to `https://github.com/Nishantjha1997/nishant-portfolio`. It has the homepage, selected-work case-study routes, AI TTS lab, resume page/download route, contact page, SEO metadata, Person JSON-LD, robots, sitemap, responsive styling, and `www.nishant.top` -> `nishant.top` host redirect configuration. The temporary duplicate under Umbra was removed after Vercel was connected to the dedicated repository.
- Portfolio source facts are sanitized from the supplied resume and local GitLab documentation. The public site uses the current role `Executive, Founder's Office at CallHippo`, includes the verified GitLab automation impact (`up to 24 hours` to a maximum `30-minute` processing window), and excludes the phone number from public HTML and metadata.
- Portfolio verification completed locally: production webpack build passed, typecheck passed, all planned route smoke requests returned `200`, the resume endpoint returned `application/pdf` with `X-Robots-Tag: noindex, noarchive`, and no phone number appeared in rendered public HTML. The local browser snapshot confirmed the homepage navigation and all five project cards.
- Remaining portfolio work: finish Namecheap DNS for `nishant.top` and perform live-domain checks. YouTube Scripto-Scribe remains explicitly last priority and must not be presented as working until its transcript extraction is verified on Vercel.
- Portfolio Vercel project `nishant-portfolio` is now created from `Nishantjha1997/Umbrestream` with root directory `portfolio/`; commit `c2f6e7e` is Ready. Vercel attached `nishant.top` and `www.nishant.top` to Production and supplied: `A @ -> 216.198.79.1` and `CNAME www -> 3fb42bb65e845d94.vercel-dns-017.com` (the trailing dot is optional in Namecheap). Do not reuse StreamFree's `www` CNAME for this domain.
- Namecheap DNS for `nishant.top` is still pending because the current browser session is signed out. Once signed in to the correct Namecheap account, replace any parking/redirect records with the two records above, wait for propagation, and refresh both Vercel domain rows before live checks.
- Hero artwork quality fix is pushed in `778335b`: the desktop hero and phone resume hero now promote TMDB `w500`/`w780`/`w1280`/`w1920` URLs to the `original` asset while leaving rails untouched; direct AniList/provider artwork passes through unchanged. Typecheck, focused lint, and `git diff --check` pass. A full production build attempt exceeded the local OneDrive command window without emitting a compile error; rerun it on the next local validation or rely on the Vercel build check after the push.

## Active implementation: StreamFree domain cutover and public rebrand (2026-08-10)

- `streamfree.online` and `www.streamfree.online` have been added to the existing Vercel project `umbrestream` as Production domains. `umbrestream.vercel.app` remains attached and reachable; the new apex has **not** been made the production alias yet.
- Vercel requires these exact Namecheap host records before either new URL can load:
  - `A` host `@` -> `216.198.79.1`
  - `CNAME` host `www` -> `e8fa04909d424665.vercel-dns-017.com`
- Current blocker: the available automated browser session is not signed into Namecheap, so its existing parking records have not yet been replaced. A browser error such as `ERR_CONNECTION_CLOSED` for `www.streamfree.online` is expected until those records are saved and DNS propagates. Do **not** infer a deployment/player problem from that error.
- StreamFree rebrand work is underway. Public-facing identity and URL work now centralizes in `src/config/brand.ts`; the code targets `https://streamfree.online` for canonical metadata while preserving the old Vercel hostname. The original `SF` mark is in `public/streamfree-mark.svg` and `src/app/icon.svg`.
- Public branding changed in progress: metadata/structured data, robots/sitemap, manifest/PWA, Capacitor display name and URL, logo/footer, DMCA/disclaimer/FAQ, sharing, account UI, admin heading, auth email templates, and README. Compatibility-sensitive internal identifiers (the `umbra_events` table, analytics symbols, local-storage keys, and feature flag) remain unchanged intentionally.
- `next.config.ts` now includes a permanent `www.streamfree.online` -> `streamfree.online` host redirect. It is only effective after the domain reaches Vercel.
- DNS is now live and verified through public resolvers: apex `A @ -> 216.198.79.1`; `www CNAME -> e8fa04909d424665.vercel-dns-017.com`. A direct HTTPS request to `https://www.streamfree.online` returned `200 OK` from Vercel. A browser may briefly retain the earlier pre-DNS failure; a fresh tab or normal DNS cache expiry resolves that.
- Rebrand validation completed locally: player source checks passed (12 adapters), secret leak scan passed, `tsc --noEmit` passed, changed-file ESLint passed, `git diff --check` passed, and the Next 16.2.1 webpack production build passed. The build still prints the pre-existing handled dynamic-cookie notices for `/library`, `/space`, and `/space/history`; those routes are emitted dynamic and this is not a build failure.
- Next required checks after the pending DNS change: run source/type/build/leak validation, deploy the rebrand, configure `NEXT_PUBLIC_SITE_URL=https://streamfree.online` in Vercel, set the primary domain, verify redirects/metadata/PWA with a fresh browser profile, then begin the separate `nishant.top` portfolio project.

## Approved next program: StreamFree domains/rebrand and Nishant.top portfolio (planning audit, 2026-08-10)

- The authoritative execution sequence is now in `STREAMFREE_PORTFOLIO_MASTER_PLAN.md`.
- Required order: identify the existing Vercel project -> attach and verify `streamfree.online` without making it primary -> implement and deploy the StreamFree rebrand -> switch the primary/canonical domain -> build and launch a separate portfolio at `nishant.top` -> repair/deploy YouTube Scripto-Scribe last.
- StreamFree/Umbra was clean on `main` at `b96f83c` during the planning audit and had no local `.vercel/project.json`; a future agent must not accidentally create a duplicate Vercel project.
- The GitLab automation worktree contains uncommitted user changes and credential-bearing local configuration. Treat it as read-only for portfolio research, never expose its secrets, and do not reset or push it as part of this program.
- The portfolio must not show the owner's phone number in site HTML or metadata. The downloadable resume may contain it and must be served with noindex/noarchive headers.
- No production code, DNS, Vercel project, or Namecheap setting was changed during this planning audit.

## SEO identity and DMCA pages (2026-08-10)

- Rebranded public metadata from the minimal `Umbra` title to `Umbra Stream | Free Movies, TV Series & Anime`; removed any Vercel branding from site metadata, Open Graph, Twitter cards, and the PWA manifest.
- Expanded the description and keyword set around `umbrestream`, movies, TV series, anime, subtitles, watch history, and mobile viewing. Search engines may take time to recrawl and replace the current result snippet.
- Added `src/app/robots.ts` and `src/app/sitemap.ts` with public discovery, legal, and navigation routes.
- Added `/dmca` with a specific copyright-reporting path using the owner contact email provided for this project. The page states that a DMCA notice is a reporting process, not a guarantee of legal compliance or legal advice.
- Mounted a crawlable full Footer menu in the redesigned shell for Movies, TV Shows, Anime, Search, Browse, Categories, About, Disclaimer, and DMCA.

## UI refinement pass (2026-08-10)

- Fixed an unclosed CSS comment in `src/styles/globals.css` that caused the compiled stylesheet to ignore the safe-area helpers and glass material utilities used by the redesigned shell.
- Added horizontal overflow clipping at the app root/body so decorative bleed cannot create a narrow-screen side gutter or horizontal scroll.
- Increased the intercepted-detail close button to a 44px touch target and added notch-aware positioning for iPhone safe areas.
- Added a subtle top separation and bottom shadow to the mobile navigation bar so it remains legible over long pages without obscuring the final content row.
- Typecheck, focused lint, `git diff --check`, and the Next 16.2.1 webpack production build pass. Generated CSS contains `glass-chrome`, `safe-bottom-nav`, `safe-detail-close`, and `overflow-x: clip`.

## Active fix: detail modal Play navigation (2026-08-10)

- After the new intercepted-route design rollout, opening a title and pressing Play inside its detail modal changes routes without visibly opening the player; opening the same Play link in a new tab works.
- Root cause: the `@modal` parallel-route slot had intercepted movie/TV/anime detail routes and a hard-navigation `default.tsx`, but no catch-all route. Next.js therefore retained the last modal subtree during same-tab soft navigation and rendered the player behind it.
- Added `src/app/@modal/[...catchAll]/page.tsx`, returning `null`, so any client navigation away from an intercepted detail route clears the modal slot.
- Local production-browser verification now passes for all three paths:
  - Movie: Home -> `/movie/1284041` intercepted modal -> Play -> `/movie/1284041/player?src=filmu`; zero visible modal Close buttons and one full-viewport Filmu iframe.
  - TV: Home -> `/tv/291496` intercepted modal -> Play S1 E1 -> `/tv/291496/1/1/player?src=vidking`; zero visible modal Close buttons and one VidKing iframe.
  - Anime: Anime -> `/anime/21` intercepted modal -> Play Episode 1 -> `/anime/21/player/1?src=anilink-sub`; zero visible modal Close buttons and one AniLink Sub iframe.
- No browser console warnings/errors were recorded during the checked Movie flow. Provider playback itself was not asserted because the frames are cross-origin; this fix concerns route visibility/mounting, not provider availability.
- Player/provider code is intentionally unchanged.
- Typecheck, focused lint, secret scan, source registry checks, `git diff --check`, and the Next 16.2.1 production build pass.
- Repaired `scripts/check-player-sources.mjs`: Phase 6 deleted `src/utils/players.ts`, but the script still imported and asserted against those legacy generators. The obsolete import/assertions were removed; all 12 current adapters pass.

## Current redesign architecture survey (2026-08-10)

This section supersedes older architectural descriptions lower in this file. Historical sections remain useful as an evidence trail, but future work must use the current files named here. The Claude redesign from `15e5217` through `08f40bb` changed 120 files (approximately 13,869 insertions and 3,578 deletions) after the TV rollback baseline.

### Design system and application shell

- The app is dark-only with one accent, local Instrument Serif display fonts, ambient color context/layers, and `EclipseRing` artwork treatment.
- `src/components/ui/layout/ImmersiveAppShell.tsx` is the composition root. Desktop and phone shells render concurrently and CSS selects the correct one at `md` (768px), avoiding hydration/media-query flashes.
- Desktop owns `src/components/shell/desktop/Rail.tsx` and `Header.tsx`; phone owns `src/components/shell/phone/TabBar.tsx`.
- Navigation is now five destinations: Home, Search, Browse, Anime, and You. `/movies`, `/tv`, and `/categories` redirect into Browse tabs through `next.config.ts`; detail and player subroutes are unaffected.
- `NEXT_PUBLIC_UMBRA_UI_V2=false` still selects the legacy shell in `src/app/layout.tsx`.

### Home and discovery

- The previous shared `Hero`/home-list composition was replaced by separate `PhoneHome` and `DesktopHome` trees with their own hero, Tonight, Vibe, Continue Watching, Trending, episode-drop, and preview sections.
- `src/hooks/useHomeHero.ts` coordinates hero selection/trailer behavior. Home data remains live TMDB/AniList data rather than mock content.
- `src/components/media/PosterCard.tsx` is still the shared normalized card used by rails/grids. Poster clicks navigate to media detail routes; on supported client navigation those routes are intercepted into the detail modal.
- Browse consolidates Films, Series, and Categories through `src/app/browse/page.tsx` and `BrowseTabs.tsx`.

### Detail routes and modal behavior

- Direct routes under `src/app/{movie,tv,anime}/[id]/page.tsx` render full detail pages.
- Client-side poster navigation is intercepted by `src/app/@modal/(.){movie,tv,anime}/[id]/page.tsx`, reusing the same extracted `DetailContent` components inside `src/components/shell/DetailModal.tsx`.
- `DetailModal` portals to `document.body` so route-template transforms cannot break its fixed positioning and locks body scroll while mounted.
- `src/app/@modal/default.tsx` handles hard navigation. The new `src/app/@modal/[...catchAll]/page.tsx` is equally required for soft navigation away from the modal; do not remove either.
- `MediaBackdrop` is decorative and globally `pointer-events-none`; commit `c844924` fixed its invisible veil swallowing Play/detail taps.

### Player architecture

- Phase 6 deleted `ReliablePlayer`, `usePlayerEngine`, the old source-selection components, `StuckStreamToast`, and `src/utils/players.ts`.
- `src/components/player/PlayerShell.tsx` is now the shared Movie/TV/Anime controller. It portals a single full-viewport iframe/native player, builds public embed sources synchronously, and enriches with an optional authorized direct source asynchronously.
- It deliberately does not preflight all providers or automatically switch opaque embeds. Providers own playback/fullscreen. Umbra owns one source sheet and one notification slot.
- Current defaults remain Movie Filmu, TV VidKing, and Anime AniLink Sub. Stable `?src=<provider-id>` and legacy ID translation remain.
- Media-specific headers and episode sheets/panels are under `src/components/sections/{Movie,TV,Anime}/Player`.
- Source contracts still live in `src/lib/sources`; `/api/player/sources` is only the non-blocking direct-source enrichment path for `PlayerShell`.

### History, account, and analytics

- `src/actions/histories.ts` now tracks accumulated `total_watched_seconds`, supports deleting and marking history complete, and returns per-media watch-time summaries.
- `/space/history`, `WatchHistory.tsx`, and `HistoryItemActions.tsx` provide account history management and watch-time tiles.
- Migration `supabase/migrations/20260809120000_history_watched_seconds.sql` must be applied to the connected Supabase project for the new watch-time field.
- First-party admin analytics, Vercel Analytics, and Speed Insights remain separate from the personal watch-history view.

### Runtime, PWA, and validation notes

- `next.config.ts` enables aggressive front-end navigation caching. Previous verification repeatedly saw stale service workers serve an older build after deployment; production smoke tests must verify the deployed commit and may require a hard refresh/service-worker update before conclusions are drawn.
- The build intentionally sets `typescript.ignoreBuildErrors=true` because Next's forked typecheck crashes on this Windows environment. A successful build is not sufficient; always run `tsc --noEmit` separately.
- The production build succeeds but logs handled dynamic-cookie bailouts for `/library`, `/space`, and `/space/history`. The routes are emitted as dynamic (`ƒ`), so this is not a build failure, but explicit dynamic declarations/error handling should be cleaned up later to prevent noisy logs from hiding real auth failures.
- Player source tests now target the adapter registry only and pass for 12 adapters.
- The in-app production browser could not attach during the first remote attempt. The completed evidence above comes from the freshly built local production server at `http://localhost:3212`.

### Recommended next checks

1. Commit and push the modal catch-all/source-test repair, wait for Vercel, and repeat Movie/TV/Anime modal-to-player navigation on production.
2. Verify a returning PWA client receives the new route bundle rather than a stale cached build.
3. Add an automated regression test for intercepted detail -> player navigation so a future shell redesign cannot reintroduce this exact soft-navigation bug.
4. Clean up the handled dynamic-cookie build logging on authenticated routes.
5. Apply and verify the `total_watched_seconds` Supabase migration before relying on account watch-time analytics.

## TV player rollback — implemented and locally verified (2026-08-07)

Phase 0 of `SONNET_IMPLEMENTATION_PLAN.md` is complete. `TV_PLAYER_ROLLBACK_HANDOFF.md` has the full evidence trail; this section records the actual implementation and verification result.

**What changed:**

- `src/components/sections/TV/Player/Player.tsx` no longer imports or renders `ReliablePlayer` / `usePlayerEngine`. It builds the source list synchronously from `createPublicEmbedSources` (the same adapter registry Movie/Anime use), resolves the default via `selectDefaultSource` + `legacySourceId`, and mounts exactly one iframe immediately — no `/api/player/sources` round trip, no provider preflight/observation, no automatic fallback switching.
- `src/components/sections/TV/Player/Header.tsx` no longer has a fullscreen button or any fullscreen state. The provider's own `allowFullScreen` iframe permission is the only fullscreen path for TV now.
- `src/components/sections/TV/Player/SourceSelection.tsx` and `EpisodeSelection.tsx` were **not modified** — both already had the exact stable-index / stable-id interface the direct controller needs (they predate the player engine).
- `src/lib/sources/adapters/embed.ts`: TV-only priority order changed to VidKing → Filmu → Cinezo → VidLink → VidLink Classic → Vidrift → Vidbolt → Videasy. **Movie order is untouched** (Filmu still first for Movies). `scripts/check-player-sources.mjs`'s TV order assertion was updated to match.
- The player container needed `SpacingClasses.reset` (from `@/utils/constants`) to cancel the app shell's `<main>` padding — without it the player rendered inset instead of full-bleed. A first attempt added `w-full` alongside the reset, which is wrong: `w-full` resolves to 100% of `<main>`'s *padded* content box, so the negative-margin trick never expanded the box to the true viewport width. The container has no explicit width class now; it relies on default block `width: auto` expanding to fill the negative margins, exactly like `ReliablePlayer`'s own shell does.

**Verification performed locally** (node v24.14.0 run directly, no `npm` available in this environment — see note below):

- `npm run test:player-sources` → pass, 12 adapters, TV order assertion updated and passing.
- `npm run typecheck` → clean.
- `npm run build` (webpack) → clean, all 24 routes generated including `ƒ /tv/[id]/[season]/[episode]/player`.
- Focused ESLint on the 3 changed files → clean.
- `npm run check:leak` → no secrets in client bundle.
- Browser-verified `/tv/97546/1/1/player` against a locally built production server (`next start`, port 3211) at both a mobile (375×812) and a desktop-ish (~715×694) viewport:
  - Defaults to `?src=vidking` with no manual selection needed.
  - Iframe `src` is `https://www.vidking.net/embed/tv/97546/1/1?...`, no `sandbox` attribute, correct `allow`/`referrerPolicy`.
  - Player is full-bleed (iframe width/height match the viewport, confirmed at both sizes) with no Umbra overlay over the iframe.
  - Header shows Back / Previous / Next / Sources / Episodes, no fullscreen button; Previous is correctly disabled on episode 1; Next preserves `?src=vidking`.
  - Sources drawer lists all 8 TV providers in the new order (VidKing, Filmu, Cinezo, VidLink, VidLink Classic, Vidrift, Vidbolt, Videasy).
  - Episodes drawer lists the full season with `?src=vidking` preserved on every episode link.
- **Not verified this session:** actual cross-origin video playback (`readyState >= 2`, advancing `currentTime`) inside the VidKing iframe. This browser tool's `javascript_tool` cannot reach into a cross-origin frame (`Blocked a frame with origin ... from accessing a cross-origin frame` — expected same-origin-policy behavior, not a bug). The prior agent's verification recorded in this file under "Live verification after TV rollback" already confirmed VidKing plays this exact fixture (`readyState: 4`, `duration: 1855.989`) when manually selected under the old engine; this session confirms the new direct-mount controller correctly defaults to that same provider/URL without engine involvement. **Deploying and re-testing in a real browser against production is still required** per the handoff's own gate — do this before considering Phase 0 fully closed in production, not just locally.
- Local dev/build environment note: no Node.js or npm was on `PATH` in this environment. A Node v24.14.0 binary was found at `C:\Users\DELL_\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe` (left over from a different agent runtime) and was used directly against this repo's own `node_modules\.bin` binaries for every check above. A `.claude/launch.json` was added at the workspace root (`My Web Sites/.claude/launch.json`) pointing at a locally-started `next start` on port 3211 for browser verification.
- A stale PWA service worker from an earlier production-server session served cached (pre-fix) HTML during verification and had to be explicitly unregistered (`navigator.serviceWorker.getRegistrations().then(r => r.unregister())`) before the width fix could be observed correctly in the browser. Not a code bug — a testing-session artifact — but worth knowing if a future session sees stale content on `localhost:3211` after a rebuild.

## Live verification on production after the direct-mount rollback (2026-08-07)

- Pushed as commit `e7d7853` (`rollback TV player to direct-mount iframe, default to VidKing`) on top of `6087633`. Vercel picked it up and deployed automatically; the new behavior was live within roughly 10 minutes of the push.
- **A stale PWA service worker on `umbrestream.vercel.app` served the pre-rollback build** (`?src=filmu`) for several checks after the deploy had actually gone live. Unregistering it (`navigator.serviceWorker.getRegistrations().then(r => r.unregister())`) and reloading picked up the new deploy immediately. Worth knowing for future production verification: a same-origin service worker from an earlier visit can make a fresh deploy look like it hasn't shipped yet.
- `/tv/97546/1/1/player` on production now defaults to `?src=vidking` with no manual selection required.
- The iframe: `src=https://www.vidking.net/embed/tv/97546/1/1?color=f5a524&autoPlay=false&nextEpisode=true&episodeSelector=true`, no `sandbox` attribute, `allow="autoplay; encrypted-media; picture-in-picture; fullscreen; screen-wake-lock"`, `referrerPolicy="origin-when-cross-origin"`. Full-bleed (iframe rect matches viewport exactly, x=0).
- The Sources drawer on production lists all 8 TV providers in the new order (VidKing, Filmu, Cinezo, VidLink, VidLink Classic, Vidrift, Vidbolt, Videasy), and against real network conditions VidKing showed "Online" (Filmu and Vidrift showed "Slow", everything else "Offline" — this is `useServerHealth`'s cosmetic no-cors ping, not a gate on playback).
- **Still not directly re-confirmed:** actual video playback inside the VidKing iframe (`readyState >= 2`, advancing `currentTime`). This session's browser tooling cannot inspect a cross-origin frame's contents (`Blocked a frame with origin ... from accessing a cross-origin frame`). The prior agent's verification recorded above under "Live verification after TV rollback" already confirmed VidKing plays this exact fixture end-to-end (`readyState: 4`, `duration: 1855.989`) when manually selected under the old engine; production now reaches that same provider/URL automatically, without the engine, and without the outage-causing Filmu default. A manual watch-through, or browser automation capable of cross-origin frame inspection, is the remaining gap before calling this fully closed.
- Filmu was not manually re-tested on production this session; it remains reachable via the Sources drawer.

## Purpose

This file is the handoff point for any AI or developer continuing the Umbra work. Read it before changing the player, analytics, authentication, or deployment code.

Repository: `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\umbra`

Remote: `https://github.com/Nishantjha1997/Umbrestream`

Deployment: Vercel is connected to the GitHub repository and deploys from `main` after a successful push.

## User decisions currently in force

- Keep Filmu as the first Movie source. For TV, the latest rollback request supersedes the earlier Filmu-first trial: the recovery plan in `TV_PLAYER_ROLLBACK_HANDOFF.md` recommends restoring VidKing as the first/default TV iframe because it is the only checked TV fixture that reached a playable media state.
- Anime source order is AniLink Sub, AniLink Dub, VidNest AnimePahe Sub, and VidNest AnimePahe Dub.
- Do not use private Bingr APIs, copied tokens, protected stream scraping, or undocumented direct-stream extraction.
- Do not register paid provider APIs or use the supplied email for provider signups.
- Do not detect provider redirect/error/advertiser pages as playback failure.
- Do not automatically switch providers because a strict containment policy blocks playback.
- Remove the ad-blocking idea completely. Umbra must not inject an ad blocker, recommend an ad blocker, or sandbox provider iframes in a way that can break playback.
- Admin access is restricted to the exact email `nishantjha31@gmail.com`.
- Monetization and Android app work are deferred.

## Implemented areas

### Player engine

- `src/lib/sources/types.ts` defines stable provider/source contracts, media requests, capabilities, tracks, variants, availability states, and direct/iframe source data.
- `src/lib/sources/adapters/embed.ts` contains the registry-backed public embed adapters.
- Movie and TV ordering is Filmu, Cinezo, VidLink variants, VidKing, Vidrift, Vidbolt, and Videasy.
- Anime V2 ordering is AniLink Sub, AniLink Dub, VidNest AnimePahe Sub, and VidNest AnimePahe Dub.
- Quarantined Anime providers are not included in the active Anime drawer.
- Stable URL source IDs and legacy numeric source links are supported.
- `/api/player/sources` returns an immediate manifest rather than blocking on every provider.
- `/api/player/observe` is registry-bound and does not inspect provider redirect/error/advertiser pages.
- `usePlayerEngine` provides session failure scoring, manual selection, fallback loop prevention, stable URL state, and source switching.
- `ReliablePlayer` provides iframe/native-player orchestration, history events, playback state, fullscreen/cinema fallback, and mobile-safe layout.
- Native direct-source playback supports HLS/DASH/MP4 and trusted subtitle tracks when an authorized direct source is configured.

### Subtitles and audio

- Provider subtitle capability is reported honestly; VidKing is not advertised as subtitle-capable.
- AniLink and VidNest Sub/Dub variants are separate stable source IDs.
- The trusted subtitle conversion route and direct-source subtitle normalization remain available only for authorized direct candidates.
- OpenSubtitles was intentionally not added as a public-site dependency because it requires an application key and has unsuitable free limits.

### Mobile and fullscreen fixes

- The server/source and episode controls are grouped separately from the fullscreen control.
- Auxiliary source/episode controls are hidden during true fullscreen, WebKit fullscreen, cinema mode, and short landscape player mode so they do not overlap provider controls.
- The player preserves safe-area spacing and avoids horizontal overflow on phone widths.
- The fullscreen action uses the native fullscreen API when available, iPhone video fullscreen for direct media, and a cinema-mode fallback for browsers that reject container fullscreen.
- Chrome fades after the idle delay and returns on pointer/touch/keyboard interaction.

### Application shell and UI

- The Bingr-inspired original shell, dark visual system, fixed desktop rail, floating mobile dock, route transitions, animated hero/detail surfaces, player chrome, drawers, and PWA/install behavior are present in the current checkout.
- The implementation uses Umbra branding and original components; it does not copy private code, assets, tokens, or APIs.
- Home hero width and mobile overflow were checked locally; no right-side grey gap or horizontal overflow was found in the checked viewport.

### Analytics and administration

- `src/lib/admin.ts` contains the exact admin-email gate.
- `/admin` redirects anonymous users to login and non-admin users to `/`; only `nishantjha31@gmail.com` receives the dashboard.
- First-party analytics events, API ingestion, session tracking, provider/fallback/playback metrics, and a 30-day admin dashboard are implemented.
- Vercel Analytics and Speed Insights remain enabled in the root layout.
- Supabase schema/migrations add the first-party event table and RLS/grants. Apply both new migrations in the connected Supabase project before expecting persisted analytics.
- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Never put it in a client bundle or commit it.

### Security and request controls

- Auth redirects, service-role handling, TMDB/search/player request limits, bounded analytics ingestion, and server-side input validation were hardened.
- The provider iframe `sandbox` attribute and the ad-warning modal have now been removed by explicit user decision because they can prevent legitimate provider playback.
- Provider frames still use their required `allow` and `referrerPolicy` values. Umbra intentionally does not attempt to strip provider advertisements or redirect behavior.
- Any future provider safety change must be tested against exact playback fixtures first and must not silently break the player.

## Historical ad-block-removal change (completed)

The ad-blocking idea was removed completely in the previously published implementation. This section is retained as historical context:

- Removed the `AdsWarning` import/render from `src/components/player/ReliablePlayer.tsx`.
- Deleted `src/components/ui/overlay/AdsWarning.tsx`.
- Removed the `ADS_WARNING_STORAGE_KEY` constant.
- Removed the iframe `sandbox` capability from `src/lib/sources/types.ts`, `src/lib/sources/adapters/embed.ts`, `src/hooks/usePlayerEngine.ts`, and `ReliablePlayer.tsx`.
- Removed blocker recommendations from the About FAQ.
- Removed the Popup Ads legend/icons from Movie, TV, and Anime legacy source drawers.
- Removed sandbox-specific source assertions from `scripts/check-player-sources.mjs`.
- Deleted the now-stale untracked `SECURITY_AUDIT_2026-08-06.md` that described sandbox enforcement which is no longer part of the implementation.

## Verification status

Completed before the latest ad-block removal:

- Player source checks passed for all 12 adapters.
- Typecheck passed in the temporary production verification copy.
- Production build passed in the temporary verification copy on Next 16.2.1.
- Secret leak check passed.
- Changed-file lint passed with 0 errors and 2 existing warnings: the deliberate hero `<img>` and React Hook Form compiler compatibility.
- `git diff --check` passed.
- Local mobile geometry check found player width equal to viewport and zero horizontal overflow.
- Local source manifest check returned Filmu first for Movie and the four active Anime sources, with Anime response under 500 ms after warm-up.
- AniLink One Piece fixture was confirmed in-browser with a cross-origin video element at `readyState: 4` and duration greater than 60 seconds.
- VidNest refused the sandboxed iframe with “Please Disable Sandbox”; this is why sandbox has now been removed globally.
- Filmu refused the sandboxed iframe with “Playback Disabled”; this is why sandbox has now been removed globally.
- Fullscreen testing showed source/episode controls hidden during fullscreen and chrome opacity reaching zero after the idle delay.

Latest post-removal checks:

- Source checks passed for all 12 adapters.
- Typecheck passed.
- Secret leak check passed.
- Changed-file lint passed with 0 errors and the same 2 warnings described above.
- `git diff --check` passed.

Still required after the latest change:

1. Run a production build if time permits. The previous production build passed before this latest capability-only removal; the post-removal typecheck and source checks now pass.
2. Test the current build/browser route for Movie, TV, and Anime after rebuilding so the rendered iframe has no `sandbox` attribute.
3. Verify `/admin` redirects unauthenticated users to `/auth?form=login&next=%2Fadmin`; do not place credentials in this file.
4. Review the final diff and status carefully.
5. Completed: committed the complete scoped change as `99ccaa4` and pushed `main` to the configured GitHub remote.
6. Vercel should now build from `main`. Confirm the deployment and remind the owner to apply the Supabase migrations and set required server environment variables.
7. Completed: stopped the verified temporary local server and finalized the browser verification tabs after resetting the temporary viewport.

Published handoff commits: `99ccaa4` (implementation) and `ee22166` (handoff status). The working tree was clean after the second push.

## Temporary local verification environment

- Temporary production build directory: `C:\Users\DELL_\AppData\Local\Temp\umbra-verify-final-20260806`
- Local server URL: `http://localhost:3210`
- At the last handoff the server process was PID `16164`; verify it before stopping it. Do not kill an unrelated process.
- The temporary copy used a junction to the repository `node_modules`; source changes must be synced/rebuilt before relying on its rendered output.

## Important final-review cautions

- Do not add back iframe sandboxing or an ad-blocker without explicit approval; the user removed that idea because it harms provider compatibility.
- Do not change the user’s exact admin email gate.
- Do not commit `.env.local`, Supabase service-role credentials, TMDB keys, provider tokens, cookies, or browser session data.
- Do not claim provider playback is universally reliable. Report exact fixture results and distinguish `available`, `unverified`, `slow`, and `failed`.
- Do not use provider redirect/error-page detection for fallback; the user explicitly excluded it.

## TV fallback fix added 2026-08-07

- Live smoke test of `/tv/97546/1/1/player` reproduced the problem: the route selected `?src=filmu`, Filmu returned the outer player page, but its iframe exposed no playable media and Umbra remained on the “Stream still loading?” prompt.
- TV source priority is now explicitly `Filmu → VidKing → Cinezo → VidLink → VidLink Classic → experimental providers`.
- The rollback generators also now place Filmu first and VidKing second for Movies and TV.
- TV opaque iframes no longer race through every provider after the 12-second unverified prompt. TV keeps the manual server prompt and only switches on an iframe network error or documented provider playback error, preventing a slow but valid provider from ending on a blank exhausted state.
- The fallback uses the existing provider failure scoring, session demotion, manual pinning, stable `src` state, and one-pass loop prevention.
- Post-change source checks, typecheck, lint, and diff validation pass.

## Live verification after TV rollback

- Deployed commit `4f6f86e` was tested on `/tv/97546/1/1/player?src=filmu`.
- After more than 20 seconds, the live route stayed on Filmu instead of racing through providers, and the Source and Episodes controls remained visible.
- Manual VidKing selection changed the URL to `?src=vidking`; the live iframe exposed one video element with `readyState: 4`, `duration: 1855.989` seconds, `currentTime: 0`, `paused: true`, and no media error. Its player text showed `30:55`, confirming the episode media loaded.
- The live Episodes drawer opened and listed the Ted Lasso season episodes.

## HD cinematic artwork upgrade — 2026-08-10

- Root cause of the blurred screenshot was isolated to the desktop `02 Tonight` billboard. It rendered the recommendation list's TMDB `w500` backdrop across an approximately `21:8` desktop surface.
- Added one shared TMDB cinematic-art selector. It filters for genuinely landscape images at least 1280px wide, then scores resolution, community rating/vote confidence, neutral artwork without baked-in language, and 16:9 crop suitability.
- The `Tonight` billboard now renders an original-resolution fallback immediately and asynchronously selects a high-quality alternate TMDB backdrop, deliberately excluding the default artwork when a suitable alternative exists.
- The main desktop hero now requests TMDB image metadata and selects its landscape artwork through the same logic without blocking initial rendering.
- Movie/TV hover previews and detail-page backdrops now use the shared selector too, preventing other wide surfaces from stretching `w500` thumbnails.
- Anime remains provider-native: AniList banner art is retained because AniList IDs cannot safely be treated as TMDB IDs.
- Typecheck, focused lint, leak scan, diff validation, and the full Next.js production build passed after the artwork changes.
- The selector was exercised against live TMDB House of the Dragon data and chose an inspected 3840×2160 alternate backdrop (`/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg`) instead of the default `w500` image.
- Completed in commit `4f38142`, pushed to `main`, and confirmed READY on Vercel production (`umbrestream-du0oq4o3e-nishants-projects-7d9628b2.vercel.app`, 1m 8s build).
- Live `streamfree.online` verification confirmed the `02 Tonight` image source is `https://image.tmdb.org/t/p/original/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg`.
- `/admin` correctly redirects unauthenticated visitors to `/auth`. The supplied email/password did not authenticate: the live form returned “That email and password don’t match an account.” No account was created automatically.

## Portfolio deployment and nishant.top DNS handoff — 2026-08-10

- Portfolio repository: `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\nishant-portfolio`.
- Portfolio GitHub: `https://github.com/Nishantjha1997/nishant-portfolio`.
- Portfolio content release is pushed as `825b18c`; the README/privacy and deployment handoff update is pushed as `5c324e8`.
- Local portfolio validation remains green: typecheck, lint (one pre-existing PostCSS anonymous-default-export warning), production build, route generation, resume headers, and the phone-number leak scan.
- Vercel project: `nishant-portfolio` under `Nishant's projects`.
- Root cause of the failed `825b18c` deployment was Vercel's stale Root Directory setting pointing to `portfolio`, which does not exist in the separate repository. The setting was changed to the repository root in Vercel Project Settings.
- A corrected redeploy of `825b18c` completed successfully as Vercel deployment `Gx53wH9zCg2duqXnDB46Fw4igLUN`, and the README commit `5c324e8` completed successfully as deployment `2jKtfDV89sSkwxsc2syXBUchWPn3`. The latest portfolio deployment is Ready.
- Vercel has `nishant.top` and `www.nishant.top` attached to Production but currently reports both as Invalid Configuration because DNS is not yet pointed at Vercel.
- Exact Namecheap records shown by Vercel:
  - `A` host `@` -> `216.198.79.1`
  - `CNAME` host `www` -> `3fb42bb65e845d94.vercel-dns-017.com.`
- The available automated browser session reached Namecheap's login page, so no DNS records were changed in this session. Do not guess or reuse StreamFree's CNAME. The next agent should sign in to the correct Namecheap account, preserve unrelated records, replace only parking/redirect records for `nishant.top`, then refresh Vercel and verify SSL, apex, and `www` redirect.
- YouTube Scripto-Scribe remains the final/lowest-priority task and must not be advertised as live until real transcript extraction works on a Vercel deployment.

## nishant.top DNS rollout completed — 2026-08-10

- Namecheap authentication was confirmed and only the two old parking/redirect records for `nishant.top` were removed.
- Added the exact Vercel records:
  - `A @ -> 216.198.79.1`
  - `CNAME www -> 3fb42bb65e845d94.vercel-dns-017.com.`
- Preserved the unrelated Namecheap email-forwarding TXT record.
- Vercel Project Settings -> Domains now reports `nishant.top` and `www.nishant.top` as **Valid Configuration** for Production.
- Public resolver checks through Google, Cloudflare, and Quad9 return the expected apex A record and `www` CNAME.
- Live portfolio verification through the resolved Vercel endpoint passed: homepage returned `200`, canonical is `https://nishant.top`, the expanded description is present, and the phone number is absent from homepage HTML.
- `https://www.nishant.top/` returns Vercel's permanent redirect to `https://nishant.top/`.
- `https://nishant.top/robots.txt` points to `https://nishant.top/sitemap.xml`.
- `https://nishant.top/api/resume` returns the PDF with `Content-Disposition: attachment` and `X-Robots-Tag: noindex, noarchive`.
- The local Windows resolver may continue to report the old NXDOMAIN briefly; this is local DNS cache propagation, not a Vercel or Namecheap configuration failure.

## Portfolio completion pass — 2026-08-10

- Portfolio repository: `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\nishant-portfolio`.
- Expanded all six published project pages into recruiter-ready case studies with a clearly separated challenge, implementation decisions, outcome, and privacy/disclosure boundary.
- The GitLab Access Automation case study now documents the approved `up to 24 hours -> maximum 30 minutes` impact, validation/approval flow, reliability controls, expiry/audit behavior, and sanitized-publication boundary without publishing source, internal URLs, employee data, or credentials.
- Replaced the static AI TTS concept card with a working browser SpeechSynthesis lab at `/labs/ai-tts`: installed voice selection, rate, pitch, play/restart, pause/resume, stop, text download, accessibility status, browser-capability errors, and an explicit local-processing/privacy explanation. It does not falsely claim downloadable audio.
- Added a contact composer at `/contact` that validates name, email, subject, and message, then opens a prefilled email draft. The website does not store or transmit the form contents and introduces no mail-service credential or public submission endpoint.
- Added project-specific canonical/Open Graph metadata and SoftwareApplication/CreativeWork structured data.
- Limited the public CallHippo experience copy to the approved current title; no unverified role achievements or dates were invented.
- Updated the portfolio README to reflect the live domain, working lab, contact workflow, and richer case studies.
- Verification passed: full typecheck, focused and full ESLint with zero errors (one existing PostCSS anonymous-default-export warning), two optimized Next.js production builds, all 17 generated routes, `git diff --check`, public-link checks, and phone/password/service-key/private-key scans outside the downloadable resume.
- Local browser verification passed for the homepage, AI TTS controls and installed-voice list, contact form semantics, GitLab case-study content/disclosure, desktop overflow, metadata titles, and absence of the phone number from rendered pages.
- Portfolio release commit: `e104410` (`feat: complete interactive portfolio case studies`), pushed to `main`.
- Vercel production deployment: `8GYY9HboeXWPbWbnGuojXLqohxfy`, URL `https://nishant-portfolio-i21ze5cum-nishants-projects-7d9628b2.vercel.app`, status **Ready**, build duration shown as 31 seconds, exact commit `e104410`.
- Live `https://nishant.top/labs/ai-tts` contains the working lab, and `https://nishant.top/work/gitlab-access-automation` contains the expanded case study. The resume route still returns `200`, `Content-Disposition: attachment`, and `X-Robots-Tag: noindex, noarchive`.

## Claude Usage Uploader public handoff — 2026-08-10

- Repository cloned to `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\claude-uploader-releases` from `Nishantjha1997/claude-uploader-releases`.
- Replaced the one-word placeholder README with a public release guide covering the verified v2.0.5 Windows/Linux/macOS assets, checksums, offline-first reliability model, 95% lock-collision reduction, high-level architecture, privacy/security limits, recovery guidance, latest-stable-release link, and portfolio case-study link.
- The README explicitly states that source code, organization configuration, private infrastructure, credentials, endpoints, and telemetry records are not published.
- Release documentation commit: `3dc8f76` (`docs: publish Claude uploader release guide`), pushed to `main`.

## YouTube Scripto-Scribe paused state — 2026-08-10

- The user reprioritized portfolio completion ahead of YouTube work. Do not resume this final phase until explicitly continuing after the portfolio release.
- Repository: `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\youtube-scripto-scribe`.
- There is an uncommitted implementation in progress: mock transcript fallback removed; strict YouTube ID parsing and typed client errors added; a Vercel Python `/api/transcript` spike using `youtube-transcript-api==1.2.4` added; language/search/TXT-SRT-VTT UI added; Lovable/GPT Engineer metadata removed; README and Vercel configuration added.
- The dependency install/validation step was interrupted before completion. The working tree also contains generated `pnpm-lock.yaml` and `pnpm-workspace.yaml`; inspect them before deciding whether they belong in the final commit. Do not discard the in-progress files.
- No YouTube Scripto-Scribe commit, GitHub push, Vercel project, live caption proof, or portfolio project entry has been completed. The portfolio correctly continues to omit this project until real caption extraction works on Vercel.

## YouTube Scripto-Scribe Vercel spike completed; provider approval required — 2026-08-11

- Resumed the paused repository at `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\youtube-scripto-scribe` without discarding the in-progress work.
- Replaced the mock-success path with strict URL/video-ID validation, typed client/server errors, and a same-origin `/api/transcript` contract backed by `youtube-transcript-api==1.2.4`.
- Added real caption-language selection, transcript search, timestamp links, copy, TXT/SRT/WebVTT exports, bounded response sizes, upstream timeouts, five-minute success caching, and basic per-IP abuse controls.
- Removed the external GPT Engineer script and active Lovable build tagger, replaced generated metadata and claims, and wrote setup/architecture/privacy/deployment documentation.
- Local verification passed with real captions: `Ks-_Mh1QhMc` returned 428 English creator-caption segments and 52 language choices; Spanish returned 422 segments. `dQw4w9WgXcQ` returned 61 segments. Invalid-ID and no-caption fixtures returned explicit errors rather than mock success.
- Final local gates passed: TypeScript typecheck, Python compilation, production Vite build (2,078 modules; 476.18 kB application bundle, 152.10 kB gzip), `git diff --check`, and secret scan. ESLint reported 0 errors and 6 pre-existing shadcn Fast Refresh warnings.
- Release commit `4e75829` (`feat: ship real YouTube transcript extraction`) was pushed to `Nishantjha1997/youtube-scripto-scribe` on `main`.
- Created a separate Vercel project named `youtube-scripto-scribe` under `Nishant's projects`. Production is Ready at `https://youtube-scripto-scribe.vercel.app`; the immutable deployment is `https://youtube-scripto-scribe-bs5tzz49f-nishants-projects-7d9628b2.vercel.app`, built from exact commit `4e75829`.
- Live browser verification proved the frontend and function route deploy correctly. `dQw4w9WgXcQ` returned 5 languages and 61 real timestamped segments, beginning with `[♪♪♪]`.
- The Vercel spike is not reliable enough to publish in the portfolio: fresh requests for `Ks-_Mh1QhMc` and `jNQXAC9IVRw` returned the explicit `RATE_LIMITED` state because YouTube blocked the Vercel data-center IP. Local requests for the same fixtures continued to work. This is the cloud-IP failure anticipated by the master plan.
- The official YouTube `captions.download` endpoint is not a fallback for arbitrary public videos because Google documents that it requires OAuth and permission to edit the video: `https://developers.google.com/youtube/v3/docs/captions/download`.
- Documented production option awaiting owner approval: Supadata's transcript API requires a server-side API key and advertises 100 free requests per month with no credit card. Documentation: `https://docs.supadata.ai/`; product/free-tier page: `https://supadata.ai/video-transcript`.
- No Supadata or paid proxy account was created, no API key was requested, and no secret was added to Git or Vercel. Per the master plan, obtain approval before creating the keyed service account or accepting its quota/pricing terms.
- The portfolio intentionally still omits YouTube Scripto-Scribe. Add it only after a keyed fallback is configured in Vercel and several fresh, uncached production fixtures succeed.

## YouTube Scripto-Scribe Node extractor and region check - 2026-08-11

- Replaced the Vercel Python extractor with the community `youtube-transcript@1.3.1` Node package. The implementation keeps strict video/language validation, bounded responses, five-minute success caching, rate limiting, typed errors, and TXT/SRT/WebVTT export support.
- The first Node deployment was pushed as `7c25346` and the package-fallback guard was corrected in `76050fc`.
- Local Node verification passed for `Ks-_Mh1QhMc` (428 English segments and 52 languages), Spanish for the same video (422 segments), `jNQXAC9IVRw` (6 segments), and `dQw4w9WgXcQ` (61 segments). Local typecheck, lint, build, syntax checks, diff validation, and secret scan passed.
- Vercel production was configured for the Mumbai Hobby region (`bom1`) and pushed as `f5265b5`. This is a latency experiment for the owner's audience, not a reliability guarantee.
- Live production probes after the region deployment: `dQw4w9WgXcQ` returned `200` with 61 segments and 5 languages; fresh probes for `Ks-_Mh1QhMc` and `jNQXAC9IVRw` still returned `404 NO_CAPTIONS`. The regional move did not solve YouTube's data-center caption restriction.
- Result: do not advertise the app as reliably live or add it as a normal portfolio project yet. A keyed transcript service such as the already documented Supadata option still requires the owner's approval before account creation or a secret is added.

## Portfolio photo, UI refinement, and YT Transcriber beta entry - 2026-08-11

- Portfolio repository: `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\nishant-portfolio`.
- Added the approved profile photo at `public/images/nishant-jha-profile.jpg` and used it in the homepage hero/profile panel. It is not used to publish personal contact details.
- Refined the portfolio UI with a sticky translucent header, clearer navigation hierarchy, stronger responsive hero layout, personal profile panel, improved card surfaces, hover/focus states, mobile sizing, and preserved reduced-motion behavior.
- Added `YT Transcriber` beside Labs in the primary navigation and added a truthful beta case study at `/work/yt-transcriber`, linking to `https://youtube-scripto-scribe.vercel.app/` and its GitHub repository. The copy explicitly explains that caption availability varies by video and request origin; it does not claim reliable extraction for all videos.
- Added the project to generated static params and sitemap through the shared project registry. Expanded public metadata keywords and Person image metadata.
- Portfolio release commit `11ff32b` was pushed to `Nishantjha1997/nishant-portfolio` on `main`.
- Verification passed after the complete change: typecheck, ESLint (0 errors; one existing PostCSS warning), Next.js production build with `/work/yt-transcriber` generated, `git diff --check`, and phone-number leak scan outside `public/resume`.
- Live propagation was subsequently verified: `https://nishant.top/` returned `200` with `/images/nishant-jha-profile.jpg` and `YT Transcriber` in the rendered HTML; `/work/yt-transcriber` returned `200` with the new portrait and case-study content; `/robots.txt` and `/sitemap.xml` also returned `200`.

## MakeCV / FlowCreate portfolio refresh - 2026-08-11

- Updated the FlowCreate case study in `nishant-portfolio` to `MakeCV — FlowCreate` using the current live domain `https://makecv.site/`.
- Refreshed the public product description from the live app: AI Assistant, ATS-optimized templates, resume and cover-letter workflows, PDF/DOCX/TXT export, privacy messaging, and reusable Master Profiles.
- Added the important access boundary: Master Profiles are sign-in protected in the live product, so the portfolio does not imply that private profile data is publicly visible.
- Updated project tags, details, operating flow, challenge, decisions, outcomes, disclosure, and README copy.
- Portfolio commit `70dcd30` was pushed to `Nishantjha1997/nishant-portfolio` on `main`.
- Verification passed: sequential typecheck, ESLint with zero errors (one existing PostCSS warning), production build, and `git diff --check`.
- Live verification passed on `https://nishant.top/work/flowcreate`: response `200` contained the MakeCV title, `makecv.site` link, AI Assistant text, and Master Profiles text.

## StreamFree password-reset recovery fix - 2026-08-11

- Fixed the existing partial reset flow for `https://streamfree.online`.
- `sendResetPasswordEmailAction` now passes the canonical recovery redirect
  (`https://streamfree.online/auth/reset-password`) to Supabase instead of
  relying on a possibly stale hosted Site URL.
- `/auth/reset-password` is no longer part of the default protected-path list,
  and middleware explicitly exempts it from unauthenticated redirects so the
  browser can hydrate Supabase's temporary recovery session from the link.
- The reset form now checks for the recovery session in the browser, uses
  Supabase's documented `updateUser({ password })` recovery flow, shows a
  useful expired-link state, and links back to request a fresh email.
- Updated the repository recovery email template to use Supabase's
  `{{ .RedirectTo }}` value for the reset CTA. The hosted Supabase email
  template must use the same template or be updated in its Auth dashboard;
  repository templates do not automatically overwrite a hosted project.
- Validation: `tsc --noEmit` passed; focused ESLint passed with one existing
  React Hook Form compiler warning and no errors; `git diff --check` passed.
- The Next production build was started with the bundled Node runtime but ran
  beyond the shell command window on the OneDrive checkout. Its process was
  still active and consuming CPU when recorded; rerun after it completes or
  from a local non-OneDrive checkout before release if the deployment gate
  requires a completed build.
