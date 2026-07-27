"use client";

import { useRef, useState, useEffect, useCallback } from "react";
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
      <h2 className="mb-3 px-4 text-lg font-semibold tracking-tight text-[var(--color-fg)] md:px-8">
        {heading}
      </h2>

      <div
        ref={trackRef}
        onScroll={sync}
        className="tray flex gap-3 overflow-x-auto px-4 pb-2 md:px-8"
      >
        {titles.map((t, i) => (
          <PosterCard key={t.key} title={t} priority={priority && i < 6} />
        ))}
      </div>

      {/* Pointer-only affordances; the tray is already swipeable on touch
          and keyboard-reachable through the links themselves. */}
      <ArrowButton side="left" hidden={atStart} onClick={() => nudge(-1)} />
      <ArrowButton side="right" hidden={atEnd} onClick={() => nudge(1)} />
    </section>
  );
}

function ArrowButton({
  side,
  hidden,
  onClick,
}: {
  side: "left" | "right";
  hidden: boolean;
  onClick: () => void;
}) {
  if (hidden) return null;
  return (
    <button
      type="button"
      aria-hidden
      tabIndex={-1}
      onClick={onClick}
      className={`absolute top-[calc(50%-0.5rem)] hidden h-20 w-10 -translate-y-1/2 items-center justify-center rounded-md border border-[var(--color-border)] bg-black/80 text-[var(--color-fg-muted)] opacity-0 backdrop-blur-sm transition hover:border-[var(--color-border-strong)] hover:text-[var(--color-fg)] group-hover/row:opacity-100 md:flex ${
        side === "left" ? "left-2" : "right-2"
      }`}
    >
      {side === "left" ? "‹" : "›"}
    </button>
  );
}
