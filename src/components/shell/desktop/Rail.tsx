"use client";

/**
 * The desktop shell (Phase 2, §6). A fixed left rail — 80px resting,
 * expanding on hover/focus — genuinely different from the phone tab bar, not
 * a breakpoint variant of it. Selection is pure CSS (`hidden md:block` on the
 * parent), not `useBreakpoints`: see `itemIsActive.ts`'s sibling
 * `TabBar.tsx` for why that matters (no flash of the wrong shell on cold
 * load).
 *
 * Content matches the 5-item nav (`src/config/site.tsx`) and the design's
 * exact rail geometry (`docs/design/DESKTOP_SPEC.md` §C): a monogram that
 * reveals into the full wordmark on expansion, a plain white/tinted active
 * state with no accent hue, and a real account menu in the footer.
 */

import UserProfileButton from "@/components/ui/button/UserProfileButton";
import BrandLogo from "@/components/ui/other/BrandLogo";
import { siteConfig } from "@/config/site";
import { cn } from "@/utils/helpers";
import Link from "next/link";
import { itemIsActive } from "../itemIsActive";

export default function DesktopRail({ pathname }: { pathname: string }) {
  return (
    <aside className="group group/rail fixed inset-y-0 left-0 z-60 hidden w-20 overflow-hidden border-r border-white/8 bg-[#0b0c10]/88 shadow-2xl shadow-black/45 backdrop-blur-2xl transition-[width] duration-300 ease-out focus-within:w-60 hover:w-60 md:block">
      <div className="pointer-events-none absolute inset-y-0 left-full w-24 bg-linear-to-r from-black/45 to-transparent opacity-0 transition-opacity duration-300 group-focus-within:opacity-100 group-hover:opacity-100" />
      <div className="flex h-full w-60 flex-col px-4 py-[max(1.25rem,env(safe-area-inset-top))]">
        <div className="flex h-[4.875rem] shrink-0 items-center">
          <BrandLogo
            className="h-11 w-full px-2"
            textClassName="-translate-x-2 opacity-0 transition-all duration-300 group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100 group-hover/rail:translate-x-0 group-hover/rail:opacity-100"
          />
        </div>
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
                  "group/item relative flex h-11 w-full items-center rounded-xl text-white/50 transition-colors duration-200 outline-none hover:bg-white/7 hover:text-white focus-visible:bg-white/9 focus-visible:ring-2 focus-visible:ring-violet-400/60",
                  active && "bg-white/9 text-white",
                )}
              >
                <span
                  className={cn(
                    "ml-2 flex size-7 shrink-0 items-center justify-center transition-transform duration-300",
                    active && "scale-110",
                  )}
                >
                  {active ? item.activeIcon : item.icon}
                </span>
                <span
                  className={cn(
                    "ml-5 flex min-w-0 -translate-x-2 items-center gap-2 text-sm font-medium whitespace-nowrap opacity-0 transition-all duration-300 group-focus-within:translate-x-0 group-focus-within:opacity-100 group-hover:translate-x-0 group-hover:opacity-100",
                    active && "font-semibold",
                  )}
                >
                  {item.label}
                  {item.preview && (
                    <span className="rounded-full border border-violet-300/20 bg-violet-400/10 px-2 py-0.5 text-[9px] font-bold tracking-[0.12em] text-violet-200 uppercase">
                      Soon
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-white/8 px-2 pt-3 pb-1">
          {/*
            UserProfileButton lays its content out as [name][avatar], left to
            right — it was built for a horizontal top navbar, not this rail.
            Clipping this box to just the avatar's width and right-aligning
            its (wider, unclippable) content means the overflow spills off
            the *left* edge instead of the right, so what stays on-screen at
            rest is the avatar — a monogram-style affordance matching the
            collapsed wordmark above — while the name and dropdown affordance
            reveal once the rail expands, exactly like the nav labels.
          */}
          <div className="flex h-11 w-11 items-center justify-end overflow-hidden transition-[width] duration-300 ease-out group-focus-within/rail:w-full group-hover/rail:w-full">
            <UserProfileButton />
          </div>
        </div>
      </div>
    </aside>
  );
}
