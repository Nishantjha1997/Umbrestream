/**
 * UI type is **Inter Variable**, not a `next/font` object (§1.4).
 *
 * It is self-hosted through `@fontsource-variable/inter`, whose `@font-face`
 * rules are imported once in `src/app/layout.tsx`, and bound to Tailwind's
 * `--font-sans` in `src/styles/globals.css`. That makes it the inherited
 * default for the whole document, so there is nothing to import here and no
 * `.className` to spread — reach for the `font-sans` utility if you ever need
 * to re-assert it inside a subtree that overrode the family.
 *
 * Poppins was removed in the same change: it is a geometric rounded sans, and
 * this UI wants the neutral grotesque register of SF Pro.
 *
 * A third face joined in Phase 1: **Instrument Serif**, bound to
 * `--font-serif` — titles and section headings only, never UI labels or body
 * copy. Its `@font-face` rules live directly in `globals.css` (self-hosted
 * from vendored files under `public/fonts/`, not the `@fontsource` package —
 * this environment had no npm/pnpm/yarn available to install it). Reach for
 * the `font-serif` utility; there is no export here for it either, for the
 * same reason there isn't one for Inter. A `--font-mono` token also exists
 * for data/numeral registers (timecodes, episode numbers, countdowns).
 */

/**
 * Wordmark face. **`BrandLogo` only.** It intentionally reuses the local
 * Inter family; weight and tracking provide the display treatment without a
 * build-time request to Google Fonts.
 */
export const Saira = { className: "font-sans" } as const;
