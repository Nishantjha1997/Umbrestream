Read all three files completely, plus grounded the phone comparison against `Umbra App v2.dc.html` so section J is fact-based rather than inferred.

---

# Umbra — Desktop Web Build: Implementation Spec

Source of truth: `C:\Users\DELL_\OneDrive\Desktop\Streaming app redesign and analysis\Umbra Desktop App.dc.html` (774 lines; markup lines 11–571, logic lines 573–772).
Presentation wrapper: `C:\Users\DELL_\OneDrive\Desktop\Streaming app redesign and analysis\Umbra Desktop.dc.html`
Browser frame: `C:\Users\DELL_\OneDrive\Desktop\Streaming app redesign and analysis\browser-window.jsx`
Phone build used for the desktop/phone delta in §J: `C:\Users\DELL_\OneDrive\Desktop\Streaming app redesign and analysis\Umbra App v2.dc.html`

---

## A. Viewport & grid

**Declared preview size.** From the `data-props` attribute on the logic script (line 573):

```
data-props='{"$preview":{"width":1480,"height":900}}'
```

→ **1480 × 900**. Every derived number below is computed at that size.

**App root** (line 11):

```css
position:relative; width:100%; height:100%; overflow:hidden;
background:#0a090d; color:#fff;
font-family:Inter,-apple-system,system-ui,sans-serif;
-webkit-font-smoothing:antialiased;
display:flex;
```

The app is a **two-column flex row**, not a grid:

| Region | CSS | Width at 1480 |
|---|---|---|
| Nav rail | `flex:none; width:84px` (→`242px` on hover) | 84 |
| Content column | `flex:1; min-width:0; height:100%; overflow:auto` | 1396 |

`overflow:hidden` on the root + `overflow:auto` on the content column means **only the content column scrolls**; the rail is fixed and always fully visible. There is no window-level scroll.

**There is no page-level `max-width`.** Content is constrained by *per-screen* padding and *per-screen* max-widths only:

| Screen | Container padding | max-width |
|---|---|---|
| Home | `padding-bottom:64px` only (no top padding — hero is flush) | none (full-bleed) |
| Browse | `56px 48px 64px` | none |
| Search | `56px 48px 64px` | **900px** |
| Anime | `56px 48px 64px` | none |
| You | `56px 48px 64px` | **760px** |

**Gutter = 48px** everywhere on desktop. On Home the 48px is applied *per-section* rather than on the container, because the horizontal shelves must bleed:

- Section headers: `padding:0 48px`
- Horizontal scrollers: `padding:0 48px 6px` — padding *inside* the scroll container, so card 1 aligns to the gutter but cards scroll edge-to-edge
- The Tonight billboard: `margin:0 48px`
- The airing grid and the party card: `padding:0 48px`

Usable content width on padded screens: **1396 − 96 = 1300px**.

**All grid structures in the build:**

| Location | `grid-template-columns` | `gap` | Item count | Computed item width @1480 |
|---|---|---|---|---|
| Browse poster grid | `repeat(7,1fr)` | `16px 14px` | 21 (3 rows) | 173.7 × 260.6 |
| Home "Next episode drops" | `repeat(3,1fr)` | `1px` | 3 | 432.7 |
| Anime top pair | `1.1fr 1.4fr` | `24px` | 2 | 561.4 / 714.6 |
| Detail synopsis block | `1.5fr 1fr` | `36px` | 2 | 494.4 / 329.6 |
| Detail episodes | `1fr 1fr` | `12px 24px` | 4 (2 rows) | 418 each |
| Detail episode row (inner) | `120px 1fr` | `13px` | — | 120 / 285 |
| Detail "More like this" | `repeat(4,1fr)` | `14px` | 4 | 204.5 × 306.8 |
| Vibe panel grid | `repeat(5,1fr)` | `14px 12px` | 10 | 142.4 × 213.6 |
| Search "Recent" row | `40px 1fr auto` | `14px` | — | — |
| Anime airing row | `1fr auto` | `14px` | — | — |
| You row | `1fr auto auto` | `12px` | — | — |
| Server row | `auto 1fr auto` | `12px` | — | — |
| Party member row | `auto 1fr auto` | `11px` | — | — |

**Wrapper page** (`Umbra Desktop.dc.html`) — presentation shell only, not part of the app:

```css
min-height:100vh;
background:radial-gradient(ellipse at 20% 0%,rgba(124,58,237,.13),transparent 52%),#08080b;
color:#fff; font-family:Inter,system-ui,sans-serif;
padding:52px 48px 80px;
display:flex; flex-direction:column; gap:34px; align-items:center;
```
- `body{margin:0;background:#08080b}`; `a{color:#c4b5fd}` / `a:hover{color:#ddd6fe}`
- Header `max-width:74ch; align-self:flex-start`; eyebrow 11px/600/`.24em`/uppercase/`#c4b5fd`; h1 40px/600/`-.045em`/1.06; body 14.5px/1.65/`rgba(255,255,255,.55)`/`text-wrap:pretty`
- App container `max-width:1480px`
- Four note cards: `width:266px`, `padding:14px 16px`, `radius:14px`, `border:1px solid rgba(255,255,255,.08)`, `background:rgba(255,255,255,.03)`, gap 14px, inner gap 5px; title 12.5px/600, body 11.5px/1.55/`rgba(255,255,255,.5)`

**Browser chrome** (`browser-window.jsx`): app is mounted at `width = Math.max(960, Math.min(1480, window.innerWidth − 96))`, `height=860`. Frame consumes **44px tab bar + 40px toolbar = 84px**, so the app's own viewport inside the frame is `height − 84` (776px at 860). Frame tokens: `borderRadius:10`, `boxShadow:'0 24px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(0,0,0,0.1)'`, `barBg:'#202124'`, `tabBg:'#35363a'`, `text:'#e8eaed'`, `dim:'#9aa0a6'`, `urlBg:'#282a2d'`, url bar `height:30 / borderRadius:15 / fontSize:13`, traffic lights `12px` circles `#ff5f57 / #febc2e / #28c840` gap 8. URL shown: `umbra.app/home`. Note the frame's content slot has `background:'#fff'` — the app must paint its own `#0a090d`, which it does.

**Effective minimum width: 960px** (the wrapper's clamp floor). Below that the 7-up Browse grid and the 2-up episode grid have no declared fallback — you will need to author responsive breakpoints yourself; the mockup declares none.

---

## B. Design tokens

### Fonts

Loaded (line 10): `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Instrument+Serif:ital@0;1&display=swap`

| Role | Stack | Weights used | Where |
|---|---|---|---|
| **UI / body** | `Inter,-apple-system,system-ui,sans-serif` (set once on root, inherited) | 400, 500, 600, **700** | All labels, metadata, buttons, synopses, nav |
| **Display** | `'Instrument Serif',Georgia,serif` — **always `font-weight:400`** | 400 | Every large title and every section-level heading that isn't an uppercase eyebrow |
| **Numeral / mono** | `ui-monospace,Menlo,monospace` (no webfont) | 400, 600 | Section index numbers, counts, timecodes, episode numbers, airing clock times, server tags |

Confirmed. `Instrument Serif` italic (`ital@0;1`) is loaded but **never used** — you can drop `;1` from the request. Weight 700 Inter is loaded and used exactly once (provider short codes, `font-weight:700`).

**Every mono usage, exhaustively:**

| Element | Size | Weight | Tracking | Color |
|---|---|---|---|---|
| Home section index `01`–`06` | 10.5px | 600 | `.14em` | `#c4b5fd` |
| Vibe card `24 TITLES` | 10px | 400 | `.14em` | `rgba(255,255,255,.42)` |
| Airing clock `Fri 23:30` | 9px | 400 | `.1em` | `rgba(255,255,255,.34)` |
| Detail episode number `E7` | 10px | 400 | — | `#c4b5fd` |
| Server tag `PLAYING` | 9.5px | 400 | `.1em`, uppercase | per-row (`s.tagColor`) |
| Player timecodes `42:18` / `-1:09:52` | 10.5px | 400 | — | `rgba(255,255,255,.55)` |

**Every Instrument Serif usage:**

| Element | Size | line-height | letter-spacing |
|---|---|---|---|
| Home hero H1 | **78px** | `.9` | `-.02em` (+ `text-wrap:balance`) |
| Detail modal H1 | **52px** | `.92` | `-.02em` |
| Browse / Search / Anime page H1 | **48px** | `1` | `-.02em` |
| Tonight billboard H3 | **44px** | `.94` | `-.02em` |
| You profile name | **34px** | `1` | — |
| Anime "Next up" line | **30px** | `1.04` | — |
| Panel title | **28px** | `1` | — |
| Vibe card label | **28px** | `1.02` | — |
| Detail "Episodes" heading | **26px** | `1` | — |
| Party card headline | **26px** | `1.06` | — |
| Airing countdown `2d 04h` | **26px** | `1` | — (`#c4b5fd`) |
| Detail "More like this" heading | **24px** | `1` | — |
| Anime list countdown | **20px** | — | — (`#c4b5fd`) |

**Inter size ramp actually used:** 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 24. (No 16, 17, 18, 20 — the sans never goes above 15px except the 24px avatar initial. All large type is serif. This is load-bearing to the identity.)

**The uppercase eyebrow pattern** appears in three sizes and must be kept consistent:
- Section H2 (Home/Anime/Search/You): `font-size:11px; font-weight:600; letter-spacing:.24em; text-transform:uppercase; color:rgba(255,255,255,.48)`
- Detail "Where to watch" H2: `font-size:10.5px; font-weight:600; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.4)`
- Anime "Next up": `font-size:10.5px; letter-spacing:.2em; text-transform:uppercase; color:rgba(255,255,255,.44)` (weight 400)

### Surface

```
--surface-app:        #0a090d   /* root bg; also the text color on all white buttons */
--surface-page:       #08080b   /* wrapper page only */
--surface-player:     #000
--surface-modal:      #131217   /* detail modal card */
--surface-panel:      rgba(19,18,23,.96)   /* vibe/servers/party panel card */
--surface-tile:       #100f14   /* airing tile */
--surface-tile-hover: #17151d   /* airing tile :hover */
--surface-avatar-ring:#14121a   /* 2px border on overlapped party avatars */
--surface-on-violet:  #140f22   /* initial glyph inside violet avatars */

--rail-bg: linear-gradient(180deg,rgba(14,13,18,.92),rgba(10,9,13,.98));

--scrim-detail: rgba(4,4,7,.7)    /* + backdrop-filter:blur(8px) */
--scrim-panel:  rgba(4,4,7,.68)   /* + backdrop-filter:blur(8px) */
```

Translucent fills, exhaustive: `rgba(255,255,255,.02)` (anime right card, lowest-signal server row), `.03` (wrapper note, party panel gradient tail, server row), `.06` (search field, panel close button), `.07` (secondary icon buttons, player pills, airing grid hairline bg), `.08` (hero "More info"), `.09` (active nav item, "Join the room"), `.13` (player play button).

### Accent

```
--accent:        #c4b5fd   /* THE accent. rings, index numerals, active underline,
                              episode numbers, countdowns, progress fills, ticks */
--accent-hi:     #ddd6fe   /* wrapper link hover only */
--accent-text:   #ece7ff   /* text on tinted violet chips/buttons */
--accent-deep:   #7c3aed   /* only inside rgba() gradient stops */
--accent-deeper: #6d28d9   /* avatar gradient terminus */
```

Violet tint scale: fills `rgba(196,181,253,.07)` (search chip) / `.1` ("Watch together"); borders `rgba(196,181,253,.18)` (party card) / `.2` (party panel header) / `.22` (search chip) / `.3` ("Watch together"); gradient stops `rgba(124,58,237,.2)` / `.22`.

### Status

```
--ok:      #4ade80   /* source "playing"/"ready" dot, player source pill dot */
--warn:    #fbbf24   /* ★ rating; caption-warning base */
--warn-fg: #fde68a   /* caption-warning text */
--warn-bd: rgba(251,191,36,.26)
--warn-bg: rgba(251,191,36,.11)
--bad:     #f87171   /* "Failed" source */
--ok-bd:   rgba(74,222,128,.3)
--ok-bg:   rgba(74,222,128,.09)
```

### Text alpha ladder (every value in the file)

```
#fff                      titles, active nav, primary labels
rgba(255,255,255,.72)     panel close X stroke
rgba(255,255,255,.68)     detail synopsis
rgba(255,255,255,.62)     hero synopsis
rgba(255,255,255,.6)      detail meta row
rgba(255,255,255,.56)     hero progress caption
rgba(255,255,255,.55)     rail username; player timecodes; hero search icon stroke; Tonight meta
rgba(255,255,255,.5)      inactive nav item; vibe-panel description; party subtitle
rgba(255,255,255,.48)     section H2 eyebrow; player "now playing"
rgba(255,255,255,.45)     search-page icon stroke; anime ring sub; server "Ready" tag
rgba(255,255,255,.44)     anime page subtitle; anime ep line; episode blurb; You stats; Anime "Next up"
rgba(255,255,255,.42)     vibe card count; inactive segment/season; anime list ep; "All" link
rgba(255,255,255,.4)      hero search placeholder; resume tag; airing ep; "Where to watch" H2; trending meta (see .38)
rgba(255,255,255,.38)     trending card meta; party member state
rgba(255,255,255,.36)     browse grid meta; You row sub; "Not here yet" body; anime shelf meta
rgba(255,255,255,.34)     search-field placeholder; airing clock time
rgba(255,255,255,.32)     episode duration
rgba(255,255,255,.28)     all chevron strokes
```

### Border alpha ladder

```
.06  rail border-right; all hairline row tops (search/anime/party)
.07  airing grid hairline background; You row top
.08  browse segment underline base; anime right card; wrapper note
.09  vibe card; anime left card; neutral server row
.10  search field; panel card
.12  panel close button; provider tile
.13  dashed placeholder cards  (border-style: dashed)
.14  hero glass pill; player CC/speed/Episodes pills
.16  detail secondary icon buttons; anime format badge
.18  player back button; player progress track
.20  player play button; "Join the room"; detail close button
.22  hero "More info"; certificate pill; phone sheet handle
.30  hover play-overlay circle
```

### Radius

```
--r-xs:  5px    certificate pill
--r-sm:  6px    recent thumb; anime format badge
--r-8:   8px    detail episode thumb; party panel mini poster
--r-9:   9px    related poster; provider tile; vibe-panel poster
--r-10:  10px   browse grid poster; browser window frame
--r-11:  11px   rail nav item; resume/trending poster
--r-12:  12px   player caption-warning banner
--r-13:  13px   server row
--r-14:  14px   airing grid; search field; party panel header card; dashed cards; wrapper note
--r-15:  15px   vibe card
--r-16:  16px   Home "Room is open" card
--r-18:  18px   Tonight billboard; detail modal; panel card; anime cards
--r-full:99px   every pill, circle, dot, progress track and bar
```

Progress bar heights: `2.5px` (episode thumb), `4px` (player scrubber, anime episode ticks).

### Elevation

```
--sh-poster:  0 16px 34px -16px rgba(0,0,0,.9)   /* 172px shelf posters */
--sh-grid:    0 12px 26px -14px rgba(0,0,0,.9)   /* browse grid posters */
--sh-overlay: 0 40px 100px -20px rgba(0,0,0,.9)  /* detail modal + all panels */
--sh-frame:   0 24px 80px rgba(0,0,0,.35), 0 0 0 1px rgba(0,0,0,.1)  /* browser chrome */
```

Note: shelf posters and browse-grid posters carry **different** shadows; the anime shelf posters, related posters and vibe-panel posters carry **none**.

### Glass (`backdrop-filter`, always paired with `-webkit-` prefix)

```
blur(8px)                  detail scrim; panel scrim
blur(12px)                 hover play-overlay circle; detail close button
blur(16px)                 hero party icon button
blur(16px) saturate(180%)  hero search pill
blur(24px) saturate(180%)  player play/pause button
```

### Motion

```
--ease: cubic-bezier(.22,1,.36,1)        /* the only easing curve in the build */

width      220ms var(--ease)   rail collapse/expand
transform  200ms var(--ease)   card hover lift
opacity    180ms               (no easing declared) trending play-overlay reveal
background 800ms var(--ease)   ambient colour field crossfade
```

Hover displacements: `translateY(-6px)` (resume, trending, vibe cards) / `translateY(-5px)` (browse grid). **No scale transforms anywhere.**

### Gradients

**Poster-art generator** (line 574) — the single source of all artwork:

```js
const A = (a, b) => `linear-gradient(155deg,${a} 0%,${b} 100%)`;
```

`ART` map (15 keys):

```
shogun     #7f2d3a → #1d1116      arcane     #5b3d9e → #160f27
dune       #8a6a3f → #241a12      frieren    #3f7f6e → #111d1a
severance  #2b6f8f → #101a22      jjk        #4a4f7a → #12141f
bear       #9a6b2f → #1e1610      samurai    #8c3a2a → #1d100c
boys       #8f2f2f → #1d0f0f      fallout    #7d6a2b → #1c1810
chainsaw   #8a5a2c → #1d1410      solo       #2f5c8f → #101823
dandadan   #7c3f7a → #1c1020      poor       #6f8f4a → #161d10
oppen      #6f6f78 → #15151a
```

Provider tile gradients: `HULU #1a7f4b→#0d3b24`, `MAX #3f3fa0→#1b1b45`, `PRIME #1f6f8f→#0f2a35`, `APPLE #4a4a52→#1c1c22`, `CR #c26a1f→#3a1e08`, `NFLX #8f2020→#2c0c0c`, `HIDIVE #1f6f8f→#0f2a35`.

Vibe-card art (translucent, so the ambient shows through): `A("rgba(139,92,246,.22)","rgba(20,17,28,.94)")`, `A("rgba(45,140,110,.2)","rgba(13,22,20,.94)")`, `A("rgba(80,110,160,.2)","rgba(12,16,24,.94)")`, `A("rgba(190,120,40,.2)","rgba(24,18,12,.94)")`, `A("rgba(191,120,150,.2)","rgba(24,15,20,.94)")`.

**Ambient field** (line 582) — 5 keys only, all following one formula:

```
radial-gradient(ellipse 90% 60% at 20% 0%, <tint>, transparent 62%)

shogun     rgba(176,68,85,.28)
dune       rgba(211,160,82,.26)
frieren    rgba(84,179,154,.24)
arcane     rgba(124,90,223,.28)
severance  rgba(59,140,175,.26)
```

Fallback for the other 10 keys is `AMBIENT.shogun` (rose). If you extend the catalogue you must extend this map or everything reads rose.

**Scrims:**

```css
/* hero, horizontal */  linear-gradient(90deg,rgba(10,9,13,.94) 0%,rgba(10,9,13,.6) 42%,rgba(10,9,13,.05) 78%)
/* hero, vertical   */  linear-gradient(0deg,#0a090d 2%,rgba(10,9,13,.1) 46%,transparent 74%)
/* tonight billboard*/  linear-gradient(90deg,rgba(10,9,13,.92),rgba(10,9,13,.2) 62%)
/* detail backdrop  */  linear-gradient(0deg,#131217 4%,rgba(19,18,23,.4) 46%,transparent 82%)
/* resume poster    */  linear-gradient(0deg,rgba(0,0,0,.65),transparent 55%)
/* player top bar   */  linear-gradient(180deg,rgba(0,0,0,.85),rgba(0,0,0,0))
/* player bottom bar*/  linear-gradient(0deg,rgba(0,0,0,.9),rgba(0,0,0,0))
/* player vignette  */  radial-gradient(ellipse at center,rgba(0,0,0,.1),rgba(0,0,0,.74))
```

**Tinted card gradients:**

```css
/* Home "Room is open" */ linear-gradient(120deg,rgba(124,58,237,.2),rgba(255,255,255,.02) 70%)
/* Anime "Next up"     */ linear-gradient(150deg,rgba(124,58,237,.2),rgba(255,255,255,.02) 66%)
/* Party panel header  */ linear-gradient(140deg,rgba(124,58,237,.22),rgba(255,255,255,.03))
/* Avatars             */ linear-gradient(145deg,#c4b5fd,#6d28d9)
/*                     */ linear-gradient(145deg,#7dd3fc,#2563eb)
/*                     */ linear-gradient(145deg,#fda4af,#be123c)
```

### Scrollbar (declared globally in `<helmet>`)

```css
::-webkit-scrollbar{width:8px;height:8px}
::-webkit-scrollbar-thumb{background:rgba(255,255,255,.14);border-radius:99px}
::-webkit-scrollbar-track{background:transparent}
```

This is why every horizontal shelf carries `padding-bottom:6px` — clearance for the 8px bar.

---

## C. Chrome & navigation

**Answer: a left rail only. There is no persistent top bar.**

This is the single most important structural fact and the biggest trap. The floating search + party cluster is positioned **inside the Home hero** (`top:26px; right:40px`, inside the `isHome` branch). On Browse, Search, Anime and You there is **no header whatsoever** — no search box, no avatar, no logo above the fold other than the rail. You should decide whether to fix that; the mockup does not.

### The rail

```css
position:relative; z-index:50; flex:none;
width:84px;                    /* style-hover → width:242px */
height:100%; overflow:hidden;
transition:width 220ms cubic-bezier(.22,1,.36,1);
background:linear-gradient(180deg,rgba(14,13,18,.92),rgba(10,9,13,.98));
border-right:1px solid rgba(255,255,255,.06);
display:flex; flex-direction:column;
```

Expansion is triggered by **hovering the rail itself** (`style-hover` on the container), not by a toggle button. There is no pin/lock control and no persisted state — it is purely transient. It expands **in-flow** (`flex:none` + `width`), so the content column reflows and *narrows by 158px* during the transition. That is a deliberate choice but it will reflow the Browse grid and re-wrap shelves; if you don't want that, overlay the expansion instead (`position:absolute` at 242 over a fixed 84px spacer) — but note that changes the look, since the mockup genuinely pushes.

**Three vertical zones:**

**1. Logo — `flex:none; height:78px; display:flex; align-items:center; gap:13px; padding:0 26px`**

SVG `34 × 27`, `viewBox="0 0 40 32"`, `flex:none`. The eclipse mark:

```html
<circle cx="14" cy="16" r="13" fill="none" stroke="#c4b5fd" stroke-width="2"/>
<circle cx="26" cy="16" r="13" fill="none" stroke="rgba(255,255,255,.4)" stroke-width="2"/>
<path d="M20 4.6a13 13 0 0 1 0 22.8 13 13 0 0 1 0-22.8Z" fill="#c4b5fd"/>
```

Two overlapping rings — one violet, one 40%-white — with the lens-shaped intersection filled violet. **There is no "Umbra" wordmark on desktop, in either rail state.** (The phone build *does* show the wordmark next to the mark at 16.5px/500/`-.02em`.) The `gap:13px` exists for a sibling that was never added — if you want the wordmark on hover, that gap is where it goes.

**2. Nav list — `flex:1; display:flex; flex-direction:column; gap:3px; padding:10px 14px`**

Item:

```css
display:flex; align-items:center; gap:15px;
height:44px; padding:0 12px; border-radius:11px;
border:0; cursor:pointer; font-family:inherit;
background: <active ? rgba(255,255,255,.09) : transparent>;
color:      <active ? #fff : rgba(255,255,255,.5)>;
```
- Icon slot: `flex:none; width:22px; height:22px; display:flex; align-items:center; justify-content:center`
- Label: `font-size:13.5px; font-weight: <active ? 600 : 500>; white-space:nowrap`

**Active state = tinted pill + full-white text + weight 600.** No left indicator bar, no icon fill swap, no accent color on the active item (the accent is reserved for data, not for chrome).

Five items, in order. Icons are all `22×22`, `viewBox="0 0 22 22"`, `stroke:currentColor`, `stroke-width:1.6`, `stroke-linecap/linejoin:round`, `fill:none`:

| # | Label | Icon geometry |
|---|---|---|
| 1 | Home | `M3.4 9.2 11 3.2l7.6 6v9.2a.9.9 0 0 1-.9.9h-4.2v-5.6H8.5v5.6H4.3a.9.9 0 0 1-.9-.9V9.2Z` |
| 2 | Search | `<circle cx=10 cy=10 r=6.4 sw=1.6>` + `M14.8 14.8 18.6 18.6` |
| 3 | Browse | `M3 5.6h16M3 11h16M3 16.4h10` (three rules, last one short) |
| 4 | Anime | `M11 3.4c2.2 2.6 2.2 5.6 0 8.2-2.2-2.6-2.2-5.6 0-8.2Z` + `M11 11.6c2.9-1.3 5.6-.5 7.4 2-3.1.9-5.7.2-7.4-2Zm0 0c-2.9-1.3-5.6-.5-7.4 2 3.1.9 5.7.2 7.4-2Z` + `M11 13.6v5` (a stylised flower/sakura) |
| 5 | You | `<circle cx=11 cy=8 r=3.4 sw=1.6>` + `M4.6 18.4c.6-3.2 3.2-5 6.4-5s5.8 1.8 6.4 5` |

Click handler: `pick: () => this.set({ screen: id, detailKey: null, panel: null, player: false })` — navigating via the rail **hard-closes every overlay**, including the player.

**3. Account footer — `flex:none; padding:16px 26px; display:flex; align-items:center; gap:13px`**
- Avatar: `32×32`, `border-radius:99px`, `background:linear-gradient(145deg,#c4b5fd,#6d28d9)`, centred `N` at `12.5px/600`, `color:#140f22`
- Name: `Nishant`, `13px`, `rgba(255,255,255,.55)`, `white-space:nowrap`

**It is a `<div>`, not a button — there is no click handler and no menu.** The only way to reach account/profile is the "You" nav item. Add a real menu here.

**Icon axis geometry.** The logo (`padding:0 26px`), nav icons (`14px` list padding + `12px` item padding = 26), and avatar (`padding:0 26px`) all start at **x = 26**, giving a clean vertical alignment. The 22px icon therefore centres at **x = 37**, while the 84px rail centres at 42 — icons sit **5px left of the rail's optical centre**. Reproduce this (it makes the expansion feel like the labels grow rightward off a fixed spine) rather than "fixing" it.

**Label clipping caveat.** Labels are always in the DOM; at 84px they are hidden only by `overflow:hidden`. A label begins at `14 + 12 + 22 + 15 = 63px`, so **~21px of the first character is visible in the collapsed state**. Implement as `opacity:0 → 1` (plus `pointer-events`) alongside the width transition, or you will ship a sliver of clipped text.

At 242px, labels get `242 − 63 − 14 = 165px` of room.

### Search affordance

Only one, and only on Home: a **non-interactive** glass pill in the hero.

```css
display:flex; align-items:center; gap:9px;
height:38px; padding:0 16px; border-radius:99px;
background:rgba(0,0,0,.36); border:1px solid rgba(255,255,255,.14);
backdrop-filter:blur(16px) saturate(180%);
```
Icon `15×15` (`circle r=6.2 sw=1.5` + `M13.6 13.6 17 17`), stroke `rgba(255,255,255,.55)`. Label "Search Umbra", `12.5px`, `rgba(255,255,255,.4)`. **It is a `<div>` with no `onClick`.** Wire it to `screen:"search"`, and give it a focus ring; also add `⌘K`, which the mockup does not have.

Beside it, the party button: `38×38`, `border-radius:99px`, `border:1px solid rgba(255,255,255,.14)`, `background:rgba(0,0,0,.36)`, `backdrop-filter:blur(16px)` (no `saturate` — deliberate or not, it differs from the pill), two-person icon `16×16` stroke `#fff` `sw 1.5`. → `panel:"party"`.

---

## D. Screen inventory

State (line 615):

```js
state = { screen:"home", detailKey:null, panel:null, season:1,
          playing:true, player:false, prevScreen:"home" }
```

(`prevScreen` is declared and never read — dead.)

### Five base screens (mutually exclusive, `sc-if` on `screen`)

| Screen | Flag | Entered by | Purpose |
|---|---|---|---|
| **Home** | `isHome` | rail item 1 (default) | Resume hero + 6 numbered editorial sections |
| **Browse** | `isBrowse` | rail item 3; Trending "All"; You → Watchlist | 7-up poster grid with Films/Series/Categories tabs |
| **Search** | `isSearch` | rail item 2; Search vibe chips | Query field + vibe chips + recent list |
| **Anime** | `isAnime` | rail item 4 | Seasonal tracker: next-up card + airing list + season shelf |
| **You** | `isYou` | rail item 5; You rows Downloads/History/Settings | Profile header + settings-style list + roadmap placeholders |

### Three overlays (stacked, not routes)

| Overlay | z-index | Open when | Entered by |
|---|---|---|---|
| **Player** | `75` | `player === true` | Hero "Resume"; detail "Play"; any episode row; party "Start together" |
| **Detail modal** | `80` | `detailKey !== null` | Any poster/card/row `open()`; hero "More info"; Tonight billboard |
| **Panel** | `85` | `panel !== null` | see below |

Panel is one component with three bodies:

| Variant | `panelTitle` | `panelWidth` | Opened by |
|---|---|---|---|
| `vibe` | "Slow-burn revenge" | `820px` | Home vibe cards; Search vibe chips |
| `party` | "Watch party" | `460px` | hero party button; "Join the room"; detail "Watch together"; You → Watch party |
| `servers` | "Choose a source" | `420px` | player source pill; player "Switch"; detail *trailer* button |

### Navigation graph, complete

```
rail(5) ─────────────────────────────► screen, and clears detailKey/panel/player

Home hero  "Resume"      → play()                        → player
Home hero  "More info"   → openTitle("shogun")           → detail
Home hero  party button  → panel:"party"
01 resume card           → openTitle(k)                  → detail
02 Tonight billboard     → openTitle("dune")             → detail
03 vibe card             → panel:"vibe"
04 airing tile           → openTitle(k)                  → detail
05 "All"                 → screen:"browse"
05 trending card         → poster().open                 → detail
06 "Join the room"       → panel:"party"

Browse  segment tabs     → pick:()=>{}                     ** INERT **
Browse  poster           → detail
Search  field            → (no handler)                    ** INERT **
Search  vibe chip        → { screen:"search", panel:"vibe" }
Search  recent row       → detail
Anime   airing row       → detail
Anime   shelf card       → detail
You     Watchlist        → screen:"browse"
You     Watch party      → panel:"party"
You     Downloads/History/Settings → screen:"you"          ** SELF NO-OP **

detail  scrim / X        → detailKey:null
detail  "Play"           → play()                         → player
detail  "+" button       → (no handler)                    ** INERT **
detail  trailer button   → openPanelVibeAsTrailer → panel:"servers"   ** MISNAMED **
detail  "Watch together" → panel:"party"
detail  season tab       → season:n
detail  episode row      → play()
detail  related poster   → detail (swaps title in place)

player  back             → player:false
player  source pill      → panel:"servers"
player  big play/pause   → playing:!playing
player  "Switch"         → panel:"servers"
player  "Episodes"       → backToDetailEpisodes → player:false  (identical to back)

panel   scrim / X        → panel:null
panel   server row       → closePanel   ** does not switch source **
panel   party "Start together" → play()
panel   vibe poster      → detail
```

### Three behaviours you must decide about before building

1. **`play()` does not clear `detailKey`.** Since detail is `z:80` and player is `z:75`, playing from the detail modal leaves the modal rendered **on top of the player**. Fix: either clear `detailKey` in `play()`, or raise the player above the detail modal.
2. **The player covers the rail.** It is `position:absolute; inset:0` on the *root* flex container, a sibling of the rail (`z:50`). The wrapper page's note claims it "takes over the content column"; the DOM says otherwise. Pick one deliberately — a player that leaves the rail visible is the more interesting desktop claim, and matches the stated intent.
3. **`openPanelVibeAsTrailer` opens `servers`, not a trailer.** The film-with-play icon in the detail action row is a source picker in disguise. Rename and decide what that button should actually be.

---

## E. Per-screen layout spec

### Ambient layer (every screen)

First child of the content column:

```css
position:absolute; inset:0; pointer-events:none;
transition:background 800ms cubic-bezier(.22,1,.36,1);
background: <AMBIENT[detailKey ?? "shogun"]>;
```

It is a sibling that precedes the screen wrapper (`position:relative`, no z-index), so it paints **behind** all content and shows through anywhere content is transparent. Two consequences to reproduce carefully:

- `inset:0` on an `overflow:auto` container pins it to the **viewport box, not the scroll height** — the ambient does **not** scroll with content. That is the intended effect (a fixed colour field the page slides over); implement it as `position:sticky`/fixed-within, not as a scrolling child.
- It is keyed to `detailKey`, so **opening a detail card re-tints the whole page behind the modal** over 800ms. This is the "ambient colour field" mechanic and it is the app's signature move.

---

### E1. Home

```css
position:relative; display:flex; flex-direction:column; gap:52px; padding-bottom:64px;
```

**No top padding** — the hero is flush with the top of the content column, running under nothing (there is no top bar).

Vertical stack: `hero (560px)` → 52px → `01 Still watching` → 52px → `02 Tonight` → 52px → `03 In the mood for` → 52px → `04 Next episode drops` → 52px → `05 Trending today` → 52px → `06 Room is open` → 64px.

Every section: `display:flex; flex-direction:column; gap:16px` (header → content).

Section header: `padding:0 48px; display:flex; align-items:baseline; gap:12px` — mono index + uppercase H2, baseline-aligned. Section 05's header additionally uses `justify-content:space-between` with the index+H2 wrapped in a nested flex and an "All" text button on the right (`12px`, `rgba(255,255,255,.42)`, `border:0; background:none; padding:0`).

Sections 01–05 have their padding on the *inner* element so shelves and grids bleed correctly; section 06 alone puts padding on the `<section>` (`padding:0 48px 8px`).

**Hero:** see §F. **Shelves 01/03/05:** see §G. **02/04/06:** see §G.

---

### E2. Browse

```css
position:relative; padding:56px 48px 64px;
display:flex; flex-direction:column; gap:26px;
```

1. **H1** — "Browse", Instrument Serif 400, `48px`, `line-height:1`, `-.02em`.
2. **Segment tabs** — `display:flex; gap:26px; border-bottom:1px solid rgba(255,255,255,.08)`. Each: `padding:0 0 13px; font-size:14px; font-weight:<600|500>; color:<#fff|rgba(255,255,255,.42)>; border-bottom:2px solid <#c4b5fd|transparent>; margin-bottom:-1px` (the −1px pulls the 2px indicator over the 1px container rule). Items: **Films / Series / Categories**; index 0 hard-coded active; `pick` is a no-op.
3. **Poster grid** — `display:grid; grid-template-columns:repeat(7,1fr); gap:16px 14px`. 21 items → 3 rows of 7. Note the asymmetric gap: **16px row / 14px column.**
   - Art: `width:100%; aspect-ratio:2/3; border-radius:10px; box-shadow:0 12px 26px -14px rgba(0,0,0,.9); display:block` → **173.7 × 260.6** at 1480.
   - Text block: `gap:8px` from art, internal `gap:1px`. Title `12px/500/1.28`, `nowrap` + ellipsis. Meta `10.5px`, `rgba(255,255,255,.36)`.
   - Hover: `transform:translateY(-5px)`, `200ms cubic-bezier(.22,1,.36,1)`.
   - No hover play overlay here (unlike Trending). No focus-visible style declared anywhere — you must add one.

---

### E3. Search

```css
position:relative; padding:56px 48px 64px;
display:flex; flex-direction:column; gap:34px;
max-width:900px;
```

1. **H1** — "What are you after?" Instrument Serif `48px/1/-.02em`.
2. **Search field** — `display:flex; align-items:center; gap:11px; height:52px; padding:0 18px; border-radius:14px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.1)`. Icon `17×17`, stroke `rgba(255,255,255,.45)`, `sw 1.6`. Placeholder text `14.5px`, `rgba(255,255,255,.34)`: "A title, a person, or a feeling…". Rendered as a `<span>` — needs to become a real `<input>` with a focus state.
3. **"Or start from a vibe"** — H2 eyebrow, `gap:14`. Chips: `display:flex; flex-wrap:wrap; gap:9px`. Chip: `padding:11px 16px; border-radius:99px; border:1px solid rgba(196,181,253,.22); background:rgba(196,181,253,.07); color:#ece7ff; font-size:13px`. Eight chips: Slow-burn revenge, Cosy low stakes, Beautifully bleak, One perfect heist, Found family, Quietly devastating, Style over plot, Comfort rewatch.
4. **"Recent"** — section `gap:6px`, H2 has `margin:0 0 8px`. Row: `display:grid; grid-template-columns:40px 1fr auto; gap:14px; align-items:center; padding:12px 0; border-top:1px solid rgba(255,255,255,.06)`. Thumb `width:40px; aspect-ratio:2/3; border-radius:6px` (→ 40×60). Title `14px/500`; meta `11.5px/rgba(.4)`. Chevron `15×15`, `M7.5 4.5 13 10l-5.5 5.5`, stroke `rgba(255,255,255,.28)`, `sw 1.6`, round cap. Four items. **No hover state declared on these rows** — add one.

---

### E4. Anime

```css
position:relative; padding:56px 48px 64px;
display:flex; flex-direction:column; gap:34px;
```

1. **Header** (`gap:8`): H1 "Anime" `48px`; sub `13px`, `rgba(255,255,255,.44)`: "Summer 2026 · six shows followed".

2. **Two-column pair** — `display:grid; grid-template-columns:1.1fr 1.4fr; gap:24px; align-items:stretch` → 561.4 / 714.6 at 1480.

   **Left — "Next up" card.** `border-radius:18px; border:1px solid rgba(255,255,255,.09); background:linear-gradient(150deg,rgba(124,58,237,.2),rgba(255,255,255,.02) 66%); padding:26px; display:flex; flex-direction:column; justify-content:space-between; gap:18px`.
   - Top row (`space-between; gap:14`): left stack `gap:4` = eyebrow "Next up" (`10.5px/.2em/uppercase/rgba(.44)`) + "Frieren S2 · Ep 4" (Instrument Serif `30px/1.04`); right ring `74×74`:
     ```html
     <circle cx=37 cy=37 r=32 stroke="rgba(255,255,255,.14)" stroke-width=3/>
     <circle cx=37 cy=37 r=32 stroke="#c4b5fd" stroke-width=3 stroke-linecap="round"
             stroke-dasharray="201" stroke-dashoffset="151" transform="rotate(-90 37 37)"/>
     ```
     Centred two-line label: "2d" `15px/600` over "04h" `9.5px/rgba(.45)`.
   - Episode ticks: `display:flex; gap:4px`; 12 spans, each `flex:1; height:4px; border-radius:99px`, `#c4b5fd` for `i < 3` else `rgba(255,255,255,.13)`.
   - Footer: "3 of 12 watched", `12px`, `rgba(255,255,255,.42)`.

   **Right — airing list.** `border-radius:18px; border:1px solid rgba(255,255,255,.08); background:rgba(255,255,255,.02); padding:8px 22px; display:flex; flex-direction:column`. Reuses the `airing` array. Row: `display:grid; grid-template-columns:1fr auto; align-items:center; gap:14px; padding:14px 0; border-top:1px solid rgba(255,255,255,.06)`. Left stack `gap:3`: title `14px/500`, ep `11px/rgba(.42)`. Right: countdown, Instrument Serif `20px`, `#c4b5fd`. (First row's `border-top` sits 8px below the card's inner top edge — that's why the card padding is `8px 22px`, not symmetric.)

3. **"Top this season"** — H2 eyebrow, `gap:16`. Shelf: `display:flex; gap:14px; overflow-x:auto; padding-bottom:6px`.
   **Note: this shelf has no `0 48px` inline padding** — it lives inside the padded container, so unlike every Home shelf it is *not* full-bleed and cannot scroll to the viewport edge. Either accept the inconsistency or make Anime's container unpadded and pad its children like Home does.
   - Card `flex:none; width:172px`; art `172px; aspect-ratio:2/3; border-radius:11px; overflow:hidden` (**no box-shadow**, unlike Home's 172px cards).
   - Format badge: `position:absolute; top:8px; left:8px; padding:3px 7px; border-radius:6px; background:rgba(0,0,0,.6); border:1px solid rgba(255,255,255,.16); font-size:9px; font-weight:600`. Values `TV` / `Film`.
   - Text `gap:9` from art, internal `gap:2`: title `13px/500/1.28`; meta `10.5px/rgba(.36)`.
   - **No hover transform.** Home's 172px cards lift by 6px; these don't. Unify.

---

### E5. You

```css
position:relative; padding:56px 48px 64px;
display:flex; flex-direction:column; gap:30px;
max-width:760px;
```

1. **Profile header** — `display:flex; align-items:center; gap:18px`. Avatar `68×68; border-radius:99px; background:linear-gradient(145deg,#c4b5fd,#6d28d9)`, centred `N` at `24px/600`, `color:#140f22`. Stack `gap:4`: name Instrument Serif `34px/1`; stats `12.5px/rgba(.44)`: "142 watched · 38 saved · 3 in progress".
2. **List** (plain `<div>` wrapper, rows are siblings). Row: `width:100%; display:grid; grid-template-columns:1fr auto auto; gap:12px; align-items:center; padding:16px 0; border-top:1px solid rgba(255,255,255,.07)`. Label `15px/500/-.01em`; sub `12.5px/rgba(.36)`; chevron `15×15/rgba(.28)`.
   Rows: Watchlist `38` → browse · Watch party `1 live` → party panel · Downloads `4 episodes` → no-op · History `142` → no-op · Settings `""` → no-op.
   No hover state declared.
3. **"Not here yet"** — H2 eyebrow, `gap:12`. Two `flex:1` cards, `gap:12` between: `padding:18px; border-radius:14px; border:1px dashed rgba(255,255,255,.13); display:flex; flex-direction:column; gap:5px`. Titles `13.5px/500`, bodies `11px/rgba(.36)`. Cards: "Live sports / Match cards, reminders" and "Sparks / Scene reels". These are roadmap placeholders — the only `border-style:dashed` in the build.

---

## F. Hero / billboard

**Geometry.** Fixed `height:560px; flex:none; position:relative`. Full width of the content column (1396px at 1480) → an effective ratio of **~2.49 : 1**. It is a **fixed pixel height, not an aspect-ratio** — at wider viewports it gets proportionally shorter, at 960px it becomes 876 × 560 (~1.56:1) and the 78px serif title will get tight against the 640px text column. Consider a `min-height:560px; aspect-ratio:21/8`-style hybrid, but note the mockup commits to 560px.

**Layer stack, bottom to top:**

1. **Art** — `position:absolute; inset:0; background:{{hero.art}}` = `ART.shogun` = `linear-gradient(155deg,#7f2d3a 0%,#1d1116 100%)`. In production this is where the still/backdrop goes; keep the gradient as the loading/fallback layer.
2. **Horizontal scrim** — `linear-gradient(90deg,rgba(10,9,13,.94) 0%,rgba(10,9,13,.6) 42%,rgba(10,9,13,.05) 78%)`. Very heavy on the left (94%), fully clear by 78%. This is what makes the desktop hero a *left-anchored editorial panel* rather than a bottom-caption image.
3. **Vertical scrim** — `linear-gradient(0deg,#0a090d 2%,rgba(10,9,13,.1) 46%,transparent 74%)`. Note it terminates in the **opaque hex `#0a090d`**, not an rgba — this is what welds the hero into the page with no visible seam. Must match the app bg exactly.

**Top-right control cluster** — `position:absolute; top:26px; right:40px; display:flex; align-items:center; gap:12px`. (Note `right:40px` while the text block uses `left:48px` — an 8px inconsistency. Pick 48 for alignment with the gutter, or keep 40 deliberately.) Contents specified in §C.

**Text block** — `position:absolute; left:48px; right:48px; bottom:56px; display:flex; flex-direction:column; gap:18px; max-width:640px`.

1. **Progress row** (`display:flex; align-items:center; gap:14px`):
   - Ring, `56×56`, `viewBox="0 0 56 56"`:
     ```html
     <circle cx=28 cy=28 r=24.5 fill=none stroke="rgba(255,255,255,.15)" stroke-width=2.6/>
     <circle cx=28 cy=28 r=24.5 fill=none stroke="#c4b5fd" stroke-width=2.6
             stroke-linecap="round" stroke-dasharray="154"
             stroke-dashoffset="{{hero.dash}}" transform="rotate(-90 28 28)"/>
     ```
     `dash = RING(154, 31) = 154 × (1 − 31/100) = 106.26`. Circumference formula: `2πr = 2π × 24.5 = 153.94`, rounded to **154**. `RING = (c, pct) => c * (1 - pct/100)`.
   - Centred label `{{hero.pctLabel}}` = "31%", `position:absolute; inset:0; flex-center; font-size:11.5px; font-weight:600`.
   - Caption: `{{hero.tag}} · {{hero.left}}` → "Season 1, Episode 7 · 38 minutes left", `12.5px`, `rgba(255,255,255,.56)`.
2. **H1** — Instrument Serif 400, **`font-size:78px; line-height:.9; letter-spacing:-.02em; text-wrap:balance`**. Content: "Shōgun".
3. **Synopsis** — `14.5px; line-height:1.6; color:rgba(255,255,255,.62)`. The full Shōgun synopsis, unclamped (no line-clamp declared — at 640px this runs 3 lines; longer synopses will grow the block upward from `bottom:56px`, which is fine but unbounded. Add a 3-line clamp).
4. **Button row** — `display:flex; align-items:center; gap:12px; padding-top:4px`:
   - **Primary "Resume"**: `height:50px; padding:0 30px; border-radius:99px; border:0; background:#fff; color:#0a090d; display:flex; align-items:center; gap:9px; font-size:14.5px; font-weight:600`. Glyph: `<svg width=12 height=13 viewBox="0 0 12 14"><path d="M1 1.4v11.2L11 7 1 1.4Z" fill="#0a090d"/></svg>`. → `play()`.
   - **Secondary "More info"**: `height:50px; padding:0 26px; border-radius:99px; border:1px solid rgba(255,255,255,.22); background:rgba(255,255,255,.08); color:#fff; font-size:14px; font-weight:500`. → detail(shogun).
   - Neither button declares a hover state. Add them.

**Rotation: no.** The hero is bound to a single hard-coded `hero` object. There is no carousel, no dot indicator, no timer, no `1 / 4` counter. (The **phone** build's Tonight billboard *does* carry a `1 / 4` mono counter — desktop deliberately drops it, because desktop's rotation-equivalent is the *Tonight* section further down the page.)

**Trailer / autoplay: none.** No `<video>`, no muted-preview logic, no hover-to-preview, no mute toggle. The only trailer-shaped affordance in the whole build is the detail modal's third icon button, and that opens the source picker (`openPanelVibeAsTrailer → panel:"servers"`). If you want hover-trailer on desktop, you are adding it, not porting it.

---

## G. Rows / shelves

### The shelf pattern (Home 01, 03, 05)

```css
display:flex; gap:<16|14>px; overflow-x:auto; padding:0 48px 6px;
```

- **Native horizontal scroll only.** No `scroll-snap`, no `scroll-behavior:smooth`, no `overscroll-behavior`, and — critically — **no arrow/chevron controls anywhere in the build.** The visible affordance is the styled 8px webkit scrollbar (`thumb: rgba(255,255,255,.14)`), which is why every shelf carries `padding-bottom:6px`.
  This is the biggest gap for a desktop build. On a pointer device a mouse-wheel does not scroll a horizontal overflow container by default. You must add either edge arrow buttons or wheel-to-horizontal translation; the mockup provides neither. If you add arrows, style them from existing tokens: `38×38`, `border-radius:99px`, `background:rgba(0,0,0,.36)`, `border:1px solid rgba(255,255,255,.14)`, `backdrop-filter:blur(16px) saturate(180%)` — i.e. the hero search-pill recipe.
- **Titles sit BELOW the art, always.** No title-on-poster anywhere in the build. Overlays on art are reserved for *data*: the resume progress ring and the trending hover-play circle.
- The `48px` padding lives inside the scroller, so card 1 aligns to the gutter and the last card can scroll flush to the viewport edge.

### 01 — Still watching

| Property | Value |
|---|---|
| Shelf gap | **16px** |
| Card | `flex:none; width:172px`, `display:flex; flex-direction:column; gap:10px` |
| Art | `172px; aspect-ratio:2/3` → **172 × 258**; `border-radius:11px; overflow:hidden` |
| Art shadow | `0 16px 34px -16px rgba(0,0,0,.9)` |
| Art scrim | `linear-gradient(0deg,rgba(0,0,0,.65),transparent 55%)` |
| Progress ring | `position:absolute; right:8px; bottom:8px; 30×30` |
| Text block | `gap:2px`; title `13px/500/1.3` nowrap+ellipsis; tag `11px/rgba(.4)` |
| Hover | `transform:translateY(-6px)`, `200ms cubic-bezier(.22,1,.36,1)` |
| Items | 5 (`hint-placeholder-count="6"`, data supplies 5) |

Ring SVG (`viewBox="0 0 30 30"`) — three stacked circles, note the **filled** first one:
```html
<circle cx=15 cy=15 r=12.6 fill="rgba(0,0,0,.55)"/>
<circle cx=15 cy=15 r=12.6 fill=none stroke="rgba(255,255,255,.22)" stroke-width=2/>
<circle cx=15 cy=15 r=12.6 fill=none stroke="#c4b5fd" stroke-width=2 stroke-linecap="round"
        stroke-dasharray="79.2" stroke-dashoffset="{{item.dash}}" transform="rotate(-90 15 15)"/>
```
`2π × 12.6 = 79.17` → **79.2**. Values: 31% → 54.6, 56% → 34.8, 78% → 17.4, 42% → 45.9, 12% → 69.7.

### 03 — In the mood for

| Property | Value |
|---|---|
| Shelf gap | **14px** |
| Card | `flex:none; width:220px; height:150px` — **fixed landscape, not aspect-ratio** |
| Card | `border-radius:15px; border:1px solid rgba(255,255,255,.09); padding:18px; display:flex; flex-direction:column; justify-content:space-between` |
| Background | translucent `A(...)` gradient — the ambient field shows through |
| Top | mono count, `{{v.count}} TITLES`, `10px`, `.14em`, `rgba(255,255,255,.42)` |
| Bottom | label, Instrument Serif `28px/1.02` |
| Hover | `translateY(-6px)` |
| Items | 5 |

Data: Slow-burn revenge (24), Cosy low stakes (31), Beautifully bleak (18), One perfect heist (12), Found family (27). All five open `panel:"vibe"` — the panel title is hard-coded "Slow-burn revenge" regardless of which card you click. Wire the label through.

### 05 — Trending today

Same card as 01 (`172px`, `aspect-ratio:2/3`, `radius 11`, `0 16px 34px -16px rgba(0,0,0,.9)`) except: shelf gap **14px**, text gap **9px**, meta alpha **.38**.

**The desktop-only hover play overlay:**

```html
<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
            opacity:0;transition:opacity 180ms" style-hover="opacity:1">
  <span style="width:46px;height:46px;border-radius:99px;background:rgba(0,0,0,.42);
               border:1px solid rgba(255,255,255,.3);backdrop-filter:blur(12px);
               display:flex;align-items:center;justify-content:center">
    <svg width="15" height="16" viewBox="0 0 12 14"><path d="M1 1.4v11.2L11 7 1 1.4Z" fill="#fff"/></svg>
  </span>
</div>
```

Combined with the card's own `translateY(-6px)`. Note the overlay's `style-hover` is on the overlay element itself, so in a React port you want `.group:hover .overlay { opacity:1 }`. Also note the overlay has **no visible play affordance until hover** — pure pointer affordance, unavailable on touch. Eight items.

### 02 — Tonight (editorial billboard, not a shelf)

```css
margin:0 48px; position:relative; display:block;
border-radius:18px; overflow:hidden;
aspect-ratio:21/8;
border:0; padding:0; cursor:pointer; text-align:left;
```
At 1480: **1300 × 495.2**. Layers: art → `linear-gradient(90deg,rgba(10,9,13,.92),rgba(10,9,13,.2) 62%)` (left-anchored, lighter than the hero's).

Content: `position:absolute; left:40px; top:0; bottom:0; display:flex; flex-direction:column; justify-content:center; gap:12px; max-width:440px` — **vertically centred**, unlike the hero's `bottom:56px`.
- reason `11.5px`, `#c4b5fd`: "Because you finished Arrival, and rated it 5"
- H3 Instrument Serif `44px/.94/-.02em`: "Dune: Part Two"
- meta `12px`, `rgba(255,255,255,.55)`: "2024 · Science fiction · 2h 46m"
- Pseudo-button `<span>` (whole card is the button): `margin-top:6px; height:40px; padding:0 20px; border-radius:99px; background:#fff; color:#0a090d; font-size:13px; font-weight:600; width:fit-content; gap:8px`, glyph `10×11` `viewBox="0 0 12 14"`.

No hover state declared on the billboard. Add at minimum a scrim-lightening or a subtle `scale(1.01)`.

### 04 — Next episode drops (hairline 3-up grid)

```css
padding:0 48px;
display:grid; grid-template-columns:repeat(3,1fr); gap:1px;
background:rgba(255,255,255,.07); border-radius:14px; overflow:hidden;
```
The `gap:1px` over a tinted container background is a **hairline-divider trick** — the gaps *are* the dividers, and `overflow:hidden` + `border-radius:14px` clips the tile corners. Reproduce exactly; do not substitute `border`.

Tile: `background:#100f14; padding:20px; border:0; display:flex; flex-direction:column; gap:10px`. Hover: `background:#17151d` (the only background-swap hover in the build). Width 432.7 at 1480.
- title `14px/500/-.01em`
- ep `11px`, `rgba(255,255,255,.4)`
- countdown row: `display:flex; align-items:baseline; gap:6px; margin-top:4px` — Instrument Serif `26px`, `#c4b5fd`, `line-height:1` + mono `9px`, `.1em`, `rgba(255,255,255,.34)`

Data: Frieren S2·E4 / 2d 04h / Fri 23:30 · Dan Da Dan S2·E9 / 16h 12m / Thu 00:26 · Solo Leveling S3·E2 / 4d 09h / Sun 12:00.

### 06 — Room is open

Section has its own `padding:0 48px 8px`.

```css
border-radius:16px;
border:1px solid rgba(196,181,253,.18);
background:linear-gradient(120deg,rgba(124,58,237,.2),rgba(255,255,255,.02) 70%);
padding:26px 30px;
display:flex; align-items:center; justify-content:space-between; gap:20px;
```
Left stack (`gap:8`):
- Headline Instrument Serif `26px/1.06`: "Shōgun, episode 7 — in twelve minutes"
- Presence row (`gap:10`): avatar stack — three `24×24` circles, `border-radius:99px`, `border:2px solid #14121a`, 2nd and 3rd with `margin-left:-8px` (8px overlap). Gradients `(145deg,#c4b5fd,#7c3aed)`, `(145deg,#7dd3fc,#2563eb)`, `(145deg,#fda4af,#be123c)`. Then `11.5px`, `rgba(255,255,255,.5)`: "Aarav, Meera and 1 more are in".

Right: "Join the room" — `flex:none; height:44px; padding:0 24px; border-radius:99px; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.09); font-size:13px; font-weight:500`.

---

## H. Detail page

**It is not a page.** On desktop, detail is a **centred modal overlay** at `z-index:80`, and the underlying screen stays mounted and dimmed. Per the wrapper's own note: *"Not a full route change — the home page stays mounted and dimmed behind it, so closing it costs nothing."* Implement it as a parallel route / modal route (Next.js intercepting route), not a page navigation, so back/close is free and scroll position is preserved.

**Container** — `position:absolute; inset:0; z-index:80; display:flex; align-items:center; justify-content:center; padding:40px`.

**Scrim** — a full-bleed `<button aria-label="Close">`: `position:absolute; inset:0; border:0; padding:0; background:rgba(4,4,7,.7); backdrop-filter:blur(8px)`. Click closes.

**Card:**

```css
position:relative; width:100%; max-width:940px; max-height:100%;
overflow:auto; border-radius:18px; background:#131217;
box-shadow:0 40px 100px -20px rgba(0,0,0,.9);
display:flex; flex-direction:column;
```
At 900 tall the card can reach `900 − 80 = 820px` and scrolls internally.

**Backdrop treatment** — `position:relative; width:100%; aspect-ratio:21/9; flex:none` → **940 × 402.9**.
- Art layer `inset:0`, `background:{{title.art}}`
- Scrim `linear-gradient(0deg,#131217 4%,rgba(19,18,23,.4) 46%,transparent 82%)` — resolves to the **card** background (`#131217`), not the page background. This is the key difference from the hero, which resolves to `#0a090d`. Get this wrong and you get a visible band.
- **No horizontal scrim** — the detail backdrop fades bottom-up only, and the title is bottom-anchored rather than left-anchored. That is the visual signature separating detail from hero.
- Close button: `position:absolute; top:20px; right:20px; 38×38; border-radius:99px; border:1px solid rgba(255,255,255,.2); background:rgba(0,0,0,.5); backdrop-filter:blur(12px)`; X `15×15`, `M5 5l10 10M15 5 5 15`, `sw 1.8`, round cap.

**Title block over the backdrop** — `position:absolute; left:40px; right:40px; bottom:26px; display:flex; flex-direction:column; gap:12px`:
- H1 Instrument Serif `52px/.92/-.02em`
- Meta row `display:flex; flex-wrap:wrap; align-items:center; gap:9px; font-size:12px; color:rgba(255,255,255,.6)`:
  `year` · `<span style="opacity:.4">·</span>` · `runtime` · cert pill (`padding:2px 7px; border-radius:5px; border:1px solid rgba(255,255,255,.22); font-size:10px; font-weight:600`) · rating (`color:#fbbf24; font-weight:600`, content `★ 8.7`)

**Ambient color usage.** Opening the modal sets `detailKey`, which re-keys the page-level ambient radial behind the modal over `800ms`. The modal itself carries no ambient — the tint reads through the blurred scrim. This is the mechanism; only 5 keys have a tint (rest fall back to shogun rose).

**Body** — `padding:28px 40px 40px; display:flex; flex-direction:column; gap:26px`. Inner width 860.

**1. Action row** — `display:flex; gap:10px`:

| Control | Spec |
|---|---|
| Primary play | `height:48px; padding:0 28px; border-radius:99px; border:0; background:#fff; color:#0a090d; gap:9px; font-size:14.5px; font-weight:600`. Glyph `12×13`. Label = `title.playLabel` ("Resume Ep 7" / "Play" / "Resume Ep 3"). |
| Watchlist `+` | `48×48; border-radius:99px; border:1px solid rgba(255,255,255,.16); background:rgba(255,255,255,.07)`. Icon `16×16`, `M10 4v12M4 10h12`, `sw 1.7`. **No handler — inert.** |
| Trailer | Same 48×48 shell. Icon `18×18`: `<rect x=2.4 y=4.6 width=15.2 height=10.8 rx=2.2 sw=1.5/>` + `M8.4 8.2v3.6l3.2-1.8-3.2-1.8Z` filled. **Opens the servers panel.** |
| Watch together | `height:48px; padding:0 20px; margin-left:auto; border-radius:99px; border:1px solid rgba(196,181,253,.3); background:rgba(196,181,253,.1); color:#ece7ff; font-size:13px; font-weight:500` |

The `margin-left:auto` on the last item is the desktop tell — a wide row with a right-anchored social action, rather than the phone's stacked full-width buttons.

**2. Synopsis + providers, two columns** — `display:grid; grid-template-columns:1.5fr 1fr; gap:36px` → 494.4 / 329.6.
- Left: synopsis `font-size:14px; line-height:1.68; color:rgba(255,255,255,.68); text-wrap:pretty`. Unclamped.
- Right: `display:flex; flex-direction:column; gap:9px`. H2 "Where to watch" (`10.5px/600/.2em/uppercase/rgba(.4)`). Tiles row `gap:8`: each `36×36; border-radius:9px; border:1px solid rgba(255,255,255,.12); background:{{p.art}}`, centred short code `10px/700`. Three per title.

**Cast is in the data and is NOT rendered.** `title.cast` is built as `[{ name, role, art }]` (line 628) and never consumed by any markup in this file. Either build a cast row (the data shape is ready: 4 entries per title, each with `name`, `role`, and the title's art as an avatar placeholder) or drop it. Given the 940px card, the natural home is a fourth section between providers and Episodes, or as a second column beneath the synopsis.

**3. Episodes** — `sc-if` on `title.isSeries` (`shogun: true`, `dune: false`, `frieren: true`). `display:flex; flex-direction:column; gap:14px`.
- Header `display:flex; align-items:center; justify-content:space-between`: H2 "Episodes" Instrument Serif `26px/1`; season tabs `display:flex; gap:14px`, each `padding:0 0 8px; font-size:12.5px; font-weight:<600|500>; color:<#fff|rgba(.42)>; border-bottom:2px solid <#c4b5fd|transparent>; margin-bottom:-1px`. Four tabs S1–S4, `season` state, but **the episode list does not change with the season** (`EPISODES` is a constant).
- **Grid `1fr 1fr`, `gap:12px 24px` — two episodes per row.** 418px per cell.
- Row: `display:grid; grid-template-columns:120px 1fr; gap:13px`:
  - Thumb `120px; aspect-ratio:16/9` → **120 × 67.5**; `border-radius:8px; overflow:hidden`. Progress: `position:absolute; left:0; right:0; bottom:0; height:2.5px; background:rgba(255,255,255,.18)`, inner fill `height:100%; background:#c4b5fd; width:{{e.pct}}`.
  - Text `gap:3; min-width:0`: line 1 `display:flex; align-items:baseline; gap:7px` = mono ep number `10px` `#c4b5fd` + title `13px/500` nowrap+ellipsis; blurb `11px/1.5; rgba(.44); -webkit-line-clamp:2` (2-line clamp, `-webkit-box`); duration `10.5px; rgba(.32)`.
  - Click → `play()`.
- No hover state. Add one.

**4. More like this** — `display:flex; flex-direction:column; gap:12px`. H2 Instrument Serif `24px/1`. Grid `repeat(4,1fr); gap:14px` → 204.5 × 306.8 posters, `aspect-ratio:2/3; border-radius:9px`, title `12px/500/1.3`, `gap:7`. No shadow, no hover. Four fixed items (Blue Eye Samurai, The Boys, Arcane, Fallout) — **not** related to the open title. Clicking swaps `detailKey` in place, so the modal re-renders with new content and the page ambient re-tints; the modal does not stack or animate the swap.

---

## I. Player

```css
position:absolute; inset:0; z-index:75; background:#000;
display:grid; grid-template-rows:auto 1fr auto;
```

A three-row grid: header / stage / controls. **It is `inset:0` on the app root, so it covers the rail as well as the content column.** The wrapper page claims it "takes over the content column while the browser chrome stays visible" — the browser chrome part is true (it's an in-page player, not fullscreen), the content-column part is not what the DOM does. Decide deliberately; leaving the 84px rail visible is the stronger desktop-web statement and matches the design intent as written.

Controls are **always visible** — there is no idle timer, no pointer-move reveal, no `opacity` transition on either bar. On a real player you will want auto-hide; the mockup does not specify it.

### Row 1 — header

```css
position:relative; z-index:3; padding:22px 26px 14px;
display:flex; align-items:center; gap:14px;
background:linear-gradient(180deg,rgba(0,0,0,.85),rgba(0,0,0,0));
```
| Control | Spec |
|---|---|
| Back | `38×38; border-radius:99px; border:1px solid rgba(255,255,255,.18); background:rgba(0,0,0,.4)`; chevron `16×16`, `M12 4.5 6.5 10l5.5 5.5`, `sw 1.8` → `player:false` |
| Title stack | `gap:1`: `title.title` `13.5px/500`; `title.nowPlaying` `11px/rgba(.48)` — e.g. "S1 · E7 — A Stick of Time" |
| Source pill | `margin-left:auto; height:32px; padding:0 12px; border-radius:99px; border:1px solid rgba(255,255,255,.18); background:rgba(0,0,0,.4); font-size:11.5px; gap:6`; `5×5` dot `border-radius:99px; background:#4ade80`; label **"Vidsrc" hard-coded** (not bound to state) → servers panel |

Note the header padding is `26px` horizontal while everything else on desktop is `48px`. The player intentionally runs tighter than the app.

### Row 2 — stage (`1fr`)

```css
position:relative; display:flex; align-items:center; justify-content:center; overflow:hidden;
```
- Art layer `inset:0; background:{{title.art}}; opacity:.45` — stands in for video.
- Vignette `inset:0; background:radial-gradient(ellipse at center,rgba(0,0,0,.1),rgba(0,0,0,.74))`.
- Transport cluster `position:relative; z-index:2; display:flex; align-items:center; gap:34px`:

| Control | Spec |
|---|---|
| Skip back | `52×52; border-radius:99px; border:0; background:rgba(0,0,0,.32)`; icon `23×23`, `viewBox="0 0 24 24"`, `M11.5 5a7 7 0 1 1-6.9 8.2` + arrowhead `M11.5 5 8.8 2.6M11.5 5 8.8 7.6`, `sw 1.7`. **No handler.** |
| Play/pause | `82×82; border-radius:99px; border:1px solid rgba(255,255,255,.2); background:rgba(255,255,255,.13); backdrop-filter:blur(24px) saturate(180%)` → `togglePlay()`. **The only functional control.** |
| Skip fwd | `52×52`, same as skip-back, mirrored: `M12.5 5a7 7 0 1 0 6.9 8.2` + `M12.5 5 15.2 2.6M12.5 5l2.7 2.6`. **No handler.** |

`playGlyph` (lines 651–653), swapped on `playing`:
```jsx
// pause
<svg width=24 height=26 viewBox="0 0 22 24">
  <rect x=3    y=2 width=5.4 height=20 rx=1.6 fill="#fff"/>
  <rect x=13.6 y=2 width=5.4 height=20 rx=1.6 fill="#fff"/>
</svg>
// play
<svg width=24 height=26 viewBox="0 0 20 24">
  <path d="M2 1.6v20.8L19 12 2 1.6Z" fill="#fff"/>
</svg>
```
Note the two glyphs use **different viewBoxes** at the same rendered size — the play triangle is optically widened. Preserve both.

### Row 3 — controls

```css
position:relative; z-index:3; padding:0 26px 24px;
display:flex; flex-direction:column; gap:12px;
background:linear-gradient(0deg,rgba(0,0,0,.9),rgba(0,0,0,0));
```

**a. Source-nudge banner** (always shown in the mockup):
```css
display:flex; align-items:center; gap:9px; padding:9px 14px; border-radius:12px;
border:1px solid rgba(251,191,36,.26); background:rgba(251,191,36,.11);
```
Text `flex:1; font-size:11.5px; line-height:1.45; color:#fde68a`: "This server has no captions. Filmxy has them." Then a text button "Switch": `border:0; background:none; padding:0; font-size:11.5px; font-weight:600; color:#fff` → servers panel. This should be conditional on the active source's capabilities.

**b. Scrubber** — `display:flex; flex-direction:column; gap:7px`:
```css
/* track  */ position:relative; height:4px; border-radius:99px; background:rgba(255,255,255,.2)
/* buffer */ position:absolute; inset-block:0; left:0; width:42%; border-radius:99px; background:rgba(255,255,255,.32)
/* played */ position:absolute; inset-block:0; left:0; width:31%; border-radius:99px; background:#fff
/* knob   */ position:absolute; left:31%; top:50%; width:13px; height:13px; border-radius:99px;
             background:#fff; transform:translate(-50%,-50%)
```
Three-layer track (track / buffered / played) — reproduce the buffered layer, it's easy to miss. Timecode row: `display:flex; justify-content:space-between; font-family:ui-monospace,Menlo,monospace; font-size:10.5px; color:rgba(255,255,255,.55)` → `42:18` / `-1:09:52` (remaining, negative-prefixed).

The knob is `13px` on a `4px` track with no hover-grow and no hit-area padding. Give it a ≥16px hit target and a hover/scrub state; desktop needs seek-preview thumbnails, which the mockup does not include.

**c. Utility row** — `display:flex; align-items:center; justify-content:space-between; gap:6px`:
- Left group `gap:8`: **"CC"** and **"1.0×"** pills — `height:34px; padding:0 13px; border-radius:99px; border:1px solid rgba(255,255,255,.14); background:rgba(255,255,255,.07); font-size:11.5px`. **No handlers.**
- Right: **"Episodes"** pill — same shell, `padding:0 14px` → `backToDetailEpisodes()`.

**Missing controls (build these, they are not in the mockup):** volume/mute, fullscreen, PiP, quality/audio-track selector, next-episode card, skip-intro, keyboard shortcuts (space/←/→/f/m), and a real seek-preview.

### Sheet / drawer behaviour for episodes and sources

**There are no sheets or drawers on desktop.** This is one of the sharpest platform differences:

- **Episodes**: the player's "Episodes" pill calls `backToDetailEpisodes()`, which is byte-for-byte identical to `back()` — `() => this.set({ player: false })`. It simply **closes the player**, revealing the detail modal underneath (which is still mounted, because `play()` never cleared `detailKey`). There is no in-player episode list. The phone build, by contrast, has a real bottom sheet with an episode list and season tabs.
- **Sources**: handled by the shared **centred panel** at `z-index:85` (above the player at 75), `max-width:420px`. Not a drawer, not a bottom sheet.

**Panel component spec** (all three variants):

```css
/* container */ position:absolute; inset:0; z-index:85;
                display:flex; align-items:center; justify-content:center; padding:40px;
/* scrim     */ position:absolute; inset:0; background:rgba(4,4,7,.68); backdrop-filter:blur(8px)
/* card      */ position:relative; width:100%; max-width:820px|460px|420px; max-height:100%;
                overflow:auto; border-radius:18px; border:1px solid rgba(255,255,255,.1);
                background:rgba(19,18,23,.96);
                box-shadow:0 40px 100px -20px rgba(0,0,0,.9); padding:28px 30px;
/* header    */ display:flex; align-items:center; justify-content:space-between; margin-bottom:20px
/* title     */ Instrument Serif 400, 28px, line-height:1
/* close     */ 32×32; border-radius:99px; border:1px solid rgba(255,255,255,.12);
                background:rgba(255,255,255,.06); X 13×13 stroke rgba(255,255,255,.72) sw1.8
```

**Servers body** (`420px`) — `display:flex; flex-direction:column; gap:9px`. Row: `display:grid; grid-template-columns:auto 1fr auto; gap:12px; align-items:center; padding:14px; border-radius:13px; border:1px solid {{s.border}}; background:{{s.bg}}`. Dot `7×7; border-radius:99px; background:{{s.dot}}`. Middle stack `gap:2`: label `13.5px/500`, sub `11px/rgba(.42)`. Right: mono tag `9.5px; .1em; uppercase; color:{{s.tagColor}}`. All four rows `onClick = closePanel` — no actual switching.

| Source | sub | tag | tagColor | dot | border | bg |
|---|---|---|---|---|---|---|
| Vidsrc | 1080p · captions · fast | Playing | `#4ade80` | `#4ade80` | `rgba(74,222,128,.3)` | `rgba(74,222,128,.09)` |
| Filmxy | 1080p · captions | Ready | `rgba(255,255,255,.45)` | `#4ade80` | `rgba(255,255,255,.09)` | `rgba(255,255,255,.03)` |
| Superembed | 4K · no captions | Ready | `rgba(255,255,255,.45)` | `#fbbf24` | `rgba(255,255,255,.09)` | `rgba(255,255,255,.03)` |
| Smashystream | 720p · unverified | Failed | `#f87171` | `#f87171` | `rgba(255,255,255,.09)` | `rgba(255,255,255,.02)` |

Note the dot encodes *quality/verification* while the tag encodes *state* — two independent signals.

**Party body** (`460px`) — `gap:16`. Header card: `display:flex; align-items:center; gap:12px; padding:14px; border-radius:14px; border:1px solid rgba(196,181,253,.2); background:linear-gradient(140deg,rgba(124,58,237,.22),rgba(255,255,255,.03))`; mini poster `width:46px; aspect-ratio:2/3; border-radius:8px`; title `14px/500`; "Synced · host controls playback" `11.5px/rgba(.5)`. Member rows: `display:grid; grid-template-columns:auto 1fr auto; gap:11px; align-items:center; padding:10px 0; border-top:1px solid rgba(255,255,255,.06)`; avatar `30×30; border-radius:99px; background:{{m.art}}`, initial `11px/600; color:#140f22`; name `13px/500`; state `10.5px/rgba(.38)`; reaction emoji `15px`. Footer CTA "Start together": `height:46px; border-radius:99px; border:0; background:#fff; color:#0a090d; font-size:13.5px; font-weight:600` → `play()`.

**Vibe body** (`820px`) — `gap:16`. Description `12.5px/1.6; rgba(.5)`: "Weighted by how much of each title you actually finished — not just what you opened." Grid `repeat(5,1fr); gap:14px 12px`, first 10 items of `grid`; poster `aspect-ratio:2/3; border-radius:9px`, title `11.5px/500/1.28`, `gap:7`.

---

## J. What is genuinely different about desktop vs phone

Grounded against `Umbra App v2.dc.html` (declared preview **402 × 874**), not inferred. Twenty-one concrete structural differences:

### Navigation model — completely different component

| | Phone | Desktop |
|---|---|---|
| Primary nav | **Bottom tab bar**: `position:absolute; left:0; right:0; bottom:0; z-index:40; padding:12px 12px 28px; background:linear-gradient(180deg,rgba(10,9,13,0),rgba(10,9,13,.82) 34%,rgba(10,9,13,.96)); backdrop-filter:blur(24px) saturate(180%)`; `grid-template-columns:repeat(5,1fr)`. 28px bottom padding = home-indicator inset. | **Left rail**, `84px → 242px` on hover, in-flow, opaque gradient, no blur, `z-index:50`. |
| Secondary nav | **Persistent top bar** on every tab screen: `padding:54px 20px 10px` (54px = status bar), logo mark `30×24` **+ "Umbra" wordmark 16.5px/500/-.02em**, search icon button `34×34`, avatar button `30×30`. | **No top bar on any screen.** Search + party float inside the Home hero only (`top:26px; right:40px`). Wordmark absent entirely. |
| Nav labels | Always visible under icons | **Hidden until hover** — a pointer-only affordance with no touch equivalent |
| Account entry | Avatar button in the top bar, on every screen | Non-interactive name+avatar at the bottom of the rail; only entry is the "You" nav item |
| Scroll owner | `flex:1; overflow:auto; -webkit-overflow-scrolling:touch; padding-bottom:120px` (clears the tab bar) | `flex:1; overflow:auto`, no bottom clearance needed |

### Hero — a different object, not a resized one

- **Phone:** a *poster plate beside text*. `padding:12px 20px 0; display:flex; gap:18px; align-items:flex-end`; a `146px` wide `aspect-ratio:2/3` **portrait** poster with `border-radius:13px`, `box-shadow:0 28px 62px -20px rgba(0,0,0,.98),0 0 0 1px rgba(255,255,255,.11)`, plus a separate blurred glow layer (`filter:blur(30px); opacity:.9`) behind it; text column `flex:1` beside it with a `50×50` ring, H1 **38px**/`.94`/`-.015em`, and one **full-width** Resume button `height:42px`.
- **Desktop:** a *cinematic left-anchored panel*. `height:560px` full-bleed **landscape**, art as background rather than as a card, H1 **78px** (2.05× the phone), a `56×56` ring, and **two side-by-side pill buttons** at `height:50px` with intrinsic widths.
- Phone applies a global page gradient over the ambient (`linear-gradient(180deg,rgba(10,9,13,.24),rgba(10,9,13,.88) 58%,#0a090d 88%)`) and has **no per-hero scrim**; desktop has no global gradient and instead uses a **two-layer per-hero scrim** including a `90deg` horizontal ramp that only makes sense in landscape.

### Hero orientation flip is systemic, not one-off

| Element | Phone | Desktop |
|---|---|---|
| Hero art | portrait poster `2/3` | landscape backdrop, `560px` fixed |
| "Tonight" billboard | **`aspect-ratio:3/4` portrait**, full-bleed (no side margin, no radius), text bottom-anchored, H3 **46px**, and a mono **`1 / 4` position counter** | **`aspect-ratio:21/8` landscape**, `margin:0 48px`, `border-radius:18px`, text **vertically centred** at `left:40px; max-width:440px`, H3 **44px**, **no counter** |
| Vibe cards | **`132 × 176` portrait**, `radius:14`, `padding:15`, label 24px, count tracking `.16em` | **`220 × 150` landscape**, `radius:15`, `padding:18`, label 28px, count tracking `.14em` |
| Detail backdrop | **`aspect-ratio:3/4` portrait**, plus a top scrim `linear-gradient(180deg,rgba(0,0,0,.5),transparent 24%)` for the floating back button | **`aspect-ratio:21/9` landscape**, no top scrim (the close button carries its own glass) |

### Detail is a route on phone, a modal on desktop

- **Phone:** a full-screen screen — `screen === "detail"`, `position:absolute; inset:0; z-index:60; display:flex; flex-direction:column`, its own scrollable body, back chevron `36×36` at `top:52px; left:16px`, "Watch together" pill floated at `top:52px; right:16px`. H1 **44px**/`.9`/`-.025em`.
- **Desktop:** a centred **modal** at `z-index:80`, `max-width:940px`, `max-height:100%`, on a `rgba(4,4,7,.7)` + `blur(8px)` scrim, over a still-mounted, still-scrolled Home. H1 **52px**/`.92`/`-.02em`, close button inside the card at `top:20px; right:20px`. Explicit design intent: *"closing it costs nothing."*
- Consequence: on desktop, related-title clicks **swap `detailKey` in place** with no push/pop; on phone the same action is a route change with a back stack.

### Sheets vs centred panels

- **Phone:** bottom sheet — `justify-content:flex-end`, `max-height:80%`, `border-radius:22px 22px 0 0`, `border-top:1px solid rgba(255,255,255,.12)`, `background:rgba(14,13,19,.9)`, `backdrop-filter:blur(40px) saturate(180%)`, a **`34×4` grab handle** at `radius:99px; background:rgba(255,255,255,.22)`, scrim `rgba(4,4,7,.6)` + `blur(6px)`, `z-index:90`. Title Instrument Serif 26px. Episodes live **inside the player** via this sheet.
- **Desktop:** centred card — `align-items:center`, `border-radius:18px` all round, `border:1px solid rgba(255,255,255,.1)`, `background:rgba(19,18,23,.96)` (**opaque-ish, no blur on the card at all**), scrim `rgba(4,4,7,.68)` + `blur(8px)`, `z-index:85`. Title Instrument Serif 28px. Content-width-driven `max-width` (820 / 460 / 420) rather than a fixed height budget. **No grab handle, no drag-to-dismiss** — dismissal is scrim-click or the X. Episodes are **not** in a panel; the player's "Episodes" button just closes the player.

### Multi-column layouts that only exist on desktop

Desktop introduces five two-or-more-column arrangements that the phone build has no equivalent for:

1. **Browse grid: `repeat(7,1fr)`** vs phone's `repeat(3,1fr)` — 2.33× the density per row, and a genuinely different scanning gesture (eye sweep vs thumb scroll).
2. **Anime `1.1fr 1.4fr`** — the next-up card and the airing list side by side; phone stacks them.
3. **Detail `1.5fr 1fr`** — synopsis and "Where to watch" side by side.
4. **Detail episodes `1fr 1fr`** — **two episodes per row**, which is only legible at 940px card width.
5. **Vibe panel `repeat(5,1fr)`** — a 5-up poster grid inside a modal.

Plus the flat rows become multi-column: **You rows** are `1fr auto auto` (label / value / chevron on one line) and the **detail action row** uses `margin-left:auto` to right-anchor "Watch together" — both impossible in a 402px column.

### Hover affordances with no touch equivalent

There are four, and all four are invisible until a pointer arrives:

1. **Rail expansion** — `style-hover="width:242px"` on the container, `220ms`. The *only* way to read the nav labels. A touch build must show labels permanently (which the phone build does).
2. **Card lift** — `transform:translateY(-6px)` (resume / trending / vibes) and `translateY(-5px)` (browse grid), `200ms cubic-bezier(.22,1,.36,1)`. Per the wrapper's own note: *"Where the TV build scales the focused card, the desktop build scales on mouse-over with the same easing and timing."* Note the desktop build **translates rather than scales** — no `scale()` appears anywhere.
3. **Trending play overlay** — a `46×46` glass play circle at `opacity:0`, revealed by `style-hover="opacity:1"` over `180ms`. On touch this control simply does not exist; the phone build has no analogue.
4. **Airing tile background swap** — `#100f14 → #17151d`, the only background-color hover in the build.

Also inherently pointer-only: the styled `8px` webkit scrollbar as the *sole* horizontal-scroll affordance (touch has momentum and rubber-banding; a mouse has neither on an `overflow-x` container).

### Density differences, measured

| Metric | Phone | Desktop | Δ |
|---|---|---|---|
| Gutter | `20px` | `48px` | 2.4× |
| Shelf card width | `82 / 94 / 100 / 118 / 132 / 146px` | uniform **`172px`** | ~1.5× and normalised |
| Shelf gap | `11 / 12 / 13px` | `14 / 16px` | — |
| Shelf bottom pad | `4px` | `6px` (8px scrollbar) | — |
| Section-to-section gap | `46px` (Home) / `32px` (You) | `52px` (Home) / `30–34px` | — |
| Section header gap | `11px` | `12px` | — |
| Section H2 size | `10.5px` | `11px` | — |
| Section index size | `10px` | `10.5px` | — |
| Browse H1 | `38px` | `48px` | 1.26× |
| Home hero H1 | `38px` | `78px` | 2.05× |
| Detail H1 | `44px` | `52px` | 1.18× |
| Vibe chip gap | `8px` | `9px` | — |
| Vibe chip count visible | wraps at 362px | wraps at 900px | — |
| You avatar | `56px`, stacked above the name | `68px`, **beside** the name | layout flip |
| You row padding | `15px 20px` (padding carries the gutter) | `16px 0` (container carries it) | — |
| You row label | `14.5px`, chevron `14px` | `15px`, chevron `15px` | — |
| Player play button | `72×72`, transport gap `28px` | `82×82`, transport gap `34px` | — |
| Dashed placeholder cards | `padding:15px`, gap 9, title 13px, body 10.5px | `padding:18px`, gap 12, title 13.5px, body 11px | — |

The pattern: desktop scales **whitespace and display type aggressively** (2.4× gutter, 2× hero title) while leaving **UI text nearly untouched** (13.5px nav vs the phone's comparable sizes; body copy 14–14.5px on both). Do not uniformly scale up — the desktop identity comes from bigger *voids* and bigger *serifs* against the same-size sans.

### Other structural deltas

- **Ambient layer**: on phone it is `position:absolute; inset:0` on the root, under a global page gradient, and there is **no `pointer-events:none`**. On desktop it lives *inside the scrolling content column* with `pointer-events:none` — so it is scoped to the content area, not the rail, and it does not scroll.
- **Screen count**: phone has `screen` values including `detail` and `player` as first-class screens (`isDetail`, `isPlayer` both derived from `s.screen`); desktop makes them **orthogonal overlay flags** (`s.player` boolean, `s.detailKey` nullable) that can co-exist with any base screen. That's a state-model difference, not just a layout one.
- **Phone Tonight has a rotation counter (`1 / 4`) and a `+` watchlist button inline in the billboard**; desktop's billboard has neither.
- **Phone screens carry their gutter on children** (`padding:0 20px` repeated ~25 times, including on H1s and H2s) so everything can bleed; **desktop puts it on the container** for Browse/Search/Anime/You and on children only for Home. That inconsistency is why the Anime "Top this season" shelf can't bleed on desktop.
- **Player padding**: phone `header` and controls run at the 20px-ish app rhythm; desktop player runs at `26px` — tighter than its own 48px app gutter, deliberately signalling "different mode".

---

## K. Mock data shape

### Module-level constants

```js
A(a, b)                 // (hex, hex) → `linear-gradient(155deg,${a} 0%,${b} 100%)`
RING(c, pct)            // (circumference, percent) → c * (1 - pct/100)  → stroke-dashoffset

ART:     Record<15 keys, gradientString>
AMBIENT: Record<5 keys,  radialGradientString>     // shogun|dune|frieren|arcane|severance

TITLES: Record<"shogun"|"dune"|"frieren", {
  key, title, year, runtime, cert, rating,        // all strings
  art,                                            // gradient string
  playLabel, nowPlaying,                           // strings
  isSeries: boolean,
  synopsis: string,
  providers: Array<[short: string, art: string]>,   // tuple form in source
  cast:      Array<[name: string, role: string]>,   // tuple form in source
}>

EPISODES: Array<[num, title, blurb, dur, pct]>     // 5-tuple × 4

ic(kind): ReactElement                             // "home"|"search"|"browse"|"anime"|<fallback "you">
```

### `state`

```ts
{
  screen: "home" | "browse" | "search" | "anime" | "you",
  detailKey: keyof ART | null,     // null ⇒ detail modal closed
  panel: "vibe" | "servers" | "party" | null,
  season: 1 | 2 | 3 | 4,
  playing: boolean,
  player: boolean,
  prevScreen: string,              // DEAD — written once, never read
}
```

### `renderVals()` return shape

```ts
{
  // ── ambient / routing flags ──────────────────────────────────
  ambient: string,                       // radial-gradient, keyed on detailKey, fallback shogun
  isHome: boolean, isBrowse: boolean, isSearch: boolean,
  isAnime: boolean, isYou: boolean,
  isPlayer: boolean,                     // = state.player

  // ── rail ─────────────────────────────────────────────────────
  navItems: Array<{
    label: string,
    icon: ReactElement,                  // 22×22 currentColor SVG
    bg: string,                          // "rgba(255,255,255,.09)" | "transparent"
    color: string,                       // "#fff" | "rgba(255,255,255,.5)"
    weight: 600 | 500,
    pick: () => void,                    // { screen, detailKey:null, panel:null, player:false }
  }>,                                    // length 5

  // ── bare action handlers ─────────────────────────────────────
  goBrowse: () => void,
  back: () => void,                      // { player:false }
  play: () => void,                      // { player:true, panel:null, playing:true }
  togglePlay: () => void,
  backToDetailEpisodes: () => void,      // identical to back()
  playGlyph: ReactElement,               // pause-bars | play-triangle, keyed on state.playing

  heroOpen: () => void,                  // → detail("shogun")
  detailOpen: boolean,                   // detailKey !== null
  closeDetail: () => void,

  panelOpen: boolean,
  panelIsVibe: boolean, panelIsServers: boolean, panelIsParty: boolean,
  panelTitle: string,                    // "Slow-burn revenge"|"Choose a source"|"Watch party"|""
  panelWidth: string,                    // "820px"|"460px"|"420px"
  openPanelParty: () => void,
  openPanelServers: () => void,
  openPanelVibeAsTrailer: () => void,    // MISNOMER → sets panel:"servers"
  closePanel: () => void,

  // ── the active title (detail + player + party panel all read this) ──
  title: {
    key, title, year, runtime, cert, rating, art,
    playLabel, nowPlaying, isSeries, synopsis,
    providers: Array<{ short: string, art: string }>,   // mapped from tuples
    cast:      Array<{ name: string, role: string, art: string }>,  // NEVER RENDERED on desktop
  },

  // ── home ─────────────────────────────────────────────────────
  hero: { title, tag, left, pctLabel, dash: number, art, synopsis },
  resume:   Array<{ title, tag, dash: number, art, open: () => void }>,          // 5
  featured: { title, reason, meta, art, open: () => void },
  vibes:    Array<{ label, count: string, art, open: () => void }>,              // 5
  airing:   Array<{ title, ep, in: string, when: string, open: () => void }>,    // 3  (reused by Anime)
  trending: Array<{ art, title, meta, open: () => void }>,                       // 8, via poster()

  // ── browse ───────────────────────────────────────────────────
  segments: Array<{ label, weight, color, line, pick: () => void }>,   // 3, pick is a no-op
  grid:     Array<{ art, title, meta, open: () => void }>,             // 21, via poster(); modulo-cycled
                                                                       // over 15 keys; meta always "2024"
                                                                       // ALSO the source for the vibe panel (first 10)

  // ── search ───────────────────────────────────────────────────
  vibeChips: Array<{ label, open: () => void }>,                       // 8
  recent:    Array<{ title, meta, art, open: () => void }>,            // 4

  // ── anime ────────────────────────────────────────────────────
  epTicks:  Array<{ bg: string }>,                                     // 12; #c4b5fd for i<3
  animeTop: Array<{ title, meta, format: "TV"|"Film", art, open: () => void }>,  // 6

  // ── you ──────────────────────────────────────────────────────
  youRows: Array<{ label, sub: string, open: () => void }>,            // 5

  // ── detail ───────────────────────────────────────────────────
  related:  Array<{ art, title, meta, open: () => void }>,             // 4, FIXED (not title-derived)
  episodes: Array<{ num, title, blurb, dur, pct: string, art }>,       // 4, constant across seasons
  seasons:  Array<{ label: "S1".."S4", weight, color, line, pick: () => void }>, // 4

  // ── panels ───────────────────────────────────────────────────
  servers: Array<{ label, sub, tag, tagColor, dot, border, bg }>,       // 4
  party:   Array<{ name, state, initial, reaction: string, art }>,      // 3; reaction "" for host
}
```

### Helper

```js
poster(key, title, meta) → {
  art: ART[key], title, meta,
  open: () => this.set({ detailKey: TITLES[key] ? key : "dune", panel: null })
}
```

**The `TITLES[key] ? key : "dune"` fallback is everywhere.** Only 3 of 15 art keys have full title records, so any poster outside shogun/dune/frieren opens **Dune: Part Two** with Dune's art, ambient and episode list. This is mock scaffolding — real data needs a full record per title, and the `AMBIENT` map extended from 5 keys to all of them, or every non-mapped title reads rose.

### Style-token shapes the templating layer expects

The `{{ }}` interpolations are inserted into raw `style` attributes, so several data fields are **CSS strings, not semantic values** — the presentation is baked into the data. When porting to React, convert these to semantic props and resolve them in the component:

| Field | Currently | Should become |
|---|---|---|
| `navItems[].bg / .color / .weight` | CSS strings | `isActive: boolean` |
| `segments[]` / `seasons[]` `.weight/.color/.line` | CSS strings | `isActive: boolean` |
| `epTicks[].bg` | CSS string | `watched: boolean` |
| `servers[].tagColor/.dot/.border/.bg` | CSS strings | `status: "playing"\|"ready"\|"failed"`, `quality: "verified"\|"unverified"` |
| `panelWidth` | `"820px"` | derived from `panel` variant |
| `*.dash` | pre-computed `stroke-dashoffset` | `progressPct: number`, compute in the ring component |
| `*.art` | gradient string | image URL + gradient fallback |
| `playGlyph` | pre-built ReactElement | `playing: boolean` |
| `navItems[].icon` | pre-built ReactElement | icon key |

---

## Quick build-order recommendation

1. Tokens (§B) as CSS custom properties + a Tailwind theme extension. The whole build uses exactly **one easing curve**, **one accent**, and a **13-step white-alpha ladder** — encode those three and most of the surface falls out.
2. `<Rail>` (§C) with the label opacity fix and a real account menu.
3. `<Shelf>` (§G) with the 172px `PosterCard`, plus the arrow controls the mockup omits.
4. Home (§E1) top-down; the hero (§F) last, because the 78px serif at 640px is the hardest thing to get right.
5. Browse / Search / Anime / You (§E2–E5) — mostly the same primitives at different densities.
6. `<DetailModal>` (§H) as an intercepting route. Fix the `play()`/`detailKey` z-order collision (§D note 1) before wiring the player.
7. `<Panel>` (§I) as one component, three bodies, `max-width` from variant.
8. Player (§I) last, and budget for the missing controls (volume, fullscreen, PiP, in-player episodes, seek preview) — roughly half a real player is not in the mockup.

**Sixteen inert or broken affordances to triage before starting:** hero search pill (div, no handler), Browse segment tabs (`pick:()=>{}`), Search field (span, not input), You Downloads/History/Settings (self no-ops), detail `+` watchlist (no handler), detail trailer button (opens servers), player skip-back / skip-forward (no handlers), player CC / 1.0× (no handlers), player "Episodes" (just closes the player), player source pill label (hard-coded "Vidsrc"), server rows (close without switching), vibe panel title (hard-coded regardless of which card opened it), season tabs (list doesn't change), `related` (not derived from the open title), `title.cast` (in data, never rendered), `prevScreen` (dead state).