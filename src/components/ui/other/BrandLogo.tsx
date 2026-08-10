"use client";

import Link from "next/link";
import { Saira } from "@/utils/fonts";
import { cn } from "@/utils/helpers";

export interface BrandLogoProps {
  animate?: boolean;
  className?: string;
  /** Extra classes for the wordmark, useful in compact navigation chrome. */
  textClassName?: string;
}

/**
 * Original StreamFree lockup: an SF monogram with a play cut-out. The mark is
 * deliberately simple enough to remain legible in a favicon and a narrow rail.
 */
const BrandLogo: React.FC<BrandLogoProps> = ({ animate = false, className, textClassName }) => {
  return (
    <Link
      href="/"
      aria-label="StreamFree home"
      className={cn(
        "group flex items-center gap-2.5 rounded-lg",
        "focus-visible:ring-primary/60 focus-visible:ring-2 focus-visible:outline-hidden",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "text-primary shrink-0 transition-transform duration-(--duration-base) ease-(--ease-out-quint)",
          "group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
        )}
      >
        <svg viewBox="0 0 32 32" className="size-6 md:size-7" fill="none">
          <path d="M5 7h20v5H11v3h11v5H11v4h15v5H5V7Z" fill="currentColor" />
          <path d="M16 12h9v5h-9zM16 17h6v5h-6z" fill="#0a090d" />
          <path d="m23 9 6 4-6 4V9Z" fill="white" />
        </svg>
      </span>

      <span
        className={cn(
          "text-xl leading-none font-semibold tracking-[0.12em] md:text-[1.25rem]",
          "bg-linear-to-r from-transparent from-80% via-white to-transparent bg-size-[200%_100%] bg-clip-text bg-position-[40%]",
          animate ? "animate-shine motion-reduce:animate-none" : "text-foreground",
          Saira.className,
          textClassName,
        )}
      >
        STREAMFREE
      </span>
    </Link>
  );
};

export default BrandLogo;
