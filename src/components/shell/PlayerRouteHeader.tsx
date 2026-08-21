"use client";

import BrandLogo from "@/components/ui/other/BrandLogo";
import { cn } from "@/utils/helpers";
import Link from "next/link";
import { TbHome, TbLayoutGrid, TbSearch, TbSparkles } from "react-icons/tb";

const PLAYER_LINKS = [
  { href: "/", label: "Home", icon: TbHome },
  { href: "/browse", label: "Browse", icon: TbLayoutGrid },
  { href: "/anime", label: "Anime", icon: TbSparkles },
  { href: "/search", label: "Search", icon: TbSearch },
] as const;

/** Compact app-owned boundary above framed playback. Provider controls remain
 * inside the stage below, while fullscreen removes this header completely. */
export default function PlayerRouteHeader() {
  return (
    <header className="player-route-header" aria-label="Player navigation">
      <div className="mx-auto flex min-h-13 w-full max-w-[1600px] items-center justify-between gap-2 px-1 sm:min-h-14 sm:px-2">
        <BrandLogo
          className="min-h-11 shrink-0 px-2"
          textClassName="hidden text-sm tracking-[0.1em] sm:inline"
        />
        <nav className="flex items-center gap-1" aria-label="Leave player">
          {PLAYER_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              prefetch={false}
              aria-label={label}
              className={cn(
                "inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full border border-transparent px-2.5 text-white/68 outline-none",
                "transition-colors duration-(--duration-fast) ease-(--ease-out-quint) hover:border-white/12 hover:bg-white/7 hover:text-white focus-visible:ring-2 focus-visible:ring-white/65 motion-reduce:transition-none",
                "sm:px-3",
              )}
            >
              <Icon className="size-[17px] shrink-0" aria-hidden="true" />
              <span className="hidden text-xs font-semibold lg:inline">{label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
