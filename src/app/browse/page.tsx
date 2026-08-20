import { Metadata } from "next/types";
import { siteConfig } from "@/config/site";
import { Suspense } from "react";
import BrowseTabs from "@/components/sections/Discover/BrowseTabs";
import GridPageSkeleton from "@/components/ui/other/GridPageSkeleton";

export const metadata: Metadata = {
  title: `Browse | ${siteConfig.name}`,
};

/**
 * Movies, TV, and Categories as segments of one screen (Phase 3, §7) instead
 * of three separate nav items. `/movies`, `/tv`, and `/categories` redirect
 * here (`next.config.ts`) — those are pre-existing URLs that may be
 * bookmarked, so the redirect matters, not just the new nav entry.
 *
 * The films/series segments reuse `/discover`'s existing filter UI and
 * infinite-scroll grid (`DiscoverFilters`, `MovieDiscoverList`,
 * `TvShowDiscoverList`) rather than a second grid implementation —
 * `BrowseTabs` just drives the same `content` URL state those already read,
 * with its own tab UI standing in for `DiscoverFilters`' built-in
 * movie/tv/anime tabs (hidden here via `hideContentTypeTabs`, since Browse
 * has no anime segment — Anime is its own top-level nav item).
 */
export default function BrowsePage() {
  return (
    <Suspense fallback={<GridPageSkeleton />}>
      <BrowseTabs />
    </Suspense>
  );
}
