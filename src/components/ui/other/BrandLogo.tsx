"use client";

import Link from "next/link";
import { Saira } from "@/utils/fonts";
import { cn } from "@/utils/helpers";

export interface BrandLogoProps {
  animate?: boolean;
  className?: string;
}

/**
 * Wordmark: an eclipse crescent followed by UMBRA.
 *
 * History, so nobody reinstates a worse version:
 *
 * 1. Upstream substituted a play glyph for the X in CINEXTMA. That worked
 *    because the glyph stood in for a real letter. UMBRA has no such letter,
 *    so `UMB > RA` split the word around a decoration standing in for nothing.
 * 2. The glyph also carried `size-full` inside an unsized span, so it had no
 *    parent box to resolve against and ballooned, wrecking the letter spacing.
 * 3. Moving it to a leading rounded-square plate fixed the sizing but read as
 *    a toolbar button parked beside the wordmark.
 *
 * Now it is a bare mark: a disc with a bite out of it — which is what an umbra
 * is, the dark core of an eclipse shadow. No plate, no split word.
 */
const BrandLogo: React.FC<BrandLogoProps> = ({ animate = false, className }) => {
  return (
    <Link
      href="/"
      aria-label="Umbra home"
      className={cn(
        "group flex items-center gap-2.5 rounded-lg",
        "focus-visible:ring-primary/60 focus-visible:ring-2 focus-visible:outline-hidden",
        className,
      )}
    >
      {/*
        A bare glyph, not a chip. The previous rounded-square plate read as a
        toolbar button sitting next to the wordmark rather than as part of it.
        The eclipse crescent is the mark: a disc with a bite taken out, which
        is literally what an umbra is.
      */}
      <span
        aria-hidden="true"
        className={cn(
          "text-primary shrink-0 transition-transform duration-(--duration-base) ease-(--ease-out-quint)",
          "group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
        )}
      >
        <svg viewBox="0 0 24 24" className="size-6 md:size-7" fill="none">
          <path
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
            d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2.2a7.8 7.8 0 1 1 0 15.6 7.8 7.8 0 0 1 0-15.6Z"
          />
          <path
            fill="currentColor"
            d="M12 4.2a7.8 7.8 0 0 0 0 15.6c1.9 0 3.6-.68 4.95-1.8A9.3 9.3 0 0 1 12 4.2Z"
          />
        </svg>
      </span>

      <span
        className={cn(
          "text-xl leading-none font-semibold tracking-[0.16em] md:text-[1.4rem]",
          "bg-linear-to-r from-transparent from-80% via-white to-transparent bg-size-[200%_100%] bg-clip-text bg-position-[40%]",
          animate ? "animate-shine motion-reduce:animate-none" : "text-foreground",
          Saira.className,
        )}
      >
        UMBRA
      </span>
    </Link>
  );
};

export default BrandLogo;
