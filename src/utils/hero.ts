import { heroui } from "@heroui/react";

/**
 * Single accent (Phase 1, design system §A.3): Tailwind's own violet-50…900,
 * pointed at HeroUI's `primary`. Movie, TV, and Anime players — and every
 * other `color="primary"` control in the app — now render this same violet
 * instead of three media-type-taxonomy hues. `DEFAULT`/`foreground` match the
 * design's `--accent` (#c4b5fd) and its near-black on-accent text; the full
 * scale exists so shaded utilities (`text-primary-500`, …) don't fall back to
 * HeroUI's default blue and mismatch `DEFAULT`.
 */
const accent = {
  50: "#f5f3ff",
  100: "#ede9fe",
  200: "#ddd6fe",
  300: "#c4b5fd",
  400: "#a78bfa",
  500: "#8b5cf6",
  600: "#7c3aed",
  700: "#6d28d9",
  800: "#5b21b6",
  900: "#4c1d95",
  DEFAULT: "#c4b5fd",
  foreground: "#140f22",
};

export default heroui({
  themes: {
    light: {
      colors: {
        primary: accent,
        //@ts-expect-error this is a custom color name
        "secondary-background": "#F4F4F5",
      },
    },
    dark: {
      colors: {
        // Matches `globals.css`'s `html`/`body` background (§A.2) — one value.
        background: "#0a090d",
        primary: accent,
        //@ts-expect-error this is a custom color name
        "secondary-background": "#18181B",
      },
    },
  },
});
