
# StreamFree project handoff

This is the current handoff document for another developer or AI agent taking over the
StreamFree project. Read this file before changing production, playback, Android builds, or
the Vercel deployment.

Last updated: 2026-08-17

## 1. Product identity and live state

- Product name shown to users: **StreamFree**.
- Historical code/package names: **Umbra** and **Umbrestream**. Do not rename packages or the
  Vercel project casually; the public brand is already StreamFree.
- Git repository: https://github.com/Nishantjha1997/Umbrestream
- Baseline branch: main
- Active implementation branch: `codex/streamfree-worldclass-hardening`
- Production domain: https://streamfree.online
- Vercel project: umbrestream
- Production baseline commit recorded before this hardening branch: `2f234a6`.
- This branch has not been deployed or published as production. Vercel status must be rechecked
  after the final test gate; do not infer production status from the dashboard's last deployment.
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
It uses canonical package ID `online.streamfree.app`. Historical `com.umbrestream.app` artifacts
are legacy packages and cannot be upgraded in place with a different signing certificate.

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

    android/app/build/outputs/apk/release/app-release.apk

The current checked-in release copy is:

public/downloads/StreamFree-Android-v1.3.apk

Current phone release metadata:

- Package: online.streamfree.app
- Version name: 1.3.0
- Version code: 4
- APK size: 3,271,575 bytes
- SHA-256: 427FCA603B8DE1D743A5D32A80D03FA0EC4FD06201AB72E7A92A67306007B497

## 7. Android TV app

The TV app is a large-screen static shell in tv/, packaged by Capacitor in android-tv/.
It uses canonical package ID `online.streamfree.tv`. Historical `com.umbrestream.tv` artifacts
are legacy packages and cannot be upgraded in place with a different signing certificate.

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

    android-tv/app/build/outputs/apk/release/app-release.apk

The current checked-in release copy is:

public/downloads/StreamFree-TV-v1.2.apk

Current TV release metadata:

- Package: online.streamfree.tv
- Version name: 1.2.0
- Version code: 3
- APK size: 3,302,587 bytes
- SHA-256: D40AE8717FDA6E9D5B90F607782A1BD4EC019349C54D94F43447DEC086832B0E

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

- Phone: https://streamfree.online/downloads/StreamFree-Android-v1.3.apk
- TV: https://streamfree.online/downloads/StreamFree-TV-v1.2.apk
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

### Historical source/build validation

- npm run test:player-sources passed; expected movie, TV, and anime adapter orders passed.
- npm run typecheck passed with the bundled Node runtime.
- git diff --check passed before the final release commits.
- Historical APK package metadata was verified before the current hardening branch; the current
  release artifacts are the canonical packages recorded in Sections 6 and 7.
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

The current workspace has the Android SDK/Gradle project but no usable `java`/`JAVA_HOME`, so
Gradle APK compilation is blocked until a JDK is made available. Do not claim a new APK was
built from this workspace until the release command succeeds.

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
    git push origin codex/streamfree-worldclass-hardening

Do not publish this branch directly until the final testing tasks pass and the intended merge or
Vercel production promotion is explicitly performed.

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
16. **Anime Sub/Dub labeling:** under the same anime episode, present Sub and Dub servers as
    separate, explicit choices. Do not create duplicate episode rows or leave viewers with
    ambiguous labels such as Server 1 and Server 2. Preserve stable provider IDs such as
    vidnest-animepahe-sub, vidnest-animepahe-dub, cinezo-anime-sub, and cinezo-anime-dub. Verify
    the labels in the episode picker, source picker, URL persistence, and next-episode flow.
17. **Conditional native Android ad-blocking review:** investigate whether a narrowly scoped,
    native Android/WebView-level filter can block clearly identified nuisance ad or popup
    requests without changing the website, mutating provider iframes, blocking provider scripts,
    breaking video playback, breaking login/update downloads, or violating provider terms. Do
    not implement it unless a feasibility spike passes movie, TV, anime, fullscreen, next-episode,
    account, and update regression tests on a real device. If safe filtering cannot be proven,
    document a no-go decision and leave playback untouched. This is not permission to add a
    general ad blocker or to scrape/intercept protected media.

Do not reintroduce Bollywood/Indian TV shelves, direct provider scraping, or secret client-side
tokens. Native ad blocking remains disabled unless the conditional safety review in item 17
passes.

## 15. Attribution

The project retains the original MIT license and attribution for the cinextma foundation by
Wisnu Wirayuda. Do not delete or modify LICENSE. StreamFree/Nishant additions are layered on
top of that licensed foundation.

## 16. August 15, 2026 implementation addendum

This addendum is the current release state and supersedes older version examples above.

Implemented:

- Shared playback policy in `src/lib/sources/playbackPolicy.ts` for provider ranking,
  manual preference precedence, anime audio compatibility, trusted playback events, resume
  positions, and consent-based recovery prompts.
- Movies default to Filmu, followed by Cinezo, VidLink, VidLink Classic, and VidKing. TV keeps
  its VidKing-first order. Recovery never silently replaces a manually selected source.
- Web, phone, and TV anime flows expose separate labelled Sub and Dub episode/server choices.
- Phone fullscreen requests landscape and restores portrait. TV starts episode playback immersive
  landscape and shows a focusable ten-second next-episode countdown after trusted completion.
- Continue Watching has an additive cursor RPC migration at
  `supabase/migrations/20260815120000_continue_watching_cursor.sql`, returning the newest
  incomplete row per title sorted by `updated_at DESC, id DESC`. The app has a bounded fallback
  until the migration is applied to production.
- Continue Watching and watchlist removal stop pointer/touch/keyboard propagation, update
  optimistically, and expose Undo when the server returns removed data.
- PWA navigation caching is narrowed. Player, search, auth, library, and account routes are
  marked noindex; content/about/download surfaces remain indexable.
- Android packages are now `online.streamfree.app` version 1.3.0 code 4 and
  `online.streamfree.tv` version 1.2.0 code 3. They are non-debuggable, cleartext-disabled,
  signed with separate release keystores, and use a registered Capacitor native plugin instead
  of a URL-taking `addJavascriptInterface` bridge. Native installation now fetches the official
  manifest over HTTPS, rejects redirects and non-StreamFree download URLs, normalizes only
  site-relative `/downloads/*.apk` paths, and verifies the manifest's live size, SHA-256, version
  code, package ID, and pinned certificate before opening Android's user-confirmed installer.
  Release-specific APK size/hash values are no longer embedded in native updater code.
- Release artifacts are `public/downloads/StreamFree-Android-v1.3.apk` and
  `public/downloads/StreamFree-TV-v1.2.apk`; hashes and sizes are recorded in their manifests.
  Legacy migration helpers are published as `public/downloads/StreamFree-Android-Legacy-Migration.apk`
  and `public/downloads/StreamFree-TV-Legacy-Migration.apk`. They retain the old package IDs,
  are signed with the recovered debug certificate used by the historical v1.2/v1.1 artifacts,
  prompt users to sign in before continuing, then install the new canonical package side by side.
  Keystores are outside Git in the user's OneDrive backup directory. Never commit them or the
  password.

Validation completed:

- Player source checks passed (14 adapters).
- TypeScript `--noEmit` passed.
- Phone and TV static bundles passed with esbuild.
- Phone and TV Gradle `assembleRelease` passed.
- APK v2 signature, package ID, version code/name, hash, and manifest checks passed.

Release limitations:

- Only an Android phone can be physically connected for QA. Android TV has been build-tested and
  should use an emulator/automated focus tests; physical TV playback, remote Back, and
  next-episode behavior remain unverified until a TV/ADB device is available.
- Apply the Continue Watching Supabase migration and run a signed-in account test with more than
  100 episode rows and several active titles before declaring the production gate closed. The
  migration is ready locally but was not applied by the local CLI because no Supabase
  dashboard/CLI session is present; the production RPC returned `PGRST202` until an authorized
  Supabase session applies it.
- These new package IDs are side-by-side migration releases. The signed legacy helpers above are
  the one-time bridge; they do not claim to be in-place updates and they leave the old app
  removable only after the user confirms the new app and account data are available.
- Real provider playback smoke tests and the connected-phone orientation/update test remain
  required. Third-party provider availability is not guaranteed by StreamFree.

## 17. August 17, 2026 world-class hardening checkpoint

Implementation is being continued on the Git branch
`codex/streamfree-worldclass-hardening`. The durable implementation contract is in
`plan.md`; `TODO.md` is the live task board and must be updated and committed with every
completed task so another agent can resume safely.

Baseline recorded before code changes:

- Git baseline: `2f234a6 Fix blocked desktop player menus`.
- Vercel project: `umbrestream`; production domain: `streamfree.online`.
- Phone manifest: `online.streamfree.app`, version `1.3.0`, code `4`, certificate
  `577D4F3C9BBE0A87C3F2CDFC087BD1A6D26EF1A613F392091DF0A26F10677DB9`.
- TV manifest: `online.streamfree.tv`, version `1.2.0`, code `3`, certificate
  `3899CD4ABFB7DC439680CE0BE05BEB455B32CA2A4B012D15FCEFF1E0D4D2CE2B`.
- TypeScript, production build, player-source contracts, and leak scan passed at baseline.
- Production desktop source picker opens and switches providers successfully. Mobile web,
  phone, and TV source-picker regression testing remains outstanding.
- The web splash is fixed-duration and blocks the shell for approximately 3.25 seconds;
  phone and TV retain a roughly 2.9-second custom splash overlay.
- Search suggestions do not currently activate through Arrow Down followed by Enter from the
  search field.
- Authored-source lint fails and the broad lint command also scans generated Android/build
  assets.
- `public/downloads/StreamFree-local-debug.apk` is publicly present and has the same SHA-256
  as `StreamFree-Android-v1.2.apk`; it must be removed before release.
- Android unit/instrumentation tests are still Capacitor placeholders with obsolete package
  assertions.
- Android TV ad filtering is currently hardcoded on and must be disabled until a safe,
  remotely disableable policy is proven.
- TV and web episode navigation currently need a shared cross-season resolver.

Resume protocol: read `plan.md`, then `TODO.md`, then this handoff, inspect the latest Git
commit, and continue only the task marked `in progress` or the next unstarted dependency.

## 18. Current hardening branch checkpoint — 2026-08-17

This section supersedes stale version/build statements in older sections above.

Implemented on `codex/streamfree-worldclass-hardening` since the baseline:

- Authored-source lint is clean; generated/build assets are excluded from the authored lint scope.
- The public debug APK was removed from `public/downloads/` and retained outside the repository as
  a recoverable local file. Release checks reject debug/unsigned APK names and invalid manifests.
- The shared playback policy, trusted-event recovery, source picker, anime Sub/Dub grouping,
  cross-season episode resolver, region-aware Home API, Continue Watching helper, PWA update prompt,
  native official-manifest updater, native SplashScreen integration, onboarding replay, and app/About
  trust copy are implemented. See the corresponding completed tasks in `TODO.md`.
- Home-feed rows now remove repeated `kind:id` titles across ordered rows, with deterministic
  regression coverage in `scripts/check-home-feed.mjs`.
- Browse segment switching now resets incompatible filter state, normalizes direct-link query values,
  labels controls, and restores focus to the results region.
- Phone and TV shells consume a shared native region policy in `src/lib/native/region.ts`; their
  touch and remote presentation layers remain separate.

Current verified checks on this branch include TypeScript, targeted authored lint, player-source
contracts, episode resolver, Continue Watching, Home-feed dedupe, update-manifest validation, and
static phone/TV esbuild bundles. Full release testing is intentionally still pending.

Open release blockers:

- Supabase Continue Watching RPC migration is ready locally but has not been applied to production;
  an authorized Supabase dashboard/CLI session is required for application and high-volume account
  verification.
- Android Gradle release builds are blocked in this workspace because no usable JDK is available.
- Physical Android phone QA is still required. Android TV physical QA is unavailable by decision;
  use an Android TV emulator and document the deferral.
- Final browser/source-picker, real-provider playback, accessibility, performance, APK, Vercel
  production, and rollback checks remain in the final testing phase. Do not publish new manifests or
  claim Vercel Ready for this branch before those gates pass.

The next agent should read `TODO.md` for the single active task, keep task evidence and commit hashes
current, and never replace the canonical release artifacts with debug builds.

## 19. Latest implementation checkpoint — 2026-08-17

Since the previous checkpoint, the branch also includes:

- Shared native cache, history, and update-state modules consumed by both phone and TV shells,
  with deterministic checks for concurrent cache requests, history ordering/deduplication, and
  strict higher-version update availability. Phone and TV still own separate touch/remote
  presentation code.
- Retryable service states for movie details, TV details, and anime discovery. Transient TMDB or
  AniList failures no longer masquerade as missing titles or leave an indefinite spinner.
- The photo lightbox and plugin graph are client-only and dynamically loaded from Photos; its type
  import is erased from the detail route's initial module graph.
- Core web interaction targets now meet the 44px minimum on player actions, phone header controls,
  desktop search, and the standalone fullscreen control. Playback/source/update/next-episode
  notifications are explicit live regions and include the anime audio variant when relevant.
- Home copy now says personal picks improve after sign-in, while signed-out rows remain labelled
  as trending. The unavailable Watch Parties teaser remains inert and honestly marked Coming soon.

Latest commits are recorded in `TODO.md`; the worktree is expected to remain clean after each
checkpoint. Before release, rerun the complete automated checks rather than relying only on the
targeted checks recorded above. The remaining gates are Supabase migration application and
high-volume verification, browser/source-picker/accessibility QA, physical-phone QA, Android TV
emulator QA, real-provider smoke tests, signed release APK production, Vercel readiness, and
production rollback verification. Do not claim production readiness until those gates pass.

## 20. Final validation checkpoint — 2026-08-17

The local production server was started from the current branch and exercised through the in-app
browser at the default viewport, 390×844, and 820×1180. Home and About rendered with the expected
navigation, trust copy, app links, and Nishant attribution. Browse filter selection changed the
URL, exposed an enabled Reset Filters action, and reset back to the unfiltered route on desktop and
mobile. Search accepted typed input and keyboard submission on desktop and mobile. Movie detail and
Browse displayed the new retryable catalog-service states when the local TMDB proxy returned 503.

These checks are evidence for the browser gate but are not a release pass. A playable source-picker
exercise, authenticated Continue Watching/removal flow, PWA update flow, mocked provider recovery,
and real-title source selection still require catalog/auth fixtures or a configured environment.

Current environment blockers confirmed during this checkpoint:

- No `adb`, Android SDK/emulator, or usable Java/JDK is available in the workspace, so physical-phone
  orientation/update QA, TV-emulator QA, and new signed APK production cannot be claimed.
- No Supabase CLI session, production environment variables, or dashboard session is available, so
  the Continue Watching cursor migration cannot be applied or verified against an authenticated
  account with more than 100 active rows.
- Vercel production must remain unchanged until the device, migration, provider, APK, and rollback
  gates are available and pass.

The latest task-board evidence is commit `e21f5f7`. Resume by reading `plan.md`, `TODO.md`, and this
section, then satisfy the blockers in dependency order. Keep `SF-073`, `SF-100`, `SF-111`, `SF-112`,
`SF-125`, `SF-126`, and `SF-151` in progress until their stated evidence exists; do not mark
`SF-155` through `SF-159` complete early.

## 21. Supabase and Android build checkpoint — 2026-08-17

The user authenticated in the Supabase dashboard for the production project
`kqrazmvxmjasjyrwfyyf`. Through the SQL Editor, the Continue Watching migration was applied
idempotently. Verification returned:

- `public.get_continue_watching_page(integer,timestamp with time zone,bigint)` exists.
- The `authenticated` role has execute privilege.
- `histories_continue_watching_idx` exists.
- Production currently contains 42 incomplete history rows across 35 distinct titles. The planned
  more-than-100-row stress test is therefore still pending; no synthetic history was inserted.

ADB is not required for APK assembly. A portable Temurin JDK 21 and Android SDK 36 were installed
outside the repository, and the existing mobile/TV sync strategy completed. The phone Gradle release
build reached `:app:packageRelease` and then stopped because the canonical release keystore is not
available in this workspace. Existing public phone and TV APKs were independently verified with
APK Signature Scheme v2 and match the pinned certificate fingerprints, but they are not rebuilt
artifacts from this checkpoint. Do not generate replacement signing keys: that would invalidate
upgrades for existing installs. Recover the original keystores before producing or publishing new
APK versions.

The worktree must remain clean after generated bundle review. Do not commit environment-specific
`capacitor.settings.gradle` paths generated by a local pnpm layout, and do not publish the existing
APKs as if they contained this checkpoint's source changes.

## 22. Production playback and release metadata checkpoint — 2026-08-17

The production source-picker flow was exercised against real title routes in the in-app browser.
The movie fixture Spider-Man: Brand New Day opened the picker, switched from Filmu to Cinezo exactly
once (`src=cinezo`), closed safely, and retained Cinezo as the selected source when reopened. The TV
fixture Lanterns S1E1 switched from Cinezo to VidKing exactly once (`src=vidking`) and carried the
selection into the Next Episode link. The anime fixture ONE PIECE E1 exposed separate `Sub servers`
and `Dub servers` groups. Sub switched to `cinezo-anime-sub`; Dub switched to `cinezo-anime-dub`;
both retained their `audio` query and episode context. These are provider-selection and recovery
smoke results, not a guarantee that a third-party iframe will always permit playback.

Signing certificate fingerprints are now stored in the checked-in release metadata file
`release/signing-certificates.json`. `scripts/check-update-manifests.mjs` reads that file and fails
when either public manifest drifts from the pinned phone or TV certificate. The website phone and TV
download pages no longer display APK or certificate SHA digests; the values remain available to the
native updater through the manifests and to release validation through the repository metadata.

The bundled Node runtime passed TypeScript, authored ESLint, player-source, episode-resolver,
Continue Watching, Home-feed, native cache/history/update-state, update-manifest, release-artifact,
leak, and production webpack checks after this change. New APK publication is still blocked by the
missing original phone and TV private keystores. The public APKs are the older v1.3.0/code 4 and
v1.2.0/code 3 artifacts; do not relabel or republish them as the new source checkpoint. Once the
canonical keystores are recovered, build phone 1.3.1/code 5 and TV 1.2.1/code 4, verify signatures
and hashes, then publish manifests/APKs and deploy the matching Vercel production commit.

The verified website-only production deployment is `dpl_Dt2ZUKLhXj27M6KgNeieMxQ61k48`; Vercel
returned `readyState: READY` and aliased it to `https://streamfree.online`. This deployment includes
the download-page digest removal and current web fixes, but intentionally does not claim new APK
publication. Recheck the deployment and APK routes after the signed artifacts are available.

## 23. Fresh signing reset and release candidates — 2026-08-17

The original private keystores were not found in the repository, Stream project, desktop search
scope, or Git history. Per the user's decision, a fresh signing reset was created. Private material
is outside Git at:

- `C:\Users\HP_5C\.cache\codex-runtimes\streamfree-signing-20260817\streamfree-phone-release.jks`
  alias `streamfree-phone`.
- `C:\Users\HP_5C\.cache\codex-runtimes\streamfree-signing-20260817\streamfree-tv-release.jks`
  alias `streamfree-tv`.

The folder is ACL-restricted to the current Windows user and contains `KEEP-PRIVATE.txt` with the
local build credentials. Never commit or upload that folder. Future releases must reuse these exact
keystores. Because the package IDs remain `online.streamfree.app` and `online.streamfree.tv` but the
certificates changed, users must uninstall the old APK before installing this release. Future
updates from these new APKs can install in place.

New release artifacts:

- Phone: `StreamFree-Android-v1.3.1.apk`, package `online.streamfree.app`, code `5`, size `3344756`,
  SHA-256 `A19B3ED6E96FDA0DA2E0E5B5FD08BC19B5987599F77B2C4120E2C96C631241E9`, certificate
  `4218B5F726FD4D61703B2112D7A41C77B93F215F1C1DC85560BAB86A6FB38EF4`.
- TV: `StreamFree-TV-v1.2.1.apk`, package `online.streamfree.tv`, code `4`, size `3373310`,
  SHA-256 `BA2BDB9E65176D1C250DFABDFFA78C90C2F57DDB63130FD80FAC6C31B6BB5969`, certificate
  `7D5C1BB46BA3CE888C56E9CF1F39F86F65BC502BCD5480B0F8CF4663C80779D7`.

Both APKs are non-debuggable and pass APK Signature Scheme v2 and v3 verification. The checked-in
manifests point to these filenames and pass `test:update-manifests` and `check:release-artifacts`.
The updater now compares the manifest certificate to the currently installed app signer, then
verifies the downloaded APK's package, version, certificate, size, and SHA-256. This keeps future
certificate pins out of Java release constants while retaining the official-host and APK identity
checks.

The exact APKs/manifests are now deployed to Vercel deployment
`dpl_CrsmiM7s1iwXY5SpfoUjGukswvRM`, which returned `READY` and aliases `streamfree.online`. Live
verification confirmed both manifest hashes/sizes, `application/vnd.android.package-archive` MIME
types, and the expected filenames. Remaining QA is physical-device validation: connect the Android
phone for orientation, Back, playback, and updater checks. Physical TV testing remains deferred;
an Android TV emulator is the substitute when provisioned.

## 24. Anime Mode release checkpoint — 2026-08-18

Anime Mode is now a dedicated, themed experience at `/anime`, reachable from the Home page through
the Anime Mode entry card. Its web shell provides Discover, Back, and in-app episode notifications;
the phone and TV bundles expose the same Anime Mode entry point. The implementation is native to
StreamFree rather than a source copy of Anilili: the checked-out Anilili repository contained
documentation/showcase material without the Kotlin/Compose application source or a visible license,
so no unavailable or unlicensed code was copied. The intended interaction principles—focused anime
discovery, source grouping, Sub/Dub clarity, and remote-friendly playback—are implemented in the
existing StreamFree architecture.

Anime source adapters support documented Anivexa and Miruro API payload shapes and normalize provider
labels for ReAnime, AniKoto, AnimeGG, AniNeko, 2DHive, AniZone, AnimeCG, AnimeNoSub, MegaPlay, and
Miruro provider keys. The adapters are deliberately configuration-gated by exact HTTPS origins:
set `ANIVEXA_API_BASE_URL`, `MIRURO_API_BASE_URL`, and `STREAMFREE_ANIME_ALLOWED_ORIGINS` in Vercel
only after selecting an authorized, reliable API deployment. They do not bypass secure pipes,
extract provider HTML, or claim third-party availability. Anivexa documents self-hosted deployment
as the reliable option for serverless consumers; Miruro's hosted API can be paused or return provider
errors. The deterministic adapter contract is covered by `pnpm run test:anime-integrations`.

AniList and MyAnimeList connection routes are present and configuration-gated. OAuth state/PKCE is
validated server-side and access/refresh tokens are encrypted before storage in
`anime_linked_accounts`. Configure the official client IDs, redirects, and
`STREAMFREE_ANIME_TOKEN_ENCRYPTION_KEY` before enabling them in production. New-episode notifications
currently use authenticated in-app polling every 15 minutes while Anime Mode is open; background web
push/native delivery is intentionally deferred until an authorized VAPID/FCM channel is configured.

The production Supabase migration was applied in project `kqrazmvxmjasjyrwfyyf` through SQL Editor on
2026-08-18. It creates the linked-account and episode-notification tables with RLS, indexes, and the
updated-at trigger. The SQL Editor returned `Success. No rows returned`.

New release candidates built from this checkpoint are additive and preserve the previous APKs for
rollback:

- Phone: `StreamFree-Android-v1.3.3.apk`, package `online.streamfree.app`, version code `7`, size
  `3347964`, SHA-256 `571FA4CB69051EDE36A16F02FDBAFF8EC7C2F1714D08B216B832DDA652D0D444`, certificate
  `4218B5F726FD4D61703B2112D7A41C77B93F215F1C1DC85560BAB86A6FB38EF4`.
- TV: `StreamFree-TV-v1.2.3.apk`, package `online.streamfree.tv`, version code `6`, size `3375567`,
  SHA-256 `06E4C403D29C5D4F6EF5D690AC31A38908A5E64A1D1308AE703C11E9C1907683`, certificate
  `7D5C1BB46BA3CE888C56E9CF1F39F86F65BC502BCD5480B0F8CF4663C80779D7`.

Both APKs are release-only, non-debuggable, and pass v2/v3 signature verification. No ADB was
required to assemble them. Physical Android phone testing, Android TV emulator testing, and new
real-provider smoke testing remain final release gates; do not describe them as passed until the
devices/providers are exercised. Production Anime API adapters and OAuth remain dormant until their
authorized Vercel configuration is added.

## 24. Continue Watching removal navigation fix — 2026-08-17

The Continue Watching removal regression was caused by `HistoryItemActions` being rendered inside
the resume `<Link>` on the phone rail, desktop rail, and phone resume hero. Although the action
component stopped bubbling events, nested interactive elements can still activate the ancestor link
in browsers. The action controls now render as siblings of the playback link, with the card art and
metadata remaining the only resume target. This makes Remove and Mark complete safe for pointer,
touch, and keyboard activation. Re-run the authenticated removal/Undo browser flow after the next
Vercel deployment and confirm the URL never changes when the action is used.

The fix is deployed in Vercel production deployment
`umbrestream-ga17rhrt4-nishants-projects-7d9628b2.vercel.app`, which returned `Ready` and was aliased
to `https://streamfree.online`. The available QA browser session was signed out during verification,
so authenticated mutation and Undo behavior remain explicitly unclaimed until a signed-in session is
available.

## 25. Player and Android TV experience release — 2026-08-18

The player/TV experience release is deployed to production. Vercel deployment
`https://umbrestream-l0nyvg9fp-nishants-projects-7d9628b2.vercel.app` returned `Ready` and is aliased to
`https://streamfree.online`. The prior Vercel deployments remain available for rollback.

Web and generated native clients now include:

- A borderless initial 16:9 cinema stage with black framing and no page-level player margins.
- Device-local Fit/Fill display preference. Fit preserves the whole frame; Fill scales the StreamFree-owned
  viewport to the available bounds without remounting the provider iframe or changing its URL.
- Explicit app-owned fullscreen handling, with the web stage becoming fixed to the viewport only after
  Full screen is requested.
- A persistent StreamFree-owned Source action so provider selection remains reachable after temporary player
  chrome fades.
- Phone/TV native black window surfaces and immersive system-bar handling. TV playback mode hides and removes
  global chrome from focus instead of placing it above the player.
- Responsive TV 720p/1080p/4K sizing tokens and compact playback overlays.

Release artifacts published at `/downloads`:

- Phone `1.3.2`, code `6`, package `online.streamfree.app`, SHA-256
  `5B0B9CDDC36CEFFA72D0EE7733C609A83E6F73351D8840CEE62C581B58186653`, size `3347279` bytes,
  certificate SHA-256 `4218B5F726FD4D61703B2112D7A41C77B93F215F1C1DC85560BAB86A6FB38EF4`.
- TV `1.2.2`, code `5`, package `online.streamfree.tv`, SHA-256
  `D035E163E033E822AB493F85B679B7EFBBB51518C18157E46CD8C7752A08DAC7`, size `3375097` bytes,
  certificate SHA-256 `7D5C1BB46BA3CE888C56E9CF1F39F86F65BC502BCD5480B0F8CF4663C80779D7`.

Production verification confirmed both manifests and APKs return HTTP 200, the manifests match the local
artifact hashes/sizes/version codes, APKs use `application/vnd.android.package-archive`, and the phone/TV
download pages expose the new release versions. Deterministic checks passed: TypeScript, authored lint,
player-source contracts, episode resolver, update-manifest validation, release-artifact validation, leak scan,
production build, and `git diff --check`.

Browser smoke verification covered the production movie source picker and the real-title route matrix:
two movies, two TV fixtures, and two anime fixtures with separate Sub and Dub routes. Source mounting and
URL/provider selection were confirmed; these checks do not claim that a third-party provider will always start
or remain playable. The physical-device gate remains open: `adb devices` currently reports no connected phone,
and no Android TV emulator is provisioned. Next action is to connect the phone and run signed-APK playback,
Fit/Fill, fullscreen/orientation, Back, reload/resume, and updater checks. Physical Android TV certification is
not available; an emulator is the planned substitute.

## 26. Final non-hardware web QA checkpoint — 2026-08-18

Accessibility and web/PWA hardening was deployed in Vercel production deployment
`dpl_HGo3ubtSK3oBFC6tCqnRfwr8x8x9`, which returned `READY` and is aliased to
`https://streamfree.online`.

The final browser checks covered desktop and 390×844 mobile flows:

- Search suggestions returned live TMDB results for `toys`; pointer selection and mobile ArrowDown/Enter
  selection both routed to `/movie/11597` while preserving `aria-expanded`, `aria-controls`, and
  `aria-activedescendant`.
- Movie Source sheet opened on mobile, Cinezo selection changed the URL to `src=cinezo`, closed the sheet,
  and Fit/Fill changed the StreamFree shell without changing iframe identity or URL.
- Home, Search, Browse, About, and movie player audits found zero unnamed visible interactive controls, zero
  missing nondecorative image alt values, zero unlabeled inputs, and zero nested interactive controls.
- About's GitHub icon now has an accessible name. Player Back/source actions no longer contain nested interactive
  elements.
- PWA service worker, manifest, robots, and sitemap routes return HTTP 200; `/sw.js` is served with
  `must-revalidate, max-age=0`. Phone/TV app pages expose release versions `1.3.2` and `1.2.2`.
- Continue Watching deterministic cursor stress coverage now walks 150 title-level records across pages with
  no duplicates, proving the old 100-row client cap is not present. No synthetic rows were inserted into
  production; a signed-in mutation/Undo pass remains the only web QA requiring a user session.

The remaining open tasks are authorization/device-dependent only: sign in to a StreamFree test account to
exercise live Continue Watching/watchlist removal plus Undo, connect the physical Android phone for native
playback/orientation/updater checks, and provision an Android TV emulator for D-pad/playback checks. The
production web/PWA and deterministic non-hardware QA gate is complete.

## 27. Anime release deployed — 2026-08-18

The Anime Mode release is live in the linked `umbrestream` Vercel project. Production deployment
`dpl_8vrwdH2JFAtWTrZ6QGEDqQumSB2A` returned `readyState: READY` and was aliased to
`https://streamfree.online`. The remote build completed successfully with the Anime routes and APIs:
`/anime`, `/api/anime/accounts`, `/api/anime/notifications`, `/api/auth/anilist/*`,
`/api/auth/mal/*`, `/api/mobile/home`, and the existing player/source routes.

Live release checks returned:

- Phone manifest: HTTP 200, version `1.3.3`, code `7`, size `3347964`, SHA-256
  `571FA4CB69051EDE36A16F02FDBAFF8EC7C2F1714D08B216B832DDA652D0D444`.
- TV manifest: HTTP 200, version `1.2.3`, code `6`, size `3375567`, SHA-256
  `06E4C403D29C5D4F6EF5D690AC31A38908A5E64A1D1308AE703C11E9C1907683`.
- Both APK URLs: HTTP 200, `application/vnd.android.package-archive`, exact manifest byte length,
  and expected release filenames.
- `/anime`, `/app`, `/app/tv`, and `/api/mobile/home`: HTTP 200. The mobile home response reported
  schema version `1`, signed-out provenance, and effective country `IN`.

Vercel's build emitted only the existing dynamic-rendering notices for authenticated `/library`,
`/space`, and `/space/history` static generation; the build still completed successfully. Live
Anivexa/Miruro adapters, AniList/MAL OAuth, and background push remain configuration-gated because
the production environment currently has no authorized API origins, OAuth client credentials, token
encryption key, or VAPID/FCM delivery credentials. In-app notification polling is the active release
behavior. Physical phone, Android TV emulator, and real-provider playback checks remain pending.

The deterministic Anime adapter suite was expanded after this deployment checkpoint. It now verifies
all requested Anivexa provider labels, nested Miruro provider payloads, Sub/Dub isolation, subtitle
track normalization, rejection of unallowlisted and cleartext streams, non-anime rejection, and the
origin allowlist gate before an optional API is queried. The corresponding adapter change must be
deployed before it is considered live; the release task board records that follow-up deployment.

The adapter hardening was deployed in Vercel production deployment
`dpl_BStWz2stsDZCDEvhTDFSQyeNuzWk`, which returned `READY` and was aliased to
`https://streamfree.online`. Live `/anime` and `/api/mobile/home` returned HTTP 200. The live player
source contract returned six existing anime sources with `fallbackMode: prompt`; optional Anivexa and
Miruro sources were intentionally absent because no authorized API origins are configured in Vercel.

## 28. Anime player visibility bug — 2026-08-18

A production browser reproduction found that the shared `PlayerShell` is portalled to `document.body`
after the immersive route's `min-h-dvh` main container. Its non-fullscreen `relative` stage therefore
landed below the viewport; on a 390×844 test viewport the stage was at document position `y=844`, and
the browser's scroll restoration made the iframe appear blank/off-frame. The Source control was present
in the DOM but moved with the displaced stage, which explains why users could not choose a server.

The fix changes only the non-fullscreen stage positioning to a fixed, top-centered 16:9 viewport. The
iframe remains clipped inside the StreamFree-owned stage, while Source, Fit/Fill, Full screen, recovery,
and episode controls stay attached to the visible player. Fullscreen continues to use the existing
fixed full-viewport branch. `SF-196` was deployed as `dpl_EUwggePWmcSgCGeXNvqrXHMSBpFV` and verified
on desktop and mobile geometry.

## 29. Framed anime player flow — 2026-08-18

The anime route now opts into an inline player layout rather than the shared body portal. This keeps the
initial stage in normal document flow, leaves fullscreen opt-in, restores page scrolling, and places a
persistent Next episode action plus the complete episode list below the stage. Episode links preserve the
selected audio variant, while the device-local source preference continues to select the remembered
provider on the next route.

The source sheet now also renders the requested provider catalog — Miruro, AniKoto, ReAnime, AniZone,
AnimeCG, AnimeGG, AniNeko, 2DHive, and MegaPlay — in the relevant Sub/Dub group. Catalog entries are
disabled and labelled `Not connected` unless Anivexa or MiruroAPI returns a validated candidate for the
current title and episode. This prevents a provider name from being presented as playable when the
optional API origin is absent or unavailable.

Commit: `a4a2741` (`fix(anime): restore framed episode player flow`). Preview deployment
`7giGdMzuXGFsqBcrC6JcL7RxtygZ` is Ready at
`https://umbrestream-quyb9f2gl-nishants-projects-7d9628b2.vercel.app`. Desktop 1280×720 and mobile
390×844 checks passed for stage geometry, scroll position, Source sheet opening, catalog visibility,
next-episode navigation, and default fullscreen-off behavior. Production promotion remains pending
because the Vercel project dashboard currently indicates production is updated from `main`.

## 30. Web-first rebuild W1 production checkpoint — 2026-08-20

The web-first rebuild is being developed on branch `codex/web-first-native-rebuild`.
The canonical implementation plan is `plan.md` and the live task board is `TODO.md`.
The W1 release-blocker phase is complete and pushed in commits `375f93b` and `4c38c63`.

W1 repaired the Next.js production build by removing the Anime Discover dynamic RSC boundary,
making the shared route skeletons server-safe CSS placeholders, and confirming a fresh
`next build --webpack` passes all 38 routes. Anime remote source resolution now uses a reusable
exact-HTTPS allowlist policy covering API bases, streams, subtitles, and manually validated redirects.
It rejects wildcard `*`, HTTP, credentials, fragments, nonstandard ports, private/reserved literal
hosts, and unallowlisted origins; wildcard subdomains require explicit `https://*.example.com`
configuration. Anime catalog resolution is Sub/Dub-specific, deduplicated, and combines the full
validated catalogue with a bounded direct-watch fallback. VidSrc remains an experimental,
user-selectable fallback and is not treated as a stable default.

The deterministic gate passed: strict lint (`--max-warnings=0`), TypeScript, player source ordering,
episode resolver, Continue Watching, Home-feed dedupe, Anime integrations, native cache/history/update
state, update-manifest verification, release-artifact checks, leak scan, and production build.
The single `verify` script now includes these checks. The local bundled runtime did not include npm;
equivalent commands were run directly with Node, while Vercel ran the project build successfully.

Production deployment `dpl_4fYCKjtDyJm9hPJJF5zsDFZLMJyx` returned `READY` and is aliased to
`https://streamfree.online`. Live smoke checks returned HTTP 200 for `/`, `/anime/discover`, `/browse`,
`/robots.txt`, `/sitemap.xml`, and `/api/mobile/config`. Live source checks returned movie default
`filmu`, TV default `vidking`, anime source policy `2026-08-reliability-v1`, and the expected source
labels. Vercel built from a transient generated pnpm lockfile created by the local pnpm wrapper; that
file was removed from the worktree and was not committed. Future deployments must use the repository's
tracked npm lockfile only.

The approved reference policy is recorded in `plan.md`: Media3 and Now in Android are primary
architecture references; Aniyomi is pattern-only because it is archived; Dantotsu was not reused
because its source/license could not be verified during review. No provider anti-bot bypass, hidden
iframe stream extraction, open proxy, or unlicensed code was added.

Next phase is W2 player and interaction certification: deterministic source-sheet tests, framed
playback/Fit-Fill/fullscreen checks, Continue Watching/watchlist removal and Undo checks, and the
Playwright/accessibility matrix. Native Android work remains blocked behind completion of the web phases.
