"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Play, Star } from "lucide-react";
import type { Title } from "@/types/title";

interface Props {
  title: Title;
  /** 0–100. Renders the continue-watching bar when > 0. */
  progress?: number;
  priority?: boolean;
  index?: number;
}

export function PosterCard({ title, progress = 0, priority = false, index = 0 }: Props) {
  const href = `/title/${title.mediaType}/${title.tmdbId ?? title.anilistId}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      // Stagger caps at 8 so a 20-card row doesn't take two seconds to appear.
      transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.045, ease: [0.22, 1, 0.36, 1] }}
      className="w-[9.5rem] shrink-0 sm:w-[10.5rem] md:w-[11.5rem]"
    >
      <Link href={href} className="group block">
        <motion.div
          whileHover={{ y: -8, scale: 1.035 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 380, damping: 26 }}
          className="poster-frame relative aspect-[2/3] overflow-hidden rounded-[var(--radius-card)] bg-[var(--color-surface-1)] will-change-transform"
        >
          {title.posterUrl ? (
            <Image
              src={title.posterUrl}
              alt=""
              fill
              sizes="(max-width: 640px) 152px, 184px"
              priority={priority}
              className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-3 text-center text-xs text-[var(--color-fg-subtle)]">
              {title.title}
            </div>
          )}

          {/* Scrim and play affordance reveal together on hover. */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex size-11 scale-50 items-center justify-center rounded-full bg-[var(--color-accent)]/95 opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:scale-100 group-hover:opacity-100">
              <Play className="size-5 translate-x-[1px] text-white" fill="currentColor" />
            </div>
          </div>

          <div className="pointer-events-none absolute inset-0 rounded-[var(--radius-card)] ring-0 ring-[var(--color-accent)] transition-all duration-300 group-hover:ring-2" />

          {title.rating !== undefined && title.rating > 0 && (
            <span className="absolute right-1.5 top-1.5 flex items-center gap-1 rounded-md bg-black/75 px-1.5 py-0.5 text-[11px] font-semibold tabular-nums text-white backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-0">
              <Star className="size-3 text-[var(--color-accent-hover)]" fill="currentColor" />
              {title.rating.toFixed(1)}
            </span>
          )}

          {progress > 0 && (
            <div className="absolute inset-x-0 bottom-0 h-[3px] bg-black/70">
              <div
                className="h-full bg-[var(--color-accent)] shadow-[0_0_8px_var(--color-accent)]"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          )}
        </motion.div>

        <p className="mt-2 line-clamp-1 text-[13px] font-medium text-[var(--color-fg)] transition-colors duration-200 group-hover:text-[var(--color-accent-hover)]">
          {title.title}
        </p>
        {title.year && (
          <p className="mt-0.5 text-[11px] tabular-nums text-[var(--color-fg-subtle)]">
            {title.year}
          </p>
        )}
      </Link>
    </motion.div>
  );
}
