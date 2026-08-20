# Movie and TV provider contract audit — 2026-08-20

Scope: user-facing movie and TV iframe adapters in `src/lib/sources/adapters/embed.ts`.
This audit verifies only documented embed URL shapes, documented query parameters, exact final origins,
and visible playback evidence. It does not inspect provider HTML or extract media URLs.

## Active providers

| Provider | Primary contract | StreamFree decision | Playback evidence |
|---|---|---|---|
| Filmu | No public API documentation was exposed at `embed.filmu.in`; current product contract is based on the existing `/movie/{tmdbId}` and `/tv/{tmdbId}/{season}/{episode}` integration. | Keep as the movie product default by explicit decision. Keep subtitle support unverified and do not claim URL-based resume. | Movie fixture rendered the correct title/player shell but stream startup remained intermittent. A full 30-second grace period remains mandatory. |
| VidRift | Provider-owned documentation at `https://vidrift.in` specifies `https://embed.vidrift.in/embed/movie/{tmdb_id}` and `https://embed.vidrift.in/embed/tv/{tmdb_id}/{season}/{episode}`. | URL shapes are correct. Keep as a stable, eventless safety net because the provider does not document a parent-window playback event contract. | Movie fixture selected Direct 1 and visibly advanced beyond one minute. |
| VidKing | Provider-owned documentation at `https://www.vidking.net` specifies `/embed/movie/{tmdbId}`, `/embed/tv/{tmdbId}/{season}/{episode}`, and `color`, `autoPlay`, `nextEpisode`, `episodeSelector`, and `progress`. It documents `PLAYER_EVENT` messages. | Existing URL and parameters are correct. Keep trusted events and `progress` resume support. | Movie playback was confirmed, but source negotiation took about 26 seconds in the release fixture. |
| Videasy | Provider-owned documentation at `https://www.videasy.to/docs` specifies the canonical `player.videasy.net` movie/TV routes and `color`, `progress`, `nextEpisode`, `episodeSelector`, and `autoplayNextEpisode`. The canonical host currently redirects to `player.videasy.to`. | Use the final `.to` player origin so exact postMessage validation remains correct; add all supported StreamFree parameters and `progress` resume. Keep it as a stable manual backup, but exclude it from silent recovery until repeated embedded smokes pass. | Direct movie playback reached `0:01 / 01:50:31`; TV playback reached `0:03 / 01:01:35` and exposed episodes/quality/subtitle/server controls. The later release-preview iframe timed out, so availability is currently intermittent. |
| Cinezo | Provider-owned docs at `https://cinezo.live` specify `/embed/movie/{tmdbId}`, `/embed/tv/{tmdbId}/{season}/{episode}`, and the current color/player-control query parameters. | Existing URL shape and UI parameters are correct. Remove the unsupported `startAt` resume claim because it is not in the published option list. | Correct movie shell rendered, but the release fixture did not confirm advancing media. |
| VidLink / VidLink Classic | Provider-owned docs at `https://vidlink.pro` specify `/movie/{tmdbId}`, `/tv/{tmdbId}/{season}/{episode}`, `player=jw`, color options, `autoplay`, `startAt`, and `PLAYER_EVENT` messages. | Existing routes, variants, resume, and event contracts are correct. | Current browser environment blocked or stalled the release fixtures, so these remain later stable manual/automatic candidates rather than first recovery. |

## Quarantined providers

| Provider | Reason removed from the user-facing source sheet |
|---|---|
| VidBolt | `https://vidbolt.xyz` and the current movie fixture rendered blank; no provider-owned integration documentation or working playback fixture could be verified. |
| VidSrc (`vidsrc.rip`) | The current movie fixture rendered blank and no provider-owned integration documentation could be verified. Third-party code examples are not sufficient release evidence. |

Quarantine means the adapter is not offered to users. It can return only after a provider-owned contract and a real movie plus TV fixture pass. A large server count is not treated as reliability when entries are known dead or undocumented.

## Recovery order

- Movie product default: Filmu.
- Clean-launch automatic recovery: Filmu → VidKing → VidRift.
- TV clean-launch recovery: VidKing → Cinezo → VidLink → VidLink Classic → Filmu → VidRift.
- VidRift is last in automatic chains because it is eventless. Once mounted, elapsed wall time alone must not replace it.
- Explicit URL selections and remembered device preferences remain consent-based and are never silently replaced.
