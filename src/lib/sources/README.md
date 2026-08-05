# Player source adapters

Movie, TV, and Anime playback use one adapter registry. Each adapter declares a stable provider ID, supported media types, identifier requirements, media-specific priority, URL resolution, playback capabilities, audio variant, and iframe policy.

The browser never supplies an arbitrary upstream URL. `/api/player/sources` builds eligible URLs from validated title identifiers, resolves adapters in parallel, and preflights each exact embed with a timeout. Exact-source successes are cached for 60 seconds; failed or inconclusive probes are cached for 15 seconds.

## Current registry

- Movie/TV: VidKing, two VidLink player modes, CineSrc, VidSrc RU, and VidSrc MOV.
- Anime: documented sub/dub endpoints for VidSrc Anime, MegaPlay, and DropFile, plus AutoEmbed Anime's documented title route.

Movie and TV providers were kept only after an exact player rendered the requested title. Anime hosts are more volatile, so their exact episode page must pass preflight before automatic selection; explicit 404/410/5xx pages, parked/suspended pages, homepage redirects, DNS failures, and timeouts are marked Failed. A failed provider stays in the server drawer for diagnosis and is retried after the short negative-cache window.

Reference sites are used only to learn UX behavior such as grouped audio variants and server fallback. Their private resolver calls and undocumented protected endpoints are not copied.

## Contract

```ts
interface SourceAdapter {
  id: string;
  label: string;
  supportedMediaTypes: MediaType[];
  identifierRequirements: Partial<Record<MediaType, SourceIdentifier[]>>;
  priority: number | ((request: SourceRequest) => number);
  supports(request: SourceRequest): boolean;
  resolve(request: SourceRequest, signal?: AbortSignal): Promise<StreamCandidate[]>;
}
```

`SourceRequest` may carry a title, TMDB, IMDb, AniList, and MAL IDs plus season, episode, audio, subtitle, and resume preferences. `supports()` must return false whenever the adapter's required identifiers are unavailable.

`StreamCandidate` includes the stable provider ID, provider origin, media type, priority, audio variant, capability metadata, and an approved URL built by the adapter. Iframe candidates also declare their `allow`, referrer, and optional sandbox policy.

Subtitle capability is recorded as `native`, `unverified`, or `none`. When a request includes `preferredSubtitle`, automatic selection chooses the first usable native-caption provider, while an explicit `src=<provider-id>` remains pinned. This describes player capability, not a guarantee that every title has a matching subtitle file.

## Adding a provider

1. Add an adapter under `adapters/` using only an authorized, documented embed or API contract.
2. Validate all required identifiers in `supports()` and return no candidate if the request is incomplete.
3. Honor the abort signal and throw on adapter failure so the resolver can report it without failing other providers.
4. Register the adapter once in `bootstrap.ts`.
5. Add Movie, TV, Anime, resume, ordering, and missing-identifier fixtures to `scripts/check-player-sources.mjs`.

Do not accept source URLs from query parameters, expose provider secrets to the client, copy private endpoints, or bypass provider protections.
