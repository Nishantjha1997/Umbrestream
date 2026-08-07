"use client";

/**
 * The desktop shell (Phase 2, §6). A fixed left rail — 80px resting,
 * expanding on hover/focus — genuinely different from the phone tab bar, not
 * a breakpoint variant of it. Selection is pure CSS (`hidden md:block` on the
 * parent), not `useBreakpoints`: see `itemIsActive.ts`'s sibling
 * `TabBar.tsx` for why that matters (no flash of the wrong shell on cold
 * load).
 *
 * Content still matches the pre-Phase-3 9-item nav; Phase 3 reduces this to
 * 5 items and restyles to the design's exact rail geometry
 * (`docs/design/DESKTOP_SPEC.md` §C). This phase only establishes the file
 * boundary the design work will land in.
 */

import BrandLogo from "@/components/ui/other/BrandLogo";
import { siteConfig } from "@/config/site";
import { cn } from "@/utils/helpers";
import Link from "next/link";
import { itemIsActive } from "../itemIsActive";

export default function DesktopRail({ pathname }: { pathname: string }) {
  return (
    <aside className="group fixed inset-y-0 left-0 z-60 hidden w-20 overflow-hidden border-r border-white/8 bg-[#0b0c10]/88 shadow-2xl shadow-black/45 backdrop-blur-2xl transition-[width] duration-300 ease-out focus-within:w-60 hover:w-60 md:block">
      <div className="pointer-events-none absolute inset-y-0 left-full w-24 bg-linear-to-r from-black/45 to-transparent opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100" />
      <div className="flex h-full w-60 flex-col px-4 py-[max(1.25rem,env(safe-area-inset-top))]">
        <BrandLogo className="mb-7 h-11 w-[190px] px-2" />
        <nav
          aria-label="Main navigation"
          className="flex min-h-0 flex-1 flex-col justify-center gap-1.5"
        >
          {siteConfig.navItems.map((item) => {
            const active = itemIsActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group/item relative flex h-11 w-full items-center rounded-xl text-white/58 transition-colors duration-200 outline-none hover:bg-white/7 hover:text-white focus-visible:bg-white/9 focus-visible:ring-2 focus-visible:ring-violet-400/60",
                  active && "bg-white/10 text-white",
                )}
              >
                <span
                  className={cn(
                    "ml-2 flex size-7 shrink-0 items-center justify-center transition-transform duration-300",
                    active && "scale-110 text-violet-300",
                  )}
                >
                  {active ? item.activeIcon : item.icon}
                </span>
                <span className="ml-5 flex min-w-0 -translate-x-2 items-center gap-2 text-sm font-medium whitespace-nowrap opacity-0 transition-all duration-300 group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100">
                  {item.label}
                  {item.preview && (
                    <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] text-violet-200 uppercase">
                      Soon
                    </span>
                  )}
                </span>
                {active && (
                  <span className="absolute right-2 h-5 w-0.5 rounded-full bg-violet-300" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
