"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useReducedMotionSafe } from "@/utils/motion";

export function usePlayerChromeVisibility(locked = false, delayMs = 3_000) {
  const [hidden, setHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reduceMotion = useReducedMotionSafe();
  const chromeLocked = locked || reduceMotion;

  const reveal = useCallback(() => {
    setHidden(false);
    if (timer.current) clearTimeout(timer.current);
    if (!chromeLocked) timer.current = setTimeout(() => setHidden(true), delayMs);
  }, [chromeLocked, delayMs]);

  useEffect(() => {
    if (!chromeLocked) timer.current = setTimeout(() => setHidden(true), delayMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [chromeLocked, delayMs]);

  return { hidden: chromeLocked ? false : hidden, reveal };
}
