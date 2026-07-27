"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "motion/react";
import { Info, Play, Star } from "lucide-react";
import type { Title } from "@/types/title";

const ease = [0.22, 1, 0.36, 1] as const;

export function HeroBanner({ title }: { title: Title }) {
  const href = `/title/${title.mediaType}/${title.tmdbId ?? title.anilistId}`;

  return (
    <section className="relative -mt-px h-[62vh] min-h-[26rem] w-full overflow-hidden">
      {title.backdropUrl && (
        <motion.div
          initial={{ scale: 1.08, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.4, ease }}
          className="absolute inset-0"
        >
          <Image
            src={title.backdropUrl}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-top"
          />
        </motion.div>
      )}

      {/* Three scrims: bottom fade into the page, left for text contrast,
          and a top veil so the header stays readable over bright art. */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/55 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent" />

      <div className="relative flex h-full max-w-2xl flex-col justify-end px-4 pb-12 md:px-8 md:pb-16">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease }}
        >
          <span className="mb-3 inline-block rounded-full border border-[var(--color-accent)]/40 bg-[var(--color-accent-dim)] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-accent-hover)]">
            Trending now
          </span>

          <h1 className="text-4xl font-bold leading-[1.05] tracking-tight text-white md:text-6xl">
            {title.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-[var(--color-fg-muted)]">
            {title.rating !== undefined && title.rating > 0 && (
              <span className="flex items-center gap-1 font-semibold text-[var(--color-accent-hover)]">
                <Star className="size-3.5" fill="currentColor" />
                {title.rating.toFixed(1)}
              </span>
            )}
            {title.year && <span className="tabular-nums">{title.year}</span>}
            <span className="rounded border border-[var(--color-border-strong)] px-1.5 py-px text-[11px] uppercase tracking-wide">
              {title.mediaType === "tv" ? "Series" : "Film"}
            </span>
          </div>

          {title.overview && (
            <p className="mt-4 line-clamp-3 max-w-xl text-[15px] leading-relaxed text-[var(--color-fg-muted)]">
              {title.overview}
            </p>
          )}

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href={`/watch/${title.mediaType}/${title.tmdbId}`}
              className="group flex items-center gap-2 rounded-lg bg-white px-7 py-3 text-sm font-semibold text-black transition-transform duration-200 hover:scale-[1.04] active:scale-95"
            >
              <Play className="size-4 transition-transform group-hover:scale-110" fill="currentColor" />
              Play
            </Link>
            <Link
              href={href}
              className="flex items-center gap-2 rounded-lg border border-white/25 bg-white/10 px-7 py-3 text-sm font-semibold text-white backdrop-blur-md transition-all duration-200 hover:scale-[1.04] hover:bg-white/20 active:scale-95"
            >
              <Info className="size-4" />
              Details
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
