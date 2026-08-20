import { siteConfig } from "@/config/site";
import dynamic from "next/dynamic";
import { Metadata, NextPage } from "next/types";
import { Suspense } from "react";
import GridPageSkeleton from "@/components/ui/other/GridPageSkeleton";
const SearchList = dynamic(() => import("@/components/sections/Search/List"));

export const metadata: Metadata = {
  title: `Search Movies | ${siteConfig.name}`,
};

const SearchPage: NextPage = () => {
  return (
    <Suspense fallback={<GridPageSkeleton />}>
      <SearchList />
    </Suspense>
  );
};

export default SearchPage;
