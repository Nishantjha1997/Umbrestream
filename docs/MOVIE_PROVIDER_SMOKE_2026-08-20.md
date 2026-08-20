# Movie provider smoke matrix — 2026-08-20

Fixture: TMDB `1212763` (`Evil Dead Burn`). Checks were performed from a real browser and record only visible player behavior. Cross-origin provider internals and media URLs were not inspected.

| Provider | Visible result | Startup observation | Release action |
|---|---|---:|---|
| Filmu | Correct title and player UI rendered inside the StreamFree movie route | About 12 seconds on the checked run | Keep as movie default; extend recovery grace to 30 seconds |
| VidRift | Resolved `Direct 1`, exposed 1080p/player controls, and visibly advanced to `0:06 / 82:54` | Playable | Promote to first automatic movie recovery; never timer-switch away because it has no trusted StreamFree event contract |
| VidKing | Correct movie reached visible playback at `02:54 / 1:50:31` | About 26 seconds and one earlier connection timeout | Keep as second certified automatic recovery; remove the `fast` claim |
| Cinezo | Correct movie player rendered but remained at `00:00 / 00:00` | Unconfirmed | Keep manually selectable; exclude from automatic movie recovery |
| VidLink | Provider returned an alert/blocked state in the checked browser | Failed in this environment | Keep manually selectable; exclude from automatic movie recovery |
| VidLink Classic | Correct controls rendered, but remained at `0:00 / 0:00` after Play | Failed for fixture | Keep manually selectable; exclude from automatic movie recovery |
| VidRift documentation host | The old non-embed host displayed documentation instead of playback | Invalid endpoint | Fixed separately to `embed.vidrift.in` and retained by contract test |
| Vidbolt | Blank result | Unconfirmed | Keep as a manual backup only |
| Videasy | Connection timed out | Failed in this environment | Keep as a manual backup only |
| VidSrc | Redirecting/blank result | Failed in this environment | Keep as a manual backup only |

## Reliability policy derived from the matrix

- Filmu remains the product movie default.
- A clean default launch gets 30 seconds before automatic recovery; five seconds interrupted valid provider startup.
- The certified automatic movie chain is Filmu → VidRift → VidKing.
- Explicit or remembered source choices are never replaced automatically.
- An eventless cross-origin source is never replaced solely because a timer elapsed. It receives a visible one-tap recovery prompt instead.
- Providers that were not playback-confirmed remain available for regional/manual recovery but cannot enter the silent automatic chain.
- Provider availability is external and can vary by title, region, time, and network; this file is release evidence, not a guarantee.
