# Umbra — UI/UX Overhaul Spec

**Target aesthetic:** Apple TV+ (material, translucency, restraint) with Netflix's
information density where it earns its place.

**Audience:** implementing engineers and coding agents. Phases are ordered by
dependency — **do not reorder them.** Each phase has acceptance criteria; do not
advance until they pass.

**Status of survey:** this spec is written against a full read of the current
codebase, not assumptions. Line references are accurate as of writing.

---

## How to use this document

1. Read §0 and §1 fully before writing any code. §1 is the foundation every
   later phase depends on.
2. Work one phase at a time. Complete its acceptance criteria. Commit.
3. Before every commit run **both**: `npm run typecheck` and `npm run build`.
   They catch different things — see §0.3.
4. §11 is a list of specific known defects with file:line. Fix them inside
   whichever phase touches that file.
5. When a decision isn't specified here, follow the **Design Principles** in §1.1
   rather than inventing a new pattern.

**Guardrail for agents:** this codebase has ~800 lines of triplicated component
code (§2). If you find yourself making the same edit in a `Movie/`, `TV/`, and
`Anime/` file, **stop** — you're meant to consolidate that file, not edit it
three times. That's Phase 2 and it's the highest-leverage work in this spec.

---

## §0 — Preconditions

### 0.1 Environment variables (blocking, human task)

The deployed site was returning a bare `Internal Server Error` on every route
because Supabase env vars were unset. Middleware now degrades gracefully, so
the site *renders*, but **auth, watchlist, and history are dead until these are
set** in Vercel → Project Settings → Environment Variables:

| Var | Scope |
|---|---|
| `TMDB_ACCESS_TOKEN` | server only — **no** `NEXT_PUBLIC_` prefix |
| `SUPABASE_SERVICE_ROLE_KEY` | server only |
| `NEXT_PUBLIC_SUPABASE_URL` | client-safe |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | client-safe |

Then add the Vercel URL under Supabase → Authentication → URL Configuration, or
email confirmation links point at `localhost`.

### 0.2 Known-broken environment

The dev machine faults with `0xC0000005` across Node, Next build workers,
Turbopack, and even signed installers. Consequences already pinned in config:
`--webpack` on `dev`/`build`, and `typescript.ignoreBuildErrors: true`.

### 0.3 A green build is NOT a green typecheck

Because `ignoreBuildErrors` is on, **`next build` will happily ship type errors
and runtime crashes.** A real example from this codebase: a variable referenced
outside its declaring scope (`ReferenceError` at runtime) built and deployed
clean.

**Therefore, every phase's acceptance criteria require both:**

```bash
npm run typecheck   # in-process tsc — the real type gate
npm run build       # catches RSC boundary violations tsc cannot see
```

Neither is sufficient alone. `tsc` cannot see "Functions cannot be passed to
Client Components"; the build cannot see type errors.

---

## §1 — Design foundation (do this first)

**Current state:** there is effectively no design system. `src/utils/hero.ts` is
19 lines defining two colors. `globals.css` has one custom keyframe and three
utilities. There are **zero** glass tokens, **zero** easing tokens, **zero**
duration tokens. Real translucency exists in exactly 4 places, as the same
hardcoded string pasted 3 times.

Everything downstream depends on fixing this. Restyling components before
tokens exist means restyling them twice.

### 1.1 Design principles (the tie-breaker for unspecified decisions)

1. **Art is the interface.** Chrome recedes; poster and backdrop art carry the
   page. When in doubt, remove UI, don't add it.
2. **Depth comes from material and light, never from saturated color.** A 3px
   primary-blue ring around a poster is the single most dated thing in the
   current UI. Replace with scale + soft elevation + a low-opacity light border.
3. **Color is not taxonomy.** Today `primary`/`warning`/`secondary` encode
   movie/TV/anime across cards, shelf titles, and spinners. Apple TV+ uses one
   accent. Demote media-type color to at most a small text label.
4. **Motion is fluid and interruptible.** Springs over linear easing. Nothing
   hard-pops. Everything respects `prefers-reduced-motion`.
5. **Metadata is secondary.** Posters stay clean; metadata sits below the card
   or reveals on hover — not burned into a permanent gradient overlay.
6. **One weight of glass per elevation tier.** Don't invent a new
   `bg-black/37 backdrop-blur-sm` per component.

### 1.2 Token definitions — add to `src/styles/globals.css`

Add inside the existing `@theme` block. These are the contract; later phases
reference them by name.

```css
@theme {
  /* ---- Motion: duration scale ---- */
  --duration-instant: 100ms;
  --duration-fast: 180ms;    /* hover/press feedback */
  --duration-base: 280ms;    /* most transitions */
  --duration-slow: 450ms;    /* panels, drawers, shelf reveals */
  --duration-cinematic: 800ms; /* hero art, page-level */

  /* ---- Motion: easing ---- */
  /* Decelerate — default for anything entering or responding to input. */
  --ease-out-quint: cubic-bezier(0.22, 1, 0.36, 1);
  /* Accelerate — for exits. */
  --ease-in-quint: cubic-bezier(0.64, 0, 0.78, 0);
  --ease-in-out-quint: cubic-bezier(0.83, 0, 0.17, 1);
  /* Slight overshoot — press releases, card lifts. Use sparingly. */
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  /* ---- Material / glass ---- */
  /* Three tiers only. Do not invent a fourth. */
  --glass-blur-sm: 12px;
  --glass-blur-md: 24px;
  --glass-blur-lg: 40px;
  --glass-saturate: 180%;

  /* ---- Elevation (dark-first: glow, not drop shadow) ---- */
  --elevation-card: 0 1px 2px rgb(0 0 0 / 0.4);
  --elevation-lift: 0 12px 32px -8px rgb(0 0 0 / 0.7);
  --elevation-panel: 0 24px 64px -12px rgb(0 0 0 / 0.85);

  /* ---- Radius ---- */
  --radius-card: 0.75rem;
  --radius-panel: 1rem;
  --radius-hero: 1.25rem;
}
```

### 1.3 Glass utilities — also `globals.css`

Three tiers, defined once. **Every translucent surface in the app must use one
of these** rather than a bespoke `bg-*/NN backdrop-blur-*` pair.

```css
/* Tier 1 — persistent chrome: nav bars, sticky headers. */
@utility glass-chrome {
  @apply border-white/10 bg-white/5 dark:bg-black/40;
  backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
}

/* Tier 2 — floating surfaces: hover previews, dropdowns, chips over art. */
@utility glass-panel {
  @apply border-white/12 bg-white/8 dark:bg-black/55;
  backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
  box-shadow: var(--elevation-panel);
}

/* Tier 3 — controls sitting directly on artwork: play buttons, badges. */
@utility glass-control {
  @apply border-white/20 bg-black/35;
  backdrop-filter: blur(var(--glass-blur-sm)) saturate(var(--glass-saturate));
  -webkit-backdrop-filter: blur(var(--glass-blur-sm)) saturate(var(--glass-saturate));
}
```

> **`backdrop-filter` needs a translucent background to be visible.** Do not
> raise these opacity values past ~0.6 or the blur stops reading as material.
> The current auth card (`bg-background/70` + `border-2`) is the failure mode to
> avoid — it looks like an opaque panel.

> `-webkit-` prefixes are required for Safari, which is the primary browser for
> an Apple-TV-like audience. Don't drop them.

### 1.4 Typography

**Change:** `Poppins` → `Inter Variable` (or `Geist`) for UI.

Poppins is a geometric rounded sans — friendly, and wrong for this. Apple TV+
uses SF Pro, a neutral grotesque. Inter is the closest freely-licensed match and
is already a familiar dependency shape.

- Install: `npm i @fontsource-variable/inter`
- Update `src/utils/fonts.ts`; keep `Saira` **only** for the wordmark.
- **Delete the global heading styles** in `globals.css` (`h1 → text-3xl
  font-black` etc., lines ~43-65). `font-black` on every `h1` is why the UI
  reads heavy. Headings should be styled by component, and `SectionTitle`
  currently renders `<h1>` for every shelf on the page (§11.6).

### 1.5 Accent color

Keep one accent. Remove the three-way media-type coloring (§1.1.3). Where you
need to distinguish sections, use a small text label, not hue.

### Phase 1 acceptance criteria

- [ ] Tokens from §1.2 present in `globals.css`
- [ ] Three glass utilities from §1.3 present, with `-webkit-` prefixes
- [ ] Inter wired; `Saira` used only by `BrandLogo`
- [ ] Global `h1`–`h6` block removed from `globals.css`
- [ ] The three nav bars (`TopNavbar`, `BottomNavbar`, `Sidebar`) use
      `glass-chrome` instead of their hardcoded
      `border-white/10 bg-background/70 backdrop-blur-xl` string
- [ ] `npm run typecheck` clean **and** `npm run build` clean
- [ ] Visually: nav bars still look correct in **both** light and dark mode.
      The old hardcoded `border-white/10` was wrong in light mode; verify the
      new utility isn't.

---

## §2 — Consolidation (highest leverage; do before restyling)

There are three near-identical copies of almost every browse component. Two of
them (`Movie/Cards/Poster.tsx`, `TV/Cards/Poster.tsx`) are **byte-identical at
147 lines** apart from five tokens.

| What | Files | Lines |
|---|---|---|
| Poster card | `{Movie,TV,Anime}/Cards/Poster.tsx` | ~476 |
| Hover preview | `{Movie,TV,Anime}/Cards/Hover.tsx` | ~394 |
| Shelf/row | `{Movie,TV,Anime}/HomeList.tsx` | ~177 |
| Detail backdrop | `{Movie,TV,Anime}/Detail(s)/Backdrop.tsx` | ~122 |
| Related + Casts | across three detail folders | ~200 |

**Do not restyle these in place.** Collapse first, restyle once.

### 2.1 The normalizer (build this first)

Create `src/types/media.ts` and `src/utils/normalize-media.ts`.

```ts
export type MediaKind = "movie" | "tv" | "anime";

/** The single shape every card, shelf, and detail component consumes. */
export interface MediaSummary {
  kind: MediaKind;
  id: number;
  href: string;          // precomputed: /movie/123, /anime/456
  title: string;         // already resolved through the fallback chain
  posterUrl?: string;    // absolute, ready for <Image>
  backdropUrl?: string;
  year?: number;
  rating?: number;       // NORMALIZED 0–10
  isAdult: boolean;
  format?: string;       // anime only: TV / OVA / Movie
}
```

Write `toMediaSummary()` overloads for TMDB `Movie`, TMDB `TV`, and AniList
`AniListMediaSummary`.

> **Critical gotcha.** TMDB returns *relative* image paths (`/abc.jpg`) that
> `getImageUrl()` in `src/utils/movies.ts` prefixes with a base URL. AniList
> returns **absolute URLs** (`https://s4.anilist.co/...`). The normalizer is
> where this gets resolved — `posterUrl` must come out absolute and
> ready-to-render for all three sources. Getting this wrong renders broken
> images for one media type only, which is easy to miss in review.

> AniList `averageScore` is **0–100**; TMDB `vote_average` is **0–10**. Normalize
> to 0–10.

### 2.2 `<PosterCard>`

One component: `src/components/media/PosterCard.tsx`. Replaces all six card
files. Props: `{ media: MediaSummary; variant?: "rail" | "grid"; priority?: boolean; index?: number }`.

Visual spec (this is the restyle — see §11 for what's being fixed):

- 2:3 poster, `--radius-card`, `object-cover`
- **Remove the 3px chromatic border entirely.** Replace hover with:
  `scale(1.04)` + `--elevation-lift` + a `ring-1 ring-white/15`
- Image zoom: reduce `scale-110` → `scale-[1.06]`, duration `--duration-base`,
  easing `--ease-out-quint`. **Remove the simultaneous `opacity-70`** — a 30%
  opacity drop plus a 10% zoom is muddy.
- **Metadata moves below the card**, not burned into a permanent gradient.
  Title + year in small type under the poster. This is the single biggest
  Apple-TV-vs-current difference.
- Play affordance: `glass-control` circle, `opacity-0 → group-hover:opacity-100`
  with a real transition. **Not** the current conditionally-mounted 64px
  `line-md` self-animating icon (it hard-pops and replays its draw every hover).
  Use a static icon at ~40px.
- Badges: `glass-control`, not opaque HeroUI `Chip`.
- Focus-visible must be as strong as hover — currently there is no focus state.

### 2.3 `<Shelf>`

One component: `src/components/media/Shelf.tsx`. Replaces the three `HomeList`
files. Props: `{ title: string; items: MediaSummary[]; isLoading: boolean; seeAllHref?: string; priority?: boolean }`.

- **Enable snap.** Change embla options from `{ dragFree: true, slidesToScroll: "auto" }`
  to `{ align: "start", slidesToScroll: "auto", containScroll: "trimSnaps" }`.
  Free-drag leaving a half-poster dangling is the most visible "not premium"
  tell in the current browse UI.
- **Fix the skeleton.** Current loading state is one grey slab
  `h-[250px] md:h-[300px]` spanning the row. Use `PosterCardSkeleton` × 6 in a
  row (that component already exists and is already used correctly by the
  Discover grids — it's just not used by the shelves). Also match `gap-2`
  between skeleton and loaded states; they currently differ (`gap-5` vs `gap-2`)
  so the header visibly jumps on load.
- Arrows: fade in/out via opacity, don't mount/unmount. Add a gradient scrim
  behind them so they don't sit naked on top of posters.
- Header: plain type. **Remove `SectionTitle`'s left accent bar** (§11.6).

### 2.4 `<MediaBackdrop>`

One component replacing the three detail backdrops, including the triplicated
scroll-opacity math.

- Keep the good ideas: fixed-position backdrop, dual gradient scrims, TMDB
  English **logo art** centered with `drop-shadow-xl`. That logo-art treatment
  is genuinely Apple-TV-like — preserve it.
- **Replace the scroll mechanism.** All four current call sites do
  `useWindowScroll()` from `@mantine/hooks` → `Math.min((y/1000)*N, 1)` → inline
  `style={{ opacity }}`. That's a React re-render per scroll event driving a
  non-composited property. Use `useScroll` + `useTransform` from `motion`, which
  drives it off the compositor.
- Add the `!isEmpty(titleImage)` guard that `TV/Details/Backdrop.tsx` has and
  `Movie/Detail/Backdrop.tsx` lacks (§11.9).
- Add `prefers-reduced-motion` handling.

### 2.5 Also consolidate

- `RelatedList`, `Casts`, `Related` across the three detail folders
- Two genres renderers: `ui/other/Genres.tsx` and `Anime/Detail/Genres.tsx`.
  Keep one, and parameterize the hardcoded `/discover?genres=…&content=` URL so
  it can serve anime.
- Three different slide-wrapper conventions (`embla__slide flex min-h-fit
  max-w-fit items-center px-1 py-2` vs `embla__slide min-w-[160px]
  max-w-[200px] pr-4` vs no `embla__slide` at all). Pick one, put it in
  `<Shelf>`.

### Phase 2 acceptance criteria

- [ ] `MediaSummary` + normalizer exist and handle all three sources
- [ ] Exactly **one** `PosterCard`, **one** `Shelf`, **one** `MediaBackdrop`
- [ ] The six card files and three HomeList files are **deleted**, not left
      orphaned
- [ ] Shelves snap; no partial poster dangling at rest
- [ ] Shelf skeleton is per-card, and the header does not jump on load
- [ ] AniList posters and TMDB posters both render (the §2.1 gotcha)
- [ ] `npm run typecheck` clean **and** `npm run build` clean
- [ ] Manually load `/`, `/anime`, `/discover`, `/movie/27205`, `/tv/1399`,
      `/anime/21` in a browser. These pages are client-rendered via react-query,
      so **HTTP 200 proves nothing about whether they render** — you must
      actually look.

---

## §3 — The hero (biggest structural win)

**Current state:** `src/app/page.tsx` is 17 lines and opens directly onto a
horizontal rail. There is no hero, billboard, or featured area anywhere in the
app. Apple TV+ opens on a full-bleed shelf; Netflix opens on a billboard. This
is the largest single gap.

Build `src/components/media/Hero.tsx`:

- Full-bleed 16:9 (desktop) / 4:3 (mobile) backdrop from the top trending item
  **that actually has `backdropUrl`** — falling back blind renders a black slab.
- Layered scrims: bottom-to-transparent (fades into the page), left-to-right
  (text legibility), and a top veil so the glass nav stays readable.
- TMDB logo art if available, else the title in large type.
- One line of metadata. One dominant **Play** button (flat white/tinted pill —
  **not** HeroUI `variant="shadow"`, which emits a colored glow that reads
  distinctly non-Apple), plus a secondary glass **Details** button.
- Entrance: slow scale-down from `1.06` over `--duration-cinematic` with
  `--ease-out-quint`. Gate on `prefers-reduced-motion`.
- Optional (nice): rotate through the top 5 trending every ~8s with a crossfade.
  Pause on hover and when the tab is hidden.

**Also fix:** `ContentTypeSelection` renders three tabs (Movies / TV / **Anime**)
but `Home/List.tsx` parses `parseAsStringLiteral(["movie", "tv"])`. **Selecting
Anime on the home page renders an empty box** — anime rows only exist at
`/anime`. Either add anime rows to the home page or remove the tab. Don't ship a
tab that does nothing.

### Phase 3 acceptance criteria

- [ ] Home opens on a hero with real art
- [ ] Hero never renders a blank slab when art is missing
- [ ] The Anime tab either works on home or is gone
- [ ] Reduced-motion respected
- [ ] `typecheck` + `build` clean; verified in a browser

---

## §4 — Motion system

Migrate `framer-motion` → the `motion` package (v12 renamed — same library).

**Correction to an earlier draft of this doc:** `motion` is **not** currently
installed. `package.json` lists only `framer-motion@^12.23.12` and
`node_modules/motion` does not exist — it was a dependency of the original
scaffold and was lost in the rebase onto cinextma. So this needs a real
`npm i motion` plus dropping `framer-motion`, not just an import swap.

Import sites to change in one pass: `ui/background/ThreeDMarquee.tsx`,
`sections/Auth/Forms.tsx`, `sections/Search/Filter.tsx`, and
`media/MediaBackdrop.tsx`.

Then establish a real vocabulary — currently there is none:
4 `tailwindcss-motion` presets used decoratively, one custom keyframe, and
`framer-motion` imported in only 4 files.

Define in `src/utils/motion.ts`:

```ts
export const spring = { type: "spring", stiffness: 380, damping: 30 } as const;
export const springSoft = { type: "spring", stiffness: 220, damping: 28 } as const;
export const easeOut = [0.22, 1, 0.36, 1] as const;
```

Apply:
- **Shelf reveal:** stagger cards ~45ms, cap the stagger at 8 items so a 20-card
  row doesn't take two seconds.
- **Card hover:** `spring`, transform-only (`scale`/`translateY`). Never animate
  `width`/`height`/`top`/`left`.
- **Page transitions:** consider React 19 + Next 16 View Transitions
  (`viewTransition` is available in `next.config.ts`). Prototype before
  committing — it's genuinely nice but can fight react-query loading states.
- **Nav active indicator:** `layoutId` shared-element so the pill slides between
  items instead of popping.
- **Reduced motion:** a single `useReducedMotion()` gate, applied once.

### Phase 4 acceptance criteria

- [ ] `src/utils/motion.ts` exists and is the only place easing/spring is defined
- [ ] No component animates a layout-triggering property
- [ ] Shelf stagger present and capped
- [ ] `prefers-reduced-motion: reduce` visibly disables non-essential motion
- [ ] `typecheck` + `build` clean

---

## §5 — Auth flow overhaul

The auth screen is the most visually ambitious surface in the app and the one
with the most unfinished plumbing. It's a single client component (`Forms.tsx`)
rendering four states over an animated 3D poster wall.

### 5.1 Fix the blocking defect first

**`Forms.tsx:69-71` replaces the entire auth UI with a bare spinner while two
TMDB trending queries are pending. You cannot log in until TMDB responds, and
there is no error or timeout branch.** If TMDB fails you get a permanent spinner
or a blank vignette.

The poster wall is **decoration**. Render the form immediately; let the wall fade
in behind it when (and if) it arrives. This is the highest-priority fix in this
phase.

### 5.2 Fix the two-phase captcha

Currently the first click on "Sign In" does not sign you in — it mounts a
Turnstile widget *between the password field and the button*, pushing the button
down, changes the label to "Verifying…", then re-invokes submit programmatically.
Every retry repeats the whole dance.

- Mount Turnstile invisibly on form mount so a token is ready before submit, or
- Reserve its space so appearance doesn't reflow the card, and animate it in.

Either way: **the primary CTA must not lie on first click.**

### 5.3 Errors move inline

Every server error is currently a top-right toast with `maxVisibleToasts={1}`,
and raw Supabase strings reach users (`Invalid login credentials`, `Email not
confirmed`). Worse, `signIn` can surface
`Database error. Could not get username for user@example.com.` — an internal
error containing the user's email, shown as a login failure *after* auth
actually succeeded.

- Map Supabase error codes to human copy. Never pass `error.message` through.
- Field-attributable errors render **under the field**.
- `src/actions/auth.ts:43` joins all validation failures with `". "` into one
  run-on string — return structured per-field errors instead.
- Fix `src/schemas/auth.ts`: `username` says "must not exceed 20 characters" but
  the rule is `.max(25)`. `captchaToken` surfaces "Token too short" — internal
  language that can reach users. `loginPassword` has no message at all.

### 5.4 Real success states

Register and Forgot currently "succeed" by showing a **permanent
non-dismissing toast** over a still-filled, still-interactive form. Register
doesn't redirect or change state at all — it's a dead end.

Build an actual "Check your email" panel: glass panel, the email address shown,
a resend affordance, and a route onward.

### 5.5 Fix the state-transition jank

`AnimatePresence mode="sync"` with animated `height: 0 → auto` means outgoing and
incoming forms are both mounted and both animating height — this is the visible
card-height jump when switching login ↔ register (register is ~2 fields taller).
Use `mode="wait"`, or a fixed-height container with crossfade.

### 5.6 Finish or remove the decoys

- **Google login is a stub** (`GoogleLoginButton.tsx:16-49` — fires "temporarily
  unavailable" and returns; the real call is commented out) yet renders
  prominently below an `OR` divider, not visually disabled. Either configure
  OAuth or remove the button.
- **`PasswordInput`'s strength meter is dead code** — a full 5-requirement
  checklist behind a `withStrengthMeter` prop that nothing passes. Wire it into
  Register or delete it.
- `/profile` is in `PROTECTED_PATHS` but **no `/profile` page exists.** The
  profile dropdown has one item (Logout); Profile and Settings are commented out.
- Unused `Google` icon imports in `Login.tsx:5` and `Register.tsx:2`.

### 5.7 Non-atomic signup (data-integrity bug, not cosmetic)

`signUp` runs with the service-role key and does auth-create-then-profile-insert
with no transaction. On profile failure the auth user already exists, so the
account is orphaned **and the email can no longer be re-registered.** Fix with a
Postgres trigger creating the profile row on `auth.users` insert, or a cleanup
path that deletes the auth user on profile failure.

### 5.8 Accessibility

- No `<h1>` on the auth screen; no `<main>` landmark.
- All state navigation ("Sign Up", "Sign In", "Forgot password?") is HeroUI
  `Link` with `onClick` and **no `href`** — not keyboard-focusable or
  Enter-activatable. `cursor-pointer` is manually added because they aren't real
  links. Make them real buttons or real links.
- The forgot-password back button (`Forms.tsx:90-96`) has **no `aria-label`**.
- Two infinite animations (the marquee, and `animate-shine` on the wordmark)
  have **no reduced-motion guard.**
- `mode: "onChange"` fires "Password must be at least 8 characters" on keystroke
  one. Use `onBlur` or `onTouched`.

### 5.9 Redirects

- Unauthenticated → protected route redirects to `/auth` with **no `?next=`**,
  so users always land on home instead of where they were going. Preserve and
  honor a return URL.
- Logout pushes to `/auth`, dropping the user onto a full-screen poster wall
  rather than the browsable app. Send them to `/`.
- `/library` doesn't use `PROTECTED_PATHS` — it server-renders an inline
  `UnauthorizedNotice` instead. **Two unrelated gating mechanisms with different
  visuals.** Pick one.

### Phase 5 acceptance criteria

- [ ] Auth form renders and is usable with TMDB blocked (test: DevTools →
      block `api.themoviedb.org`, reload `/auth`, sign in successfully)
- [ ] First click on the primary CTA submits
- [ ] No raw Supabase or internal DB string reachable by a user
- [ ] Register shows a real confirmation state, not an infinite toast
- [ ] Login ↔ Register swap has no height jump
- [ ] Google button either works or is gone
- [ ] Full keyboard traversal of every auth state; visible focus throughout
- [ ] `?next=` honored after sign-in
- [ ] `typecheck` + `build` clean

---

## §6 — Watchlist & Library

- **Anime is not wired in.** The DB accepts `type = 'anime'` (migration
  `20260727120000_add_anime_type.sql`, applied), but `src/actions/histories.ts`
  hard-gates on `["movie","tv"].includes(...)` and fetches metadata via the
  server-only `tmdb` client. Add an AniList branch. Add
  `getAnimeLastPosition(id, episode)` — anime has no seasons, so use `episode`
  and leave `season` at `0`.
- `Library/List.tsx` clear-watchlist mutation is typed `"movie" | "tv"` while
  `content` now includes `"anime"`.
- `BookmarkButton` + `ContentType` need widening; add the bookmark button to the
  anime detail page (deliberately omitted pending this).
- **Empty states.** `ContinueWatching` and `Recommended` both `return null` when
  empty, so a first-time signed-out user sees only a tab bar and TMDB rows.
  Design a real empty state.
- Library uses `variant="bordered"` cards — a **completely different visual
  language** from the rail cards, in the same file. After Phase 2, unify.
- `Home/Cards/Resume.tsx` is the best card in the repo (16:9, glass play button,
  real progress bar, timestamp chips) and shares no code with the poster cards.
  Promote its patterns into the consolidated `PosterCard`'s `continue` variant.

### Phase 6 acceptance criteria

- [ ] Anime can be bookmarked, appears in Library, and records watch progress
- [ ] Library and rail cards share one visual language
- [ ] Designed empty states for Continue Watching, Recommended, and Library
- [ ] `typecheck` + `build` clean

---

## §7 — Recommendation engine

`src/actions/recommendations.ts` and `Home/Recommended.tsx` exist already —
extend rather than replace.

Weighting (recency, completion, replay):

```ts
const recency    = Math.pow(0.5, ageDays / 30);       // 30-day half-life
const completion = Math.min(1, percentWatched / 80);  // abandoned != watched
const replay     = 1 + Math.log2(Math.max(1, playCount));
const weight     = recency * completion * replay;
```

Then: build a genre-affinity profile from weighted history → query TMDB
`/discover` weighted by it → blend with `/recommendations` from the top ~5 seeds
→ **dedupe against everything already watched.**

Two practical notes:

1. `histories` stores **no genre data.** Either one TMDB call per history row
   (slow) or a small `titles_cache(title_key, genre_ids, ...)` table. **Use the
   cache** — it turns this into a single query.
2. **Cold start:** zero history must fall back to Trending, not error or render
   an empty row.

`tmdbBrowser.recommendations()` and `.similar()` now exist for both movies and
TV, and the `/api/tmdb` allowlist already permits those endpoints.

### Phase 7 acceptance criteria

- [ ] A user with 10 watched sci-fi titles gets a visibly sci-fi row
- [ ] Zero already-watched titles appear
- [ ] Cold-start user sees Trending, no error, no empty row
- [ ] Row is cached, not recomputed per navigation
- [ ] `typecheck` + `build` clean

---

## §8 — Detail page hierarchy

Current detail pages are `max-w-5xl` centered with a poster-beside-text column —
a **TMDB/IMDb information hierarchy**, not a streaming one. Title, metadata,
genres, actions, and synopsis all sit at similar visual weight.

- Go full-bleed. Lead with key art + logo art, one metadata line, one dominant
  Play. Push everything else into shelves below.
- Whole-page loading is a single centered spinner and the page is blank until
  all appended data lands (`images,videos,credits,keywords,recommendations,similar,reviews,watch/providers`).
  Stream it: render backdrop + title from the base payload, suspend the shelves.
- `watch/providers` is fetched and never rendered — surface it. `reviews` and
  `keywords` are fetched and never used — **drop them from the request.**
- `CastsSection` uses HeroUI `User` (small circular avatar + text) — a form-list
  widget, not a cast shelf. Use portrait cards.
- `Related.tsx` positions its title with `sm:translate-y-10`, a magic-number
  hack to fake alignment against a right-floated tab strip. Also, tabs inside a
  shelf is unusual for streaming — just use two rows.
- `useDocumentTitle` is called inside `OverviewSection`; a presentational child
  shouldn't own the document title. Use route metadata.
- **Free win:** `src/hooks/useExtractColors.ts` is fully implemented and
  **imported nowhere.** Wire it to tint the detail page's glass and scrims with
  the poster's dominant color. That's ambient-color theming for near-zero effort
  and it's very Apple TV+.

---

## §9 — Packages

**Keep:** `embla-carousel-react` (just enable snap), `vaul` (`VaulDrawer` is the
best primitive in the repo), `HeroUI`, `tailwindcss-motion` (fine for simple
presets), `yet-another-react-lightbox`.

**Add:** `@fontsource-variable/inter` (§1.4).

**Migrate:** `framer-motion` → `motion` (same library, current name). Note this
is a real install, not just a rename — see §4.

**Do not add:** a second toast library, a second carousel, a component kit that
overlaps HeroUI, or a CSS-in-JS runtime. The fix for toasts is HeroUI config +
inline errors (§5.3), not another dependency.

**Reconsider:** HeroUI `variant="shadow"` buttons emit a colored glow that reads
distinctly non-Apple. Prefer flat/tinted pills for primary actions.

---

## §10 — Phase order & rough effort

| Phase | Depends on | Effort |
|---|---|---|
| §0 env vars | — | 15 min (human) |
| §1 tokens | §0 | 0.5 day |
| §2 consolidation | §1 | 2–3 days |
| §3 hero | §1, §2 | 1 day |
| §4 motion | §1, §2 | 1 day |
| §5 auth | §1 | 2 days |
| §6 watchlist | §2 | 1.5 days |
| §7 recommendations | §6 | 1.5 days |
| §8 detail pages | §2, §4 | 1.5 days |

§5 is independent of §2/§3/§4 and can run in parallel by a second person.

---

## §11 — Known defects (fix within the phase that touches the file)

1. **`useCustomCarousel.ts`** registers its embla `select` listener **in the
   render body**, not an effect — a new handler every render, never cleaned up.
   It also only listens to `select`, not `reInit`/`resize`, so with `dragFree`
   the `canScrollPrev/Next` booleans drift out of sync. Arrows and ScrollShadow
   are therefore unreliable, especially after resize. → §2.3
2. **Hover preview `delay={1000}`** — a full second before anything appears.
   Netflix ≈300–400ms. Use ~350ms. → §2.2
3. **Hover preview is a `Tooltip`** — a fixed `w-80` panel with an arrow, so it
   collides with the viewport edge on the last card in a row and can't do an
   in-place expand. Reimplement as a positioned panel. → §2.2
4. Hover-card loading state is a bare `Spinner` in a black `h-96 w-80` box.
   Show the poster you already have + a skeleton. → §2.2
5. **Mobile haptic fires ~600ms late** — `useLongPress` (300ms) opens the drawer,
   then a `setTimeout(300)` triggers vibration. Haptics must lead or coincide.
   → §2.2
6. **`SectionTitle` always renders `<h1>`** regardless of its `size` prop, so
   every shelf title on the home page is an `h1` — an accessibility problem.
   It also renders a left accent bar (a dashboard/admin motif) and uses color as
   media-type taxonomy. → §1.4 / §2.3
7. **`Rating.tsx`** hardcodes `text-warning-500 font-semibold`, has no
   size/color props and no `aria-label`, and every card imports it directly. It
   will fight any restyle. → §2.2
8. **Anime tab on home renders nothing** (§3).
9. `Movie/Detail/Backdrop.tsx` lacks the `!isEmpty(titleImage)` guard its TV
   counterpart has → empty `Image` wrapper for movies with no English logo.
   → §2.4
10. Four files drive scroll animation through React state + inline style, with no
    `will-change`, throttling, or reduced-motion guard. → §2.4
11. **`useSupabaseUser` fires `addToast` from inside a data-fetching hook.** Five
    components call it, so a transient auth error can pop a danger toast at an
    arbitrary moment on any page, unattached to any user action. Move error
    presentation to the consumer. → §5
12. Same hook returns `null` for "profile row missing", indistinguishable from
    "guest" — so a user with a broken profile silently appears logged out
    everywhere, while `signIn` shows a DB error for the identical condition.
    → §5
13. `createClient()` is called unmemoized on every render in `useSupabaseUser`
    and is in the `useEffect` dep array, so the auth listener resubscribes every
    render. → §5
14. `UserProfileButton` returns `null` while loading, so the navbar's right
    cluster **shifts horizontally** when user state resolves. Reserve space.
    → §5
15. Avatar URL is `${AVATAR_PROVIDER_URL}${user.email}` — the **raw un-hashed
    email in a third-party URL.** Hash it (most such services accept an MD5/SHA
    hash) or drop it. → §5
16. `api/auth/callback/route.ts` has `console.info({ user })` — logs the full
    user object. Also contains leftover non-English comments. → §5
17. `api/auth/confirm/route.ts` has a stray `console.error({ error })` that fires
    on success too. → §5
18. `VaulDrawer` uses `backdrop-blur-xs` — the *weakest* blur step, barely
    visible. Move to `glass-panel`. Also has hardcoded `z-9998`/`z-9999` and a
    typo in its public API (`classNames.scollWrapper`). → §1.3
19. `package.json` still says `"name": "cinextma"`.
20. `npx update-browserslist-db@latest` — build warns caniuse data is 13 months
    stale.
21. `absolute-center` utility uses `!important` on six properties — it will
    fight any positioning override. Consider replacing usages.

---

## §12 — What NOT to do

- **Don't add streaming sources.** Out of scope for this spec.
- **Don't delete `LICENSE`.** This project is built on
  [cinextma](https://github.com/wisnuwirayuda15/cinextma), MIT,
  © 2025 Wisnu Wirayuda. MIT's single obligation is preserving that notice.
  Deleting it during a rebrand is the one act that turns a legitimate fork into
  infringement. Rebrand everything else freely.
- **Don't remove `import "server-only"` from `src/api/tmdb.ts`.** It exists to
  make the build fail if a Client Component imports the TMDB token. There were
  originally **ten** such leaks. If you hit that error, route through
  `src/api/tmdb-browser.ts` — never delete the guard.
- **Don't add a new TMDB endpoint client-side** without adding it to the
  allowlist in `src/app/api/tmdb/[...path]/route.ts`. Without the allowlist that
  route is an open relay against your token.
- **Don't trust a green build.** See §0.3.
- **Don't edit the same thing in a `Movie/`, `TV/`, and `Anime/` file.** That's
  the signal to consolidate (§2).
