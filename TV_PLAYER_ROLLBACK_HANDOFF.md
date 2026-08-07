# TV player rollback handoff

Last updated: 2026-08-07

## Immediate objective

Restore TV episode playback before doing any other Umbra work. The latest user request is to remove the added Umbra player layer from TV and return TV to the simple direct-iframe behavior it had before the shared player-engine upgrade.

Do not change Movie or Anime playback while fixing TV.

## Repository state

- Repository: `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\umbra`
- Remote: `https://github.com/Nishantjha1997/Umbrestream`
- Branch: `main`
- HEAD when this handoff was written: `60876338419bf63f5e868519732aeb6fe656f12e`
- Production: `https://umbrestream.vercel.app/`
- TV fixture: `https://umbrestream.vercel.app/tv/97546/1/1/player`
- The only intentional local changes at handoff time are documentation changes in `IMPLEMENTATION_PROGRESS.md` and this file. Check `git status --short` before editing.

## Latest user clarification

- Production TV playback is still perceived as a blank/non-working page.
- The historical Vercel deployment `https://umbrestream-3536m6v9r-nishants-projects-7d9628b2.vercel.app/` is also not a valid working playback baseline after all.
- Therefore, do not promote or blindly restore that deployment.
- Roll back the TV player implementation in source code instead, keeping unrelated modern features intact.

## Evidence gathered

### Current production

On `/tv/97546/1/1/player?src=filmu`:

- The Umbra route renders and the iframe occupies the viewport.
- The iframe URL is `https://embed.filmu.in/tv/97546/1/1`.
- Filmu renders only its title/episode shell in the checked browser; no playable media was confirmed.
- Umbra shows `Stream still loading?` after 12 seconds.
- Sources and Episodes controls render, so the Next.js TV route itself is not crashing.

On the same fixture after manually selecting VidKing during the previous verification:

- The URL changed to `?src=vidking`.
- VidKing exposed a video element with `readyState: 4`, `duration: 1855.989`, and no media error.
- This proves VidKing is the strongest known TV default for this fixture. It does not prove every title works.

### Deployment/API limitations

- The supplied historical deployment is protected by Vercel Authentication and redirects an anonymous request to Vercel login.
- The connected Vercel account returned `Deployment not found` for that deployment and does not list the Umbra project, so its commit could not be resolved through Vercel metadata.
- Chrome browser control was unavailable, and the in-app browser was not authenticated to the historical deployment.
- Do not spend more time treating that deployment as a known-good source; the user confirmed it is not working either.

## Confirmed architectural regression boundary

Current TV playback flows through:

`src/components/sections/TV/Player/Player.tsx`

-> `src/components/player/ReliablePlayer.tsx`

-> `src/hooks/usePlayerEngine.ts`

-> `src/lib/sources/adapters/embed.ts`

The shared layer surrounds the provider iframe with:

- top and bottom gradient overlays;
- `StuckStreamToast`;
- shared source resolution and source status state;
- provider event handling and failure scoring;
- custom fullscreen/cinema behavior;
- conditional exhausted/no-source overlays;
- caption warning overlays;
- shared source drawer orchestration.

Even where individual overlay elements use `pointer-events: none`, this is substantially more state and layering than TV had before. The user specifically wants this layer removed from TV.

## Historical direct-iframe reference

Commit `31b308cfaa7d19b4e4020773278d545c57f196b0` contains the useful pre-engine TV pattern in:

`src/components/sections/TV/Player/Player.tsx`

That version:

- builds the TV provider array directly with `getTvShowPlayers(...)`;
- reads a numeric `src` query value;
- unconditionally mounts exactly one iframe;
- switches provider by changing the selected array item;
- does not use `ReliablePlayer` or `usePlayerEngine`;
- does not preflight or conditionally withhold the iframe.

Do not copy that historical file verbatim. It also contains the removed `AdsWarning`, old health racing, old numeric source state, and old layout details. Use only its direct-iframe architecture.

Useful inspection command:

```powershell
$git = 'C:\Users\DELL_\.cache\codex-runtimes\codex-primary-runtime\dependencies\native\git\cmd\git.exe'
& $git show 31b308cfaa7d19b4e4020773278d545c57f196b0:src/components/sections/TV/Player/Player.tsx
```

## Recommended TV-only rollback plan

1. Rewrite `src/components/sections/TV/Player/Player.tsx` as a TV-specific direct iframe controller. Do not import or render `ReliablePlayer`.
2. Build sources synchronously from the current adapter registry or a small TV-only stable source list. Mount the selected iframe immediately; no `/api/player/sources` dependency and no provider observation before mounting.
3. Make VidKing the first/default TV source. Keep Filmu available as a manual source, but do not default to it merely because its outer HTML loads. Suggested TV order for the first recovery deploy: VidKing -> Filmu -> Cinezo -> VidLink -> VidLink Classic -> remaining experimental sources.
4. Preserve stable `?src=<provider-id>` values. Continue translating legacy numeric links if practical, but do not let compatibility logic delay iframe mounting.
5. Render exactly one iframe with:
   - `allowFullScreen`;
   - the provider's existing `allow` and `referrerPolicy` values;
   - no `sandbox` attribute;
   - `className="absolute inset-0 h-full w-full border-0"` or equivalent;
   - a key based only on provider ID and final URL.
6. Remove these features from TV only:
   - `StuckStreamToast`;
   - automatic source switching;
   - provider preflight/observation;
   - failure scoring and exhausted-source overlays;
   - subtitle warning overlays;
   - Umbra fullscreen/cinema interception;
   - top/bottom decorative gradients owned by `ReliablePlayer`.
7. Let the embedded provider own playback and fullscreen. Keep Umbra source/episode navigation outside the iframe's interactive control region. Prefer a compact reveal button or drawer trigger that is hidden after source selection rather than a full-width transparent layer over the iframe.
8. Reuse the current TV source and episode drawers if they can be driven by the TV-only controller. If adapting `PlayerSourceSelection` pulls the shared engine back in, restore a small TV-specific stable-ID source drawer.
9. Do not modify `ReliablePlayer`, `usePlayerEngine`, Movie player code, or Anime player code as part of this recovery unless compilation requires a type-only adjustment.
10. Update this handoff and `IMPLEMENTATION_PROGRESS.md` with every material result.

## Important current code observations

- `src/components/sections/TV/Player/Header.tsx` currently renders an Umbra fullscreen button and receives fullscreen state from `ReliablePlayer`. The TV-only rollback should remove those props and the custom fullscreen button, allowing the provider's fullscreen control to work directly.
- The header root has `pointer-events-none`; interactive child behavior depends on `PlayerActionButton`. Verify in a real browser that no header/container rectangle intercepts the iframe.
- `src/components/player/ReliablePlayer.tsx` uses a `Card` plus a `Skeleton` under the iframe and multiple absolute layers above it. The TV-only player should avoid this stack during recovery: use a plain black container and one iframe.
- `src/utils/players.ts` currently places Filmu first and VidKing second. If the TV-only controller uses this generator, change only the TV order or construct a TV-specific stable source list. Do not change Movie order accidentally.
- The current adapter order in `src/lib/sources/adapters/embed.ts` should also be checked if it is reused, because the manifest order and legacy generator order have diverged during prior fixes.

## Required constraints

- Do not add ad blocking, DNS routing, popup stripping, iframe sandboxing, or redirect detection.
- Do not automatically switch because a provider is slow, opaque, redirected, challenged, or cannot be inspected cross-origin.
- Do not reintroduce the deleted ads-warning modal.
- Do not scrape protected streams, copy tokens, or use private provider APIs.
- Do not change the admin email gate.
- Do not work on monetization or Android packaging during this fix.
- Do not claim playback works based on iframe `load` alone.

## Verification gates before commit

1. Run `npm run test:player-sources`.
2. Run `npm run typecheck`.
3. Run focused lint on every changed TS/TSX file.
4. Run `npm run build`.
5. Run `npm run check:leak`.
6. Browser-test `/tv/97546/1/1/player` at desktop and phone viewport.
7. Confirm the iframe is visible immediately and that no Umbra overlay covers the provider controls.
8. Confirm Source and Episodes remain reachable without placing a full-screen click layer over the iframe.
9. Confirm provider fullscreen is initiated by the provider's own control.
10. Playback passes only if a video element reaches `readyState >= 2`, has duration above 60 seconds, and playback time advances after Play. For a cross-origin iframe, inspect the provider frame with browser automation or visibly confirm advancing time; top-level iframe `load` is insufficient.
11. Test VidKing first. Test Filmu manually but do not block release on Filmu if VidKing plays and Filmu only shows a shell.
12. After pushing `main`, wait for Vercel, then repeat the exact production TV fixture. Record the deployed commit and evidence here.

## Suggested commit scope

Keep the recovery commit narrow. Expected changed files are approximately:

- `src/components/sections/TV/Player/Player.tsx`
- `src/components/sections/TV/Player/Header.tsx`
- optionally a TV-only source selection component or helper
- optionally TV-only ordering in `src/utils/players.ts` or the adapter registry
- `IMPLEMENTATION_PROGRESS.md`
- `TV_PLAYER_ROLLBACK_HANDOFF.md`

Avoid a repository-wide revert. Commits after the old direct TV implementation also contain desired Anime, UI, mobile, analytics, admin, security, and PWA work.

## Git history landmarks

- `31b308c` - simple always-mounted TV iframe; best architectural reference for rollback.
- `193c5d6` - shared reliable player/PWA upgrade begins the modern engine path.
- `99ccaa4` - large player reliability, analytics, and UI upgrade.
- `4385882` - attempted Filmu-to-VidKing TV fallback.
- `4f6f86e` - removed the opaque timeout race after it exhausted providers and blanked the player.
- `6087633` - documentation-only live TV verification record; current HEAD at handoff.

## Handoff status

**Implemented (2026-08-07).** The TV-only rollback described above is done: `Player.tsx` and `Header.tsx` no longer use `ReliablePlayer`/`usePlayerEngine`, TV priority order in `src/lib/sources/adapters/embed.ts` is now VidKing → Filmu → Cinezo → VidLink → VidLink Classic → Vidrift → Vidbolt → Videasy (Movie order untouched), and all local verification gates (player-source checks, typecheck, build, focused lint, leak check) pass. Full detail, including a full-bleed layout bug found and fixed during local browser verification, is recorded in `IMPLEMENTATION_PROGRESS.md` under "TV player rollback — implemented and locally verified (2026-08-07)".

**Not yet done:** production deploy and re-verification. This was all verified against a local production build (`next start` on port 3211), not the live Vercel deployment. Cross-origin video-element inspection (`readyState`, advancing `currentTime`) inside the VidKing iframe was also not directly re-confirmed this session — the browser tool used cannot reach into a cross-origin frame. Push to `main`, wait for Vercel, repeat the exact fixture (`/tv/97546/1/1/player`), and record the deployed commit + evidence in `IMPLEMENTATION_PROGRESS.md` before treating this as closed.
