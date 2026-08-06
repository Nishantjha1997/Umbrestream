"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState, type FocusEvent } from "react";

export function useFloatingDock() {
  const reducedMotion = useReducedMotion();
  const [scrollHidden, setScrollHidden] = useState(false);
  const [keyboardFocused, setKeyboardFocused] = useState(false);
  const previousY = useRef(0);

  useEffect(() => {
    previousY.current = window.scrollY;
    let frame = 0;
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      const delta = y - previousY.current;
      if (delta > 4 && y > 50) setScrollHidden(true);
      else if (delta < -4) setScrollHidden(false);
      previousY.current = y;
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

  return {
    hidden: !reducedMotion && !keyboardFocused && scrollHidden,
    reducedMotion: Boolean(reducedMotion),
    focusProps: {
      onFocusCapture: () => setKeyboardFocused(true),
      onBlurCapture: (event: FocusEvent<HTMLElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setKeyboardFocused(false);
      },
    },
  };
}
