# Implementation Plan: Android APK Client-Side Stream Resolution & Cloudflare Evasion

## 1. Executive Summary & Objective
This plan outlines the architecture and execution steps for enabling **local/client-side stream resolution** within the StreamFree (Umbrestream) Android APK. 

By executing stream extraction and provider resolution directly on the client's device using **Capacitor Native HTTP**, requests originate from **residential and cellular (4G/5G) IP addresses** instead of cloud datacenter IPs (Render, AWS, Vercel). This eliminates Cloudflare and DDoS-Guard blocks (CAPTCHAs, 403 Forbidden) and enables 100% ad-free, direct video playback (identical to native Android anime apps such as *Anilili*, *CloudStream*, and *Aniyomi*).

---

## 2. Problem Analysis: Cloud Datacenter vs. Mobile IPs

```
[Current Architecture (Cloud Proxy)]
Mobile App / Web -> Render API (Datacenter ASN) -> Provider (Cloudflare / DDoS-Guard)
                                                ↳ 🛑 BLOCKED (403 Forbidden / CAPTCHA)

[Target Architecture (Hybrid Native Resolution)]
Mobile App (Capacitor) -> Native OkHttp Stack -> Provider (Direct HTTP)
                       ↳ ✅ ALLOWED (Residential/Cellular ASN, No CORS, Native IP)
```

1. **Datacenter IP Flagging:** Scraping backends hosted on cloud providers (Render, AWS, DigitalOcean) share IP subnets known to security CDNs (Cloudflare, DDoS-Guard). Providers immediately challenge or block these IPs.
2. **CORS Restrictions on Web:** Normal web browsers enforce CORS, preventing client-side `fetch()` directly to 3rd-party provider domains without a proxy.
3. **Mobile Exemption via Native Networking:** Android apps are not constrained by browser CORS policies when using native network stacks (`OkHttp`). In addition, consumer mobile/Wi-Fi IPs are treated as genuine end-user traffic by CDNs.

---

## 3. Core Architecture: Hybrid Resolution Strategy

The application must support a **Hybrid Source Adapter Pipeline**:
- **Mobile Native Platform (`Capacitor.isNativePlatform() === true`):**
  - Uses `@capacitor/http` (or `@capacitor-community/http`) to run scrapers directly on the device.
  - Queries anime providers (AniBD, Senshi, Miruro, ReAnime, AnimeGG, etc.) from the phone's native connection.
  - Returns raw `.m3u8` / `.mp4` streams and subtitle tracks directly to `NativePlayer.tsx`.
- **Web Platform (`Capacitor.isNativePlatform() === false`):**
  - Falls back to server-side proxy routes (`/api/player/sources`), Render backend (`ANIVEXA_API_BASE_URL`), and verified embed servers (`vidsrc`, etc.).

---

## 4. Step-by-Step Implementation Roadmap

### Phase 1: Capacitor Native Networking Integration
1. **Install Capacitor HTTP Plugin:**
   ```bash
   npm install @capacitor/http
   npx cap sync android
   ```
2. **Configure Network Permissions:**
   Ensure `android/app/src/main/AndroidManifest.xml` has proper internet and cleartext permissions:
   ```xml
   <uses-permission android:name="android.permission.INTERNET" />
   <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
   <application
       android:usesCleartextTraffic="true"
       ... >
   ```
3. **Create Unified HTTP Client Utility (`src/lib/network/httpClient.ts`):**
   Create an abstraction that dynamically switches between native HTTP and browser `fetch`:
   ```typescript
   import { Capacitor, CapacitorHttp } from "@capacitor/core";

   export interface HttpRequestOptions {
     url: string;
     method?: "GET" | "POST" | "HEAD";
     headers?: Record<string, string>;
     data?: any;
     responseType?: "json" | "text" | "arraybuffer";
   }

   export async function appFetch<T = any>(options: HttpRequestOptions): Promise<T> {
     if (Capacitor.isNativePlatform()) {
       const response = await CapacitorHttp.request({
         url: options.url,
         method: options.method || "GET",
         headers: {
           "User-Agent": "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
           ...options.headers,
         },
         data: options.data,
         responseType: options.responseType || "json",
       });
       return response.data;
     }
     
     // Fallback for Web Browser
     const res = await fetch(options.url, {
       method: options.method || "GET",
       headers: options.headers,
       body: options.data ? JSON.stringify(options.data) : undefined,
     });
     return options.responseType === "text" ? res.text() : res.json();
   }
   ```

---

### Phase 2: Client-Side Scraper Engine (`src/lib/sources/resolvers/client/`)
Port key provider scrapers to run client-side using `appFetch`:

1. **Directory Structure:**
   ```
   src/lib/sources/resolvers/client/
   ├── index.ts              # Registry & orchestration
   ├── anibd.ts              # AniBD extractor
   ├── miruro.ts             # Miruro/Senshi extractor
   ├── reanime.ts            # ReAnime extractor
   └── types.ts              # Stream schemas
   ```
2. **Provider Implementation Template (`anibd.ts`):**
   - Resolve episode stream manifest (`.m3u8`).
   - Extract embedded subtitle tracks (VTT/SRT).
   - Return normalized `StreamCandidate` object.

---

### Phase 3: Update Source Adapter Router (`src/lib/sources/animeCatalog.ts`)
Modify the Anime source resolver to prioritize client-side native extraction when running on Android:

```typescript
import { Capacitor } from "@capacitor/core";
import { resolveClientSideAnime } from "./resolvers/client";
import { createAnimeRemoteAdapters } from "./adapters/animeRemote";

export async function resolveAnimeStreams(request: AnimeSourceRequest): Promise<StreamCandidate[]> {
  // 1. If running inside Android APK, resolve directly via native HTTP
  if (Capacitor.isNativePlatform()) {
    try {
      const clientCandidates = await resolveClientSideAnime(request);
      if (clientCandidates && clientCandidates.length > 0) {
        return clientCandidates;
      }
    } catch (err) {
      console.warn("[MobileResolver] Client extraction failed, falling back:", err);
    }
  }

  // 2. Otherwise (or as fallback), query server-side adapters / embeds
  return resolveServerSideAnime(request);
}
```

---

### Phase 4: Video Player & HLS Native Configuration
1. **Configure `NativePlayer.tsx` for Android WebViews:**
   - In Android WebView, `hls.js` works natively.
   - When passing headers (e.g., `Referer` or `User-Agent`) required by some HLS streams:
     Configure `hls.js` `xhrSetup` to attach custom headers when needed:
     ```typescript
     const hls = new Hls({
       xhrSetup: (xhr, url) => {
         // Add custom referer / auth headers if provider requires it
       },
     });
     ```
2. **Enable Picture-in-Picture (PiP) and Background Play:**
   Add WebChromeClient media playback settings in `android/app/src/main/java/.../MainActivity.java`:
   ```java
   import android.os.Bundle;
   import android.webkit.WebSettings;

   public class MainActivity extends BridgeActivity {
       @Override
       public void onCreate(Bundle savedInstanceState) {
           super.onCreate(savedInstanceState);
           WebSettings settings = this.bridge.getWebView().getSettings();
           settings.setMediaPlaybackRequiresUserGesture(false);
           settings.setJavaScriptCanOpenWindowsAutomatically(true);
       }
   }
   ```

---

### Phase 5: Build & Packaging Process
1. **Sync Assets to Android Project:**
   ```bash
   npm run build
   npx cap sync android
   ```
2. **Build Debug APK:**
   ```bash
   cd android
   ./gradlew assembleDebug
   # Output: android/app/build/outputs/apk/debug/app-debug.apk
   ```
3. **Build Release APK:**
   ```bash
   ./gradlew assembleRelease
   # Output: android/app/build/outputs/apk/release/app-release-unsigned.apk
   ```
4. **Publishing / Download Delivery:**
   Place the generated APK in `public/downloads/StreamFree.apk` so users can download it directly from the `/space#install` page.

---

## 5. Verification Checklist & Success Criteria

| Criterion | Target | Verification Method |
| :--- | :--- | :--- |
| **Cloudflare Bypass** | 0% CAPTCHA/403 blocks on mobile | Test AniBD and Senshi providers on 4G/5G mobile data. |
| **Playback Latency** | < 1.5s stream start | Measure time from tapping episode to first frame rendered. |
| **No Iframe Ads** | 100% Ad-Free | Confirm stream plays inside `NativePlayer.tsx` (no popups/overlays). |
| **Sub/Dub Toggle** | Functional audio switching | Verify both Sub and Dub audio options resolve streams. |
| **Episode Tracking** | Auto-sync to Watch History & AniList | Verify episode increments in database upon completion. |

---

## 6. Next Actions for Implementing Agent
1. Install `@capacitor/http` and run `npx cap sync android`.
2. Implement `src/lib/network/httpClient.ts` using `CapacitorHttp`.
3. Add client-side scrapers in `src/lib/sources/resolvers/client/`.
4. Hook into `resolveAnimeStreams` with `Capacitor.isNativePlatform()` check.
5. Build and verify the APK using `./gradlew assembleDebug`.
