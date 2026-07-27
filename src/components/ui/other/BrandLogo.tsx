"use client";

import Link from "next/link";
import { Saira } from "@/utils/fonts";
import { cn } from "@/utils/helpers";
import { Next } from "@/utils/icons";

export interface BrandLogoProps {
  animate?: boolean;
  className?: string;
}

/**
 * Wordmark: a play glyph badge followed by UMBRA.
 *
 * The upstream mark substituted the glyph for the X in CINEXTMA, which worked
 * because it stood in for a real letter. UMBRA has no such letter, so the glyph
 * moves out to a leading badge rather than splitting the word. The icon is also
 * explicitly sized — it previously carried `size-full` inside an unsized span,
 * which let it balloon and blow the spacing apart.
 */
const BrandLogo: React.FC<BrandLogoProps> = ({ animate = false, className }) => {
  return (
    <Link href="/" aria-label="Umbra home" className={cn("group flex items-center gap-2", className)}>
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md md:size-8",
          "bg-primary/15 text-primary ring-1 ring-primary/30",
          "transition-all duration-(--duration-base) ease-(--ease-out-quint)",
          "group-hover:bg-primary/25 group-hover:ring-primary/50",
          "motion-reduce:transition-none",
        )}
      >
        <Next className="size-4 translate-x-px md:size-[18px]" />
      </span>

      <span
        className={cn(
          "text-xl leading-none font-semibold tracking-[0.18em] md:text-2xl",
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
