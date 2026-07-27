"use client";

import NavbarMenuItems from "../other/NavbarMenuItems";
import { siteConfig } from "@/config/site";
import { usePathname } from "next/navigation";

const Sidebar: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathName = usePathname();
  const hrefs = siteConfig.navItems.map((item) => item.href);
  const shouldShowSidebar = hrefs.includes(pathName);

  return (
    <div className="flex h-full">
      {shouldShowSidebar && (
        <div className="hidden md:block">
          <div className="left-0 top-0 w-20" />
          <aside className="fixed left-0 top-0 h-screen w-fit">
            <nav className="flex h-full flex-col justify-center border-r border-white/10 bg-background/70 pl-2 text-foreground backdrop-blur-xl transition-all duration-300 motion-reduce:transition-none dark:bg-background/80">
              <NavbarMenuItems size="sm" isVertical withIcon variant="light" />
            </nav>
          </aside>
        </div>
      )}
      {children}
    </div>
  );
};

export default Sidebar;
