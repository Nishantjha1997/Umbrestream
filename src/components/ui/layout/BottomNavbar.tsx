"use client";

import { siteConfig } from "@/config/site";
import clsx from "clsx";
import { Link } from "@heroui/link";
import { usePathname } from "next/navigation";
import { Chip } from "@heroui/chip";

const BottomNavbar = () => {
  const pathName = usePathname();
  const hrefs = siteConfig.navItems.map((item) => item.href);
  const show = hrefs.includes(pathName);

  return (
    show && (
      <>
        <div className="h-[calc(5rem+env(safe-area-inset-bottom))] md:hidden" />
        <div className="glass-chrome safe-bottom-nav fixed bottom-0 left-0 z-50 block h-fit w-full translate-y-px border-t pt-2 transition-all duration-(--duration-base) motion-reduce:transition-none md:hidden">
          <div
            className="mx-auto grid h-full max-w-lg"
            style={{ gridTemplateColumns: `repeat(${siteConfig.navItems.length}, minmax(0, 1fr))` }}
          >
            {siteConfig.navItems.map((item) => {
              const isActive = pathName === item.href;
              return (
                <Link
                  href={item.href}
                  key={item.href}
                  className="text-foreground flex items-center justify-center transition-transform duration-300 hover:scale-105 active:scale-95 motion-reduce:transition-none motion-reduce:hover:scale-100"
                >
                  <div className="flex max-h-[50px] flex-col items-center justify-center">
                    <Chip
                      size="lg"
                      variant={isActive ? "solid" : "light"}
                      color={isActive ? "primary" : "default"}
                      classNames={{
                        base: "py-[2px] transition-all duration-300 motion-reduce:transition-none",
                        content: "size-full",
                      }}
                    >
                      {isActive ? item.activeIcon : item.icon}
                    </Chip>
                    <p
                      className={clsx("text-[10px] transition-colors duration-300", {
                        "text-primary font-bold": isActive,
                      })}
                    >
                      {item.label}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </>
    )
  );
};

export default BottomNavbar;
