import { siteConfig } from "@/config/site";
import dynamic from "next/dynamic";
import { Metadata, NextPage } from "next/types";
const AnimePageList = dynamic(() => import("@/components/sections/Anime/List"));

export const metadata: Metadata = {
  title: `Anime | ${siteConfig.name}`,
};

const AnimePage: NextPage = () => {
  return <AnimePageList />;
};

export default AnimePage;
