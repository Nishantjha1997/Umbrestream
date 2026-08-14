"use client";

import { motion, useReducedMotion } from "motion/react";
import { usePrevious } from "@mantine/hooks";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

function tabIndex(pathname: string): number | null {
  if (pathname === "/") return 0;
  if (pathname === "/search") return 1;
  if (pathname === "/browse" || pathname.startsWith("/browse/")) return 2;
  if (pathname === "/anime") return 3;
  if (pathname === "/space" || pathname.startsWith("/space/")) return 4;
  return null;
}

/** Short directional entrances for primary phone-tab navigation. */
export default function AppRouteMotion({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const previousPathname = usePrevious(pathname) ?? pathname;
  const previousIndex = tabIndex(previousPathname);
  const nextIndex = tabIndex(pathname);
  const isTabTransition =
    previousIndex !== null && nextIndex !== null && previousIndex !== nextIndex;
  const direction = isTabTransition && nextIndex > previousIndex ? 1 : -1;

  // Keep first loads and non-tab routes visible in the server HTML. Only a
  // real switch between primary tabs needs the directional glass-slide;
  // hiding every route until hydration can leave a blank page when an older
  // PWA service worker is still refreshing its assets.
  const initial =
    reducedMotion || !isTabTransition
      ? false
      : { opacity: 0, x: direction * 20, y: 3, scale: 0.992 };

  return (
    <motion.div
      key={pathname}
      initial={initial}
      animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      transition={
        reducedMotion
          ? { duration: 0 }
          : { duration: isTabTransition ? 0.34 : 0, ease: [0.22, 1, 0.36, 1] }
      }
      className="relative min-w-0"
    >
      {children}
    </motion.div>
  );
}
