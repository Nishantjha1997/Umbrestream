# Umbra implementation progress

Last updated: 2026-08-07

## Purpose

This file is the handoff point for any AI or developer continuing the Umbra work. Read it before changing the player, analytics, authentication, or deployment code.

Repository: `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\umbra`

Remote: `https://github.com/Nishantjha1997/Umbrestream`

Deployment: Vercel is connected to the GitHub repository and deploys from `main` after a successful push.

## User decisions currently in force

- Keep Filmu as the first Movie and TV source.
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

## Latest change in progress

The latest user request was to remove the ad-blocking idea completely. The following source changes have been made but still need final verification and commit:

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
4. Test the current build/browser route for Movie, TV, and Anime after rebuilding so the rendered iframe has no `sandbox` attribute.
5. Verify `/admin` redirects unauthenticated users to `/auth?form=login&next=%2Fadmin`; do not place credentials in this file.
6. Review the final diff and status carefully.
7. Completed: committed the complete scoped change as `99ccaa4` and pushed `main` to the configured GitHub remote.
8. Vercel should now build from `main`. Confirm the deployment and remind the owner to apply the Supabase migrations and set required server environment variables.
9. Completed: stopped the verified temporary local server and finalized the browser verification tabs after resetting the temporary viewport.

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
