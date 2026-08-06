"use client";

import BrandLogo from "@/components/ui/other/BrandLogo";
import { siteConfig } from "@/config/site";
import { useFloatingDock } from "@/hooks/useFloatingDock";
import { cn } from "@/utils/helpers";
import { SpacingClasses } from "@/utils/constants";
import { motion, useMotionValue, useSpring, useTransform, type MotionValue } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRef, type PropsWithChildren } from "react";

type NavigationItem = (typeof siteConfig.navItems)[number];

function itemIsActive(pathname: string, item: NavigationItem): boolean {
  if (item.href === "/") return pathname === "/";
  if (item.href === "/movies") return pathname === "/movies" || pathname.startsWith("/movie/");
  if (item.href === "/tv") return pathname === "/tv" || pathname.startsWith("/tv/");
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function DesktopRail({ pathname }: { pathname: string }) {
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

function MobileDock({ pathname }: { pathname: string }) {
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
      className="safe-floating-dock fixed bottom-0 left-1/2 z-60 flex h-16 max-w-[calc(100vw-1rem)] -translate-x-1/2 items-center gap-1 rounded-2xl border border-white/10 bg-[#0f1014]/92 px-2 shadow-[0_18px_50px_rgba(0,0,0,.65)] backdrop-blur-2xl md:hidden"
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

export default function ImmersiveAppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const chromeHidden = pathname.includes("/player") || pathname.startsWith("/auth");

  return (
    <div className="min-h-dvh bg-[#0f1014] text-white">
      {!chromeHidden && <DesktopRail pathname={pathname} />}
      <main
        className={cn(
          "container mx-auto min-h-dvh max-w-full transition-[padding] duration-300",
          SpacingClasses.main,
          !chromeHidden && "md:pl-[calc(5rem+var(--spacing-main-x,1rem))]",
        )}
      >
        {children}
      </main>
      {!chromeHidden && <MobileDock pathname={pathname} />}
    </div>
  );
}
