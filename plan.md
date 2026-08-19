# StreamFree (Umbrestream) Master Engineering Handover & Action Plan

**Project:** StreamFree (Umbrestream)  
**Production URL:** [https://streamfree.online](https://streamfree.online)  
**Vercel Project:** `umbrestream`  
**GitHub Repository:** `Nishantjha1997/Umbrestream` (Branch: `main`)  
**Active Cloudflare Edge Proxy:** `https://streamfree-proxy.nishantjha31.workers.dev`  
**AniList Client ID:** `47128` | **Redirect URI:** `https://streamfree.online/api/auth/anilist/callback`  

---

## 1. Background & Problem Statement: Why Cloudflare Blocks Our Streams

### The Problem:
When StreamFree's scraping backend (hosted on Render/AWS/Vercel) attempts to resolve video streams from 3rd-party anime providers (AniBD, Senshi, ReAnime, Miruro, MKissa, etc.), the providers' security layers (**Cloudflare / DDoS-Guard**) identify our server requests as originating from **Datacenter IP Ranges (Datacenter ASNs)**. As a result, requests are challenged with CAPTCHAs or rejected with **HTTP 403 Forbidden**.

### The Goal:
Replicate the ad-free, native playback of top native Android clients (*Anilili*, *CloudStream*, *Aniyomi*):
- Extract the raw `.m3u8` or `.mp4` video manifest directly.
- Feed it into our custom `NativePlayer.tsx` (`hls.js`) with native quality selection, multi-audio tracks, subtitles, and PiP.
- Completely bypass ad-heavy 3rd-party `<iframe>` embeds.

---

## 2. The 3-Hack Architecture: Cloudflare & CORS Evasion Strategies

To bypass Cloudflare blocking and browser CORS restrictions, we formulated 3 distinct architectural hacks:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                             CLOUDFLARE EVASION HACKS                             │
├──────────────────────────────────────────────────────────────────────────────────┤
│ HACK 1: Invisible Iframe postMessage Sniffer                                     │
│   ↳ Loads embed in 1x1 hidden iframe on client IP -> captures postMessage m3u8   │
│                                                                                  │
│ HACK 2: Cloudflare Edge Worker Reverse Proxy (★ IMPLEMENTED)                     │
│   ↳ Routes requests through Cloudflare's own Edge ASN -> bypasses CF 403 + CORS  │
│                                                                                  │
│ HACK 3: StreamFree Companion Browser Extension (Contingency)                     │
│   ↳ 1-click Chrome extension with all-origin permissions -> 100% unrestricted    │
│                                                                                  │
│ HACK 4: Android Capacitor Native HTTP (Mobile APK Plan)                          │
│   ↳ Executes OkHttp natively from user's cellular/residential phone IP           │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Deep Dive into Each Hack:

#### ★ Hack 2: Cloudflare Edge Worker Proxy *(Currently Implemented & Active)*
- **Why we chose it first:** Zero friction for users (no extension or APK required), 100% serverless, free (100k requests/day), and fast (<150ms edge latency).
- **How it works:** 
  1. We deployed a custom proxy worker to `https://streamfree-proxy.nishantjha31.workers.dev`.
  2. Because the request originates from **within Cloudflare’s own internal ASN**, Cloudflare’s anti-bot algorithms treat it as trusted edge traffic rather than an external datacenter scraper.
  3. The worker injects `Access-Control-Allow-Origin: *` headers, allowing the browser to read the payload without CORS errors.
- **Code Implementation:**
  - Utility: [`src/utils/proxy.ts`](file:///c:/Users/HP_5C/OneDrive/Desktop/Stream/Umbrestream/src/utils/proxy.ts) (`proxiedFetch`, `toProxiedUrl`).
  - Automatic Failover: [`src/lib/sources/adapters/animeRemote.ts`](file:///c:/Users/HP_5C/OneDrive/Desktop/Stream/Umbrestream/src/lib/sources/adapters/animeRemote.ts) automatically falls back to `proxiedFetch` whenever direct Render/proxy calls fail.

#### Hack 1: Invisible `<iframe>` postMessage Sniffer *(Fallback for Web)*
- **Concept:** If a provider completely locks down their API, we mount an invisible `1x1` pixel `<iframe>` pointing to the provider's embed player.
- **Why it works:** Browser iframes run directly on the user's residential IP (bypassing CORS). Many player engines (JWPlayer, Video.js, Plyr) broadcast player events and `.m3u8` URLs via `window.parent.postMessage()`. We listen on `window.addEventListener('message')` to extract the stream URL and transfer it into `NativePlayer.tsx`.
- **When to use:** If Cloudflare Worker IPs are ever rate-limited by a specific target domain.

#### Hack 3: StreamFree Companion Web Extension *(The Ultimate Nuclear Option)*
- **Concept:** A lightweight Chrome/Firefox extension with `"host_permissions": ["<all_urls>"]`.
- **Why it works:** Web extensions run with elevated browser privileges that completely bypass CORS and originate from the user's home IP with real browser TLS fingerprints.
- **When to use:** If providers deploy aggressive Turnstile CAPTCHAs that block all cloud proxies.

#### Hack 4: Android Mobile Native Scraping (`ANDROID_APK_PLAN.md`)
- **Concept:** Inside the Android Capacitor app, `@capacitor/http` makes native Android `OkHttp` calls directly over 4G/5G/Wi-Fi, bypassing browser CORS and cloud IP bans entirely.

---

## 3. What Has Been Completed So Far

1. **Cloudflare Edge Worker Proxy Deployed:**
   - Active worker live at `https://streamfree-proxy.nishantjha31.workers.dev`.
   - Verified via edge IP check (`2a06:98c0:3600::103`) and live Anivexa payload delivery with CORS headers.
   - Integrated into `src/utils/proxy.ts` and `src/lib/sources/adapters/animeRemote.ts`.
2. **TV Player Layout Overhaul (Unified with Anime Player):**
   - Refactored `src/components/sections/TV/Player/Player.tsx` and `EpisodeSelection.tsx`.
   - Desktop: Dedicated, always-visible **Episodes Sidebar** on the right.
   - Mobile: Clean, glassmorphic **inline episode grid** below player controls.
3. **Anime Player Header UX Refinements:**
   - Watchlist bookmarking button with toast notification undo.
   - Dynamic 10-point AniList score badge (e.g. ⭐ `8.5`).
   - Direct tracker links for AniList (**AL**) and MyAnimeList (**MAL**).
4. **AniList OAuth Hardening & Fallbacks:**
   - Added AES-256 encryption key fallbacks in `src/lib/anime/oauth.ts`.
   - User configured AniList Developer Redirect URI to `https://streamfree.online/api/auth/anilist/callback`.
5. **Android Native APK Blueprint:**
   - Full implementation blueprint written in [`ANDROID_APK_PLAN.md`](./ANDROID_APK_PLAN.md).

---

## 4. Immediate Action Items & Task Backlog for DeepSeek

### Task 1: Push the Type Error Fix for Vercel
In `src/components/sections/TV/Player/Player.tsx`, `useMediaQuery` was added to `@mantine/hooks` import to resolve the Vercel build failure.
**Action:** Stage, commit, and push this fix to `main`:
```bash
git add src/components/sections/TV/Player/Player.tsx
git commit -m "fix(tv-player): add useMediaQuery to @mantine/hooks import"
git push origin main
```

---

### Task 2: Enable & Verify AniList OAuth ("Sync your anime lists" button)
**Current Issue:** The "Connect" button under "Sync your anime lists" on `/space` currently appears disabled ("Unavailable") because the failed deployment hasn't deployed the new OAuth fallbacks yet.

**Action & Verification Steps:**
1. Once Task 1 deploys to Vercel, visit `https://streamfree.online/space`.
2. Verify that `/api/anime/accounts` returns `providers.anilist.configured = true`.
3. The button will now show active **"Connect"**.
4. Click **Connect** -> authorize with AniList -> verify redirect back to `/space?anime_connected=anilist` with the green **"Connected as [Username]"** badge.

---

### Task 3: Add Prominent `/space` ("My Space") Entry Points on UI
Users need easy access to `/space` to connect their AniList account, customize playback settings, and view watch history.

**Files to Modify:**
1. **Desktop Header & Rail (`src/components/shell/desktop/Header.tsx`, `Rail.tsx`):**
   - Add a direct link/button to `/space` ("My Space") with an icon (e.g. `FiCompass` or `FiUser`).
2. **Mobile Tab Bar (`src/components/shell/phone/TabBar.tsx`):**
   - Ensure "My Space" is easily accessible in the primary mobile navigation bar.
3. **User Profile / Auth (`src/app/auth/` or Profile components):**
   - Add a prominent callout banner:
     > 💡 **Sync Your Anime:** Link your AniList account in [My Space](/space) to automatically track watched episodes and get live new episode notifications.

---

### Task 4: Verify Cloudflare Worker Failover on Anime Streams
1. Test anime stream resolution on `https://streamfree.online/anime/21/player/1`.
2. Inspect network tab to verify that `animeRemote.ts` resolves streams via `streamfree-proxy.nishantjha31.workers.dev` when direct calls encounter 403s.
3. Confirm video plays inside `NativePlayer.tsx` (ad-free with quality/audio options).

---

### Task 5: Contingency Execution (If Hack 2 Ever Fails)
If Cloudflare Worker proxy is challenged by a provider:
1. **For Web:** Implement Hack 1 (Hidden iframe sniffer) or Hack 3 (Browser Extension).
2. **For Mobile:** Follow [`ANDROID_APK_PLAN.md`](./ANDROID_APK_PLAN.md) to implement client-side `@capacitor/http` scrapers.

---

## 5. Key Reference Files

| File Path | Description |
| :--- | :--- |
| [`src/lib/sources/adapters/animeRemote.ts`](file:///c:/Users/HP_5C/OneDrive/Desktop/Stream/Umbrestream/src/lib/sources/adapters/animeRemote.ts) | Remote anime provider resolver with Cloudflare proxy failover |
| [`src/utils/proxy.ts`](file:///c:/Users/HP_5C/OneDrive/Desktop/Stream/Umbrestream/src/utils/proxy.ts) | Universal Cloudflare Edge Worker proxy fetcher |
| [`src/lib/anime/oauth.ts`](file:///c:/Users/HP_5C/OneDrive/Desktop/Stream/Umbrestream/src/lib/anime/oauth.ts) | AniList / MAL OAuth encryption & URI management |
| [`src/components/sections/Settings/AnimeConnections.tsx`](file:///c:/Users/HP_5C/OneDrive/Desktop/Stream/Umbrestream/src/components/sections/Settings/AnimeConnections.tsx) | UI for linking AniList / MAL accounts on `/space` |
| [`src/components/sections/TV/Player/Player.tsx`](file:///c:/Users/HP_5C/OneDrive/Desktop/Stream/Umbrestream/src/components/sections/TV/Player/Player.tsx) | TV player shell with desktop sidebar & mobile inline grid |
| [`ANDROID_APK_PLAN.md`](file:///c:/Users/HP_5C/OneDrive/Desktop/Stream/Umbrestream/ANDROID_APK_PLAN.md) | Master plan for Android APK client-side stream scraping |
