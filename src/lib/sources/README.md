# Player source adapters

Movie, TV, and Anime playback use one adapter registry. Public iframe sources are built synchronously in the browser so playback never waits for upstream health requests. `/api/player/sources` returns the same manifest plus any server-configured direct sources; `version=2` retains the previous exact-page preflight for one rollback deployment.

## Current registry

- Movie/TV: Filmu is the trial default, followed by Cinezo, VidLink, VidKing, Vidrift, Vidbolt, and Videasy.
- Anime: AnimePahe via VidNest, VidLink sub/dub via MAL ID, AniLink sub/dub via AniList ID, and conditional VidSrc Sub via MAL ID. Cinezo is intentionally reserved for movies and TV; it is not an anime option. Optional server-side Anivexa and MiruroAPI adapters can add ReAnime, AniKoto, AnimeGG, AniNeko, 2DHive, AniZone, AnimeCG, MegaPlay, and other documented provider entries while preserving separate Sub/Dub groups.
- Unverified experimental Anime routes are intentionally not exposed. They can be reintroduced only after a documented Sub/Dub playback fixture and a source-contract test pass.
- Authorized direct HLS, DASH, and MP4 entries can be supplied with `PLAYER_DIRECT_SOURCES_JSON` and play in Umbra's native player.

Cinezo, VidLink, and VidKing are stable adapters. Public providers without a developer contract are labelled experimental. VidLink player variants share one provider identity so a failed origin does not masquerade as two independent fallbacks.

Reference sites are used only to learn UX behavior such as grouped audio variants and server fallback. Their private resolver calls, tokens, and protected endpoints are not copied.

## Contract

`SourceRequest` carries validated TMDB, IMDb, AniList, MAL, optional Anime TMDB, season, episode, audio, subtitle, and resume values. `StreamCandidate` declares a stable source and provider ID, provider tier, player variant, stream format, capabilities, and optional audio/subtitle tracks.

Subtitle capability is `native`, `unverified`, or `none`. Caption requests prefer a native-caption source unless the user explicitly pins another server. Direct subtitle tracks are fetched only through `/api/player/subtitles`, which requires an HTTPS hostname listed in `PLAYER_SUBTITLE_HOSTS` and accepts only SRT/VTT files.

## Direct-source configuration

`PLAYER_DIRECT_SOURCES_JSON` is a JSON array matching `DirectEntry`. Example:

```json
[
  {
    "tmdbId": 27205,
    "url": "https://media.example.com/inception.m3u8",
    "quality": 1080,
    "subtitleTracks": [
      {
        "id": "en",
        "language": "en",
        "label": "English",
        "url": "https://subs.example.com/inception.srt",
        "isDefault": true
      }
    ]
  }
]
```

The stream must be authorized for the site and expose browser-compatible CORS headers. Set `PLAYER_SUBTITLE_HOSTS=subs.example.com` for the example caption host.

## Adding a provider

1. Add an adapter under `adapters/` and assign a stable provider identity and tier.
2. Validate identifiers in `supports()` and return no candidate when requirements are missing.
3. Keep public embed resolution synchronous; asynchronous provider API resolvers belong on the server.
4. Add URL, ordering, missing-ID, audio, subtitle, and fallback fixtures to `scripts/check-player-sources.mjs`.

Do not accept arbitrary stream URLs from requests, expose provider secrets, copy private endpoints, or bypass provider protections.

## Optional Anime API configuration

The Anivexa and Miruro adapters are disabled unless the server provides all of the following:

- `ANIVEXA_API_BASE_URL` and/or `MIRURO_API_BASE_URL`, using HTTPS.
- `STREAMFREE_ANIME_ALLOWED_ORIGINS`, a comma-separated exact-origin allowlist containing the API origin and every authorized stream/subtitle origin the API is permitted to return.

The adapters call only the documented episode/watch routes, reject non-HTTPS or non-allowlisted URLs, and return no candidate when configuration is incomplete. They do not copy provider resolvers, inspect protected HTML, or bypass provider access controls. Vercel deployment should use a separately operated, authorized API instance; free/serverless provider deployments may be blocked or too slow for reliable playback.

Anivexa's documented flow is `GET /episodes/{anilistId}` followed by `GET /watch/{provider}/{anilistId}/{sub|dub}/{provider}-{episode}`. The adapter uses the provider-specific episode ID returned by the API instead of guessing a slug. Do not set the allowlist to `*`: the policy rejects that value intentionally. Add the exact API origin and the HTTPS CDN origins returned by the authorized API deployment; wildcard subdomains are supported only when their parent domain is explicitly approved.
