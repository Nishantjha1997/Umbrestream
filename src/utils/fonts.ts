import { Saira as FontSaira } from "next/font/google";

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
 */

/**
 * Wordmark face. **`BrandLogo` only.** Saira is a display cut with tight
 * apertures — it is legible at 24px in all-caps and poor at 14px in a
 * paragraph. Do not use it for UI copy.
 */
export const Saira = FontSaira({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-saira",
});
