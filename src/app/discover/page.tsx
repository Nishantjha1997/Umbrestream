import { Metadata, NextPage } from "next/types";
import { siteConfig } from "@/config/site";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import GridPageSkeleton from "@/components/ui/other/GridPageSkeleton";
const DiscoverListGroup = dynamic(() => import("@/components/sections/Discover/ListGroup"));

export const metadata: Metadata = {
  title: `Discover Movies | ${siteConfig.name}`,
};

const DiscoverPage: NextPage = () => {
  return (
    <Suspense fallback={<GridPageSkeleton />}>
      <DiscoverListGroup />
    </Suspense>
  );
};

export default DiscoverPage;
