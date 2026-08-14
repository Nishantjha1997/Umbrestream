
# StreamFree project handoff

This is the current handoff document for another developer or AI agent taking over the
StreamFree project. Read this file before changing production, playback, Android builds, or
the Vercel deployment.

Last updated: 2026-08-15

## 1. Product identity and live state

- Product name shown to users: **StreamFree**.
- Historical code/package names: **Umbra** and **Umbrestream**. Do not rename packages or the
  Vercel project casually; the public brand is already StreamFree.
- Git repository: https://github.com/Nishantjha1997/Umbrestream
- Main branch: main
- Production domain: https://streamfree.online
- Vercel project: umbrestream
- Production code baseline: efdbfe7 (fix: name downloadable APK files correctly).
- The latest repository commit adds only this handoff documentation and the README link; it
  does not change runtime behavior.
- Current production status for the release: Ready and Current on Vercel.
- Creator branding: **Nishant**. The site and app splash screens use the signature
  Created with love by Nishant.

Never put Vercel tokens, Supabase service-role keys, TMDB tokens, passwords, or account
credentials in this document or in Git.

## 2. What StreamFree does

StreamFree is a responsive discovery and playback application for movies, TV series, and
anime. It combines:

- TMDB metadata and discovery for movies and TV series.
- AniList metadata, episodes, and trending anime discovery.
- Public playback embed adapters for movie, TV, and anime providers.
- User authentication through Supabase.
- Cross-device watchlist and watch-history storage through Supabase.
- Region-aware discovery rows based on the visitor's country.
- Personalized recommendations based on recent watch history when the user is signed in.
- Responsive web UI, PWA behavior, a phone APK, and an Android TV APK.

The website is a discovery/player product, not a media-hosting backend. Provider embeds are
cross-origin and owned by external services. Do not add private API scraping, copied tokens,
ad-blocking, provider-internal automation, or undocumented direct-stream extraction.

## 3. Repository architecture

The repository is a Next.js App Router application with a static Capacitor shell for Android
phone and Android TV.

### Main technologies

- Next.js 16.2.1 with the App Router.
- React 19 and TypeScript.
- Tailwind CSS 4 and HeroUI components.
- TanStack Query for client fetching and caching.
- TMDB for movie/TV metadata.
- AniList for anime metadata.
- Supabase Auth and Postgres for profiles, watchlist, history, and analytics.
- Capacitor 8 for Android WebView packaging.
- @ducanh2912/next-pwa for installable web/PWA behavior.
- Vercel for production hosting and Git-based deployments.

### Important directories

- src/app/ - web routes, layouts, API routes, metadata, and page composition.
- src/components/ - shell, home rows, detail views, player UI, cards, and feedback UI.
- src/api/ - TMDB, AniList, and browser-region access.
- src/actions/ - server actions for auth, history, library, search, and recommendations.
- src/lib/sources/ - source contracts, provider adapter registry, and source selection logic.
- src/utils/ - Supabase clients, recommendation scoring, media normalization, and helpers.
- supabase/migrations/ - database migrations.
- supabase/schemas/ - schema/reference SQL.
- mobile/ - standalone phone app HTML/CSS/JS bundle source.
- tv/ - standalone Android TV HTML/CSS/JS bundle source.
- android/ - Capacitor Android phone project.
- android-tv/ - Capacitor Android TV project.
- public/downloads/ - production APKs and update manifests.
- scripts/ - source checks, bundle builds, and TV asset synchronization.

### Important routes

- / - home/discovery feed.
- /browse - consolidated Films, Series, and Categories browsing.
- /search - title search.
- /anime - anime home/discovery.
- /movie/[id] - movie detail.
- /tv/[id] - TV detail.
- /anime/[id] - anime detail.
- /movie/[id]/player - movie playback.
- /tv/[id]/[season]/[episode]/player - TV playback.
- /anime/[id]/player/[episode] - anime playback.
- /about - product, app, and creator information.
- /app - Android phone download/product page.
- /app/tv - Android TV download/product page.
- /api/player/sources - source manifest/enrichment endpoint.
- /api/mobile/config - runtime configuration consumed by the static Android shells.
- /downloads/streamfree-android.json - phone update manifest.
- /downloads/streamfree-android-tv.json - TV update manifest.

Legacy routes /movies, /tv, and /categories redirect into the Browse tabs. Do not remove the
detail/player routes while changing navigation.

## 4. Current website features

### Home and discovery

- Dark, responsive StreamFree shell for desktop, tablet, and phone.
- Hero content, continue watching, trending rows, episode-drop content, anime discovery, and
  personalized recommendations.
- Region-aware rows use src/api/geo-browser.ts and RegionalDiscoveryRows.tsx.
- The current regional feed provides separate rows for country/global trending movies,
  country/global trending series, and trending anime for every user.
- A signed-in user's Recommended For You row uses weighted watch history and cached genre
  metadata. Cold-start users fall back to trending instead of rendering an empty row.
- The unsupported India-specific Bollywood and Indian TV/web-series shelves were removed.
  Do not re-add them unless reliable data and playback sources are available.

### Accounts and library

- Supabase email authentication and profile state.
- Watchlist add/remove behavior.
- Watch history with current position, duration, completion state, season, and episode.
- Continue Watching is ordered by most recently updated history and is designed to retain all
  active titles instead of silently dropping older entries.
- Phone and website use the same Supabase account when the app runtime is configured.

### Player behavior

- Movie, TV, and anime player routes use one source manifest and a controlled provider iframe.
- Source selection is explicit; the app does not inspect opaque cross-origin provider internals
  to guess whether a stream failed.
- Fullscreen controls are delegated to the provider iframe plus the app's mobile shell.
- TV playback carries next-episode context and the TV shell advances to the next episode when
  the provider emits the expected completion event.

### Onboarding and polish

- Phone and TV apps show a first-launch product tour explaining discovery, library, playback,
  and update features.
- The tour is skippable and is stored as completed locally.
- Website splash and app splash screens include Created with love by Nishant in a cursive
  signature treatment.
- About, app, footer, metadata, and JSON-LD content identify Nishant as the creator.

## 5. Playback providers and fallback order

The provider registry is in src/lib/sources/adapters/embed.ts. The focused regression test
is scripts/check-player-sources.mjs, run with npm run test:player-sources.

### Current intended order

| Media | First provider | Fallbacks currently included |
|---|---|---|
| Movie | Cinezo | VidLink, VidLink Classic, VidKing, Vidrift, Vidbolt, Videasy, Filmu (manual fallback) |
| TV | VidKing | Cinezo, VidLink, VidLink Classic, Vidrift, Vidbolt, Videasy, Filmu (manual fallback) |
| Anime | VidNest AnimePahe Sub | VidNest AnimePahe Dub, Cinezo Sub/Dub, AniLink Sub/Dub |

These are public embed adapters. Provider availability can change independently of StreamFree.
The current production smoke fixtures used for verification were:

- Movie: TMDB 1212763 (Evil Dead Burn), Cinezo iframe rendered 1:50:31 controls.
- TV: TMDB 97546, season 1 episode 1 (Ted Lasso), VidKing iframe rendered 30:55 and a
  next-episode link.
- Anime: AniList 21, episode 1 (ONE PIECE), VidNest iframe rendered 24:37 controls.

If a provider is replaced:

1. Add or change the adapter in src/lib/sources/adapters/embed.ts.
2. Preserve stable provider IDs and src URL compatibility where possible.
3. Update scripts/check-player-sources.mjs expected order/defaults.
4. Run source tests, typecheck, and a live browser smoke test for movie, TV, and anime.
5. Do not claim an iframe is playable solely because it loaded; verify visible player controls or
   a real playback fixture when the browser permits it.

## Browser playback server-switch incident and exact requirement

This is an important piece of context from Nishant's browser-version playback report.

### Original problem

On the web player, opening the server/source picker and clicking another playback server could
close the picker without reliably applying the new server. In some cases the old cross-origin
iframe continued receiving the click, the URL did not retain the selected provider, or a later
render snapped the player back to the previous source. Provider-owned region, caption, server,
and fullscreen controls could also be covered by StreamFree's always-visible player chrome.

The intended behavior is:

1. A user opens the source/server picker on a movie, TV episode, or anime episode.
2. Clicking a server immediately remounts that server's iframe and shows clear Switching to / Now
   using feedback.
3. The picker closes only after the selection has been committed to StreamFree state; a slow URL
   update must never undo the click.
4. The selected provider persists as a stable src provider ID in the URL and through episode
   navigation.
5. The player must never treat an opaque cross-origin iframe as failed merely because its DOM is
   inaccessible. The user can manually choose another server when a provider is slow.
6. StreamFree chrome fades after idle so provider-owned controls remain clickable. A visible
   reveal affordance, keyboard interaction, or pointer/touch interaction restores StreamFree
   controls.

### Current implementation status

This browser issue is implemented in the current player code:

- src/components/player/PlayerShell.tsx keeps a request-scoped selected-source override so the
  iframe changes synchronously before the asynchronous query-string update completes.
- The source click is committed with flushSync, then the picker closes and the selected source is
  persisted as ?src=provider-id.
- A failed History API/query-state update has a window.history.replaceState fallback.
- src/components/player/PlayerSourceSheet.tsx uses native button/radio-style server choices for
  both phone and desktop layouts.
- Source feedback and manual-switch analytics identify the old and new providers.
- Player chrome visibility is managed by usePlayerChromeVisibility, with a left-edge reveal
  control and pointer-events disabled while hidden.
- Movie, TV, and anime episode links preserve the selected provider ID where appropriate.

### Required regression acceptance test

For each of movie, TV, and anime on desktop web and mobile web/PWA:

- Open a player route and confirm exactly one player iframe is mounted.
- Open Select a source / Video servers.
- Click a different server once. Confirm the source label changes, the new iframe URL changes,
  the picker closes, and the URL contains the new provider ID.
- Reload the same URL and confirm the chosen provider remains selected.
- Navigate to the next TV/anime episode and confirm the provider choice is retained where that
  provider supports the episode.
- Move the pointer/touch over the provider's own controls after StreamFree chrome fades and
  confirm the provider controls receive the interaction.
- Click Remove from watchlist or Remove from Continue Watching controls and confirm no detail or
  player navigation occurs.

Do not replace this with automatic provider scraping or ad blocking. A provider outage should be
handled with an explicit, user-visible server choice and a tested fallback order.

## 6. Android phone app

The phone app is a bundled static shell in mobile/, packaged by Capacitor in android/.
It uses package ID com.umbrestream.app.

### Implemented phone features

- Mobile home, search, detail, player, library, account, settings, onboarding, and update UI.
- Supabase-backed account/watchlist/history loading.
- Guest library fallback for unsigned users.
- Fullscreen player shell with portrait restore after exiting fullscreen.
- Orientation requests are handled defensively; rejected WebView orientation promises are caught.
- Playback iframe URLs receive autoplay parameters when appropriate.
- API defaultId selects the intended initial provider.
- Check for update reads the live phone manifest and offers an in-app download/install flow.
- WebView configuration enables JavaScript, DOM storage, database storage, media playback without
  a user gesture, cookies, third-party cookies, and disables unwanted popup/multiple-window paths.

### Phone build

From the repository root:

    npm install
    npm run android:apk

The command performs:

1. npm run mobile:build - bundles mobile/app.js to mobile/app.bundle.js with esbuild.
2. cap sync android - copies the static shell into the Capacitor Android project.
3. android/gradlew.bat assembleDebug - builds the debug APK.

Build output:

    android/app/build/outputs/apk/debug/app-debug.apk

The current production copy is:

    public/downloads/StreamFree-Android-v1.2.apk

Current phone release metadata:

- Version name: 1.2.0
- Version code: 3
- APK size: 4,272,365 bytes
- SHA-256: 6031CBED6380012E5AEE791E9EFF14FF75716B189F2940916EDF79012D17A1AA

## 7. Android TV app

The TV app is a large-screen static shell in tv/, packaged by Capacitor in android-tv/.
It uses package ID com.umbrestream.tv.

### Implemented TV features

- TV-focused navigation and remote-friendly controls.
- Playback opens in the TV full-screen shell when an episode is selected.
- Remote back exits the player and restores orientation correctly.
- TV iframe URLs receive autoplay parameters and next-episode context.
- Automatic next episode handling is implemented for TV playback.
- First-launch tour is skippable.
- TV Check for update flow downloads the live TV APK manifest and starts installation after
  Android TV allows unknown-source installs.
- TV WebView is configured for JavaScript, DOM storage, database storage, media playback,
  cookies, third-party cookies, and stable fullscreen iframe behavior.

### TV build

From the repository root:

    npm install
    npm run android-tv:apk

The command performs:

1. npm run tv:build - bundles tv/app.js to tv/app.bundle.js with esbuild.
2. node scripts/sync-tv-assets.mjs - synchronizes the TV public shell/assets.
3. android-tv/gradlew.bat assembleDebug - builds the debug APK.

Build output:

    android-tv/app/build/outputs/apk/debug/app-debug.apk

The current production copy is:

    public/downloads/StreamFree-TV-v1.1.apk

Current TV release metadata:

- Version name: 1.1.0
- Version code: 2
- APK size: 4,346,221 bytes
- SHA-256: 7407020DD6087A8C0E0649ED62608E974363BFDFF213306AAF32E0D8A05526C9

## 8. Publishing APKs and the update flow

The APKs are static files in public/downloads/, so they ship with the normal Vercel
deployment. The phone app reads /downloads/streamfree-android.json; the TV app reads the TV
manifest.

When releasing a new APK:

1. Build the phone and/or TV APK with the commands above.
2. Increment versionCode and versionName in the relevant Gradle file.
3. Copy the final binary into public/downloads/ with a versioned filename.
4. Update the corresponding JSON manifest versionName, versionCode, apkUrl, and notes.
5. Update the website app page's displayed version, path, size, and SHA-256:
   - src/app/app/page.tsx
   - src/app/app/tv/page.tsx
6. Check next.config.ts exact APK header entries. Keep APK MIME and per-file download
   filenames correct; do not apply APK MIME headers to JSON manifests.
7. Run typecheck, source tests, and build checks.
8. Commit and push to main; Vercel's Git integration deploys it.
9. Verify the production manifest MIME is JSON and the APK response MIME is
   application/vnd.android.package-archive.

Current live download URLs:

- Phone: https://streamfree.online/downloads/StreamFree-Android-v1.2.apk
- TV: https://streamfree.online/downloads/StreamFree-TV-v1.1.apk
- Phone manifest: https://streamfree.online/downloads/streamfree-android.json
- TV manifest: https://streamfree.online/downloads/streamfree-android-tv.json

The Android installer may still require the user to allow installs from the app/source in
Android settings. That is an operating-system security requirement, not a Vercel issue.

## 9. SEO, About, and creator branding

Current SEO work is centered in:

- src/config/site.tsx - title, description, keywords, and site defaults.
- src/config/brand.ts - product identity, site URL, creator name, and brand description.
- src/app/layout.tsx - authorship, creator/publisher metadata, canonical/structured data.
- src/app/about/page.tsx - About page metadata and product explanation.
- robots/sitemap configuration - crawler discovery.

The public copy explains the website, Android phone app, Android TV app, discovery model, and
the creator Nishant. The signature is present in the website splash, footer, About/app surfaces,
and the bundled mobile/TV splash screens.

SEO deployment does not guarantee an immediate Google ranking change. Google must recrawl the
site, and ranking also depends on external signals, performance, links, and content quality.

## 10. Data, authentication, and recommendations

### Supabase

Database migrations live in supabase/migrations/. Important tables include:

- profiles
- watchlist
- histories
- titles_cache
- analytics/event tables used by the application

Required environment variables are configured in local/Vercel environments, not in this file:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
- SUPABASE_SERVICE_ROLE_KEY (server-only)
- TMDB_ACCESS_TOKEN (server-only)
- PROTECTED_PATHS (optional; defaults are defined in src/utils/env.ts)

Optional feature flags include NEXT_PUBLIC_ANIME_SOURCES_V2, NEXT_PUBLIC_UMBRA_UI_V2, and
the player-engine flags. Check src/utils/env.ts before changing defaults.

### Recommendation behavior

src/actions/recommendations.ts and src/utils/recommendations.ts implement:

- recency weighting;
- completion weighting;
- replay weighting;
- separate movie/TV genre affinity;
- AniList-native anime seed recommendations;
- watched-title deduplication;
- bounded metadata lookup and titles_cache usage;
- server-side caching;
- trending fallback for signed-out, cold-start, or upstream-failure cases.

Do not move the TMDB token into a client component. src/api/tmdb.ts is server-only by design;
client requests should go through the guarded /api/tmdb proxy.

## 11. Verification completed for the current release

### Source/build validation

- npm run test:player-sources passed; expected movie, TV, and anime adapter orders passed.
- npm run typecheck passed with the bundled Node runtime.
- git diff --check passed before the final release commits.
- APK package metadata was verified:
  - phone com.umbrestream.app, version code 3, version 1.2.0;
  - TV com.umbrestream.tv, version code 2, version 1.1.0.
- APK assets were checked for the creator signature and playback/autoplay code.
- A full Next production webpack build passed before the final header filename polish; Vercel then
  built the final efdbfe7 deployment successfully.

### Production verification

The current production domain returned 200 for the homepage, About page, app pages, manifests,
and player source APIs.

Verified live response details:

- Phone APK: 200, Android APK MIME, 4,272,365 bytes, correct phone filename.
- TV APK: 200, Android APK MIME, 4,346,221 bytes, correct TV filename.
- Phone update manifest: 200, application/json, points to v1.2 APK.
- Homepage/About/app pages include Nishant branding, Android app copy, Android TV copy, and no
  Bollywood or Indian TV/web-series shelves in the tested HTML.
- Movie player: visible iframe controls and 1:50:31 duration.
- TV player: visible VidKing controls, 30:55 duration, and next-episode link.
- Anime player: visible VidNest controls, 24:37 duration, and next-episode link.

The browser console showed no StreamFree application errors during the final playback smoke
test. One provider-owned warning came from the VidKing frame (SettingsOverlay: No qualities
received); the same fixture still rendered and exposed playback controls.

There was no connected physical Android phone, Android TV device, or emulator in the workspace.
Therefore native installation and hardware rotation behavior were code/build verified, but not
certified on a physical device in this session.

## 12. Local environment notes

The repository is currently worked from:

    C:/Users/HP_5C/OneDrive/Desktop/Stream/Umbrestream

The bundled Node runtime used successfully in this workspace was:

    C:/Users/HP_5C/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node.exe

The local Android toolchain included JDK 21 and Android SDK build tools. If node is not on
PATH, use the bundled runtime path above or run from a machine with Node 20+ and Java 21.

This Windows/OneDrive workspace has previously shown intermittent 0xC0000005 and EPERM process
failures. The project intentionally uses webpack for Next builds and runs TypeScript separately.
If a build crashes, retry once and inspect the actual exit output before changing application
code.

Recommended validation commands:

    npm run test:player-sources
    npm run typecheck
    npm run build
    npm run check:leak
    git diff --check

Do not use git reset --hard or discard unrelated work in a dirty checkout.

## 13. Deployment procedure

Normal release path:

    git status --short
    npm run test:player-sources
    npm run typecheck
    npm run build
    git diff --check
    git add <intended-files>
    git commit -m "<focused release message>"
    git push origin main

Vercel is connected to GitHub and automatically builds main. In the Vercel dashboard, check
the umbrestream project's Deployments page and wait for the new commit to show Ready and
Production before announcing the release.

After deployment, verify:

    Invoke-WebRequest -UseBasicParsing https://streamfree.online/
    Invoke-WebRequest -UseBasicParsing https://streamfree.online/downloads/streamfree-android.json
    Invoke-WebRequest -UseBasicParsing -Method Head https://streamfree.online/downloads/StreamFree-Android-v1.2.apk

Then browser-test one movie, one TV episode, and one anime episode. A stale PWA service worker
can make a new deployment appear old; use a hard refresh or unregister the site's old service
worker during verification if the HTML does not match the deployed commit.

## 14. Outstanding user-requested work and plan

The following items were requested during the product discussion and are either still unverified,
partially implemented, or require an explicit future QA pass. The next agent should update this
section as each item is completed.

1. Test both APKs on a physical Android phone and Android TV device, including rotation,
   fullscreen exit, remote back, update installation, and TV next-episode autoplay.
2. Add automated browser regression coverage for movie/TV/anime player routes, the server-switch
   incident above, the remove-action no-navigation rule, and the update manifest MIME/filename
   contract.
3. Verify the Continue Watching union on a real account with many active titles. The current
   implementation filters completed rows, deduplicates episode rows by title, and orders the
   server response by updated_at. The first active title is promoted into the resume hero and
   the remaining titles appear in the rail, so the acceptance test must check the hero-plus-rail
   union rather than the rail alone. Test more than 100 history rows and multiple episodes of one
   series before changing limits or pagination.
4. Verify every watchlist/remove action in Library, hover previews, detail surfaces, and Continue
   Watching. The Continue Watching HistoryItemActions component already stops pointer, touch,
   click, and keyboard propagation; BookmarkButton still needs an explicit browser regression
   check in every context where it could be rendered inside or beside a Link. Removing an item
   must never open its detail page or start playback.
5. Perform a broader Nishant signature audit. The signature is already in the website splash,
   footer, About/app surfaces, and phone/TV splash screens. Review the homepage, detail pages,
   auth screens, library/account screens, loading/empty/error pages, 404, and download pages for
   consistent but tasteful creator attribution. Keep it in brand surfaces; do not clutter player
   controls, title metadata, or accessibility labels with decorative copy.
6. Run a product-manager/design/performance pass on the complete web and app flows. Measure route
   transition latency, image loading, query waterfalls, bundle size, PWA cache behavior, and
   Android WebView startup. Use Lighthouse/Core Web Vitals and a real low-end Android profile
   before claiming that the lag complaint is fully closed.
7. Verify region-aware feed behavior from multiple country/IP conditions, including the default
   fallback when geolocation is unavailable. Confirm trending movies, trending series, and anime
   remain separate rows and that the removed Bollywood/Indian TV shelves do not return.
8. Verify personalized recommendations with signed-out, cold-start, movie-heavy, TV-heavy,
   anime-heavy, and mixed watch histories. Keep the row bounded, cached, deduped against watched
   titles, and resilient when titles_cache or an upstream provider is unavailable.
9. Monitor provider uptime and keep the adapter order conservative; providers can change without
   notice. Re-test a movie, TV episode, and anime episode before changing the default provider.
10. **Movie default server decision:** make Filmu the primary/default movie server again, unless
    the user explicitly changes the server in the selection menu. Preserve the explicit `src`
    choice across reloads and navigation, update the movie adapter priority and source-registry
    fixtures, and smoke-test both the default Filmu path and manual switching. Do not silently
    override a user's selected server with a later automatic fallback.
11. Verify Google Search Console ownership, submit the sitemap, and inspect canonical/indexing
    status after Google recrawls the SEO changes. Do not promise a ranking lift from metadata alone.
12. Review Vercel runtime logs and add structured error monitoring if production traffic grows.
13. Keep the update installer flow safe on Android and Android TV. Test unknown-source permission,
    download completion, cancellation, reinstall/upgrade semantics, and version-code handling.
14. Keep the personalized recommendation row bounded and cached; do not turn it into an
    unbounded per-history provider fan-out.
15. Consider a durable shared rate limiter for the TMDB proxy if traffic exceeds a single
    serverless instance.

Do not reintroduce Bollywood/Indian TV shelves, direct provider scraping, ad blocking, or secret
client-side tokens without a new explicit product/security review.

## 15. Attribution

The project retains the original MIT license and attribution for the cinextma foundation by
Wisnu Wirayuda. Do not delete or modify LICENSE. StreamFree/Nishant additions are layered on
top of that licensed foundation.
