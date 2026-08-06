"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function usePlayerChromeVisibility(locked = false, delayMs = 3_000) {
  const [hidden, setHidden] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reveal = useCallback(() => {
    setHidden(false);
    if (timer.current) clearTimeout(timer.current);
    if (!locked) timer.current = setTimeout(() => setHidden(true), delayMs);
  }, [delayMs, locked]);

  useEffect(() => {
    if (!locked) timer.current = setTimeout(() => setHidden(true), delayMs);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [delayMs, locked]);

  return { hidden: locked ? false : hidden, reveal };
}
