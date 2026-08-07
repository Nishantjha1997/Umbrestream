import { siteConfig } from "@/config/site";

/**
 * Shared by both shells (Phase 2, §6 — "share primitives, fork composition").
 * Active-route matching is the same question on phone and desktop; only the
 * two shells' *rendering* of that answer differs.
 */
export type NavigationItem = (typeof siteConfig.navItems)[number];

export function itemIsActive(pathname: string, item: NavigationItem): boolean {
  if (item.href === "/") return pathname === "/";
  if (item.href === "/movies") return pathname === "/movies" || pathname.startsWith("/movie/");
  if (item.href === "/tv") return pathname === "/tv" || pathname.startsWith("/tv/");
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
