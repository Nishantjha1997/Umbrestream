# Player source adapters

Movie, TV, and Anime playback use one adapter registry. Public iframe sources are built synchronously in the browser so playback never waits for upstream health requests. `/api/player/sources` returns the same manifest plus any server-configured direct sources; `version=2` retains the previous exact-page preflight for one rollback deployment.

## Current registry

- Movie/TV: Cinezo, VidLink, VidKing, Vidrift, Vidbolt, Videasy, and Filmu.
- Anime: VidLink sub/dub via MAL ID and Cinezo sub/dub via AniList ID.
- Experimental Anime routes for Vidrift, Vidbolt, Videasy, and Filmu require an explicit `animeTmdbId`; they are excluded when that mapping is unavailable.
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
3. Keep public embed resolution synchronous; asynchronous authenticated resolvers belong on the server.
4. Add URL, ordering, missing-ID, audio, subtitle, and fallback fixtures to `scripts/check-player-sources.mjs`.

Do not accept arbitrary stream URLs from requests, expose provider secrets, copy private endpoints, or bypass provider protections.
