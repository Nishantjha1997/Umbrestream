"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  Clapperboard,
  Compass,
  Film,
  History,
  Home,
  Play,
  Settings,
  Sparkles,
  Star,
  Tv,
  type LucideIcon,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  Icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/discover", label: "Discover", Icon: Compass },
  { href: "/movies", label: "Movies", Icon: Film },
  { href: "/shows", label: "TV Shows", Icon: Tv },
  { href: "/anime", label: "Anime", Icon: Sparkles },
];

const LIBRARY: NavItem[] = [
  { href: "/my/continue", label: "Continue", Icon: Play },
  { href: "/my/watchlist", label: "Watchlist", Icon: Star },
  { href: "/my/history", label: "History", Icon: History },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)] md:flex">
      <Link
        href="/"
        className="group flex h-16 items-center gap-2.5 px-5 text-xl font-bold tracking-tight"
      >
        <Clapperboard
          className="size-6 text-[var(--color-accent)] transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110"
          strokeWidth={2.25}
        />
        <span>Umbra</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </ul>

        <p className="mb-2 mt-7 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)]">
          My Space
        </p>
        <ul className="space-y-1">
          {LIBRARY.map((item) => (
            <NavLink key={item.href} {...item} active={isActive(item.href)} />
          ))}
        </ul>
      </nav>

      <div className="border-t border-[var(--color-border)] px-3 py-3">
        <ul>
          <NavLink href="/settings" label="Settings" Icon={Settings} active={isActive("/settings")} />
        </ul>
      </div>
    </aside>
  );
}

function NavLink({ href, label, Icon, active }: NavItem & { active: boolean }) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors duration-200"
      >
        {/* Shared layout id makes the pill slide between items instead of
            popping, which is most of what makes nav feel considered. */}
        {active && (
          <motion.span
            layoutId="nav-active"
            transition={{ type: "spring", stiffness: 400, damping: 32 }}
            className="absolute inset-0 rounded-lg bg-[var(--color-accent-dim)]"
          />
        )}
        <Icon
          className={`relative size-[18px] shrink-0 transition-all duration-200 ${
            active
              ? "text-[var(--color-accent)]"
              : "text-[var(--color-fg-subtle)] group-hover:scale-110 group-hover:text-[var(--color-accent-hover)]"
          }`}
          strokeWidth={2.1}
        />
        <span
          className={`relative transition-colors duration-200 ${
            active
              ? "font-medium text-[var(--color-fg)]"
              : "text-[var(--color-fg-muted)] group-hover:text-[var(--color-fg)]"
          }`}
        >
          {label}
        </span>
      </Link>
    </li>
  );
}
