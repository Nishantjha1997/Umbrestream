"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/utils/helpers";
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import type { ReactNode } from "react";
import { itemIsActive, type NavigationItem } from "../itemIsActive";

const TAB_ICON_PATHS: Record<string, ReactNode> = {
  Home: <path d="M3.4 9.2 11 3.2l7.6 6v9.2a.9.9 0 0 1-.9.9h-4.2v-5.6H8.5v5.6H4.3a.9.9 0 0 1-.9-.9V9.2Z" />,
  Search: (
    <>
      <circle cx="10" cy="10" r="6.4" />
      <path d="M14.8 14.8 18.6 18.6" />
    </>
  ),
  Browse: <path d="M3 5.6h16M3 11h16M3 16.4h10" />,
  Anime: (
    <>
      <path d="M11 3.4c2.2 2.6 2.2 5.6 0 8.2-2.2-2.6-2.2-5.6 0-8.2Z" />
      <path d="M11 11.6c2.9-1.3 5.6-.5 7.4 2-3.1.9-5.7.2-7.4-2Zm0 0c-2.9-1.3-5.6-.5-7.4 2 3.1.9 5.7.2 7.4-2Z" />
      <path d="M11 13.6v5" />
    </>
  ),
  You: (
    <>
      <circle cx="11" cy="8" r="3.4" />
      <path d="M4.6 18.4c.6-3.2 3.2-5 6.4-5s5.8 1.8 6.4 5" />
    </>
  ),
};

function TabGlyph({ label }: { label: string }) {
  const paths = TAB_ICON_PATHS[label];
  if (!paths) return null;

  return (
    <svg
      viewBox="0 0 22 22"
      aria-hidden="true"
      className="h-full w-full"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    >
      {paths}
    </svg>
  );
}

function TabBarItem({ item, active }: { item: NavigationItem; active: boolean }) {
  const reducedMotion = useReducedMotion();

  return (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative isolate flex min-h-[54px] flex-col items-center justify-center gap-1.5 rounded-2xl p-0 outline-none transition-colors duration-(--duration-fast) active:scale-[0.95] focus-visible:ring-2 focus-visible:ring-violet-300/70 motion-reduce:transition-none",
        active ? "text-white" : "text-white/42 hover:text-white/70",
      )}
    >
      {active && (
        <motion.span
          layoutId="phone-active-tab"
          aria-hidden="true"
          className="absolute inset-x-1 inset-y-1 -z-10 rounded-[18px] border border-white/12 bg-white/[0.09] shadow-[0_8px_22px_-12px_rgba(0,0,0,.96),inset_0_1px_0_rgba(255,255,255,.13)] backdrop-blur-xl"
          transition={
            reducedMotion
              ? { duration: 0 }
              : { type: "spring", stiffness: 420, damping: 32, mass: 0.65 }
          }
        />
      )}
      <motion.span
        animate={reducedMotion ? undefined : { y: active ? -1 : 0, scale: active ? 1.08 : 1 }}
        transition={reducedMotion ? { duration: 0 } : { duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-5 w-6 items-center justify-center"
      >
        <TabGlyph label={item.label} />
      </motion.span>
      <span className={cn("text-[9.5px] tracking-[.06em]", active ? "font-semibold" : "font-medium")}>
        {item.label}
      </span>
    </Link>
  );
}

export default function TabBar({ pathname }: { pathname: string }) {
  const items = siteConfig.navItems
    .filter((item) => !item.desktopOnly)
    .sort((a, b) => (a.dockOrder ?? 99) - (b.dockOrder ?? 99));

  return (
    <LayoutGroup id="phone-app-tabs">
      <nav
        aria-label="Mobile navigation"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 md:hidden"
        style={{
          padding: "10px 12px max(18px, env(safe-area-inset-bottom))",
          background: "linear-gradient(180deg, rgba(10,9,13,0), rgba(10,9,13,.82) 34%, rgba(10,9,13,.96))",
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",
          boxShadow: "0 -14px 32px rgba(0, 0, 0, .24)",
        }}
      >
        <div className="grid grid-cols-5">
          {items.map((item) => (
            <TabBarItem key={item.href} item={item} active={itemIsActive(pathname, item)} />
          ))}
        </div>
      </nav>
    </LayoutGroup>
  );
}
