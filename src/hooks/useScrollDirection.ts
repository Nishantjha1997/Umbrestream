"use client";

import { useEffect, useState } from "react";

export type ScrollDirection = "up" | "down";

export function useScrollDirection() {
  const [state, setState] = useState<{ direction: ScrollDirection; y: number }>({
    direction: "up",
    y: 0,
  });

  useEffect(() => {
    let previous = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      if (Math.abs(y - previous) < 4) return;
      setState({ direction: y > previous ? "down" : "up", y });
      previous = y;
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return state;
}
