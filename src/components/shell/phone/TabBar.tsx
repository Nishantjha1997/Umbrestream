"use client";

/**
 * The phone shell (Phase 2, §6). A floating bottom dock with a magnetic
 * hover/focus size effect — genuinely different from the desktop rail, not
 * a breakpoint variant of it. Selection is pure CSS (`md:hidden` here,
 * `hidden md:block` on `Rail.tsx`), not `useBreakpoints`, so there is no
 * flash of the wrong shell on cold load and no hydration mismatch:
 * `useBreakpoints` wraps `useMediaQuery`, which is client-only and returns
 * `undefined` on first paint — exactly what this phase's selection mechanism
 * has to avoid (§6, "How to select, and the trap").
 *
 * Content still matches the pre-Phase-3 9-item nav (filtered to the 7 that
 * aren't `desktopOnly`); Phase 3 reduces this to 5 items and restyles to the
 * design's exact tab-bar geometry (`docs/design/PHONE_SPEC.md` §E). This
 * phase only establishes the file boundary the design work will land in.
 */

import { useFloatingDock } from "@/hooks/useFloatingDock";
import { cn } from "@/utils/helpers";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import Link from "next/link";
import { useRef } from "react";
import { itemIsActive, type NavigationItem } from "../itemIsActive";
import { siteConfig } from "@/config/site";

function FloatingDockItem({
  item,
  active,
  pointerX,
  reducedMotion,
}: {
  item: NavigationItem;
  active: boolean;
  pointerX: MotionValue<number>;
  reducedMotion: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const distance = useTransform(pointerX, (value) => {
    const bounds = ref.current?.getBoundingClientRect();
    return bounds ? value - (bounds.left + bounds.width / 2) : 999;
  });
  const targetSize = useTransform(distance, [-120, 0, 120], [36, 60, 36]);
  const targetIcon = useTransform(distance, [-120, 0, 120], [18, 30, 18]);
  const size = useSpring(targetSize, { mass: 0.1, stiffness: 150, damping: 12 });
  const iconSize = useSpring(targetIcon, { mass: 0.1, stiffness: 150, damping: 12 });

  return (
    <motion.div
      className="group/dock relative flex h-[60px] w-9 shrink-0 items-center justify-center"
      style={reducedMotion ? undefined : { width: size }}
    >
      <Link
        ref={ref}
        href={item.href}
        aria-label={item.label}
        aria-current={active ? "page" : undefined}
        onFocus={() => {
          const bounds = ref.current?.getBoundingClientRect();
          if (bounds) pointerX.set(bounds.left + bounds.width / 2);
        }}
        className={cn(
          "relative flex size-11 min-h-11 min-w-11 items-center justify-center rounded-xl text-white/58 transition-colors duration-200 outline-none active:scale-95",
          "hover:bg-white/8 hover:text-white focus-visible:bg-white/10 focus-visible:text-white focus-visible:ring-2 focus-visible:ring-violet-300/70",
          active && "bg-white/10 text-violet-200",
        )}
      >
        <motion.span
          className="flex items-center justify-center"
          style={reducedMotion ? { width: 22, height: 22 } : { width: iconSize, height: iconSize }}
        >
          {active ? item.activeIcon : item.icon}
        </motion.span>
        <span className="pointer-events-none absolute bottom-[calc(100%+0.65rem)] left-1/2 -translate-x-1/2 rounded-lg border border-white/10 bg-black/90 px-2.5 py-1 text-[11px] font-medium whitespace-nowrap text-white opacity-0 shadow-xl transition-all duration-150 group-focus-within/dock:-translate-y-1 group-focus-within/dock:opacity-100 group-hover/dock:-translate-y-1 group-hover/dock:opacity-100">
          {item.label}
        </span>
        {active && <span className="absolute bottom-1 h-1 w-1 rounded-full bg-violet-300" />}
      </Link>
    </motion.div>
  );
}

export default function TabBar({ pathname }: { pathname: string }) {
  const pointerX = useMotionValue(Number.POSITIVE_INFINITY);
  const { hidden, reducedMotion, focusProps } = useFloatingDock();
  const items = siteConfig.navItems
    .filter((item) => !item.desktopOnly)
    .sort((a, b) => (a.dockOrder ?? 99) - (b.dockOrder ?? 99));

  return (
    <motion.nav
      aria-label="Mobile navigation"
      {...focusProps}
      initial={false}
      animate={{ y: hidden ? 110 : 0, opacity: hidden ? 0 : 1 }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
      onPointerMove={(event) => pointerX.set(event.clientX)}
      onPointerLeave={() => pointerX.set(Number.POSITIVE_INFINITY)}
      className="safe-floating-dock fixed bottom-0 left-1/2 z-60 flex h-16 max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-[#0a090d]/92 px-2 shadow-[0_18px_50px_rgba(0,0,0,.65)] backdrop-blur-2xl md:hidden"
    >
      {items.map((item) => (
        <FloatingDockItem
          key={item.href}
          item={item}
          active={itemIsActive(pathname, item)}
          pointerX={pointerX}
          reducedMotion={reducedMotion}
        />
      ))}
    </motion.nav>
  );
}
