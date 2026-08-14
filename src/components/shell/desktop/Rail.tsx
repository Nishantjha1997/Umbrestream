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
import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import { TbBrandAndroid } from "react-icons/tb";
import { itemIsActive } from "../itemIsActive";

export default function DesktopRail({ pathname }: { pathname: string }) {
  const reducedMotion = useReducedMotion();
  const appActive = pathname === "/app" || pathname.startsWith("/app/");

  return (
    <LayoutGroup id="desktop-navigation-rail">
      <aside className="group group/rail fixed inset-y-0 left-0 z-60 hidden w-20 overflow-hidden border-r border-white/8 bg-[#0b0c10]/88 shadow-2xl shadow-black/45 backdrop-blur-2xl transition-[width,box-shadow] duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)] focus-within:w-60 focus-within:shadow-[24px_0_70px_-32px_rgba(0,0,0,.95)] hover:w-60 hover:shadow-[24px_0_70px_-32px_rgba(0,0,0,.95)] md:block">
        <div className="pointer-events-none absolute inset-y-0 left-full w-28 bg-linear-to-r from-black/48 to-transparent opacity-0 transition-opacity duration-500 group-focus-within:opacity-100 group-hover:opacity-100" />
        <div className="pointer-events-none absolute -top-28 -left-28 size-64 rounded-full bg-violet-500/14 opacity-0 blur-3xl transition-[opacity,transform] duration-700 group-focus-within/rail:translate-x-20 group-focus-within/rail:opacity-100 group-hover/rail:translate-x-20 group-hover/rail:opacity-100" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-px bg-linear-to-b from-transparent via-violet-300/40 to-transparent opacity-0 transition-opacity duration-500 group-focus-within/rail:opacity-100 group-hover/rail:opacity-100" />

        <div className="relative flex h-full w-60 flex-col px-4 py-[max(1.25rem,env(safe-area-inset-top))]">
          <div className="flex h-[4.875rem] shrink-0 items-center">
            <BrandLogo
              className="h-11 w-full px-2"
              textClassName="-translate-x-2 opacity-0 transition-all duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)] group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100 group-hover/rail:translate-x-0 group-hover/rail:opacity-100"
            />
          </div>
          <nav
            aria-label="Main navigation"
            className="flex min-h-0 flex-1 flex-col justify-center gap-1.5"
          >
            {siteConfig.navItems.map((item, index) => {
              const active = itemIsActive(pathname, item);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group/item relative isolate flex h-11 w-full items-center overflow-hidden rounded-xl text-white/50 transition-colors duration-200 outline-none hover:text-white focus-visible:ring-2 focus-visible:ring-violet-400/60",
                    active && "text-white",
                  )}
                >
                  {active ? (
                    <motion.span
                      layoutId="desktop-active-rail-item"
                      aria-hidden="true"
                      className="absolute inset-0 -z-10 rounded-xl border border-white/11 bg-linear-to-r from-white/11 via-white/[0.075] to-violet-300/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,.09),0_10px_25px_-18px_rgba(139,92,246,.8)]"
                      transition={
                        reducedMotion
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 390, damping: 31, mass: 0.7 }
                      }
                    />
                  ) : (
                    <span className="absolute inset-0 -z-10 rounded-xl bg-white/0 transition-colors duration-200 group-hover/item:bg-white/[0.065]" />
                  )}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute top-1/2 left-0 h-5 w-0.5 -translate-y-1/2 rounded-full bg-violet-200 opacity-0 shadow-[0_0_14px_rgba(196,181,253,.9)] transition-[height,opacity] duration-300",
                      active && "h-7 opacity-100",
                    )}
                  />
                  <motion.span
                    whileHover={
                      reducedMotion ? undefined : { x: 2, scale: 1.12, rotate: active ? 0 : -4 }
                    }
                    whileTap={reducedMotion ? undefined : { scale: 0.92 }}
                    className={cn(
                      "relative z-10 ml-2 flex size-7 shrink-0 items-center justify-center transition-transform duration-300",
                      active && "scale-110 text-violet-100",
                    )}
                  >
                    {active ? item.activeIcon : item.icon}
                  </motion.span>
                  <span
                    className={cn(
                      "relative z-10 ml-5 flex min-w-0 -translate-x-2 items-center gap-2 text-sm font-medium whitespace-nowrap opacity-0 transition-[transform,opacity] duration-[380ms] ease-[cubic-bezier(.22,1,.36,1)] group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100 group-hover/rail:translate-x-0 group-hover/rail:opacity-100",
                      active && "font-semibold",
                    )}
                    style={{ transitionDelay: `${index * 24}ms` }}
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

          <div className="mb-3 border-t border-white/8 pt-3">
            <Link
              href="/app"
              aria-current={appActive ? "page" : undefined}
              className={cn(
                "group/app relative isolate flex h-12 items-center overflow-hidden rounded-xl border border-violet-300/12 bg-violet-400/[0.055] text-violet-100 transition-colors outline-none hover:border-violet-200/25 hover:bg-violet-400/[0.11] focus-visible:ring-2 focus-visible:ring-violet-300/70",
                appActive && "border-violet-200/28 bg-violet-400/[0.14]",
              )}
            >
              <span className="absolute inset-y-0 -left-16 w-12 -skew-x-12 bg-white/12 blur-sm transition-transform duration-700 group-hover/app:translate-x-72 motion-reduce:hidden" />
              <motion.span
                animate={reducedMotion ? undefined : { rotate: [0, -5, 5, 0] }}
                transition={
                  reducedMotion
                    ? { duration: 0 }
                    : { duration: 1.8, repeat: Infinity, repeatDelay: 3.5 }
                }
                className="relative z-10 ml-2 flex size-7 shrink-0 items-center justify-center"
              >
                <TbBrandAndroid className="size-[22px]" aria-hidden="true" />
              </motion.span>
              <span className="relative z-10 ml-5 flex -translate-x-2 items-center gap-2 whitespace-nowrap opacity-0 transition-[transform,opacity] duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)] group-focus-within/rail:translate-x-0 group-focus-within/rail:opacity-100 group-hover/rail:translate-x-0 group-hover/rail:opacity-100">
                <span className="text-sm font-semibold">Android app</span>
                <span className="rounded-full bg-violet-200 px-2 py-0.5 text-[8px] font-extrabold tracking-[0.12em] text-violet-950 uppercase">
                  New
                </span>
              </span>
            </Link>
          </div>

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
            <div className="flex h-11 w-11 items-center justify-end overflow-hidden transition-[width] duration-[420ms] ease-[cubic-bezier(.22,1,.36,1)] group-focus-within/rail:w-full group-hover/rail:w-full">
              <UserProfileButton />
            </div>
          </div>
        </div>
      </aside>
    </LayoutGroup>
  );
}
