"use client";

/**
 * Composition root only (Phase 2, §6). The two shells themselves live at
 * `src/components/shell/desktop/Rail.tsx` and `src/components/shell/phone/TabBar.tsx`
 * — genuinely separate components, not one component branching on an
 * `isMobile` prop. Both render unconditionally here; `Rail.tsx` is
 * `hidden md:block` and `TabBar.tsx` is `md:hidden`, so the choice between
 * them is resolved by the browser's CSS engine before first paint, not by
 * client JS reading a media query. That is what makes it flash-free: there
 * is no "wrong shell" state to flash, both are always in the DOM and only
 * one is ever visible for a given viewport width.
 *
 * Tablet (768–1023px) falls on the desktop side of this split: `md` is
 * 768px, so a 768–1023px viewport gets `Rail.tsx`, not `TabBar.tsx`. That is
 * the deliberate choice §6 asks for — the desktop rail and content grids
 * hold up better stretched down to tablet width than the phone shell does
 * stretched up.
 */

import { AmbientLayers } from "@/components/media/AmbientProvider";
import DesktopHeader from "@/components/shell/desktop/Header";
import DesktopRail from "@/components/shell/desktop/Rail";
import PhoneAppHeader from "@/components/shell/phone/PhoneAppHeader";
import TabBar from "@/components/shell/phone/TabBar";
import AppRouteMotion from "@/components/ui/layout/AppRouteMotion";
import Footer from "@/components/ui/layout/Footer";
import { cn } from "@/utils/helpers";
import { SpacingClasses } from "@/utils/constants";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

interface ImmersiveAppShellProps {
  children: ReactNode;
  /** The `@modal` parallel-route slot (Phase 2, §6) — an intercepted detail
      route, or nothing (`@modal/default.tsx` renders `null` for every path
      that isn't intercepted). Rendered last so it paints above the rail and
      tab bar too, matching the design's z-index ordering (modal above nav
      chrome). `children` (the page underneath) stays mounted and scrolled
      exactly where it was — that's the whole point of a parallel route. */
  modal: ReactNode;
}

export default function ImmersiveAppShell({ children, modal }: ImmersiveAppShellProps) {
  const pathname = usePathname();
  const playerRoute = pathname.includes("/player");
  const chromeHidden = playerRoute || pathname.startsWith("/auth");

  return (
    <div className="relative min-h-dvh overflow-x-clip bg-[#0a090d] text-white">
      {/* Ambient theming (Phase 1). Mounted here, not in `providers.tsx`,
          because this is the `position: relative` root the `inset-0` layers
          need — see `AmbientProvider.tsx`'s file header. No page sets an
          ambient color yet (Phase 5), so this renders the neutral default
          (vignette only) everywhere for now. */}
      <AmbientLayers />
      {!chromeHidden && <DesktopRail pathname={pathname} />}
      <main
        className={cn(
          "container mx-auto min-h-dvh max-w-full transition-[padding] duration-300",
          chromeHidden
            ? SpacingClasses.main
            : "px-3 pt-[max(0.5rem,env(safe-area-inset-top))] pb-[calc(6.5rem+env(safe-area-inset-bottom))] sm:px-5 md:py-8",
          !chromeHidden && "md:pl-[calc(5rem+var(--spacing-main-x,1rem))]",
        )}
      >
        {/* Persistent desktop search header (Phase 3, §7). Hidden on
            player/auth routes along with the rail and tab bar — those
            screens own the whole viewport. */}
        {!chromeHidden && <DesktopHeader isHome={pathname === "/"} />}
        {!chromeHidden && <PhoneAppHeader pathname={pathname} />}
        {playerRoute && <div className="player-route-header" aria-hidden="true" />}
        <AppRouteMotion>{children}</AppRouteMotion>
        {!chromeHidden && <Footer className="hidden md:block" />}
      </main>
      {!chromeHidden && <TabBar pathname={pathname} />}
      {modal}
    </div>
  );
}
