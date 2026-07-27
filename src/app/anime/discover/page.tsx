import { Metadata, NextPage } from "next/types";
import { siteConfig } from "@/config/site";
import dynamic from "next/dynamic";
import { Suspense } from "react";
const AnimeDiscoverList = dynamic(() => import("@/components/sections/Anime/Discover/AnimeDiscoverList"));

export const metadata: Metadata = {
  title: `Discover Anime | ${siteConfig.name}`,
};

const AnimeDiscoverPage: NextPage = () => {
  return (
    <Suspense>
      <AnimeDiscoverList />
    </Suspense>
  );
};

export default AnimeDiscoverPage;
