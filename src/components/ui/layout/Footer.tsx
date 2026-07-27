"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/utils/helpers";
import { BreadcrumbItem, Breadcrumbs, Link } from "@heroui/react";
import { usePathname } from "next/navigation";
import { FaGithub } from "react-icons/fa6";

interface FooterProps {
  className?: string;
}

const Footer: React.FC<FooterProps> = ({ className }) => {
  const pathName = usePathname();

  return (
    <footer
      className={cn(
        "bottom-0 flex w-full flex-col items-center justify-center gap-3 p-4 text-center",
        className,
      )}
    >
      <h6>{siteConfig.description}</h6>

      <Link isExternal href={siteConfig.socials.github} color="foreground">
        <FaGithub size={24} />
      </Link>

      <Breadcrumbs separator="•" itemClasses={{ separator: "px-2" }}>
        {siteConfig.navItems.map(({ label, href }) => (
          <BreadcrumbItem key={href} isCurrent={pathName === href} href={href}>
            {label}
          </BreadcrumbItem>
        ))}
      </Breadcrumbs>

      {/* Owner's signature. Glass pill so it reads as a deliberate mark rather
          than boilerplate, with the same shine sweep the brand logo uses. */}
      <div className="group glass-control mt-1 flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs">
        <span className="text-white/50">Created by</span>
        <span
          className={cn(
            "bg-linear-to-r from-primary via-white to-primary bg-size-[200%_100%] bg-clip-text",
            "font-semibold tracking-wide text-transparent",
            "animate-shine motion-reduce:animate-none",
          )}
        >
          Nishant
        </span>
        <span className="text-white/50">with</span>
        <span
          aria-label="love"
          role="img"
          className={cn(
            "text-danger inline-block transition-transform duration-(--duration-base)",
            "group-hover:scale-125 motion-reduce:transition-none motion-reduce:group-hover:scale-100",
          )}
        >
          ♥
        </span>
      </div>

    </footer>
  );
};

export default Footer;
