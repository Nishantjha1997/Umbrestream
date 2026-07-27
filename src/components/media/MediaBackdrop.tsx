"use client";

import { Image } from "@heroui/image";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { isEmpty } from "@/utils/helpers";

/**
 * Responsive height of the key-art band. Declared once because the section, the
 * artwork, and the solid-colour fallback all have to agree — three copies that
 * silently drifted apart is how the old per-media-type backdrops worked.
 */
const BAND_HEIGHT = "h-[35vh] md:h-[50vh] lg:h-[70vh]";

/**
 * Scroll distance, in pixels, over which the backdrop fades out into the page
 * background. Matches the previous `Math.min((y / 1000) * 2, 1)` ramp exactly
 * (fully opaque at 500px) so the page reads the same as before the rewrite.
 */
const FADE_DISTANCE = 500;

export interface MediaBackdropProps {
  /**
   * Absolute, ready-to-render key art URL. When absent a solid block tinted
   * with `fallbackColor` is rendered instead of a broken image.
   */
  backdropUrl?: string;
  /**
   * Absolute URL of the English wordmark/logo art, centred over the key art.
   * Omit it (or pass `undefined`) and nothing is rendered in its place — the
   * empty `<Image>` wrapper movies used to get is gone.
   */
  logoUrl?: string;
  /** CSS colour used to tint the no-artwork fallback block, e.g. AniList's `coverImage.color`. */
  fallbackColor?: string;
  /** Accessible name for the artwork — the already-resolved title of the work. */
  alt: string;
}

/**
 * The fixed key-art band behind every detail page.
 *
 * Being `position: fixed` is deliberate: page content scrolls over a stationary
 * backdrop, which buys a parallax feel without a scroll handler moving anything.
 *
 * The one thing that *is* scroll-linked — the veil that dissolves the art into
 * the page background — runs on a `MotionValue`. That writes `opacity` straight
 * to the DOM node on the compositor rather than re-rendering React on every
 * scroll event, which is what the previous `useWindowScroll()` + inline-style
 * implementation did in triplicate.
 */
const MediaBackdrop: React.FC<MediaBackdropProps> = ({
  backdropUrl,
  logoUrl,
  fallbackColor,
  alt,
}) => {
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();
  const veilOpacity = useTransform(scrollY, [0, FADE_DISTANCE], [0, 1]);

  const hasBackdrop = !isEmpty(backdropUrl);
  const hasLogo = !isEmpty(logoUrl);

  return (
    <section id="backdrop" className={`fixed inset-0 ${BAND_HEIGHT}`}>
      {/* Scroll-linked veil. Pinned transparent under reduced motion: the
          gradient scrims below already carry legibility on their own. */}
      <motion.div
        aria-hidden
        className="absolute inset-0 z-10 bg-background"
        style={{
          opacity: prefersReducedMotion ? 0 : veilOpacity,
          willChange: "opacity",
        }}
      />
      {/* Dual scrims fading the art into --background from both edges. */}
      <div
        aria-hidden
        className="absolute inset-0 z-2 bg-linear-to-b from-background from-1% via-transparent via-30%"
      />
      <div
        aria-hidden
        className="absolute inset-0 z-2 translate-y-px bg-linear-to-t from-background from-1% via-transparent via-55%"
      />
      {hasLogo && (
        <Image
          isBlurred
          radius="none"
          alt={alt}
          classNames={{ wrapper: "absolute-center z-1 bg-transparent" }}
          className="w-[25vh] max-w-80 drop-shadow-xl md:w-[60vh]"
          src={logoUrl}
        />
      )}
      {hasBackdrop ? (
        <Image
          radius="none"
          alt={alt}
          className={`z-0 w-screen object-cover object-center ${BAND_HEIGHT}`}
          src={backdropUrl}
        />
      ) : (
        <div
          aria-hidden
          className={`z-0 w-screen bg-secondary-100 ${BAND_HEIGHT}`}
          style={fallbackColor ? { backgroundColor: fallbackColor } : undefined}
        />
      )}
    </section>
  );
};

export default MediaBackdrop;
