"use client";

/**
 * Films / Series / Categories segments for `/browse` (Phase 3, §7).
 *
 * Films and Series drive `useDiscoverFilters`' existing `content` URL state
 * (`content=movie|tv`) — the same state `/discover` reads — so switching
 * this tab reuses the already-working filter UI and infinite-scroll grids
 * rather than a second implementation. Categories is a local `tab=categories`
 * flag only; it doesn't touch `content` at all.
 */

import dynamic from "next/dynamic";
import CategoriesSection from "@/components/sections/Discover/Categories";
import DiscoverFilters from "@/components/sections/Discover/Filters";
import useDiscoverFilters from "@/hooks/useDiscoverFilters";
import { Tabs, Tab } from "@heroui/react";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect } from "react";

const MovieDiscoverList = dynamic(() => import("@/components/sections/Discover/MovieList"));
const TvShowDiscoverList = dynamic(() => import("@/components/sections/Discover/TvShowList"));

const TABS = ["films", "series", "categories"] as const;
type BrowseTab = (typeof TABS)[number];

export default function BrowseTabs() {
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("films"));
  const { setContent } = useDiscoverFilters();

  // Keep the shared `content` state in sync so `DiscoverFilters` (genre
  // select, etc.) and the grids stay correct when Browse itself changes tab
  // — e.g. from a direct `/browse?tab=series` link, not just a click here.
  useEffect(() => {
    if (tab === "films") setContent("movie");
    if (tab === "series") setContent("tv");
  }, [tab, setContent]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8 pt-6 pb-28 md:pt-10 md:pb-12">
      <Tabs
        size="lg"
        variant="underlined"
        selectedKey={tab}
        aria-label="Browse"
        color="primary"
        classNames={{ tabList: "mx-auto", cursor: "h-1 rounded-full" }}
        onSelectionChange={(key) => setTab(key as BrowseTab)}
      >
        <Tab key="films" title="Films" />
        <Tab key="series" title="Series" />
        <Tab key="categories" title="Categories" />
      </Tabs>

      {tab === "categories" ? (
        <CategoriesSection />
      ) : (
        <div className="flex flex-col gap-8">
          <DiscoverFilters hideContentTypeTabs />
          {tab === "films" ? <MovieDiscoverList /> : <TvShowDiscoverList />}
        </div>
      )}
    </div>
  );
}
