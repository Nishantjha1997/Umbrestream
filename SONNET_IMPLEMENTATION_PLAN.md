# Umbra — implementation plan (v2)

**Written by:** an Opus planning pass, for a Sonnet execution session.
**Date:** 2026-08-07
**Repository:** `C:\Users\DELL_\OneDrive\Desktop\Projects\Projects\My Web Sites\umbra`
**Supersedes:** the previous `SONNET_IMPLEMENTATION_PLAN.md` (same filename, overwritten). Two things changed that invalidated it: real design files arrived, and the user reversed two of its scope decisions.

---

## §0 — What changed since the last plan

Three things, and they matter more than the task list:

1. **The design project landed.** It could not be pulled last session (`/design-login` needed an interactive terminal). The user has now downloaded it. It is vendored into this repo at `docs/design/` — see §1. It is authoritative for all visual decisions and it goes considerably further than `UI_OVERHAUL_PLAN.md` ever did: new type system (a serif), new base color, a brand-signature progress component, a different information architecture, and a different player architecture.

2. **The user reversed "don't fork phone and desktop."** The old plan recorded *"user confirmed responsive/shared-component is the right call; do not fork the codebase into two UIs."* That is no longer the instruction. The current instruction is: *"phone web version should be different from desktop web version."* The mockups back this up — they are not one responsive design, they are two designs (21 measured structural differences, `docs/design/DESKTOP_SPEC.md` §J). §4 below defines exactly where the seam goes, because "fork the UI" done carelessly doubles the maintenance surface for the rest of the project's life.

3. **TV APK is out of scope for this pass** (explicit user instruction, given mid-session). `docs/design/mockups/Umbra TV.dc.html` is a complete 10-foot leanback design — it is not being thrown away, it is deferred. Do not build it, do not add Capacitor/Android tooling, do not "prepare" for it. See §11.

`UI_OVERHAUL_PLAN.md` is now **historical**. Its Phases 1–4 and §9 are implemented; its remaining sections are superseded by the design files wherever the two disagree, and the design files disagree a lot (base color, type, card metadata placement, nav count, player architecture). Do not work from it. Read it only when you want to know *why* an existing component is shaped the way it is — its §11 defect numbers are cited throughout the codebase's comments and those citations stay valid.

---

## §1 — Ground truth, and the order to read it in

Everything is in-repo now. Read in this order before writing code:

| # | Path | What it is |
|---|---|---|
| 1 | `docs/design/mockups/UI Analysis.dc.html` | **Read this first.** The designer's audit of the *current* app: 8 numbered findings, each with the fix. This is the "why" behind every phase below. Short. |
| 2 | `docs/design/PHONE_SPEC.md` | 832-line extracted spec for the phone build. Exact values — tokens, all 7 screens, the progress ring, the tab bar, the player, home sections 01–06, mock data shape, and a v1-vs-v2 diff. |
| 3 | `docs/design/DESKTOP_SPEC.md` | 1285-line extracted spec for the desktop build. Same structure, plus **§J — 21 measured phone-vs-desktop deltas**, which is the single most important section in either document for this project. |
| 4 | `docs/design/mockups/Umbra Mobile.dc.html` | The designer's own 6-point summary of what changed and why. One screen. Read it — it states design *intent* the specs can only describe mechanically. |
| 5 | `docs/design/mockups/Umbra App v2.dc.html` | The authoritative phone prototype source. Go here when a spec value looks wrong or is missing. |
| 6 | `docs/design/mockups/Umbra Desktop App.dc.html` | The authoritative desktop prototype source. |
| 7 | `TV_PLAYER_ROLLBACK_HANDOFF.md` | Required before touching TV playback (§3). |
| 8 | `IMPLEMENTATION_PROGRESS.md` | Standing user decisions, provider constraints, verification history. |

The two `*_SPEC.md` files were mechanically extracted from the mockups in this planning session and are accurate as of writing, but they are **derived artifacts**. The `.dc.html` files are the source. Where they conflict, the `.dc.html` wins and you should fix the spec file in the same commit.

**`Umbra App.dc.html` (v1) is superseded by `Umbra App v2.dc.html`.** v1 has no serif, no progress ring, emoji on the vibe tiles, and a fifth tab called "My Space". Do not build from it. `PHONE_SPEC.md` §I lists every diff, including §I.4 — three things v1 did better that are worth recovering.

### Reading the mockups

They are `.dc.html` "design canvas" files using a small custom templating layer: `<x-dc>`, `<helmet>`, `<sc-if>`, `<sc-for>`, `{{ }}`, `<x-import>`, and a trailing `<script type="text/x-dc">` holding `class Component extends DCLogic` with a `renderVals()` method that returns all the mock data. `support.js` is the runtime — you never need to read it. Open them in a browser to see them rendered; read the source for exact values.

**Every poster in the mockups is a synthetic CSS gradient, not an image** (`ART` map, `PHONE_SPEC.md` §A.8). The real app uses TMDB/AniList art. Do not port the gradients as poster art. Do port them where they are genuinely used as art-independent surfaces: the vibe tiles, provider chips, and avatars.

---

## §2 — Ownership boundaries

The previous plan carved TV playback out for a different agent. **That boundary is dissolved — you own everything.** TV playback is now this plan's Phase 0 and it is the highest-priority item in the file. Check `git status --short` before you start regardless; if there is uncommitted work in the tree you did not create, stop and ask.

Current tree state at time of writing:

```
 M IMPLEMENTATION_PROGRESS.md
?? SONNET_IMPLEMENTATION_PLAN.md      ← this file
?? TV_PLAYER_ROLLBACK_HANDOFF.md
?? docs/design/                        ← vendored this session
```

HEAD is `6087633` on `main`. Remote `https://github.com/Nishantjha1997/Umbrestream`, Vercel deploys `main`.

### Closed decisions — do not reopen

These were each decided after a real failure. Reversing one costs a production outage.

- **No iframe `sandbox`.** VidNest returns "Please Disable Sandbox"; Filmu returns "Playback Disabled". Removed globally and permanently.
- **No ad blocking, no popup stripping, no DNS routing, no provider-redirect detection.** Explicitly removed as an idea, not deferred.
- **Never auto-switch provider** because a stream is slow, opaque, redirected, challenged, or cross-origin-uninspectable. Switch only on a real iframe network error or a documented provider playback error.
- **Admin gate is the exact string `nishantjha31@gmail.com`** in `src/lib/admin.ts`. Do not touch.
- **`import "server-only"` stays in `src/api/tmdb.ts`.** It exists to make the build fail when a Client Component reaches for the TMDB token — there were originally ten such leaks. Route client code through `src/api/tmdb-browser.ts`.
- **Adding a client-side TMDB endpoint requires adding it to the allowlist** in `src/app/api/tmdb/[...path]/route.ts`. Without the allowlist that route is an open relay against the token.
- **`LICENSE` stays.** This is a fork of [cinextma](https://github.com/wisnuwirayuda15/cinextma) (MIT, © 2025 Wisnu Wirayuda). Preserving the notice is MIT's single obligation. Rebrand everything else freely.
- **Security-hardened files** — `next.config.ts` headers, `src/lib/rate-limit.ts` and its call sites, auth callback/confirm redirect validation, `safeNextPath()` in the auth forms. Patched for specific documented CVE-classes (open redirect, log injection, unauthenticated amplification). Change only what a task requires; leave the security logic alone.

### A green build is not a green typecheck

`next.config.ts` sets `typescript.ignoreBuildErrors: true` because of an unrelated local `0xC0000005` segfault in the build workers. Consequence: **`next build` will ship type errors and runtime `ReferenceError`s clean.** That has already happened once in this repo. Both gates, every time:

```bash
npm run typecheck && npm run build
```

Then load the route in a browser. Every page here is client-rendered through react-query, so **HTTP 200 proves nothing about whether anything rendered.**

---

## §3 — Phase 0: TV playback recovery (do this first, alone, and ship it)

TV episode playback is broken in production. Nothing else in this plan matters to a user who cannot watch an episode. Read `TV_PLAYER_ROLLBACK_HANDOFF.md` in full first — it has the evidence, the fixture, and the git landmarks.

### The situation

`src/components/sections/TV/Player/Player.tsx` currently renders `ReliablePlayer`, which pulls in `usePlayerEngine`, `/api/player/sources`, provider observation, failure scoring, `StuckStreamToast`, exhausted-source overlays, caption warnings, and a three-path custom fullscreen implementation. On the fixture `/tv/97546/1/1/player` the route selects Filmu, Filmu serves its outer shell with no playable media, and the user sits on a "Stream still loading?" prompt forever. Manually selecting VidKing on the same fixture produces a real video element at `readyState: 4`, `duration: 1855.989`. **VidKing works on this fixture and Filmu does not.**

### What to do

Rewrite `src/components/sections/TV/Player/Player.tsx` as a direct-mount TV controller. Do not import `ReliablePlayer`. Do not import `usePlayerEngine`.

1. Build the source list **synchronously** from the adapter registry. No `/api/player/sources` call, no preflight, no observation before mounting.
2. **VidKing first for TV**, then Filmu, Cinezo, VidLink, VidLink Classic, then the remaining experimental sources. Keep Filmu manually reachable. Do not default to it because its outer HTML loads — that is exactly the trap that produced this outage. Change TV order only; **do not touch Movie order** (Filmu stays first for Movies — standing user decision).
3. Mount **exactly one** iframe, immediately, unconditionally: `allowFullScreen`, the provider's own `allow` and `referrerPolicy`, **no `sandbox`**, `className="absolute inset-0 h-full w-full border-0"`, `key` derived only from provider id + final URL.
4. Plain black container. No `Card`, no `Skeleton` under the iframe, no gradient overlays, no absolute layers above it.
5. Preserve `?src=<provider-id>` stable values. Keep translating legacy numeric links if it is free, but never let compatibility logic delay the mount.
6. Remove from TV: `StuckStreamToast`, automatic switching, failure scoring, exhausted/no-source overlays, subtitle warnings, and Umbra's fullscreen/cinema interception. **The provider owns playback and fullscreen.**
7. `src/components/sections/TV/Player/Header.tsx` renders an Umbra fullscreen button fed by `ReliablePlayer` state — remove the button and those props. Verify in a real browser that no header rectangle intercepts the iframe; the root has `pointer-events-none` but interactive children depend on `PlayerActionButton`.
8. Keep Source and Episodes reachable **without** a full-width transparent layer over the iframe. Prefer a compact reveal trigger. Reuse the existing TV drawers if they can be driven without dragging the shared engine back in; otherwise write a small TV-only stable-ID source drawer.
9. Do not modify `ReliablePlayer`, `usePlayerEngine`, or Movie/Anime player code in this phase, except a type-only adjustment if compilation demands it.

Commit 31b308c has the pre-engine direct-iframe pattern. **Use its architecture, not its code** — it also contains the deleted `AdsWarning`, old health racing, and old numeric source state.

```bash
git show 31b308cfaa7d19b4e4020773278d545c57f196b0:src/components/sections/TV/Player/Player.tsx
```

### Phase 0 acceptance

- [ ] `npm run test:player-sources`, `npm run typecheck`, `npm run build`, `npm run check:leak` all pass
- [ ] Focused lint clean on every changed file
- [ ] `/tv/97546/1/1/player` tested at desktop **and** phone viewport
- [ ] The iframe is visible immediately; no Umbra overlay covers provider controls
- [ ] Source and Episodes reachable with no full-screen click layer over the iframe
- [ ] Fullscreen is initiated by the provider's own control
- [ ] **Playback passes only if** a video element reaches `readyState >= 2`, duration > 60s, and time advances after Play. Inspect the provider frame with browser automation or visibly confirm advancing time. **A top-level iframe `load` event is not evidence.**
- [ ] VidKing tested first. Filmu tested manually but does not block release if it only shows a shell.
- [ ] Pushed to `main`, Vercel deployed, **production fixture re-tested**, deployed commit + evidence recorded in `IMPLEMENTATION_PROGRESS.md`

Keep this commit narrow — roughly `TV/Player/Player.tsx`, `TV/Player/Header.tsx`, optionally a TV-only source helper and TV-only ordering, plus the two handoff docs. **No repo-wide revert:** commits after the old direct TV implementation carry wanted Anime, UI, analytics, admin, security, and PWA work.

---

## §4 — The one architectural decision that decides whether this project goes well

**Do not build the player twice.**

Phase 0 strips Umbra's player layer off TV and hands control to the provider iframe. Independently, the design says this about the player (`UI Analysis` findings 02 and 03):

> *Fullscreen has three fallback paths and no single source of truth… the `fullscreenchange` sync clears cinema mode whenever the real fullscreen element isn't the shell, so the third path silently cancels itself.*
> **Fix — the player is a modal route that owns the viewport at `100dvh` from the moment it opens. No fullscreen button at all: portrait is the compact player, rotating to landscape *is* fullscreen. One state, no fallbacks.**

> *Four systems place things absolutely… globals.css then patches the symptom by `display:none`-ing auxiliary controls in landscape and fullscreen — which hides the server switcher exactly when a stream dies.*
> **Fix — one control layer, a three-row grid (top bar / centre transport / bottom bar) with a dedicated notification slot above the scrubber. Nothing is ever hidden by media query; alerts queue in one slot instead of overlapping.**

These two documents, written independently, are describing **the same fix**: delete the layered fallback machinery, mount one thing, own one state. Phase 0 is not a throwaway hack that Phase 6 replaces — **Phase 0's direct-mount controller is the seed of the design's player**, and `ReliablePlayer` + `usePlayerEngine` are what get retired.

So:

- Write Phase 0's TV controller as if it will be generalized, because it will be. Keep provider resolution in a plain function, keep the component dumb, do not bake `mediaType: "tv"` into anything that isn't genuinely TV-specific.
- Do **not** pre-generalize it in Phase 0. Phase 0 ships in hours, not days, and every extra abstraction is a chance to reintroduce the outage.
- In Phase 6, promote it to the shared player for Movie/TV/Anime, add the design's single three-row control layer, and **delete** `ReliablePlayer.tsx` and `usePlayerEngine.ts` rather than leaving them orphaned.
- Phase 6's regression gate is Phase 0's acceptance checklist, re-run. TV playback working is a ratchet — it must never go backwards after Phase 0.

The corollary: **do not start Phase 6 until Phases 1–5 are done and TV has been stable in production for the intervening time.** The player is the highest-risk surface in the app and the one with a live user-visible failure history.

---

## §5 — Phase 1: design foundation

The existing token layer (`src/styles/globals.css` `@theme` block) is good work and its motion/glass/elevation/radius tokens broadly match what the design wants. **Extend it; do not rewrite it.** What is genuinely missing is color and type.

### 5.1 Type — add the serif

The design runs **two voices, never mixed within one line**:

- **Inter** — every UI label, body line, metadata, button, nav item. Already wired via `@fontsource-variable/inter`, bound to `--font-sans`. Weights used: 400/500/600, plus 700 on provider chips only.
- **Instrument Serif, weight 400 only** — every title, section heading, sheet title, countdown numeral, vibe-tile label. Never italic (the mockup requests `ital@0;1` and never uses the italic).
- **A mono** (`ui-monospace, Menlo, monospace`) — section numbers `01`–`06`, episode numbers `E7`, timecodes, the `1 / 4` counter, airing timestamps, server tags. Numerals-as-data.

Install `@fontsource/instrument-serif` and self-host it. **Do not add a Google Fonts `<link>`** — the existing code deliberately avoids a build-time external font request, which is why `fonts.ts` currently aliases the old `Saira` export to `font-sans`. Add `--font-serif` and `--font-mono` to `@theme`, import the face in `src/app/layout.tsx` next to the Inter import, and update the `fonts.ts` header comment (it currently documents a two-family world that is about to become three).

`PHONE_SPEC.md` §A.1 lists every serif occurrence with its exact size, line-height and tracking — 14 sites on phone. `DESKTOP_SPEC.md` §B has the desktop sizes. Note the display type is where the two builds diverge hardest: home hero H1 is **38px on phone, 78px on desktop** (2.05×), while body copy is 14–14.5px on both. **Do not uniformly scale.** Per `DESKTOP_SPEC.md` §J: *"the desktop identity comes from bigger voids and bigger serifs against the same-size sans."*

### 5.2 Color — the base shifts and the accent collapses to one

Current: `html` is `#0d0c0f`, `body` is `#0f1014`, and HeroUI carries a `primary`/`warning`/`secondary` scheme still used as **media-type taxonomy** (`TV/Player/Player.tsx` passes `color="warning"`; Movie and Anime pass their own).

Target:

| Token | Value | Role |
|---|---|---|
| base | `#0a090d` | Root background; also the ink color on white buttons |
| player | `#000` | Player root only |
| sheet | `rgba(14,13,19,.9)` | Phone bottom sheet |
| panel | `rgba(19,18,23,.96)` | Desktop centred panel — note: **no blur on the card itself** |
| accent | `#c4b5fd` (violet-300) | The single accent: ring fill, section numbers, active states, episode numbers, countdowns, logo crescent |
| accent-deep | `#7c3aed` / `#6d28d9` | Gradient partners only |
| ok / warn / fail | `#4ade80` / `#fbbf24` / `#f87171` | Server states, ratings. Data, not chrome. |

**The accent is reserved for data, never for chrome.** Desktop's active nav item is a tinted pill with full-white 600-weight text and *no* accent color at all (`DESKTOP_SPEC.md` §C). Media-type coloring goes away entirely — that is the same instruction `UI_OVERHAUL_PLAN.md` §1.1.3 gave and it is now enforced by the design. Removing `color="warning"` and friends from the three player call sites is part of this.

Full alpha ladders (every text and border alpha value used, exhaustively) are in `PHONE_SPEC.md` §A.4 and `DESKTOP_SPEC.md` §B.

### 5.3 The eclipse ring — the brand signature

This is the highest-value single component in the design and it does not exist in the codebase. From `Umbra Mobile.dc.html`:

> *Progress is a filling ring, not a bar — on continue-watching art, countdown timers, season trackers. It's the one shape the whole product is built from, echoed in the logo.*

The logomark is the same geometry: two overlapping `r13` circles at `cx14`/`cx26`, violet and 40%-white, with the lens-shaped intersection filled violet. The ring reads as the brand mark repeated.

Build **one** `<EclipseRing>` in `src/components/media/` — SVG, two concentric circles, `stroke-dasharray` = full circumference, `stroke-dashoffset` = `circumference * (1 - pct/100)`, `stroke-linecap="round"`, `transform="rotate(-90 cx cy)"` so 0% starts at 12 o'clock. Not a conic-gradient, not canvas.

Three sizes, verbatim in `PHONE_SPEC.md` §D:

| Size | r | stroke-width | Track | Extra | Where |
|---|---|---|---|---|---|
| 50 | 22 | 2.5 | `rgba(255,255,255,.15)` | centred `%` label, 10.5px/600 | home resume hero |
| 26 | 11 | 2 | `rgba(255,255,255,.22)` | opaque `rgba(0,0,0,.55)` backing disc, no label | still-watching poster corner |
| 64 | 28 | 3 | `rgba(255,255,255,.14)` | two-line `2d` / `04h` label | anime season countdown |

Derived rule: `r = size/2 − strokeWidth/2 − 0.5`. Track and fill share `r` and `stroke-width`; only `stroke` and the dash attributes differ.

**Three linear progress forms coexist and must be kept** — do not ring-ify everything: the 2.5px episode-thumbnail bar, the anime 12-pip tick strip, and the player scrubber (`PHONE_SPEC.md` §D "Where progress is *not* a ring").

### 5.4 Ambient color — promote it to the shell

`src/hooks/useExtractColors.ts` is fully implemented and imported nowhere. The design's use of it is much more ambitious than the old plan's "tint one detail page":

> *Not a bloom behind one card — the whole shell tints to the open title's palette and crossfades between screens.*

Implementation: two absolutely-positioned `inset-0` layers painted *before* content — layer 1 the ambient radial gradient with `transition: background 800ms cubic-bezier(.22,1,.36,1)`, layer 2 a static vignette. The ambient key resolves to the open title on detail/player and to a default elsewhere. Reference gradients (`PHONE_SPEC.md` §A.2):

```css
radial-gradient(ellipse 120% 70% at 30% 0%, rgba(176,68,85,.42), transparent 62%)   /* crimson  */
radial-gradient(ellipse 120% 70% at 30% 0%, rgba(124,90,223,.4),  transparent 62%)   /* violet   */
```

So this is a **context provider**, not a per-page hook — one `<AmbientProvider>` high in the tree, a `useSetAmbient(color)` that detail/player call, `pointer-events: none` on the layers, and the 800ms crossfade as the only transition. Guard `loading`/`error`/`null` from `useExtractColors` and fall back to the default wash, never a broken style. Gate the crossfade on `prefers-reduced-motion` via the existing `useReducedMotionSafe()` in `src/utils/motion.ts`.

Note the mockups hardcode a 5-entry ambient map keyed by title; the real app derives the color from poster art at runtime. **Extract, don't hardcode** — that is the whole point of wiring the hook.

One real difference to respect: on phone the ambient layer sits on the root under a global page gradient; on desktop it lives *inside the scrolling content column* with `pointer-events:none`, so it is scoped to the content area and does not cover the rail (`DESKTOP_SPEC.md` §J).

### Phase 1 acceptance

- [ ] Instrument Serif self-hosted, `--font-serif` + `--font-mono` in `@theme`, no Google Fonts link added
- [ ] Base color `#0a090d`; single violet accent; `color="warning"`-style media-type props gone from all three player call sites
- [ ] `<EclipseRing>` exists, renders all three sizes correctly, and the three linear progress forms are untouched
- [ ] `<AmbientProvider>` tints the shell and crossfades at 800ms; falls back cleanly when extraction fails; respects reduced motion
- [ ] `npm run typecheck` **and** `npm run build` clean
- [ ] Light mode still not broken (the app is dark-first but HeroUI ships both; check the nav bars specifically — the old hardcoded `border-white/10` was wrong in light mode)

---

## §6 — Phase 2: the phone/desktop seam

This is the phase where a wrong decision costs the most later. The user wants two visually distinct experiences. The mockups genuinely are two designs. But "fork the UI" naively means every future feature gets built twice forever.

### Where the seam goes

**Shared, one copy, no forking:**
- Everything under `src/api/`, `src/actions/`, `src/lib/`, `src/hooks/`, `src/utils/`
- `src/types/media.ts` + `src/utils/normalize-media.ts` (the `MediaSummary` normalizer — TMDB relative paths vs AniList absolute URLs, AniList 0–100 vs TMDB 0–10, already correctly handled; do not touch)
- Design tokens, `<EclipseRing>`, `<AmbientProvider>`, `<VaulDrawer>`, form primitives, `useExtractColors`
- All routing and all data fetching

**Forked, two copies, deliberately:**
- The **shell**: `src/components/shell/phone/` and `src/components/shell/desktop/`. These are genuinely different components — a bottom tab bar with permanent labels versus an 84px→242px hover-expanding left rail. Not one component with breakpoint props.
- **Screen composition**: which sections appear, in what order, in what shape. Home is the extreme case — phone has 6 numbered asymmetric sections plus an unnumbered resume hero; desktop has a different hero object entirely.
- **Card geometry**: phone posters are 82/94/100/118/132/146px wide at various aspect ratios; desktop is a uniform 172px. Phone's "Tonight" billboard is `3/4` portrait full-bleed; desktop's is `21/8` landscape inset with `margin:0 48px`.

**The rule:** fork *composition*, share *primitives*. If you find yourself writing the same `<PosterCard>` twice, stop — that is a shared primitive taking a variant prop. If you find yourself writing `{isMobile ? <ThirtyLines/> : <ThirtyDifferentLines/>}` inside one component, stop — that is a composition boundary and it belongs in two files.

### How to select, and the trap

`src/hooks/useBreakpoints.ts` wraps `@mantine/hooks`'s `useMediaQuery`. **It is client-only and returns `undefined` on first paint.** Selecting between two shell trees with it produces a visible flash of the wrong UI on every cold load, or worse a hydration mismatch. Do not build the seam on it.

Do this instead:

1. **Prefer CSS.** Render both trees and let `md:hidden` / `hidden md:block` decide. No JS, no flash, no hydration risk. The cost is shipping both trees' markup — acceptable for shells and nav, wasteful for whole screens with independent data needs.
2. **For whole-screen forks, branch on the server.** Read the `User-Agent` in a Server Component / middleware and pass a `device` prop down, or use a route group. This gets the right tree in the first byte. UA sniffing is imprecise at the tablet boundary — pick a side deliberately and document it. The design has no tablet artwork; **treat tablet as desktop** (`lg` = 1024px is the existing `desktop` breakpoint, and the desktop rail + 7-up grid survive at 1024 better than the phone build stretched to it).
3. **Keep `useBreakpoints` for behavior, not structure** — haptics, long-press, hover-only affordances. Those are allowed to resolve late because they are interactions, not layout.

### Detail: a route on phone, a modal on desktop

The sharpest structural difference (`DESKTOP_SPEC.md` §J):

- **Phone** — a full-screen route. Back chevron at `top:52px; left:16px`. H1 44px. Its own scroll body. Tab bar hidden.
- **Desktop** — a centred modal, `max-width:940px`, `z-index:80`, over a `rgba(4,4,7,.7)` + `blur(8px)` scrim, **on top of a still-mounted, still-scrolled Home**. H1 52px. Close button inside the card. Stated design intent: *"closing it costs nothing."* Related-title clicks swap the title **in place**, with no push/pop.

Do **not** implement this as two components behind a media query — that throws away the URL. Use **Next.js parallel + intercepting routes**: keep `/movie/[id]` as a real, shareable, SEO-visible route that renders the full page on direct navigation, and add an intercepting `(.)` slot in a `@modal` parallel route so an in-app click from the desktop shell renders it as an overlay over the preserved home. That is exactly what the pattern exists for, it gets the URL and the back button right for free, and it is the only way to satisfy both "closing it costs nothing" and "a detail page is a shareable link."

On phone, the intercepting slot simply renders full-bleed instead of centred — same route, different presentation.

### Sheets vs panels

Same content, genuinely different components:

- **Phone** — bottom sheet. `max-height:80%`, `border-radius:22px 22px 0 0`, `rgba(14,13,19,.9)` + `blur(40px) saturate(180%)`, a `34×4` grab handle, scrim `rgba(4,4,7,.6)` + `blur(6px)`, drag-to-dismiss. `<VaulDrawer>` already does this well — it is the best primitive in the repo. It does need its `backdrop-blur-xs` (the weakest tier) moved to `glass-panel`, its hardcoded `z-9998`/`z-9999` regularized, and the typo in its public prop API fixed (`classNames.scollWrapper` → `scrollWrapper`; grep all call sites first, it is a breaking rename).
- **Desktop** — centred card. `border-radius:18px` all round, `rgba(19,18,23,.96)` with **no blur on the card**, scrim `rgba(4,4,7,.68)` + `blur(8px)`, content-driven `max-width` (820 vibe / 460 party / 420 servers), **no grab handle, no drag-to-dismiss** — scrim-click or X only.

### Phase 2 acceptance

- [ ] `src/components/shell/phone/` and `src/components/shell/desktop/` exist; no shell component takes an `isMobile` prop
- [ ] Selection mechanism produces **no flash of the wrong shell** on cold load — verify with a hard reload and a throttled network, on both a phone viewport and desktop
- [ ] `/movie/27205` opens as a full page on direct navigation and as an overlay when clicked from desktop home; back button and browser reload both behave
- [ ] Tablet (768–1023px) resolves deliberately to one side and is documented
- [ ] Zero duplicated primitives — `PosterCard`, `EclipseRing`, drawers, data hooks all single-copy
- [ ] `typecheck` + `build` clean; both shells loaded in a browser

---

## §7 — Phase 3: information architecture (9 nav items → 5)

`UI Analysis` finding 05: *"Seven dock items, two of which go nowhere… macOS-dock magnification has no meaning on a touchscreen where there is no cursor to be near."*

`src/config/site.tsx` currently declares **nine** `navItems`; the mobile dock renders the seven that are not `desktopOnly`. Target is **five**, both platforms:

**Home · Search · Browse · Anime · You**

Movies, TV and Categories become **segments inside Browse**. Sports and Sparks (currently `desktopOnly` + `preview: true`, rendering "Soon" chips) come out of the nav entirely — finding 08 says *"Soon states designed rather than chipped."*

### The routing trap

`/browse` does not exist yet. `/movies`, `/tv`, `/categories`, `/space` do. So:

- Create `/browse` with a `?tab=films|series|categories` segment param. Phone: `repeat(3,1fr)` poster grid. Desktop: `repeat(7,1fr)`.
- **Redirect `/movies` → `/browse?tab=films`, `/tv` → `/browse?tab=series`, `/categories` → `/browse?tab=categories`.** These are existing URLs that may be bookmarked or linked.
- **`/tv/[id]`, `/tv/[id]/[season]/[episode]/player` must keep working.** A careless `redirect` rule on `/tv` will eat the entire TV detail and player tree — including the fixture Phase 0 just fixed. Scope the redirect to the exact path, and add a manual check of `/tv/97546` and `/tv/97546/1/1/player` to this phase's acceptance.
- "You" maps to the existing `/space` ("My Space" — v1 of the mockup called the tab that; **v2 renames it "You"** and v2 is authoritative). Either rename the route to `/you` with a redirect, or keep `/space` and label the tab "You". Keeping the route is cheaper and equally correct; say which you chose in the commit message.

### Nav component specifics

- **Phone tab bar** (`PHONE_SPEC.md` §E): `position:absolute; bottom:0; z-index:40; padding:12px 12px 28px`, gradient background + `blur(24px) saturate(180%)`, `grid-template-columns:repeat(5,1fr)`. Icons 21×21 on a `viewBox="0 0 22 22"`, `stroke:currentColor`, `stroke-width:1.6`. Labels 9.5px, `letter-spacing:.06em`. Active state is **color + weight only** — `#fff`/600 active, `rgba(255,255,255,.4)`/500 inactive. No pill, no dot, no underline. Scroll body reserves `padding-bottom:120px`.
  - **The mockup's `28px` bottom padding is a hardcoded home-indicator inset with no `env(safe-area-inset-bottom)`. Add the env().**
  - The markup carries a comment *"eclipse crescent marks the active tab"* — **that crescent was never implemented.** Either build it (it would be a nice tie to the brand mark) or ship color-only. Your call; note it in the commit.
  - Active state derives from the current screen, so on a detail screen all five tabs read inactive. Harmless while the bar is hidden on detail; if you keep it visible you must fall back to the remembered tab.
- **Desktop rail** (`DESKTOP_SPEC.md` §C): `84px → 242px` on **hover of the rail itself** (no toggle, no pin, no persistence), `220ms cubic-bezier(.22,1,.36,1)`. Expands **in-flow**, so the content column narrows by 158px and the Browse grid reflows mid-transition. That is what the mockup does; if you don't want the reflow, overlay the expansion over a fixed 84px spacer instead — but that changes the feel, so decide deliberately.
  - Nav item: `height:44px; padding:0 12px; border-radius:11px`; active = `background:rgba(255,255,255,.09)` + `#fff` + weight 600. Inactive `rgba(255,255,255,.5)`, weight 500. **No accent color on the active item.**
  - Labels are always in the DOM and hidden only by `overflow:hidden`, so **~21px of the first character shows in the collapsed state.** Animate `opacity:0 → 1` alongside the width or you will ship a sliver of clipped text.
  - Icons deliberately sit 5px left of the rail's optical centre (everything starts at x=26). Reproduce it — it makes the labels feel like they grow rightward off a fixed spine.
  - Logo zone `height:78px`, SVG `34×27`. **There is no wordmark on desktop in either rail state** — the `gap:13px` is where one would go.

### The wordmark problem

Finding 04: `ImmersiveAppShell.tsx` renders `BrandLogo` at `w-[190px]` inside a rail clipped to `w-20` with `overflow-hidden`, so at rest you see the first ~48px of the letterforms; the mobile dock drops the brand entirely. *"The product has no persistent identity anywhere."*

Fix: a monogram lockup legible at 20px collapsed that expands to the full wordmark, **plus the wordmark in the phone home header** (phone has a persistent top bar at `padding:54px 20px 10px` with the 30×24 eclipse mark + "Umbra" at 16.5px/500/`-.02em`; desktop has no top bar at all). `docs/design/mockups/Umbra Logo.dc.html` is the logo exploration — read it before drawing anything.

### Missing headers on desktop

`DESKTOP_SPEC.md` §C flags this as *"the biggest trap"*: the desktop search + party cluster is positioned **inside the Home hero** (`top:26px; right:40px`). On Browse, Search, Anime and You there is **no header at all** — no search, no avatar, no logo above the fold beyond the rail. The mockup does not resolve this. **You must.** Recommendation: promote the glass search pill to a persistent position on all desktop screens and add `⌘K` (the mockup has neither a handler nor a shortcut — the pill is a `<div>` with no `onClick`).

Likewise the desktop account footer is a `<div>` with no handler and no menu; the only route to account is the "You" nav item. Give it a real menu.

### Phase 3 acceptance

- [ ] Exactly 5 nav items on both platforms; Sports/Sparks out of nav
- [ ] `/browse` works with all three segments on both platforms (3-up phone, 7-up desktop)
- [ ] `/movies`, `/tv`, `/categories` redirect correctly
- [ ] **`/tv/97546` and `/tv/97546/1/1/player` still work** — Phase 0's fixture has not regressed
- [ ] Brand identity visible at rest on both platforms
- [ ] Desktop search reachable from every screen; account menu real
- [ ] Safe-area inset honoured on the phone tab bar (test on a notched viewport)
- [ ] No dock magnification anywhere
- [ ] `typecheck` + `build` clean

---

## §8 — Phase 4: the home feed

The largest visual piece. Phone and desktop diverge most here.

### Kill the auto-rotating hero

Finding 01: *"a single 4:3 frame at `max-h-68vh` carries a rotating still, a YouTube iframe that dissolves in at 2.2s, three stacked scrims, wordmark art, a metadata line, two pills, and five dots — all inside `AnimatePresence` on an 8-second timer. On a 390pt screen the title changes under your thumb while you're reading it, the dots are hidden below `sm` so rotation has no visible control, and the trailer's 135% overscan crops the logo art it just faded up."*

Fix: **stop auto-rotating on mobile.** One featured title, manual paging, trailer only after a deliberate tap. **Continue Watching takes the top of the page** — that is what a returning user came for.

`src/components/media/Hero.tsx` currently does the rotation, the 2.2s trailer dissolve, and the pause-on-hover/hidden-tab logic. Keep the reduced-motion gating and the tab-visibility handling (both correct); remove the mobile auto-advance.

### Phone home: 6 numbered asymmetric sections

Container `display:flex; flex-direction:column; gap:46px`, preceded by an **unnumbered resume hero** (146px `2/3` poster plate + text column with the 50px eclipse ring, H1 38px serif, one full-width 42px Resume button).

Every section header is a mono number + uppercase eyebrow. **No two consecutive sections share a shape** — that alternation is the whole point. Full spec in `PHONE_SPEC.md` §G:

| # | Section | Shape | Item geometry | Gutter |
|---|---|---|---|---|
| 01 | Still watching | h-rail with corner rings | 94 × 141 (`2/3`) | 20px |
| 02 | Tonight | **full-bleed** editorial poster | 402 × 536 (`3/4`) | **0** |
| 03 | In the mood for | fixed-height vibe tiles, serif labels | 132 × 176 | 20px |
| 04 | Next episode drops | divider list, right-aligned serif countdown | full width × ~62px | 20px in-row |
| 05 | Trending today | wider h-rail, bare art, "All" link | 118 × 177 (`2/3`) | 20px |
| 06 | Room is open | inset violet-gradient card | full − 40 | 20px on section |

02 is the only bleed. 03's tiles are the only fixed-`height` (not aspect-ratio) box in the app. 05's cards have **no overlay, no ring, no badge** — the markup comment calls it *"art unveiled."*

### Posters lose the permanent scrim

Finding 06: *"`PosterCard.tsx` paints a 60%-tall gradient at 85% resting opacity over the bottom of every card… a rail of twelve cards becomes twelve identical dark-bottomed rectangles — the art can't carry the page when 60% of it is veiled."*

Fix: **clean art in rails, title and metadata below the card.** Keep the scrim only where text must sit on art — billboard, continue-watching, TV rows.

⚠️ **This reverses a previously deliberate decision.** `PosterCard.tsx`'s own header comment records that an earlier attempt moved metadata below the poster and it *"read as a downgrade,"* and the last plan said explicitly *"Do not move it back off the artwork."* The design overrides that. Note the reversal in the commit message and update the component's header comment so the next reader does not revert it back on the strength of the old note.

Note the internal nuance: sections 01 and 05 differ precisely here — 01 keeps a `rgba(0,0,0,.55)` inner scrim (it has to, the ring sits on the art), 05 has none. So this is per-variant, not global.

### Desktop home

Different hero object, not a resized one (`DESKTOP_SPEC.md` §F, §J): `height:560px` full-bleed **landscape** with the art as background rather than as a card, H1 **78px**, a 56px ring, **two side-by-side** 50px pill buttons with intrinsic widths, and a two-layer per-hero scrim including a `90deg` horizontal ramp that only makes sense in landscape. No global page gradient (phone has one; desktop does not).

The orientation flip is systemic: Tonight becomes `21/8` landscape at `margin:0 48px; border-radius:18px` with text vertically centred at `left:40px; max-width:440px`, H3 44px, **and no `1 / 4` counter**. Vibe cards become `220 × 150` landscape.

Shelves normalise to a uniform **172px** card width, `gap:14/16px`, gutter **48px** (2.4× phone's 20px). Hover lift is `translateY(-6px)` / `translateY(-5px)` at `200ms cubic-bezier(.22,1,.36,1)` — **translate, never scale**; `scale()` appears nowhere in the desktop build. A `46×46` glass play circle fades in at `opacity:0 → 1` over 180ms on trending cards; on touch that control does not exist at all.

### Shelf mechanics — already good, keep them

`src/components/media/Shelf.tsx` already has snap (`{align:"start", slidesToScroll:"auto", containScroll:"trimSnaps"}`) and per-card `PosterCardSkeleton`. Keep both. Re-check `src/hooks/useCustomCarousel.ts` while you are here — it registers its embla `select` listener **in the render body** rather than an effect (new handler every render, never cleaned up) and listens only to `select`, not `reInit`/`resize`, so `canScrollPrev/Next` drift out of sync after a resize. Fix it properly now; the desktop rail's in-flow expansion resizes the content column on every hover, which will hit this bug hard.

### The home "Anime" tab

`ContentTypeSelection` renders three tabs but `Home/List.tsx` parses only `["movie","tv"]`, so **selecting Anime on home renders an empty box.** The new IA gives Anime its own top-level tab, so the home content-type tabs should go away entirely rather than be fixed. Verify nothing else depends on them before deleting.

### Phase 4 acceptance

- [ ] Phone home: 6 numbered sections, all six shapes distinct, 02 full-bleed, resume hero above 01
- [ ] Desktop home: 560px landscape hero, 78px H1, uniform 172px shelves, 48px gutter, translate-not-scale hover
- [ ] No auto-rotation on mobile; trailer requires a deliberate tap
- [ ] Rail posters carry no permanent scrim; metadata below the card; `PosterCard` header comment updated
- [ ] `useCustomCarousel` listener moved into an effect and listening to `reInit`/`resize`
- [ ] Home content-type tabs gone; no empty box reachable
- [ ] Reduced motion visibly disables non-essential motion
- [ ] `typecheck` + `build` clean; both homes loaded in a browser

---

## §9 — Phase 5: detail pages

Mostly carried over from the last plan (still accurate), now with design specifics.

- **Remove the `max-w-5xl` wrapper** from `src/app/movie/[id]/page.tsx` and mirror in `tv/[id]` and `anime/[id]`. Keep a max-width **only** on text — `OverviewSection`'s synopsis already has `max-w-[68ch]`, which is right and stays. Cast/Photos/Related become full-width shelves.
- **Drop `keywords` and `reviews`** from every detail `append_to_response` list. Confirmed by reading all four section components: nothing renders either. **Keep `watch/providers`** — it is rendered, and finding 08 wants it surfaced *under the play row*.
- **`generateMetadata` per route**, delete the three `useDocumentTitle` calls. The comment in `Overview.tsx` says it stayed there because `page.tsx` was "owned elsewhere" — that constraint is gone.
- **Ambient tint** — wire the Phase 1 `<AmbientProvider>` here. This is the design's stated signature: *"the whole shell tints to the open title's palette."*
- **Cast** — `CastsSection` uses HeroUI `User`, a form-list widget. Rebuild as a shelf of portrait cards reusing `<Shelf>`'s snap mechanics. Fall back to an initials tile when TMDB has no profile image; never a broken `<img>`.
- Backdrop: phone `aspect-ratio:3/4` portrait + a top scrim `linear-gradient(180deg,rgba(0,0,0,.5),transparent 24%)` for the floating back button; desktop `21/9` landscape with no top scrim (the close button carries its own glass). Desktop adds two-column arrangements phone has no equivalent for: synopsis + "Where to watch" at `1.5fr 1fr`, and **two episodes per row** at `1fr 1fr`.
- `MediaBackdrop` already uses `useScroll`/`useTransform` off the compositor and already has the `!isEmpty(titleImage)` guard. Leave that alone.
- `Related.tsx` has a `sm:translate-y-10` magic number faking alignment against a right-floated tab strip. Tabs inside a shelf is unusual for streaming — use two plain rows and delete the hack.

### Phase 5 acceptance

- [ ] All three detail routes: full-bleed shelves under a readable-width overview column
- [ ] No `keywords`/`reviews` in any append list; `watch/providers` rendered under the play row
- [ ] `<title>` from `generateMetadata`; no `useDocumentTitle` in a presentational child
- [ ] Ambient tint visible and subtle; degrades cleanly on extraction failure
- [ ] Cast is a portrait shelf with an initials fallback
- [ ] Desktop two-column layouts present; phone stacks
- [ ] `typecheck` + `build` clean; all three routes loaded

---

## §10 — Phase 6: the player rebuild

**Do not start this until Phases 1–5 are done and TV has been stable in production since Phase 0.** Re-read §4 first.

Promote Phase 0's direct-mount controller into the shared player for Movie, TV and Anime. Then:

- **One control layer**, three-row grid: top bar / centre transport / bottom bar, with a **dedicated notification slot above the scrubber**. Today the exhausted-servers banner, the no-captions prompt, `StuckStreamToast` and the header controls each pin themselves with their own `absolute` + `z-50` + their own safe-area class; two share `.player-safe-bottom` and stack on each other.
- **Delete the media-query hiding.** `globals.css` currently `display:none`s auxiliary controls in landscape and fullscreen — *"which hides the server switcher exactly when a stream dies."* Nothing may be hidden by media query. Alerts **queue** in the one slot instead of overlapping.
- **No fullscreen button and no fallback chain.** The player owns the viewport at `100dvh` from the moment it opens. Portrait is the compact player; **rotating to landscape *is* fullscreen.** Delete the `webkitEnterFullscreen` → container `requestFullscreen` → `.player-cinema-mode` cascade and the `fullscreenchange` sync that silently cancels the third path. Note the current `h-svh`-inside-a-scrollable-page arrangement is why iOS address-bar collapse resizes the video mid-playback — `100dvh` on a route that owns the viewport fixes that too.
- **Delete `ReliablePlayer.tsx` and `usePlayerEngine.ts`** rather than orphaning them. Check `usePlayerEvents.ts`, `usePlayerChromeVisibility.ts`, `useServerHealth.ts` and `NativePlayer.tsx` for what is still needed — native direct-source HLS/DASH/MP4 playback and trusted subtitle tracks are real features that must survive.
- Sheets: phone bottom sheet for Episodes and Choose-a-source; desktop centred panels at 420px (servers) — and note the desktop mockup has **no episodes panel at all**, its "Episodes" button just closes the player. That is an unfinished mockup, not a design decision. Build a real desktop episodes affordance.

### Phase 6 acceptance

- [ ] **Phase 0's full acceptance checklist re-run and passing** for TV, plus the equivalent for Movie and Anime
- [ ] One control layer; no component pins itself independently; no `display:none` by media query
- [ ] No fullscreen button; landscape rotation gives a full-viewport player; no cinema-mode CSS path
- [ ] iOS address-bar collapse does not resize the video mid-playback
- [ ] `ReliablePlayer.tsx` and `usePlayerEngine.ts` deleted, not orphaned; native direct-source playback and subtitles still work
- [ ] Provider fullscreen still initiated by the provider's own control
- [ ] `npm run verify` passes; production fixture re-tested after deploy

---

## §11 — Phase 7: remaining screens

Lower leverage; do after the above. Specs in `PHONE_SPEC.md` §C.2–C.5 and `DESKTOP_SPEC.md` §E2–E5.

- **Search** — serif H1 "What are you after?" (38px phone / larger desktop), query field, vibe chips, recent list. **The mockup's search field has no handler at all.** Wire it for real, debounce it, and add `⌘K` on desktop.
- **Browse** — segmented Films/Series/Categories + poster grid, 3-up phone / 7-up desktop. **The mockup's segment tabs are inert (`pick:()=>{}`).**
- **Anime** — season tracker card with the 64px countdown ring + 12-pip tick strip, plus a "Top this season" rail. Desktop puts the next-up card and airing list side by side at `1.1fr 1.4fr`; phone stacks them.
- **You** — profile header, 5 settings rows, and a "Not here yet" roadmap block. Phone stacks a 56px avatar above the name; desktop puts a 68px avatar beside it. **Downloads, History and Settings are all self-no-op dead ends in the mockup** — design them or remove the rows. Do not ship rows that go nowhere; that is the exact defect finding 05 called out.
- **Sports / Sparks** — out of nav, and finding 08 wants *"Soon states designed rather than chipped."* Either design a real coming-soon surface or drop the routes.
- **Watch party** — appears throughout the design (home 06, detail action row, a dedicated panel, a nav-adjacent button). **There is no watch-party backend.** Treat every party surface as design-complete but functionally unimplemented. Either build it as a real feature (out of this plan's scope — it needs realtime infrastructure) or render it as a designed "coming soon" state. **Do not ship a button that pretends to open a room.**

### Cheap cleanups, do them alongside whatever phase touches the file

- `VaulDrawer`: `backdrop-blur-xs` → `glass-panel`; regularize `z-9998`/`z-9999`; `classNames.scollWrapper` → `scrollWrapper` (grep call sites first).
- `absolute-center` in `globals.css` uses `!important` on six properties. Replace call sites with plain flex/grid centering where feasible; where it is genuinely load-bearing against a third-party inline style, leave a comment saying so rather than removing it blind.
- `Rating.tsx` hardcodes `text-warning-500 font-semibold`, has no size/color props and no `aria-label`, and every card imports it directly. It will fight the Phase 1 accent collapse — fix it there.
- Hover preview: `delay={1000}` → ~350ms. It is a HeroUI `Tooltip` with a fixed `w-80` and an arrow, so it collides with the viewport edge on the last card in a row — reimplement as a positioned panel. Its loading state is a bare `Spinner` in a black `h-96 w-80` box; show the poster you already have plus a skeleton.
- Mobile haptic fires ~600ms late: `useLongPress` (300ms) opens the drawer, then a `setTimeout(300)` vibrates. Haptics must lead or coincide.
- Finding 07: long-press is an invisible affordance. Keep it, but add an explicit overflow affordance on the card, and make the quick-look sheet the home for watchlist / watch-party / episode actions.
- `useSupabaseUser` fires `addToast` from inside a data-fetching hook (five consumers → a transient auth error pops a danger toast on any page, unattached to any user action); returns `null` for "profile row missing" indistinguishably from "guest"; and calls `createClient()` unmemoized on every render with it in the `useEffect` dep array, resubscribing the auth listener every render. Fix all three.
- `UserProfileButton` returns `null` while loading, so the navbar's right cluster shifts horizontally when user state resolves. Reserve the space.
- Avatar URL is `${AVATAR_PROVIDER_URL}${user.email}` — **the raw un-hashed email in a third-party URL.** Hash it or drop it.
- `GoogleLoginButton.tsx` is a stub with the real call commented out. It is no longer rendered, so nothing is broken — but decide with the user: wire real OAuth (needs a Google Cloud client + Supabase provider config, a human task) or delete the component. Do not leave it indefinitely.
- `npx update-browserslist-db@latest` — one command; the build warns caniuse data is 13 months stale. Commit the lockfile change.

---

## §12 — Traps

Collected because each one costs an hour or a production incident.

1. **The mockups contain inert controls.** `DESKTOP_SPEC.md` §D marks them: Browse segment tabs (`pick:()=>{}`), the search field (no handler), the detail `+` button (no handler), the desktop search pill (a `<div>`), the desktop account footer (a `<div>`), and the servers panel's rows (close the panel without switching source). A pixel-perfect port ships a dead UI. Every one needs real behavior.
2. **`openPanelVibeAsTrailer` opens `servers`, not a trailer.** The film-with-play icon in the desktop detail action row is a source picker in disguise. Decide what that button should actually be.
3. **Desktop `play()` does not clear `detailKey`.** Detail is `z:80`, player is `z:75`, so playing from the detail modal leaves the modal on top of the player. Clear it, or raise the player.
4. **The desktop player covers the rail.** It is `position:absolute; inset:0` on the root, a sibling of the rail. The wrapper page's prose claims it "takes over the content column"; the DOM disagrees. A player that leaves the rail visible is the more interesting desktop claim and matches the stated intent — but pick deliberately.
5. **Phone's `1 / 4` counter on Tonight implies a 4-item carousel that does not exist.** One editorial card, no swipe, no paging. Build the pager or drop the counter.
6. **The redirect trap in §7.** `/tv` → `/browse` must not eat `/tv/[id]` or the player route.
7. **`useMediaQuery` returns `undefined` on first paint.** See §6. Do not build structure on it.
8. **`capacitor.config.json` sits at the repo root with no `@capacitor/*` dependency installed.** It is orphaned from earlier Android exploration. Leave it alone this pass — do not delete it (the user may want it when TV/mobile packaging resumes) and do not act on it.
9. **The mockups hardcode a 5-title ambient map.** Extract from real art at runtime; do not port the map.
10. **Every mockup poster is a CSS gradient.** Do not port them as poster art.
11. **Don't add dependencies casually.** No second toast library, no second carousel, no component kit overlapping HeroUI, no CSS-in-JS runtime. The additions this plan authorizes are exactly one: `@fontsource/instrument-serif`.
12. **HeroUI `variant="shadow"`** emits a colored glow that reads distinctly wrong against this design. Flat/tinted pills for primary actions — the design's play button is `background:#fff; color:#0a090d`.

---

## §13 — Explicitly out of scope

- **TV APK / Android packaging** — user instruction, this pass. `docs/design/mockups/Umbra TV.dc.html` is a complete 10-foot leanback design (focus-driven, D-pad navigable, full-bleed billboard, focus-scale rows, side drawer nav). It is deferred, not cancelled. Do not build it, do not add Capacitor tooling, do not "prepare" for it. When it resumes, that file plus `android-frame.jsx` are the source.
- **Watch party as a working feature** — needs realtime infrastructure. Design-complete, functionally a "coming soon" state for now (§11).
- **Adding streaming sources.** Standing exclusion.
- **Monetization.** Standing exclusion.
- **Google OAuth wiring** unless the user supplies credentials (§11).

---

## §14 — Working agreement

**Verification gates, every phase, no exceptions:**

```bash
npm run typecheck && npm run build
```

Plus `npm run test:player-sources` and `npm run check:leak` for anything touching players or config, and `npm run verify` before any player commit. Then **actually load the changed routes in a browser** — react-query means a 200 proves nothing.

**Commit discipline.** One phase (or one tightly-related group) per commit. Imperative subject lines matching the existing style, referencing the finding or section number closed. Narrow diffs.

**Comment convention.** This codebase has an unusual and valuable property: nearly every non-trivial line carries a comment explaining *why*, citing a section number from a spec or a defect number from `UI_OVERHAUL_PLAN.md` §11. **Match it.** Cite `docs/design/PHONE_SPEC.md §D`, `UI Analysis finding 06`, etc. A future reader should be able to tell why a decision was made without asking anyone. Where this plan reverses an earlier decision (the `PosterCard` scrim in §8 is the clear case), **update the old comment** — do not leave a note behind that argues against the code above it.

**Keep the docs current.** `IMPLEMENTATION_PROGRESS.md` is the handoff point. Update it as you go, with real evidence and honest status. Distinguish `available` / `unverified` / `slow` / `failed` for providers; never claim playback works universally; never claim a fixture passed on an iframe `load` event alone.

**When something is ambiguous and the answer changes what you build, ask.** The mockups leave several genuine decisions open (§12) and the user has already reversed two scope calls this session. A five-minute question beats a day of rework.
