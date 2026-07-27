"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Home", glyph: "◈" },
  { href: "/discover", label: "Discover", glyph: "◎" },
  { href: "/movies", label: "Movies", glyph: "▷" },
  { href: "/shows", label: "TV Shows", glyph: "▤" },
  { href: "/anime", label: "Anime", glyph: "✦" },
] as const;

const LIBRARY = [
  { href: "/my/continue", label: "Continue", glyph: "⟳" },
  { href: "/my/watchlist", label: "Watchlist", glyph: "☆" },
  { href: "/my/history", label: "History", glyph: "◷" },
] as const;

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-56 shrink-0 flex-col border-r border-[var(--color-border)] bg-[var(--color-bg)] md:flex">
      <Link href="/" className="flex h-16 items-center px-5 text-xl font-bold tracking-tight">
        <span className="text-[var(--color-accent)]">◆</span>
        <span className="ml-2">Umbra</span>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        <NavGroup items={NAV} pathname={pathname} />
        <p className="mb-2 mt-6 px-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--color-fg-subtle)]">
          My Space
        </p>
        <NavGroup items={LIBRARY} pathname={pathname} />
      </nav>

      <div className="border-t border-[var(--color-border)] px-3 py-3">
        <NavLink href="/settings" label="Settings" glyph="⚙" active={pathname === "/settings"} />
      </div>
    </aside>
  );
}

function NavGroup({
  items,
  pathname,
}: {
  items: readonly { href: string; label: string; glyph: string }[];
  pathname: string;
}) {
  return (
    <ul className="space-y-0.5">
      {items.map((item) => (
        <li key={item.href}>
          <NavLink
            {...item}
            active={item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)}
          />
        </li>
      ))}
    </ul>
  );
}

function NavLink({
  href,
  label,
  glyph,
  active,
}: {
  href: string;
  label: string;
  glyph: string;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
        active
          ? "bg-[var(--color-accent-dim)] font-medium text-[var(--color-fg)]"
          : "text-[var(--color-fg-muted)] hover:bg-[var(--color-surface-1)] hover:text-[var(--color-fg)]"
      }`}
    >
      <span aria-hidden className="w-4 text-center text-[var(--color-accent)]">
        {glyph}
      </span>
      {label}
    </Link>
  );
}
