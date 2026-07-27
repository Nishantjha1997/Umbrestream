"use client";

import NavbarMenuItems from "../other/NavbarMenuItems";
import { siteConfig } from "@/config/site";
import { usePathname } from "next/navigation";

const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathName = usePathname();
  const hrefs = siteConfig.navItems.map((item) => item.href);
  const shouldShowSidebar = hrefs.includes(pathName);

  return (
    <div className="flex h-full min-w-0">
      {shouldShowSidebar && (
        <div className="hidden md:block">
          <div className="w-20 shrink-0" />
          {/*
            No border and no glass plate.

            `border-r` ran the full viewport height, so it drew a hard rule past
            the wordmark at the top and below the last item at the bottom —
            visible as two stray line fragments. The glass plate also stacked
            against the navbar's own glass, doubling the tint in the corner.
            The rail now floats over the page: separation comes from spacing
            and the item pills, which is the Apple TV register.

            `top-16` starts it below the navbar so nothing sits behind the
            wordmark.
          */}
          <aside className="fixed top-16 bottom-0 left-0 w-20">
            <nav className="text-foreground flex h-full flex-col justify-center">
              <NavbarMenuItems size="sm" isVertical withIcon variant="light" />
            </nav>
          </aside>
        </div>
      )}
      {/* min-w-0 lets a too-wide child shrink instead of forcing the page into
          a horizontal scrollbar. */}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
};

export default Sidebar;
