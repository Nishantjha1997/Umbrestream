"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

export function usePlayerChromeVisibility(locked = false, delayMs = 3_000) {
  const reducedMotion = useReducedMotion();
  const [hidden, setHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reveal = useCallback(() => {
    setHidden(false);
    if (timer.current) clearTimeout(timer.current);
    if (!locked && !reducedMotion) timer.current = setTimeout(() => setHidden(true), delayMs);
  }, [delayMs, locked, reducedMotion]);

  useEffect(() => {
    if (!locked && !reducedMotion) timer.current = setTimeout(() => setHidden(true), delayMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [delayMs, locked, reducedMotion]);

  return { hidden: locked || reducedMotion ? false : hidden, reveal };
}
