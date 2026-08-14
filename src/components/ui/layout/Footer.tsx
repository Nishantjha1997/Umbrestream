"use client";

import { siteConfig } from "@/config/site";
import { cn } from "@/utils/helpers";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaGithub } from "react-icons/fa6";

interface FooterProps {
  className?: string;
}

const LINK_GROUPS = [
  {
    title: "Explore",
    links: [
      { label: "Movies", href: "/browse?tab=films" },
      { label: "TV Shows", href: "/browse?tab=series" },
      { label: "Anime", href: "/anime" },
      { label: "Search", href: "/search" },
    ],
  },
  {
    title: "Discover",
    links: [
      { label: "Browse", href: "/browse" },
      { label: "Categories", href: "/browse?tab=categories" },
      { label: "Trending", href: "/discover" },
      { label: "Your Space", href: "/space" },
    ],
  },
  {
    title: "StreamFree",
    links: [
      { label: "Android App", href: "/app" },
      { label: "Android TV App", href: "/app/tv" },
      { label: "About StreamFree", href: "/about" },
      { label: "DMCA Notice", href: "/dmca" },
      { label: "Disclaimer", href: "/about#disclaimer" },
    ],
  },
];

const Footer: React.FC<FooterProps> = ({ className }) => {
  const pathname = usePathname();

  return (
    <footer
      className={cn(
        "mt-16 border-t border-white/8 px-4 pt-10 pb-28 text-white/60 md:mt-24 md:px-8 md:pb-12",
        className,
      )}
    >
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <div className="grid gap-9 sm:grid-cols-[1.4fr_repeat(3,1fr)] sm:gap-6">
          <div className="max-w-xs">
            <Link
              href="/"
              aria-label="StreamFree home"
              className="text-lg font-semibold tracking-[0.16em] text-white transition-opacity hover:opacity-80"
            >
              STREAMFREE
            </Link>
            <p className="mt-3 text-sm leading-6 text-white/45">{siteConfig.description}</p>
            <Link
              href={siteConfig.socials.github}
              target="_blank"
              rel="noreferrer"
              aria-label="StreamFree on GitHub"
              className="mt-5 inline-flex size-10 items-center justify-center rounded-full border border-white/12 text-white/65 transition-colors hover:border-white/30 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300"
            >
              <FaGithub size={18} />
            </Link>
          </div>

          {LINK_GROUPS.map((group) => (
            <nav key={group.title} aria-label={`${group.title} footer links`}>
              <h2 className="mb-3 text-xs font-semibold tracking-[0.16em] text-white/80 uppercase">
                {group.title}
              </h2>
              <ul className="flex flex-col items-start gap-2 text-sm">
                {group.links.map((link) => {
                  const active = pathname === link.href || pathname === link.href.split("?")[0];
                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "rounded-sm transition-colors hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-300",
                          active && "text-white",
                        )}
                      >
                        {link.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
          ))}
        </div>

        <div className="flex flex-col gap-2 border-t border-white/8 pt-5 text-xs text-white/35 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} StreamFree. Built for discovery.</p>
          <p>Third-party playback links may be operated by their respective providers.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
