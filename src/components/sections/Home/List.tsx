"use client";

import ContentTypeSelection from "@/components/ui/other/ContentTypeSelection";
import { animeQueryLists } from "@/config/anime-lists";
import { siteConfig } from "@/config/site";
import { Spinner } from "@heroui/react";
import dynamic from "next/dynamic";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense } from "react";
const MediaRow = dynamic(() => import("@/components/media/MediaRow"));

/**
 * The tabbed browse rows on the home page.
 *
 * §3 / §11.8: `ContentTypeSelection` has always rendered three tabs, but this
 * file parsed the `content` param as `["movie", "tv"]` only — so selecting
 * **Anime** set `?content=anime`, matched neither branch, and rendered an empty
 * box. (`useDiscoverFilters`, which drives the tab strip, already accepted all
 * three, so the tab looked selected while nothing appeared beneath it.)
 *
 * Fixed on this side rather than by deleting the tab: the anime rows already
 * exist as `animeQueryLists` and `<MediaRow kind="anime">` already renders them
 * on /anime, so wiring them in costs one branch and the tab becomes real.
 * Removing the tab would have meant editing a shared component to make the home
 * page less capable than it can be.
 */

const CONTENT_TYPES = ["movie", "tv", "anime"] as const;

const HomePageList: React.FC = () => {
  const { movies, tvShows } = siteConfig.queryLists;
  const [content] = useQueryState(
    "content",
    parseAsStringLiteral(CONTENT_TYPES).withDefault("movie"),
  );

  return (
    <div className="flex flex-col gap-12">
      <ContentTypeSelection className="justify-center" />
      <div className="relative flex min-h-32 flex-col gap-12">
        <Suspense
          fallback={
            // One neutral spinner. It used to be tinted primary/warning by
            // media type, which is colour as taxonomy (§1.1.3).
            <Spinner size="lg" variant="simple" className="absolute-center" />
          }
        >
          {content === "movie" &&
            movies.map((row, i) => (
              <MediaRow key={row.name} kind="movie" priority={i === 0} {...row} />
            ))}
          {content === "tv" &&
            tvShows.map((row, i) => (
              <MediaRow key={row.name} kind="tv" priority={i === 0} {...row} />
            ))}
          {content === "anime" &&
            animeQueryLists.map((row, i) => (
              <MediaRow key={row.name} kind="anime" priority={i === 0} {...row} />
            ))}
        </Suspense>
      </div>
    </div>
  );
};

export default HomePageList;
