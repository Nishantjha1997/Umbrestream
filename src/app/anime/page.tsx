import { siteConfig } from "@/config/site";
import dynamic from "next/dynamic";
import { Metadata, NextPage } from "next/types";
const AnimePageList = dynamic(() => import("@/components/sections/Anime/List"));
import AnimeModeShell from "@/components/sections/Anime/AnimeModeShell";

export const metadata: Metadata = {
  title: `Anime | ${siteConfig.name}`,
};

const AnimePage: NextPage = () => {
  return (
    <AnimeModeShell>
      <AnimePageList />
    </AnimeModeShell>
  );
};

export default AnimePage;
