I read both files completely (v2: 815 lines, v1: 1000 lines). Here is the extracted spec.

---

# UMBRA MOBILE — IMPLEMENTATION SPEC
Source of truth: `C:\Users\DELL_\OneDrive\Desktop\Streaming app redesign and analysis\Umbra App v2.dc.html`
Earlier draft (superseded): `C:\Users\DELL_\OneDrive\Desktop\Streaming app redesign and analysis\Umbra App.dc.html`

Both declare a preview viewport of **402 × 874** (`data-props="{"$preview":{"width":402,"height":874}}"`) — iPhone 16 Pro logical size. All numbers below are unscaled CSS px at that width. Neither file uses `<dc-import>`; the templating primitives actually present are `<x-dc>`, `<helmet>`, `<sc-if value hint-placeholder-val>`, `<sc-for list as hint-placeholder-count>`, `{{ }}`, and one `<script type="text/x-dc" data-dc-script>` holding `class Component extends DCLogic` with `renderVals()`.

---

## A. Design tokens

### A.1 Fonts

v2 loads exactly two families via `<helmet>`:

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet">
```

| Token | Value | Used for |
|---|---|---|
| `--font-ui` | `Inter,-apple-system,system-ui,sans-serif` | Root stack; every label, body, metadata, button, nav |
| `--font-display` | `'Instrument Serif',Georgia,serif` — always `font-weight:400` | Screen H1s, editorial titles, section H2s on detail, sheet titles, vibe-tile labels, countdown numerals, party headline |
| `--font-mono` | `ui-monospace,Menlo,monospace` | Section numbers `01`–`06`, episode numbers `E7`, vibe-tile counts, `1 / 4` counter, airing `when` timestamps, player timecodes, server `tag` labels |

Inter weights actually used: **400** (default body), **500**, **600**, **700** (provider chips only). Instrument Serif is used at 400 only, never italic despite `ital@0;1` being requested.

Every place Instrument Serif appears in v2, with size:
- Home hero title — `38px / line-height .94 / letter-spacing -.015em / text-wrap:balance`
- Home 02 featured title — `46px / .9 / -.025em / balance`
- Home 03 vibe tile label — `24px / 1.02 / -.01em`
- Home 04 countdown value — `22px / 1` colour `#c4b5fd`, `font-variant-numeric:tabular-nums`
- Home 06 party headline — `25px / 1.06 / -.01em`
- Search H1 "What are you after?" — `38px / 1 / -.02em`
- Browse H1 "Browse" — `38px / 1 / -.02em`
- Anime H1 "Anime" — `38px / 1 / -.02em`
- Anime "Next up" value "Frieren S2 · Ep 4" — `26px / 1.04`
- You H1 "Nishant" — `34px / 1 / -.02em`
- Detail H1 — `44px / .9 / -.025em / balance`
- Detail sub-headings "Episodes" / "Cast" / "More like this" — `24px / 1`
- Sheet title — `26px / 1`

> v1 contains **no** Instrument Serif and no font link at all — it renders every heading in Inter 600 with aggressive negative tracking (`-.025em` … `-.05em`). The serif system is a v2 invention. **v2 is authoritative.**

### A.2 Surface / background

| Token | Value | Where |
|---|---|---|
| `--bg-base` | `#0a090d` | Root background; also the "ink" colour used as foreground on white buttons |
| `--bg-player` | `#000` | Player root only |
| `--sheet-bg` | `rgba(14,13,19,.9)` | Bottom-sheet panel |
| `--scrim` | `rgba(4,4,7,.6)` | Sheet backdrop button |
| `--overlay-strong` | `rgba(0,0,0,.55)` / `rgba(0,0,0,.6)` | Poster gradients, badge pills |
| `--glass-dark` | `rgba(0,0,0,.34)` / `rgba(0,0,0,.4)` / `rgba(0,0,0,.32)` | Circular icon buttons over art |
| `--glass-light` | `rgba(255,255,255,.06)` / `.07` / `.08` / `.13` | Secondary buttons, search field, chips |

Fixed root gradient stack (two absolutely-positioned layers, `inset:0`, painted before content):

```css
/* layer 1 — ambient, animated */
transition: background 800ms cubic-bezier(.22,1,.36,1);
background: {{ ambient }}
/* layer 2 — vignette, static */
background: linear-gradient(180deg,rgba(10,9,13,.24),rgba(10,9,13,.88) 58%,#0a090d 88%)
```

`AMBIENT` map (keyed by title; falls back to `shogun`):

```js
shogun:    radial-gradient(ellipse 120% 70% at 30% 0%,rgba(176,68,85,.42),transparent 62%)
dune:      radial-gradient(ellipse 120% 70% at 30% 0%,rgba(211,160,82,.38),transparent 62%)
frieren:   radial-gradient(ellipse 120% 70% at 30% 0%,rgba(84,179,154,.34),transparent 62%)
arcane:    radial-gradient(ellipse 120% 70% at 30% 0%,rgba(124,90,223,.4),transparent 62%)
severance: radial-gradient(ellipse 120% 70% at 30% 0%,rgba(59,140,175,.36),transparent 62%)
```

Ambient key resolution: `s.screen === "detail" || s.screen === "player" ? s.titleKey : "shogun"` — i.e. tab screens are always the Shōgun crimson wash; detail/player adopt the title's hue.

### A.3 Accent

| Token | Value | Meaning |
|---|---|---|
| `--accent` | `#c4b5fd` (violet-300) | The single brand accent: ring fill, section numbers, progress bars, active underlines, episode numbers, countdown numerals, logo crescent |
| `--accent-deep` | `#7c3aed` | Gradient partner (avatars, party card) |
| `--accent-deeper` | `#6d28d9` | Gradient partner (You avatar, party host avatar) |
| `--accent-violet-src` | `rgba(124,58,237,.2)` / `.18` / `.22` | Party & anime card gradient tops |
| `--accent-tint` | `rgba(196,181,253,.07)` bg / `rgba(196,181,253,.22)` border | Vibe chips |
| `--accent-border` | `rgba(196,181,253,.18)` / `.2` / `.3` | Party card, party sheet, header avatar |
| `--text-on-accent` | `#ece7ff` (chips), `#f4f1ff` (header avatar), `#140f22` (initials on light gradient) | |
| `--status-ok` | `#4ade80` | Server "Playing", live dots |
| `--status-warn` | `#fbbf24` | Star rating, warn banner border/bg source, 4K-no-captions dot |
| `--status-warn-text` | `#fde68a` | Warn banner text |
| `--status-fail` | `#f87171` | Server "Failed" |
| Warn banner | `border:1px solid rgba(251,191,36,.26)` / `background:rgba(251,191,36,.11)` | |
| Party avatar ring colour | `#17131f` (2px border) | |

### A.4 Text colours (white with alpha, exhaustive)

`#fff` (primary) · `rgba(255,255,255,.9)` (hero "38 minutes left") · `.68` (detail synopsis) · `.66` (header icon strokes) · `.58` (detail meta row) · `.55` (featured meta, player timecodes) · `.5` (hero tag, party count, vibe-sheet copy) · `.48` (all section H2 eyebrows, player nowPlaying) · `.45` (search field icon strokes, anime ring sub-label) · `.44` (anime subtitle, You subtitle, detail "Where to watch" H2) · `.42` (airing `ep`, party member state?, "All" link, inactive segment, vibe count, party sheet `sub`) · `.4` (inactive tab, logo second circle stroke) · `.38` (still-watching tag, cast role, party member state) · `.36` (trending meta, browse meta, You row sub, "Not here yet" copy) · `.34` (search placeholder, `1 / 4` counter, airing `when`) · `.32` (episode duration) · `.3` ("Rotate for fullscreen") · `.28` (chevron strokes) · `.22` (sheet grab handle, mini-ring track) · `.2` (scrubber track, join-button border) · `.18` (episode-thumb progress track) · `.16` (detail secondary button border) · `.15` (hero ring track) · `.14` (anime ring track) · `.13` (dashed "Not here yet" borders, epTick empty) · `.12` (provider chip border, sheet top border) · `.11` (poster hairline) · `.1` (search field border) · `.09` (vibe tile border, anime card border, server row border) · `.08` (browse tab underline rail) · `.07` (all list dividers, glass button fill) · `.06` (search recent dividers, sheet episode dividers) · `.025` (party/anime gradient tail)

### A.5 Border radius scale

`5px` (cert badge) · `6px` (search-recent mini poster, anime format badge) · `8px` (episode thumbnail, party sheet poster) · `10px` (still-watching poster, browse grid poster, cast poster, related poster, provider chip) · `11px` (trending poster) · `12px` (player warn banner) · `13px` (hero poster, server row, trailer frame) · `14px` (search field, vibe tile, "Not here yet" tile) · `15px` (party sheet header card) · `16px` (home 06 party card) · `18px` (hero poster glow, anime tracker card) · `22px 22px 0 0` (bottom sheet) · `99px` (every pill / circle — 35 occurrences)

### A.6 Blur / glass

| Value | Used on |
|---|---|
| `blur(6px)` | Sheet backdrop scrim |
| `blur(12px) saturate(180%)` | Featured secondary button (home 02) |
| `blur(12px)` | Detail top-bar back + "Watch together" buttons |
| `blur(24px) saturate(180%)` | Tab bar; player centre play button |
| `blur(30px)` | Hero poster bloom (`filter:blur(30px)`, `opacity:.9`) |
| `blur(40px) saturate(180%)` | Bottom-sheet panel |

Every `backdrop-filter` is paired with a `-webkit-backdrop-filter` twin.

### A.7 Shadows

```css
/* hero poster */      0 28px 62px -20px rgba(0,0,0,.98), 0 0 0 1px rgba(255,255,255,.11)
/* rail posters */     0 12px 28px -14px rgba(0,0,0,.9)
/* browse grid */      0 10px 24px -14px rgba(0,0,0,.9)
```

### A.8 Gradients

Poster-art factory — every poster in the app is a synthetic gradient, no images:
```js
const A = (a, b) => `linear-gradient(155deg,${a} 0%,${b} 100%)`;
```

```js
ART = {
  shogun:  A("#7f2d3a","#1d1116"),  dune:      A("#8a6a3f","#241a12"),
  severance:A("#2b6f8f","#101a22"), bear:      A("#9a6b2f","#1e1610"),
  arcane:  A("#5b3d9e","#160f27"),  frieren:   A("#3f7f6e","#111d1a"),
  jjk:     A("#4a4f7a","#12141f"),  samurai:   A("#8c3a2a","#1d100c"),
  boys:    A("#8f2f2f","#1d0f0f"),  fallout:   A("#7d6a2b","#1c1810"),
  chainsaw:A("#8a5a2c","#1d1410"),  solo:      A("#2f5c8f","#101823"),
  dandadan:A("#7c3f7a","#1c1020"),  poor:      A("#6f8f4a","#161d10"),
  oppen:   A("#6f6f78","#15151a"),
}
```
Provider chip gradients: `HULU A("#1a7f4b","#0d3b24")`, `MAX A("#3f3fa0","#1b1b45")`, `PRIME A("#1f6f8f","#0f2a35")`, `APPLE A("#4a4a52","#1c1c22")`, `CR A("#c26a1f","#3a1e08")`, `NFLX A("#8f2020","#2c0c0c")`, `HIDIVE A("#1f6f8f","#0f2a35")`.

Avatar gradients: `A("#c4b5fd","#6d28d9")` (you) · `A("#7dd3fc","#2563eb")` (Aarav) · `A("#fda4af","#be123c")` (Meera). Home 06 uses the 145deg form: `linear-gradient(145deg,#c4b5fd,#7c3aed)` etc.

Vibe tile gradients (155deg, translucent so the ambient shows through):
```
Slow-burn revenge  A("rgba(139,92,246,.24)","rgba(20,17,28,.92)")
Cosy, low stakes   A("rgba(45,140,110,.22)","rgba(13,22,20,.92)")
Beautifully bleak  A("rgba(80,110,160,.22)","rgba(12,16,24,.92)")
One perfect heist  A("rgba(190,120,40,.22)","rgba(24,18,12,.92)")
```

Scrim gradients (verbatim):
```css
/* root vignette        */ linear-gradient(180deg,rgba(10,9,13,.24),rgba(10,9,13,.88) 58%,#0a090d 88%)
/* hero poster bottom   */ linear-gradient(0deg,rgba(0,0,0,.42),transparent 58%)
/* rail poster bottom   */ linear-gradient(0deg,rgba(0,0,0,.55),transparent 60%)
/* featured (home 02)   */ linear-gradient(0deg,#0a090d 3%,rgba(10,9,13,.62) 34%,rgba(10,9,13,.02) 78%)
/* detail hero bottom   */ linear-gradient(0deg,#0a090d 2%,rgba(10,9,13,.55) 32%,rgba(10,9,13,.04) 76%)
/* detail hero top      */ linear-gradient(180deg,rgba(0,0,0,.5),transparent 24%)
/* tab bar             */ linear-gradient(180deg,rgba(10,9,13,0),rgba(10,9,13,.82) 34%,rgba(10,9,13,.96))
/* player top bar      */ linear-gradient(180deg,rgba(0,0,0,.85),rgba(0,0,0,0))
/* player bottom bar   */ linear-gradient(0deg,rgba(0,0,0,.9),rgba(0,0,0,0))
/* player video vignette*/ radial-gradient(ellipse at center,rgba(0,0,0,.12),rgba(0,0,0,.74))
/* party card          */ linear-gradient(150deg,rgba(124,58,237,.2),rgba(255,255,255,.025) 64%)
/* anime tracker card  */ linear-gradient(160deg,rgba(124,58,237,.18),rgba(255,255,255,.025) 62%)
/* party sheet header  */ linear-gradient(140deg,rgba(124,58,237,.22),rgba(255,255,255,.03))
/* header avatar       */ linear-gradient(145deg,rgba(196,181,253,.34),rgba(109,40,217,.42))
/* You avatar          */ linear-gradient(145deg,#c4b5fd,#6d28d9)
```

### A.9 Motion

There is exactly **one** transition in the whole of v2:

```css
transition: background 800ms cubic-bezier(.22,1,.36,1);
```
on the ambient layer. No other animation, transform, or keyframe exists in either file. Every other state change (screen swap, sheet open) is an unanimated conditional swap. An engineer should treat the 800ms/`cubic-bezier(.22,1,.36,1)` easing as the house curve and extend it to sheet slide-in and screen cross-fade.

Global scrollbar suppression (v2, in `<helmet>`):
```css
::-webkit-scrollbar{width:0;height:0;display:none}
```
(v1 instead puts `scrollbar-width:none` inline on each rail.)

Font smoothing: `-webkit-font-smoothing:antialiased` on root.

---

## B. Screen inventory

Screen state lives in `state.screen`; `state.tab` remembers the last tab so `back` can return to it. `state.sheet` is orthogonal (any sheet can overlay any screen).

| # | `screen` | Name | Triggered by | Purpose |
|---|---|---|---|---|
| 1 | `home` | Home | Tab 1; app default (`screen:"home"`) | Numbered editorial feed 01–06 plus an unnumbered resume hero |
| 2 | `search` | Search | Tab 2; header magnifier (`goSearch`) | Query field (non-functional placeholder), vibe chips, recent list |
| 3 | `browse` | Browse | Tab 3; `goBrowse` from home 05 "All"; `youRows[0]` Watchlist | Segmented Films/Series/Categories + 3-col poster grid |
| 4 | `anime` | Anime | Tab 4 | Season tracker card + Top this season rail |
| 5 | `you` | You | Tab 5; header avatar (`goYou`) | Profile, 5 settings rows, "Not here yet" roadmap |
| 6 | `detail` | Title detail | Any poster/row tap (`open`), hero poster tap (`heroOpen`) | Full title page; hides tab bar & tab chrome (`isTabScreen` false) |
| 7 | `player` | Player | `play` from detail, hero Resume, episode row, party sheet | Playback surface, black, full-bleed |

Plus **five overlay sheets** (`state.sheet`), z-index 90, over any screen:

| `sheet` | Title | Opened by |
|---|---|---|
| `episodes` | "Episodes" | Detail season button, player "Episodes" |
| `servers` | "Choose a source" | Player source pill, player warn-banner "Switch" |
| `party` | "Watch party" | Home 06 "Join the room", Detail "Watch together", `youRows[1]` |
| `vibe` | *the vibe label* | Home 03 tile, Search chip |
| `trailer` | "Trailer" | Detail trailer button |

Back behaviour: `back: () => this.set({ screen: s.screen === "player" ? "detail" : s.tab, sheet: null })` — player pops to detail, detail pops to the remembered tab.

Note: **there is no route for Downloads, History, or Settings.** `youRows` 3–5 all call `this.set({ screen: "you" })` — dead ends to be designed.

---

## C. Per-screen layout spec

### C.0 Shell (shared by all tab screens)

```
Root: position:relative; width:100%; height:100%; overflow:hidden;
      background:#0a090d; color:#fff; font-family:Inter…
  ├─ ambient layer   (position:absolute; inset:0)
  ├─ vignette layer  (position:absolute; inset:0)
  └─ tab shell       (position:absolute; inset:0; display:flex; flex-direction:column)  [if isTabScreen]
       ├─ header  flex:none
       ├─ scroll body  flex:1; min-height:0; overflow:auto; -webkit-overflow-scrolling:touch; padding-bottom:120px
       └─ tab bar  position:absolute; left/right:0; bottom:0; z-index:40
```

**Header** — `flex:none; padding:54px 20px 10px; display:flex; align-items:center; justify-content:space-between`
- Left cluster, `gap:10px`:
  - Eclipse logomark: `<svg width="30" height="24" viewBox="0 0 40 32">` — circle `cx14 cy16 r13` stroke `#c4b5fd` sw2; circle `cx26 cy16 r13` stroke `rgba(255,255,255,.4)` sw2; filled crescent path `M20 4.6a13 13 0 0 1 0 22.8 13 13 0 0 1 0-22.8Z` fill `#c4b5fd`
  - Wordmark "Umbra" — `16.5px / 500 / -.02em`
- Right cluster, `gap:12px`:
  - Search button: 34×34 tap target, transparent, 19×19 SVG (circle r6.4 sw1.5 + handle), stroke `rgba(255,255,255,.66)` → `goSearch`
  - Avatar button: 30×30, `border-radius:99px`, `border:1px solid rgba(196,181,253,.3)`, `background:linear-gradient(145deg,rgba(196,181,253,.34),rgba(109,40,217,.42))`, glyph "N" `11.5px / 600 / #f4f1ff` → `goYou`

Horizontal gutter for all tab-screen content: **20px** (except home 02 which is full-bleed and the rails which pad `0 20px 4px`).

---

### C.1 Home

Outer stack: `display:flex; flex-direction:column; gap:46px`. Sections have no top padding of their own; the first block adds `padding:12px 20px 0`.

**Resume hero (unnumbered)** — `padding:12px 20px 0; display:flex; gap:18px; align-items:flex-end`
- Left: poster button, `width:146px`, `flex:none`, `position:relative`
  - Bloom: `position:absolute; left:8px; right:8px; top:22px; bottom:-14px; filter:blur(30px); opacity:.9; border-radius:18px; background:{{hero.art}}`
  - Plate: `146px` wide, `aspect-ratio:2/3` (→ 219px tall), `border-radius:13px`, `overflow:hidden`, art background, shadow `0 28px 62px -20px rgba(0,0,0,.98),0 0 0 1px rgba(255,255,255,.11)`, plus inner bottom scrim `linear-gradient(0deg,rgba(0,0,0,.42),transparent 58%)`
  - Tap → `heroOpen` (detail, shogun)
- Right column: `flex:1; min-width:0; gap:13px; padding-bottom:2px`
  1. Ring row, `gap:11px`: **50×50 eclipse ring** (see §D) + text stack `gap:1px` → `hero.tag` (`11px / rgba(255,255,255,.5)`), `hero.left` (`12.5px / 500 / rgba(255,255,255,.9)`)
  2. `h1` serif 38px (see A.1)
  3. Resume button: `height:42px; border-radius:99px; background:#fff; color:#0a090d; gap:8px; font-size:13.5px; font-weight:600`, leading 11×12 play triangle (`viewBox 0 0 12 14`, path `M1 1.4v11.2L11 7 1 1.4Z`) → `play`

**Section header pattern** (identical for 01–06): `padding:0 20px; display:flex; align-items:baseline; gap:11px`
- Number: mono `10px / 600 / letter-spacing .14em / #c4b5fd`
- Label: `h2`, `10.5px / 600 / letter-spacing .24em / text-transform:uppercase / rgba(255,255,255,.48)`
- Section wrapper: `display:flex; flex-direction:column; gap:15px`

The six sections are enumerated in **§G**.

---

### C.2 Search

Stack `gap:34px; padding-top:6px`.
1. Head block `padding:0 20px; gap:16px`
   - H1 serif 38px "What are you after?"
   - Fake field: `height:46px; padding:0 15px; border-radius:14px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1); gap:10px` — 16×16 magnifier (stroke `rgba(255,255,255,.45)` sw1.6) + placeholder span `14px / rgba(255,255,255,.34)` "A title, a person, or a feeling…". **Not an `<input>`** — build as a real input, keep these metrics.
2. "Or start from a vibe" — H2 eyebrow (`padding:0 20px`), then `padding:0 20px; display:flex; flex-wrap:wrap; gap:8px` of 8 chips: `padding:10px 15px; border-radius:99px; border:1px solid rgba(196,181,253,.22); background:rgba(196,181,253,.07); color:#ece7ff; font-size:12.5px` → opens the vibe sheet with that label.
3. "Recent" (`gap:12px`) — flat list, each row `display:grid; grid-template-columns:36px 1fr auto; gap:13px; align-items:center; padding:10px 20px; border-top:1px solid rgba(255,255,255,.06)`
   - col1: 36px wide `aspect-ratio:2/3`, `border-radius:6px`, art
   - col2: title `13.5px / 500`, ellipsised; meta `11px / rgba(255,255,255,.4)`
   - col3: 14×14 chevron, stroke `rgba(255,255,255,.28)` sw1.6

---

### C.3 Browse

Stack `gap:22px; padding-top:6px`.
1. H1 serif 38px "Browse", `padding:0 20px`
2. **Underline segmented control**: `padding:0 20px; display:flex; gap:20px; border-bottom:1px solid rgba(255,255,255,.08)`. Each: `padding:0 0 11px; font-size:13px; font-weight:{{s.weight}}; color:{{s.color}}; border-bottom:2px solid {{s.line}}; margin-bottom:-1px`.
   Active: weight `600`, colour `#fff`, line `#c4b5fd`. Inactive: `500`, `rgba(255,255,255,.42)`, `transparent`.
   Items: `Films` (id `movies`, default), `Series` (`tv`), `Categories` (`cats`).
3. Grid: `padding:0 20px; display:grid; grid-template-columns:repeat(3,1fr); gap:14px 10px` — 12 items. Each cell `gap:7px`: poster `width:100%; aspect-ratio:2/3; border-radius:10px; box-shadow:0 10px 24px -14px rgba(0,0,0,.9)`; title `11.5px / 500 / line-height 1.28`, 2-line clamp; meta `10px / rgba(255,255,255,.36)`.

At 402px width with 20px gutters and 2×10px gaps, each cell is **(402−40−20)/3 ≈ 114px** wide, 171px tall.

The segment buttons only mutate `state.segment` — the grid content is static regardless. Wire real filtering.

---

### C.4 Anime

Stack `gap:34px; padding-top:6px`.
1. Head `padding:0 20px; gap:8px`: H1 serif 38px "Anime"; sub `12.5px / rgba(255,255,255,.44)` "Summer 2026 · six shows followed"
2. **Season tracker card** — `section padding:0 20px`, card: `border-radius:18px; border:1px solid rgba(255,255,255,.09); background:linear-gradient(160deg,rgba(124,58,237,.18),rgba(255,255,255,.025) 62%); padding:18px; display:flex; flex-direction:column; gap:16px`
   - Row A: `display:flex; align-items:center; justify-content:space-between; gap:14px`
     - Left `gap:3px`: eyebrow "Next up" `10.5px / .2em / uppercase / rgba(255,255,255,.44)`; value serif `26px / 1.04` "Frieren S2 · Ep 4"
     - Right: **64×64 eclipse ring** (see §D) with two-line centre label — `2d` (`13px / 600 / -.03em`) over `04h` (`9px / rgba(255,255,255,.45)`)
   - Row B: **episode tick strip** — `display:flex; gap:4px`, 12 spans each `flex:1; height:4px; border-radius:99px`, background `#c4b5fd` for i<3 else `rgba(255,255,255,.13)`
   - Row C: `11.5px / rgba(255,255,255,.42)` "3 of 12 watched"
3. "Top this season" — eyebrow H2, then rail `display:flex; gap:12px; overflow-x:auto; padding:0 20px 4px`. Cards `width:118px; gap:9px`: poster `aspect-ratio:2/3; border-radius:11px; overflow:hidden`, with format badge `position:absolute; top:7px; left:7px; padding:3px 6px; border-radius:6px; background:rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.16); font-size:8.5px; font-weight:600`; title `12px / 500 / 1.28` 2-line clamp; meta `10px / rgba(255,255,255,.36)`.

Note the "2d / 04h" and "3 of 12" are **hardcoded in the markup**, not data-bound. Ring dashoffset is also hardcoded (`132`).

---

### C.5 You

Stack `gap:32px; padding-top:6px`.
1. Head `padding:0 20px; gap:14px`: avatar 56×56 `border-radius:99px; background:linear-gradient(145deg,#c4b5fd,#6d28d9)` with "N" `20px / 600 / #140f22`; H1 serif 34px "Nishant"; stat line `12.5px / rgba(255,255,255,.44)` "142 watched · 38 saved · 3 in progress"
2. Rows list, 5 items, each `display:grid; grid-template-columns:1fr auto auto; gap:12px; align-items:center; padding:15px 20px; border-top:1px solid rgba(255,255,255,.07)`
   - label `14.5px / 500 / -.01em`; sub `12px / rgba(255,255,255,.36)`; 14px chevron
   - Watchlist·38 → browse · Watch party·"1 live" → party sheet · Downloads·"4 episodes" → noop · History·"142" → noop · Settings·"" → noop
3. "Not here yet" — `section padding:0 20px; gap:12px`; eyebrow H2; then `display:flex; gap:9px` of two `flex:1` tiles: `padding:15px; border-radius:14px; border:1px dashed rgba(255,255,255,.13); gap:5px` — title `13px / 500`, sub `10.5px / rgba(255,255,255,.36)`. Content: "Live sports / Match cards, reminders" and "Sparks / Scene reels".

---

### C.6 Detail

`position:absolute; inset:0; z-index:60; display:flex; flex-direction:column`. Tab bar is not rendered (`isTabScreen` is false). Scroller: `flex:1; min-height:0; overflow:auto; padding-bottom:28px`.

**Hero block** — `position:relative; width:100%; aspect-ratio:3/4` (at 402px → 536px tall). Four stacked layers:
1. art `{{title.art}}`
2. `linear-gradient(0deg,#0a090d 2%,rgba(10,9,13,.55) 32%,rgba(10,9,13,.04) 76%)`
3. `linear-gradient(180deg,rgba(0,0,0,.5),transparent 24%)`
4. Top bar: `position:absolute; top:52px; left:16px; right:16px; justify-content:space-between`
   - Back: 36×36 circle, `border:1px solid rgba(255,255,255,.2)`, `background:rgba(0,0,0,.4)`, `backdrop-filter:blur(12px)`, 16px chevron-left sw1.8
   - "Watch together": `height:36px; padding:0 14px; border-radius:99px`, same glass, `11.5px / 500` → `openParty`
5. Title block: `position:absolute; left:20px; right:20px; bottom:20px; gap:11px`
   - H1 serif 44px
   - Meta row `flex-wrap:wrap; gap:8px; font-size:11.5px; color:rgba(255,255,255,.58)`: year · `·` (`opacity:.4`) · runtime · cert badge (`padding:2px 6px; border-radius:5px; border:1px solid rgba(255,255,255,.22); font-size:9.5px; font-weight:600`) · `★ {{rating}}` in `#fbbf24 / 600`

**Body** — `padding:18px 20px 0; display:flex; flex-direction:column; gap:24px`
1. Action row `display:flex; gap:9px`:
   - Primary `flex:1; height:46px; border-radius:99px; background:#fff; color:#0a090d; gap:8px; font-size:14.5px; font-weight:600` with 12×13 play glyph, label `{{title.playLabel}}` → `play`
   - Two 46×46 circles: `border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.07)` — add (15px plus, sw1.7) and trailer (17px rect `x2.4 y4.6 w15.2 h10.8 rx2.2` sw1.5 + triangle) → `openTrailer`
2. Synopsis `p` — `14px / line-height 1.68 / rgba(255,255,255,.68) / text-wrap:pretty`
3. "Where to watch" `gap:10px`: eyebrow H2 (`.44` alpha here, not `.48`), then `display:flex; gap:8px` of 38×38 provider chips `border-radius:10px; border:1px solid rgba(255,255,255,.12)`, label `10.5px / 700`
4. Episodes block, only if `title.isSeries`, `gap:12px`:
   - Header row `justify-content:space-between`: serif 24px "Episodes"; season button `height:32px; padding:0 13px; border-radius:99px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.06); font-size:12px` showing `{{title.seasonLabel}}` → `openEpisodes`
   - **Episode row** (reused verbatim in the episodes sheet): `display:grid; grid-template-columns:100px 1fr; gap:13px; padding:12px 0; border-top:1px solid rgba(255,255,255,.07)`
     - Thumb: `width:100px; aspect-ratio:16/9; border-radius:8px; overflow:hidden`, art; progress bar pinned bottom `height:2.5px; background:rgba(255,255,255,.18)` with inner `height:100%; background:#c4b5fd; width:{{e.pct}}`
     - Text `gap:3px`: baseline row `gap:7px` = mono `10px #c4b5fd` `{{e.num}}` + title `13px / 500` ellipsised; blurb `11px / 1.5 / rgba(255,255,255,.44)` 2-line clamp; duration `10.5px / rgba(255,255,255,.32)`
     - Whole row → `play`
5. Cast, `gap:12px`: serif 24px "Cast"; rail `display:flex; gap:11px; overflow-x:auto; margin:0 -20px; padding:0 20px 4px` (negative margin so the rail bleeds to the edges while keeping the 20px start inset). Items `width:82px; gap:7px`: poster `aspect-ratio:2/3; border-radius:10px`; name `11.5px / 500 / 1.3`; role `10px / rgba(255,255,255,.38) / 1.3`
6. More like this, `gap:12px; padding-bottom:8px`: serif 24px; same bleeding rail, items `width:100px`, poster `radius:10px`, title `11.5px / 500 / 1.3` 2-line clamp

---

### C.7 Player — see §F.

---

### C.8 Bottom sheet (chrome shared by all five)

```
outer: position:absolute; inset:0; z-index:90; display:flex; flex-direction:column; justify-content:flex-end
scrim: absolute inset:0; background:rgba(4,4,7,.6); backdrop-filter:blur(6px)   → closeSheet
panel: position:relative; max-height:80%; display:flex; flex-direction:column;
       border-radius:22px 22px 0 0; border-top:1px solid rgba(255,255,255,.12);
       background:rgba(14,13,19,.9); backdrop-filter:blur(40px) saturate(180%)
  ├─ handle row  flex:none; justify-content:center; padding:9px 0 2px
  │    span 34×4, border-radius:99px, background:rgba(255,255,255,.22)
  ├─ title row   flex:none; padding:8px 20px 14px
  │    h2 serif 26px / line-height 1  → {{ sheetTitle }}
  └─ content     flex:1; min-height:0; overflow:auto; padding:0 20px 34px
```
No explicit close button in v2 — dismissal is scrim tap or (to be added) drag.

**Sheet: Episodes** (`gap:14px`) — season tab rail `display:flex; gap:16px; border-bottom:1px solid rgba(255,255,255,.08)`, buttons `padding:0 0 10px; font-size:12.5px; font-weight:{{s.weight}}; color:{{s.color}}; border-bottom:2px solid {{s.line}}; margin-bottom:-1px`, labels `S1 S2 S3 S4`, active `600 / #fff / #c4b5fd`. Then the episode-row list, dividers `rgba(255,255,255,.06)` (vs `.07` on detail).

**Sheet: Choose a source** (`gap:9px`) — 4 rows, `display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center; padding:13px; border-radius:13px; border:1px solid {{s.border}}; background:{{s.bg}}` → `closeSheet`
- 7×7 status dot `border-radius:99px; background:{{s.dot}}`
- label `13.5px / 500`, sub `11px / rgba(255,255,255,.42)`
- tag mono `9.5px / letter-spacing .1em / uppercase / color:{{s.tagColor}}`
Data in §H.

**Sheet: Watch party** (`gap:16px`)
- Header card `display:flex; align-items:center; gap:12px; padding:14px; border-radius:15px; border:1px solid rgba(196,181,253,.2); background:linear-gradient(140deg,rgba(124,58,237,.22),rgba(255,255,255,.03))` — 44px-wide `aspect-ratio:2/3` poster `radius:8px`; name `14px / 500`; "Synced · host controls playback" `11.5px / rgba(255,255,255,.5)`
- Member rows `display:grid; grid-template-columns:auto 1fr auto; gap:11px; padding:10px 0; border-top:1px solid rgba(255,255,255,.06)` — 30×30 avatar circle w/ initial `11px / 600 / #140f22`; name `13px / 500`; state `10.5px / rgba(255,255,255,.38)`; reaction emoji `15px`
- CTA `height:44px; border-radius:99px; background:#fff; color:#0a090d; 13.5px / 600` "Start together" → `play`

**Sheet: Vibe** (`gap:14px`) — copy `12.5px / 1.6 / rgba(255,255,255,.5)` "Weighted by how much of each title you actually finished — not just what you opened."; then `display:grid; grid-template-columns:repeat(3,1fr); gap:12px 10px`, cells `gap:6px`, poster `aspect-ratio:2/3; radius:10px`, title `11.5px / 500 / 1.28` clamp 2. Reuses the `grid` dataset — it is **not** filtered by vibe.

**Sheet: Trailer** (`gap:12px`) — frame `width:100%; aspect-ratio:16/9; border-radius:13px; overflow:hidden`, art + `rgba(0,0,0,.4)` wash + centred 52×52 circle `background:rgba(255,255,255,.15); border:1px solid rgba(255,255,255,.26)` with 16×18 white triangle; caption `12.5px / 1.6 / rgba(255,255,255,.48)` "Plays only on a deliberate tap — never auto-started under your thumb."

---

## D. The eclipse progress ring

**Mechanism: SVG two-circle `stroke-dasharray` / `stroke-dashoffset`.** Not conic-gradient, not a canvas. Always: a full-circumference track circle, then an identical circle carrying the accent stroke, `stroke-linecap="round"`, rotated `-90deg` about its own centre so 0% starts at 12 o'clock and fills clockwise.

Offset is computed in JS:
```js
const RING = (circumference, pct) => circumference * (1 - pct / 100);
```
`stroke-dasharray` is set to the full circumference (so there is exactly one dash) and `stroke-dashoffset` retracts it. Circumference values in the file are pre-rounded to 1 dp: `2π·22 = 138.2`, `2π·11 = 69.1`, `2π·28 = 175.9`.

### Three sizes, verbatim

**(1) Hero ring — 50px, home resume.** Track `rgba(255,255,255,.15)`, fill `#c4b5fd`, `stroke-width:2.5`.
```html
<svg width="50" height="50" viewBox="0 0 50 50" style="display:block">
  <circle cx="25" cy="25" r="22" fill="none" stroke="rgba(255,255,255,.15)" stroke-width="2.5"></circle>
  <circle cx="25" cy="25" r="22" fill="none" stroke="#c4b5fd" stroke-width="2.5" stroke-linecap="round"
          stroke-dasharray="138.2" stroke-dashoffset="{{ hero.dash }}" transform="rotate(-90 25 25)"></circle>
</svg>
```
Wrapper `position:relative; flex:none; width:50px; height:50px`. Centred label: `position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:10.5px; font-weight:600; letter-spacing:-.03em` → `hero.pctLabel` ("31%").
`hero.dash = RING(138.2, 31) = 95.358`.

**(2) Mini ring — 26px, still-watching poster corner (home 01).** Positioned `position:absolute; right:6px; bottom:6px; width:26px; height:26px` inside the 94px poster. Adds an opaque backing disc so it reads over art. `stroke-width:2`, track `rgba(255,255,255,.22)`.
```html
<svg width="26" height="26" viewBox="0 0 26 26" style="display:block">
  <circle cx="13" cy="13" r="11" fill="rgba(0,0,0,.55)"></circle>
  <circle cx="13" cy="13" r="11" fill="none" stroke="rgba(255,255,255,.22)" stroke-width="2"></circle>
  <circle cx="13" cy="13" r="11" fill="none" stroke="#c4b5fd" stroke-width="2" stroke-linecap="round"
          stroke-dasharray="69.1" stroke-dashoffset="{{ item.dash }}" transform="rotate(-90 13 13)"></circle>
</svg>
```
Offsets in the mock: Dune 56% → `30.404`; Frieren 78% → `15.202`; The Bear 42% → `40.078`; Severance 12% → `60.808`. No numeric label at this size.

**(3) Countdown ring — 64px, anime season tracker.** `stroke-width:3`, track `rgba(255,255,255,.14)`, dashoffset **hardcoded 132** (≈25% elapsed).
```html
<svg width="64" height="64" viewBox="0 0 64 64" style="display:block">
  <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,.14)" stroke-width="3"></circle>
  <circle cx="32" cy="32" r="28" fill="none" stroke="#c4b5fd" stroke-width="3" stroke-linecap="round"
          stroke-dasharray="175.9" stroke-dashoffset="132" transform="rotate(-90 32 32)"></circle>
</svg>
```
Two-line centre label: `2d` (`13px / 600 / -.03em`) above `04h` (`9px / rgba(255,255,255,.45)`), stacked with `flex-direction:column; gap:0`.

### Derived rule for implementation
`r = size/2 − strokeWidth/2 − 0.5` in practice: 50→r22 sw2.5; 26→r11 sw2; 64→r28 sw3. Track and fill share `r` and `stroke-width`; only `stroke` and the dash attrs differ.

### Where progress is *not* a ring
The ring is the signature but three linear forms coexist and must be kept:
- **Episode thumbnail bar** — 2.5px tall, `rgba(255,255,255,.18)` track, `#c4b5fd` fill, `width:{{e.pct}}` as a percentage string. Appears in detail Episodes and the Episodes sheet.
- **Anime tick strip** — 12 discrete `flex:1; height:4px; border-radius:99px` pips; watched `#c4b5fd`, unwatched `rgba(255,255,255,.13)`.
- **Player scrubber** — see §F.

The **logomark itself is the same eclipse geometry** (two r13 circles at cx14/cx26 plus a filled crescent), so the ring reads as the brand mark repeated. v1 has no ring anywhere — it used only linear bars. **v2 authoritative.**

---

## E. Navigation / tab bar

```css
position:absolute; left:0; right:0; bottom:0; z-index:40;
padding:12px 12px 28px;
background:linear-gradient(180deg,rgba(10,9,13,0),rgba(10,9,13,.82) 34%,rgba(10,9,13,.96));
backdrop-filter:blur(24px) saturate(180%); -webkit-backdrop-filter:blur(24px) saturate(180%)
```
Inner: `display:grid; grid-template-columns:repeat(5,1fr)`. The scroll body reserves `padding-bottom:120px` for it. The 28px bottom padding is the home-indicator inset; there is no `env(safe-area-inset-bottom)` — add it.

Each button: `border:0; background:none; padding:0; display:flex; flex-direction:column; align-items:center; gap:7px; min-height:44px; justify-content:center`
- Icon slot: `display:flex; align-items:center; justify-content:center; width:24px; height:20px; color:{{t.color}}` — icons are 21×21 SVGs on `viewBox="0 0 22 22"` using `stroke:currentColor; strokeWidth:1.6; strokeLinecap:round; strokeLinejoin:round; fill:none`
- Label: `font-size:9.5px; font-weight:{{t.weight}}; letter-spacing:.06em; color:{{t.color}}`

| Order | id | Label | Icon path(s) (from `ic(kind)`) |
|---|---|---|---|
| 1 | `home` | Home | `M3.4 9.2 11 3.2l7.6 6v9.2a.9.9 0 0 1-.9.9h-4.2v-5.6H8.5v5.6H4.3a.9.9 0 0 1-.9-.9V9.2Z` |
| 2 | `search` | Search | `circle cx10 cy10 r6.4` + `M14.8 14.8 18.6 18.6` |
| 3 | `browse` | Browse | 3 lines: `M3 5.6h16M3 11h16M3 16.4h10` |
| 4 | `anime` | Anime | leaf `M11 3.4c2.2 2.6 2.2 5.6 0 8.2-2.2-2.6-2.2-5.6 0-8.2Z`; wings `M11 11.6c2.9-1.3 5.6-.5 7.4 2-3.1.9-5.7.2-7.4-2Zm0 0c-2.9-1.3-5.6-.5-7.4 2 3.1.9 5.7.2 7.4-2Z`; stem `M11 13.6v5` |
| 5 | `you` | You | `circle cx11 cy8 r3.4` + `M4.6 18.4c.6-3.2 3.2-5 6.4-5s5.8 1.8 6.4 5` |

**Indicator behaviour (v2):** there is no pill, dot, or underline. Active state is expressed *only* by colour + weight, applied simultaneously to icon and label:

```js
color:  s.screen === id ? "#ffffff" : "rgba(255,255,255,.4)"
weight: s.screen === id ? 600 : 500
```

Note the markup comment says *"tab bar: eclipse crescent marks the active tab"* — that crescent was **never implemented**. Either honour the comment (add a small crescent glyph under the active tab) or ship colour-only; flag to the designer.

Active-tab derivation uses `s.screen`, not `s.tab` — so opening a detail screen (screen `detail`) leaves **all five tabs inactive**. Since the tab bar is hidden on detail/player this is invisible in the mock, but if you keep the bar visible on detail you must fall back to `s.tab`.

`pick: () => this.set({ screen: id, tab: id, sheet: null })` — tapping a tab always dismisses any open sheet.

> v1 tab bar differs: solid `rgba(11,12,16,.72)` + `border-top:1px solid rgba(255,255,255,.08)`, `padding:9px 10px 26px`, `gap:5px`, 26×22 icon slot, `letter-spacing:.01em`, and a third element per button — a **14×2px `border-radius:99px` dot**, `#c4b5fd` when active else `transparent`. Fifth tab is labelled **"My Space"** and its icon set uses a 4-rounded-square Browse glyph. **v2 renames it "You", drops the dot, drops the border-top, and switches Browse to a 3-line glyph.**

---

## F. The player screen

```css
position:absolute; inset:0; z-index:70; background:#000;
display:grid; grid-template-rows:auto 1fr auto;
```
Three grid rows. No tab bar, no ambient/vignette contribution (opaque black root). Entered via `play` (`{screen:"player", sheet:null, playing:true}`).

### Row 1 — top chrome
`position:relative; z-index:3; padding:50px 14px 10px; display:flex; align-items:center; justify-content:space-between; gap:10px; background:linear-gradient(180deg,rgba(0,0,0,.85),rgba(0,0,0,0))`
- **Left**: close button 36×36 circle, `border:1px solid rgba(255,255,255,.18)`, `background:rgba(0,0,0,.4)`, 16px **X** glyph `M5 5l10 10M15 5 5 15` sw1.7 → `back` (returns to `detail`)
- **Centre**: `flex:1; min-width:0; gap:1px; text-align:center` — `{{title.title}}` `12.5px / 500`, nowrap+ellipsis; `{{title.nowPlaying}}` `10.5px / rgba(255,255,255,.48)` (e.g. "S1 · E7 — A Stick of Time")
- **Right**: source pill `height:30px; padding:0 11px; border-radius:99px; border:1px solid rgba(255,255,255,.18); background:rgba(0,0,0,.4); font-size:11px; gap:5px` — 5×5 `#4ade80` dot + hardcoded text "Vidsrc" → `openServers`

### Row 2 — video stage + centre transport
`position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden` (takes all remaining height)
- Layer 1: `position:absolute; inset:0; background:{{title.art}}; opacity:.45` — the video stand-in
- Layer 2: `position:absolute; inset:0; background:radial-gradient(ellipse at center,rgba(0,0,0,.12),rgba(0,0,0,.74))`
- Layer 3 (`z-index:2`): transport cluster `display:flex; align-items:center; gap:28px`
  - Back-10: 46×46 circle, `border:0; background:rgba(0,0,0,.32)`, 21×21 SVG on `viewBox 0 0 24 24`: arc `M11.5 5a7 7 0 1 1-6.9 8.2` + arrowhead `M11.5 5 8.8 2.6M11.5 5 8.8 7.6`, sw1.7 round. **No "10" numeral** (v1 had one).
  - Play/pause: **72×72** circle, `border:1px solid rgba(255,255,255,.2)`, `background:rgba(255,255,255,.13)`, `backdrop-filter:blur(24px) saturate(180%)` → `togglePlay`. Glyph is `{{playGlyph}}`:
    - playing → `<svg width=22 height=24 viewBox="0 0 22 24">` two `rect` `x3 y2 w5.4 h20 rx1.6` and `x13.6 y2 w5.4 h20 rx1.6`, fill `#fff`
    - paused → `<svg width=22 height=24 viewBox="0 0 20 24">` path `M2 1.6v20.8L19 12 2 1.6Z` fill `#fff`
  - Forward-10: 46×46, mirrored arc `M12.5 5a7 7 0 1 0 6.9 8.2` + `M12.5 5 15.2 2.6M12.5 5l2.7 2.6`

### Row 3 — notification + scrubber + secondary controls
`position:relative; z-index:3; padding:0 14px 26px; display:flex; flex-direction:column; gap:12px; background:linear-gradient(0deg,rgba(0,0,0,.9),rgba(0,0,0,0))`

1. **Single notification slot** (architecturally important — v1's comment states alerts *queue* here rather than stacking as absolute toasts; keep it as one slot):
   `display:flex; align-items:center; gap:9px; padding:9px 12px; border-radius:12px; border:1px solid rgba(251,191,36,.26); background:rgba(251,191,36,.11)`
   - text `flex:1; font-size:11px; line-height:1.45; color:#fde68a` — "This server has no captions. Filmxy has them."
   - action link `11px / 600 / #fff` "Switch" → `openServers`
2. **Scrubber** `display:flex; flex-direction:column; gap:7px`
   - Track `position:relative; height:4px; border-radius:99px; background:rgba(255,255,255,.2)`
     - Buffered: `position:absolute; left:0; top:0; bottom:0; width:42%; border-radius:99px; background:rgba(255,255,255,.32)`
     - Played: same, `width:31%; background:#fff`
     - Thumb: `position:absolute; left:31%; top:50%; width:12px; height:12px; border-radius:99px; background:#fff; transform:translate(-50%,-50%)`
   - Timecodes: `display:flex; justify-content:space-between; font-family:ui-monospace,Menlo,monospace; font-size:10px; color:rgba(255,255,255,.55)` — `42:18` left, `-1:09:52` right (remaining, negative-prefixed)
   - The 4px track is well under a 44px touch target — wrap it in a taller invisible hit area.
3. **Control row** `display:flex; align-items:center; justify-content:space-between; gap:6px`
   - Left group `gap:6px`: two pills `height:34px; padding:0 12px; border-radius:99px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.07); font-size:11.5px` — text-only "CC" and "1.0×" (no icons in v2; no handlers wired)
   - Right: "Episodes" pill `height:34px; padding:0 13px`, same styling → `openEpisodes`
4. **Orientation hint** `p` centred, `10.5px / rgba(255,255,255,.3)` — "Rotate for fullscreen"

### Portrait vs landscape
This is the load-bearing product decision and it is **stated but not implemented**. Both files render *only* the portrait layout and communicate fullscreen via copy. v1 carries the design rationale as a comment:

> `<!-- rotate = fullscreen. no fullscreen button, no three fallback paths -->`

So the contract for the engineer is:
- **Portrait**: the 3-row inset layout above. Video is letterboxed inside row 2. Explicitly **no fullscreen button** — do not add one.
- **Landscape**: entering landscape *is* fullscreen. Video fills the viewport; chrome becomes overlays on the same three bands (top bar / centre transport / bottom bar) rather than grid rows; the "Rotate for fullscreen" hint is removed. Use the Screen Orientation API / `orientationchange` (or a `(orientation: landscape)` media query) as the sole entry point. No `requestFullscreen` button, no PiP fallback chain.
- The 46px/72px/46px transport cluster and the 34px pill row are sized to survive both orientations unchanged.

Neither mock specifies a controls auto-hide timer, tap-to-toggle-chrome, double-tap-to-seek, gesture volume/brightness, or a seek preview thumbnail. Those are open.

### The two player sheets

**Source / server sheet** (`sheetIsServers`, title "Choose a source") — full spec in §C.8. Four rows; the selected row is distinguished purely by border/background/tag colour, not a checkmark:

| label | sub | tag | tagColor | dot | border | bg |
|---|---|---|---|---|---|---|
| Vidsrc | `1080p · captions · fast` | Playing | `#4ade80` | `#4ade80` | `rgba(74,222,128,.3)` | `rgba(74,222,128,.09)` |
| Filmxy | `1080p · captions` | Ready | `rgba(255,255,255,.45)` | `#4ade80` | `rgba(255,255,255,.09)` | `rgba(255,255,255,.03)` |
| Superembed | `4K · no captions` | Ready | `rgba(255,255,255,.45)` | `#fbbf24` | `rgba(255,255,255,.09)` | `rgba(255,255,255,.03)` |
| Smashystream | `720p · unverified` | Failed | `#f87171` | `#f87171` | `rgba(255,255,255,.09)` | `rgba(255,255,255,.02)` |

The dot encodes *caption/quality health* (green = captions present, amber = no captions, red = failed) while the tag encodes *probe state*. Every row's handler is `closeSheet` — selection is not modelled; wire it to state.
The design intent (v1 copy, dropped in v2): *"Sources are probed in order. Captions and 4K availability shown up front, so a switch is never a guess."* Worth reinstating.

**Episode sheet** (`sheetIsEpisodes`, title "Episodes") — S1–S4 underline tabs (`gap:16px`, `padding:0 0 10px`, `12.5px`, active `600/#fff/#c4b5fd`) over the same 100px-thumb episode rows as detail, dividers at `.06` alpha. Every row → `play`. Season taps only mutate `state.season`; the episode list does not change — wire real per-season data.

---

## G. Numbered sections on home (01–06)

Container: `display:flex; flex-direction:column; gap:46px`. Preceded by the unnumbered resume hero (§C.1). Every section header is the identical mono-number + uppercase-eyebrow pair described in §C.1; every section wrapper is `display:flex; flex-direction:column; gap:15px`. The *shapes below the header* are deliberately all different — that asymmetry is the point.

---

**01 — STILL WATCHING** · shape: **narrow portrait rail with corner rings**
- Rail: `display:flex; gap:13px; overflow-x:auto; padding:0 20px 4px`
- Card: `flex:none; width:94px; gap:9px`
  - Poster: `width:94px; aspect-ratio:2/3` (→141px), `border-radius:10px; overflow:hidden`, art, `box-shadow:0 12px 28px -14px rgba(0,0,0,.9)`
  - Inner scrim `linear-gradient(0deg,rgba(0,0,0,.55),transparent 60%)`
  - **26px eclipse mini-ring** at `right:6px; bottom:6px` (§D.2)
  - Title `11.5px / 500 / line-height 1.25`, `-webkit-line-clamp:2`
  - Tag `10px / rgba(255,255,255,.38)` — remaining time, e.g. "1h 12m left"
- 4 items (`resume`), each → detail

**02 — TONIGHT** · shape: **full-bleed 3:4 editorial poster, zero side padding**
- Single button `position:relative; width:100%; aspect-ratio:3/4; overflow:hidden; display:block` — at 402px this is a 402×536 block that breaks the 20px gutter entirely
- Layers: art; then `linear-gradient(0deg,#0a090d 3%,rgba(10,9,13,.62) 34%,rgba(10,9,13,.02) 78%)`
- Content `position:absolute; left:20px; right:20px; bottom:22px; gap:13px`:
  1. Reason `11px / line-height 1.5 / #c4b5fd` — "Because you finished Arrival, and rated it 5"
  2. Title serif `46px / .9 / -.025em / text-wrap:balance`
  3. Meta `12px / rgba(255,255,255,.55) / letter-spacing .02em` — "2024 · Science fiction · 2h 46m"
  4. Action row `display:flex; align-items:center; gap:10px; padding-top:4px`:
     - Play pill `height:42px; padding:0 22px; border-radius:99px; background:#fff; color:#0a090d; gap:8px; 13.5px/600` + 11×12 triangle
     - Add circle `42×42; border-radius:99px; border:1px solid rgba(255,255,255,.24); background:rgba(0,0,0,.34); backdrop-filter:blur(12px) saturate(180%)` + 14px plus
     - Counter `margin-left:auto; font-family:mono; 10px; letter-spacing:.14em; color:rgba(255,255,255,.34)` — `1 / 4`
- Whole block → `featured.open` (Dune detail). The `1 / 4` implies a 4-item carousel that is **not implemented** — only one editorial card exists and there is no swipe/paging. Build the pager.

**03 — IN THE MOOD FOR** · shape: **fixed-height 132×176 vibe tiles, serif labels, bottom-anchored**
- Rail `display:flex; gap:11px; overflow-x:auto; padding:0 20px 4px`
- Tile `flex:none; width:132px; height:176px` (explicit height, not aspect-ratio — the only fixed-height tile in the app), `border-radius:14px; border:1px solid rgba(255,255,255,.09); padding:15px; display:flex; flex-direction:column; justify-content:space-between; background:{{v.art}}`
  - Top: count, mono `9.5px / letter-spacing .16em / rgba(255,255,255,.42)` — bare number, e.g. "24"
  - Bottom: label, **Instrument Serif `24px / 1.02 / -.01em`**
- 4 tiles → `openVibe(label)` → vibe sheet. No emoji (v1 had them).

**04 — NEXT EPISODE DROPS** · shape: **edge-to-edge divider list, no card, right-aligned serif countdown**
- Container `display:flex; flex-direction:column` (no gap — dividers do the spacing)
- Row `display:grid; grid-template-columns:1fr auto; align-items:center; gap:14px; padding:14px 20px; border-top:1px solid rgba(255,255,255,.07)`
  - Left `gap:3px`: title `14.5px / 500 / -.015em`, nowrap+ellipsis; `ep` `11px / rgba(255,255,255,.42)` — "Season 2 · Episode 4"
  - Right `align-items:flex-end; gap:1px`: **`in`** in Instrument Serif `22px / line-height 1 / #c4b5fd / font-variant-numeric:tabular-nums` (e.g. "2d 04h"); **`when`** mono `9px / letter-spacing .14em / rgba(255,255,255,.34)` (e.g. "Fri 23:30")
- 3 rows → detail

**05 — TRENDING TODAY** · shape: **wider portrait rail, header carries a trailing "All" link**
- Header differs from the other five: `padding:0 20px; display:flex; align-items:baseline; justify-content:space-between`, with the number+eyebrow nested in their own `gap:11px` flex, and a right-aligned `All` button `11.5px / rgba(255,255,255,.42)` → `goBrowse`
- Rail `display:flex; gap:12px; overflow-x:auto; padding:0 20px 4px`
- Card `flex:none; width:118px; gap:9px`: poster `aspect-ratio:2/3; border-radius:11px; box-shadow:0 12px 28px -14px rgba(0,0,0,.9)` — **no overlay, no ring, no badge** ("art unveiled" per the markup comment); title `12px / 500 / 1.28` clamp 2; meta `10px / rgba(255,255,255,.36)` — "Series · 2024"
- 6 items → detail

**06 — ROOM IS OPEN** · shape: **inset single card with violet gradient, the only section whose `<section>` itself is padded**
- `section style="padding:0 20px; display:flex; flex-direction:column; gap:15px"` (header therefore has no inner padding here)
- Card `border-radius:16px; border:1px solid rgba(196,181,253,.18); background:linear-gradient(150deg,rgba(124,58,237,.2),rgba(255,255,255,.025) 64%); padding:18px; display:flex; flex-direction:column; gap:14px`
  1. Headline, **Instrument Serif `25px / 1.06 / -.01em`** — hardcoded "Shōgun, episode 7 — in twelve minutes" (note: number spelled out, not "12 min")
  2. Presence row `display:flex; align-items:center; gap:10px`: overlapping avatar stack — three `24×24; border-radius:99px; border:2px solid #17131f`, 2nd and 3rd with `margin-left:-8px`, gradients `145deg #c4b5fd→#7c3aed`, `#7dd3fc→#2563eb`, `#fda4af→#be123c`; caption `11.5px / rgba(255,255,255,.5)` "Aarav, Meera and 1 more are in"
  3. CTA `height:40px; border-radius:99px; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.08); color:#fff; 13px / 500` "Join the room" → `openParty`

### Shape summary (the asymmetry contract)
| # | Shape | Item geometry | Gutter |
|---|---|---|---|
| — | Hero split | 146px 2:3 plate + flex column | 20px |
| 01 | H-rail, ringed | 94 × 141 (2:3) | 20px |
| 02 | Full-bleed hero | 402 × 536 (3:4) | **0** |
| 03 | H-rail, fixed box | 132 × 176 | 20px |
| 04 | Divider list | full width × ~62px | 20px (inside row) |
| 05 | H-rail, bare art | 118 × 177 (2:3) | 20px |
| 06 | Inset card | full width − 40 | 20px (on section) |

No two consecutive sections share a shape, and 02 is the only bleed — that alternation is what makes the feed read as editorial.

---

## H. Mock data shape (`renderVals()` return, v2)

Flags and handlers first, then datasets. Structure only (representative values in comments).

```ts
{
  // ── ambient / routing flags ─────────────────────────────
  ambient: string,          // CSS radial-gradient, keyed off titleKey on detail|player, else "shogun"
  isTabScreen: boolean,     // screen !== "detail" && screen !== "player"
  isHome: boolean, isSearch: boolean, isBrowse: boolean, isAnime: boolean, isYou: boolean,
  isDetail: boolean, isPlayer: boolean,

  // ── tab bar ─────────────────────────────────────────────
  tabs: Array<{
    label: string,          // "Home" | "Search" | "Browse" | "Anime" | "You"
    icon: ReactElement,     // 21×21 svg, stroke=currentColor
    color: string,          // "#ffffff" | "rgba(255,255,255,.4)"
    weight: 600 | 500,
    pick: () => void,
  }>,                       // length 5, order: home, search, browse, anime, you

  // ── navigation handlers ─────────────────────────────────
  goSearch: () => void, goYou: () => void, goBrowse: () => void,
  back: () => void,         // player→detail, else →state.tab
  play: () => void,         // →player, playing:true
  togglePlay: () => void,
  playGlyph: ReactElement,  // pause bars when playing, triangle when paused
  heroOpen: () => void,     // →detail "shogun"
  resumeOpen: () => void,   // →detail "shogun"   (declared but never referenced in markup)
  openEpisodes: () => void, openServers: () => void, openParty: () => void,
  openTrailer: () => void, closeSheet: () => void,

  // ── sheet state ─────────────────────────────────────────
  sheetOpen: boolean,       // state.sheet !== null
  sheetIsEpisodes: boolean, sheetIsServers: boolean,
  sheetIsParty: boolean, sheetIsVibe: boolean, sheetIsTrailer: boolean,
  sheetTitle: string,       // "Episodes"|"Choose a source"|"Watch party"|<vibe label>|"Trailer"|""

  // ── current title (detail + player + party/trailer sheets) ──
  title: {
    key: string,            // "shogun" | "dune" | "frieren"
    title: string,
    year: string,           // "2024"
    runtime: string,        // "10 episodes" | "2h 46m" | "S2 · 12 eps"
    cert: string,           // "18+" | "13+"
    rating: string,         // "8.7"  (string, not number)
    art: string,            // CSS linear-gradient
    playLabel: string,      // "Resume Ep 7" | "Play"
    nowPlaying: string,     // "S1 · E7 — A Stick of Time" | "Feature · 2h 46m"
    isSeries: boolean,
    seasonLabel: string,    // "Season 1" | ""
    synopsis: string,
    providers: Array<{ short: string, art: string }>,           // short = "HULU"|"MAX"|"PRIME"|"CR"|"NFLX"|"HIDIVE"|"APPLE"
    cast: Array<{ name: string, role: string, art: string }>,   // art reuses the title's own gradient
  },

  // ── home ────────────────────────────────────────────────
  hero: {
    title: string,          // "Shōgun"
    tag: string,            // "Season 1 · Episode 7"
    left: string,           // "38 minutes left"
    pctLabel: string,       // "31%"
    dash: number,           // RING(138.2, 31) = 95.358
    art: string,
  },
  resume: Array<{ title, tag, dash: number /* RING(69.1,pct) */, art, open }>,      // 4
  featured: { title, reason, meta, art, open },                                      // 1
  vibes:    Array<{ label, count /* "24" */, art, open }>,                           // 4
  airing:   Array<{ title, ep, in /* "2d 04h" */, when /* "Fri 23:30" */, open }>,  // 3  (no art field)
  trending: Array<Poster>,                                                           // 6

  // ── browse ──────────────────────────────────────────────
  segments: Array<{ label, weight, color, line, pick }>,   // 3: Films/Series/Categories
  grid:     Array<Poster>,                                 // 12 (also reused by the vibe sheet)

  // ── search ──────────────────────────────────────────────
  vibeChips: Array<{ label, open }>,                       // 8
  recent:    Array<{ title, meta, art, open }>,            // 4

  // ── anime ───────────────────────────────────────────────
  epTicks:  Array<{ bg: string }>,                         // 12; "#c4b5fd" for i<3 else "rgba(255,255,255,.13)"
  animeTop: Array<{ title, meta, format /* "TV"|"Film" */, art, open }>,  // 5

  // ── you ─────────────────────────────────────────────────
  youRows: Array<{ label, sub, open }>,                    // 5

  // ── detail ──────────────────────────────────────────────
  related:  Array<Poster>,                                 // 4
  episodes: Array<{ num /* "E7" */, title, blurb, dur /* "52m" */, pct /* "31%" */, art }>,  // 5
  seasons:  Array<{ label /* "S1" */, weight, color, line, pick }>,                          // 4

  // ── sheets ──────────────────────────────────────────────
  servers: Array<{ label, sub, tag, tagColor, dot, border, bg }>,   // 4
  party:   Array<{ name, state, initial, reaction, art }>,          // 3
}

// Poster (from this.poster(key, title, meta)):
type Poster = { art: string, title: string, meta: string, open: () => void }
```

`state` shape: `{ screen, tab, sheet, titleKey, segment, season, playing, vibe }` with defaults `{"home","home",null,"shogun","movies",1,true,"Slow-burn revenge"}`.

Note the presentation/data leak an engineer should clean up: `color`, `weight`, `line`, `bg`, `border`, `dot`, `tagColor`, `art`, and `dash` are all pre-computed **CSS strings/numbers** inside `renderVals()`. In React these belong in the component (derive from `isActive` / `status` / `pct`), not the data layer. Keep the values, move the logic.

Also: `title.rating` is a string; percentages (`e.pct`, epTick state) are CSS-ready strings; `dash` is a raw number. Normalise to numbers in the real model and format at the edge.

---

## I. Differences between v2 and v1 — v2 is authoritative

### I.1 Wholesale direction changes
| Aspect | v1 (`Umbra App.dc.html`) | v2 (`Umbra App v2.dc.html`) — **use this** |
|---|---|---|
| Typography | Inter only; headings Inter 600 with `-.025em`…`-.05em` tracking; no font link | **Instrument Serif 400 for all display type**, Inter for UI, `ui-monospace` for numerals/eyebrows; Google Fonts link in `<helmet>` |
| Base background | `#0f1014` (tab), `#0b0a0f` (detail) | **`#0a090d` everywhere**; `#0b0a0f` retired |
| Ambient colour | none globally; a single per-title blurred bloom inside the detail hero (`filter:blur(46px); opacity:.55`, `title.ambient` two-stop radial pair) | **App-wide ambient layer** at root with `transition:background 800ms cubic-bezier(.22,1,.36,1)` + fixed vignette; per-title `AMBIENT` map; the detail bloom div is deleted |
| Progress language | linear bars only (3px card bar, 2.5px episode bar, 5px ticks) | **eclipse SVG rings** at 50/26/64px with `RING()` helper, plus retained linear forms |
| Layout root | `display:flex; flex-direction:column` | absolutely-positioned layer stack |
| Horizontal gutter | **18px** | **20px** |
| Home structure | 6 unnumbered sections with plain sentence-case headings ("Jump back in", 19px Inter 600) | **numbered 01–06** mono index + `.24em` uppercase eyebrow, each a distinct shape; `gap:46px` (v1: 30px) |
| Logo | 26×26 rounded-square tile, `border-radius:8px`, gradient `145deg #c4b5fd→#7c3aed`, `box-shadow:0 4px 14px -4px rgba(139,92,246,.7)`, crescent inside; wordmark `15px/700/.2em uppercase` | **bare 30×24 two-circle eclipse mark**, no tile, no shadow; wordmark `16.5px/500/-.02em` sentence case |
| 5th tab | `space` / "My Space" — 2×2 emoji tile grid, 3-col watchlist, "Coming soon" dashed rows with "Soon" pills | `you` / "You" — serif name, 5 chevron rows (`youRows`), two dashed "Not here yet" tiles |
| Tab indicator | 14×2px `#c4b5fd` dot under active + `border-top` on bar | colour+weight only; gradient bar, no border-top, no dot (crescent promised in comment, absent) |
| Browse segments | pill segmented control in a `radius:99px` track, white active fill, plus a scrollable **filter chip row** (`All / 2026 / Top rated / Sci-Fi / Drama / 4K`) | **underline tabs** (`border-bottom:2px solid #c4b5fd`); filter row **deleted** |
| Season picker | pill chips labelled "Season 1…4", `border/bg/color` triple per state, horizontally scrollable | underline tabs labelled "S1…S4" |
| Poster badges | rating badge on trending/browse posters (`8.7` in a `radius:5/6px` black pill); literal "Poster" placeholder text on trending art | all badges removed; only the anime format badge survives |
| Emoji | vibe tiles (🗡🍵🌫🎲), space tiles (🔖👥⤓🕘), coming-soon (⚽✦), player warn (⚠) | **all decorative emoji removed** except party reactions (🔥😮) |
| Sheet header | Inter `17px/600` title + explicit 30×30 close X button | serif 26px title, **no close button** |
| Genres | chip row on detail from `title.genres` | **section deleted** (`genres` no longer in the data) |

### I.2 Value-level diffs (v1 → v2)
- Sheet panel: `rgba(16,15,22,.86)` → `rgba(14,13,19,.9)`; `max-height:78%` → `80%`; `box-shadow:0 -24px 64px -12px rgba(0,0,0,.85)` **dropped**; handle `36×4 / .24` → `34×4 / .22`; content padding `0 18px 32px` → `0 20px 34px`; scrim `.62` → `.6`
- Detail hero aspect `4/5` → **`3/4`**; H1 `34px Inter 600 -.05em` → `44px serif -.025em`; top-bar inset `left/right:14px` → `16px`; the download button and the icon inside the Party button are removed, "Party" becomes text-only **"Watch together"**; body `padding:16px 18px 0; gap:20px` → `18px 20px 0; gap:24px`; synopsis `13.5px/1.65/.7` → `14px/1.68/.68`; sub-headings `18px Inter 600` → `24px serif`; episode thumb `104px / radius 9 / centred play overlay / gap:9px between rows` → **`100px / radius 8 / no overlay / border-top dividers, padding 12px 0`**; cast tile `84px / radius 11` → `82px / radius 10`
- Player: art opacity `.5` → `.45`; vignette `rgba(0,0,0,.15)→.72` → `.12→.74`; skip buttons `48px + backdrop-filter:blur(12px) + "10" numeral <text>` → **`46px`, no blur, no numeral**; play button `70px / rgba(255,255,255,.14)` → **`72px / .13`**; transport gap `26px` → `28px`; buffered fill `.34` → `.32`; thumb `box-shadow:0 2px 8px rgba(0,0,0,.6)` **dropped**; timecodes `10.5px Inter tabular-nums rgba(.6)` → **`10px mono rgba(.55)`**; CC & Episodes pills lose their leading icons; warn banner loses `⚠` glyph and `backdrop-filter`, `.28/.12` → `.26/.11`; rotate hint loses its SVG icon and becomes a bare centred `<p>`; back/source buttons lose `backdrop-filter`
- Server rows: `radius:14 / dot 8px / tag 10.5px Inter 600 .06em` → **`radius:13 / dot 7px / tag 9.5px mono .1em`**; tagColor idle `.5` → `.45`; Vidsrc border `.32`→`.3`, bg `.1`→`.09`; idle bg `.035`→`.03`; the explanatory paragraph is deleted
- Party sheet: member rows go from bordered cards (`padding:10px 12px; radius:12px; border .07; bg .03`) to **flat rows with `border-top:1px solid rgba(255,255,255,.06); padding:10px 0`**; the "In the room" eyebrow and the "Copy link" button are removed; header card `radius:16/border .22/gradient .24` → `15/.2/.22`
- Trailer sheet: frame `radius:14`, button `54px` with `backdrop-filter:blur(24px)` → `radius:13`, `52px`, no blur; copy loses the leading word "Trailer"
- `epTicks` empty colour `rgba(255,255,255,.14)` → `.13`; tick height `5px` → `4px`
- Vibe chips: `padding:9px 14px; bg rgba(196,181,253,.08); color #e9e4ff` → `padding:10px 15px; bg .07; color #ece7ff`
- Browse grid gap `10px 9px` → `14px 10px`; poster radius `11px` → `10px`; posters gain `box-shadow:0 10px 24px -14px rgba(0,0,0,.9)`
- Vibe tiles `148×96` w/ emoji + `13px` Inter label + `"24 titles"` → **`132×176`, serif `24px` label, bare count `"24"`**
- Airing rows: v1 cards (`radius:14; border .08; bg .032; gap:8; 46px poster; countdown 13px Inter 600`) → v2 **edge-to-edge divider rows, no poster, countdown serif 22px `#c4b5fd`, `when` mono 9px `.14em`**
- Anime tracker: countdown was text-only `24px Inter 600 #c4b5fd` + `10px` timestamp; v2 replaces it with the **64px ring** and a two-line `2d/04h` centre label; card padding `16px→18px`, gap `14px→16px`, gradient tail `.03 58%` → `.025 62%`
- Anime screen: v1's whole **"Airing schedule"** section (3 rows with `studio`) is **deleted from v2** (only Home 04 keeps countdowns); v1's "Your season tracker" eyebrow is dropped
- Home hero: v1 had no resume hero at all — instead a 234×132 (16:9) landscape "Jump back in" rail with in-card play button, tag pill, title/left overlay, and a 3px linear bar. v2 replaces it with the poster-plate + ring + serif-title + Resume-button hero, and demotes the rail to 01 with 94px portrait cards
- Home featured: v1 `aspect-ratio:5/6`, `border-radius:20px`, inset in the 18px gutter, `border:1px solid rgba(255,255,255,.09)`, `box-shadow:0 24px 64px -18px rgba(0,0,0,.9)`, a `New` badge top-right, `kicker` `10px/.22em/uppercase/#c4b5fd`, title `32px Inter 600 -.045em`, **three** action buttons (play/plus/info), and 4 page dots below (16×3 active / 6×3 inactive). v2 makes it **full-bleed 3:4 with no radius, no border, no shadow, no badge**, sentence-case `reason` at `11px`, serif 46px title, **two** buttons, and moves the pager to a mono `1 / 4` counter inside the card
- Watch party card: `radius:18; gradient 140deg …,rgba(24,20,38,.9) 62%; avatars 26px/-9px; two buttons (white "Join party" + ghost "Details"); Inter 18px headline + 12.5px body` → `radius:16; gradient 150deg …,rgba(255,255,255,.025) 64%; avatars 24px/-8px; one ghost button "Join the room"; serif 25px headline, no body copy`
- Search: H1 `"Search"` 30px Inter → `"What are you after?"` 38px serif; field `height:44px; padding:0 14px` → `46px; 0 15px`; placeholder "Titles, people, or a vibe…" → "A title, a person, or a feeling…"; icon stroke `.5` → `.45`; recent rows use `border-bottom .05 / padding 9px 18px / 38px poster / 15px chevron` → `border-top .06 / 10px 20px / 36px poster / 14px chevron`

### I.3 Data-layer diffs
- v2 adds: `AMBIENT` map, `RING()` helper, `ic(kind)` icon factory (replaces v1's inline `tabDef` React elements), `hero`, `youRows`
- v2 removes: `filters`, `spaceTiles`, `watchlist`, `vibeBlurb`, `goCast`, `openFeatured` (folded into `featured.open`), `title.genres`, `title.ambient`, the `rating` argument on `this.poster()`
- `ART` loses the `gojo` gradient (`A("#3c6f8a","#111a20")`); the browse grid swaps Gojo out for **Solo Leveling** and reorders
- `resume` goes from 3 items with `pct: "31%"` + `tag: "S1 · E7"` + `left` to 4 items with `dash: number` and a single merged `tag`; Shōgun leaves the rail (it is now the hero)
- `featured.kicker` "Because you finished Arrival" → `featured.reason` "Because you finished Arrival, and rated it 5"; `meta` drops the trailing `★ 8.2`
- `airing` drops `art` and `studio`, gains full `ep` strings ("Season 2 · Episode 4"); titles lose the season suffix ("Frieren S2" → "Frieren")
- `vibes[].count` "24 titles" → "24"; label "Cosy and low stakes" → **"Cosy, low stakes"**; `glyph` removed; gradient alphas `.26/.24` → `.24/.22` and tails `.9` → `.92`
- `segments` labels "Movies/TV Shows" → **"Films/Series"**; state model switches from `bg`+`color` to `color`+`line`
- `seasons` labels "Season N" → "SN"; `border`+`bg`+`color` → `color`+`line`
- Title names shortened: `"Frieren: Beyond Journey's End"` → **`"Frieren"`**; runtime `"Season 2 · 12 eps"` → `"S2 · 12 eps"`; providers `CRUNCH/NETFLIX` → `CR/NFLX`; cast roles `"Yoshii Toranaga"/"John Blackthorne"/"Toda Mariko"/"Kashigi Yabushige"` → `"Toranaga"/"Blackthorne"/"Mariko"/"Yabushige"`; Dune roles `"Paul Atreides"/"Feyd-Rautha"` → `"Paul"/"Feyd"`
- `trending`/`grid` meta format flips from `"2024 · Series"` to `"Series · 2024"`
- `animeTop` format `"Movie"` → `"Film"`; `"A-1 Pictures"` → `"A-1"`
- Shōgun synopsis loses one comma ("In feudal Japan, an English pilot" → "In feudal Japan an English pilot")
- `episodes[].art` binds to `raw.art` in v2 (vs `title.art` in v1) — functionally identical
- v2 `state` declares `screen` before `tab`; v1 the reverse. No behavioural difference.

### I.4 Things v1 has that are worth *recovering* into v2
Not contradictions — deletions that removed useful affordances. Flag to design before dropping:
1. The **server-sheet explanation** ("Sources are probed in order. Captions and 4K availability shown up front, so a switch is never a guess.") — the whole point of the source list.
2. The **"10" numerals** on the skip buttons — v2's bare arcs don't say how far they skip.
3. The **"Copy link"** action in the party sheet — otherwise there is no way to invite anyone.
4. The **explicit sheet close button** — v2 leaves only scrim tap, with no drag-to-dismiss implemented.
5. The **rotate-for-fullscreen icon** — v2's bare 10.5px `.3`-alpha text is very low-salience for the only route to fullscreen.
6. **Browse filter chips** — v2 has no filtering UI at all beyond three segments.
7. The v1 `title.ambient` two-stop bloom gave *per-poster* colour extraction (the comment reads `useExtractColors`); v2's 5-entry `AMBIENT` map is a hardcoded downgrade. Implement real colour extraction and feed the v2 ambient layer from it.

### I.5 Known gaps in v2 to resolve during build
- Home 02 `1 / 4` counter with no carousel behind it.
- Browse `segments`, sheet `seasons`, and the vibe sheet all render identical static content regardless of selection.
- Search field is a `<span>`, not an input; no results state exists.
- Server rows all call `closeSheet` — selection is unmodelled.
- Player CC and `1.0×` pills have no handlers; no subtitle or speed menus exist.
- `youRows` Downloads / History / Settings are dead ends; no such screens exist.
- Anime tracker's `2d`, `04h`, `3 of 12 watched`, ring offset `132`, home 06's "in twelve minutes", the player's `42:18`/`-1:09:52`/`42%`/`31%`, the source pill's "Vidsrc", and the You screen's "142 watched · 38 saved · 3 in progress" are all **hardcoded in markup**, not data-bound.
- `resumeOpen` is exported from `renderVals()` but never referenced in the template — dead.
- No `env(safe-area-inset-*)` anywhere; the 54px header top and 28px tab-bar bottom are magic numbers tuned to a 402×874 notched device.
- No focus-visible styles, no `aria-*` beyond one `aria-label="Close"` on the sheet scrim, no reduced-motion handling for the 800ms ambient transition.