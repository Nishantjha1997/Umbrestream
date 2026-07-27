"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Title } from "@/types/title";
import { PosterCard } from "./PosterCard";

interface Props {
  heading: string;
  titles: Title[];
  priority?: boolean;
}

export function ContentRow({ heading, titles, priority = false }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    sync();
    const el = trackRef.current;
    if (!el) return;
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => ro.disconnect();
  }, [sync, titles.length]);

  const nudge = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  if (titles.length === 0) return null;

  return (
    <section className="group/row relative">
      <motion.h2
        initial={{ opacity: 0, x: -12 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="mb-3 flex items-center gap-2 px-4 text-lg font-semibold tracking-tight text-[var(--color-fg)] md:px-8"
      >
        <span className="h-5 w-1 rounded-full bg-[var(--color-accent)]" />
        {heading}
      </motion.h2>

      <div
        ref={trackRef}
        onScroll={sync}
        className="tray flex gap-3 overflow-x-auto px-4 pb-3 pt-1 md:px-8"
      >
        {titles.map((t, i) => (
          <PosterCard key={t.key} title={t} index={i} priority={priority && i < 6} />
        ))}
      </div>

      {/* Pointer-only affordances. The tray is swipeable on touch and the
          cards are reachable by keyboard through their own links. */}
      <AnimatePresence>
        {!atStart && <Arrow side="left" onClick={() => nudge(-1)} />}
        {!atEnd && <Arrow side="right" onClick={() => nudge(1)} />}
      </AnimatePresence>
    </section>
  );
}

function Arrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <motion.button
      type="button"
      aria-hidden
      tabIndex={-1}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.18 }}
      className={`absolute top-[42%] hidden size-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--color-border-strong)] bg-black/85 text-[var(--color-fg-muted)] opacity-0 backdrop-blur-md transition-opacity duration-200 hover:text-[var(--color-fg)] group-hover/row:opacity-100 md:flex ${
        side === "left" ? "left-3" : "right-3"
      }`}
    >
      <Icon className="size-5" />
    </motion.button>
  );
}
