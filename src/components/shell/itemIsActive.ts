import { siteConfig } from "@/config/site";

/**
 * Shared by both shells (Phase 2, §6 — "share primitives, fork composition").
 * Active-route matching is the same question on phone and desktop; only the
 * two shells' *rendering* of that answer differs.
 */
export type NavigationItem = (typeof siteConfig.navItems)[number];

export function itemIsActive(pathname: string, item: NavigationItem): boolean {
  if (item.href === "/") return pathname === "/";
  // Movies and TV are Browse segments now (Phase 3, §7), not their own nav
  // items — but /movie/[id] and /tv/[id] (detail, player) should still light
  // up Browse rather than reading as "no active tab".
  if (item.href === "/browse") {
    return (
      pathname === "/browse" ||
      pathname.startsWith("/browse/") ||
      pathname.startsWith("/movie/") ||
      pathname.startsWith("/tv/")
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
