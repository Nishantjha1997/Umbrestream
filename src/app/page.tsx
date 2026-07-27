import { NextPage } from "next";
import dynamic from "next/dynamic";
const ContinueWatching = dynamic(() => import("@/components/sections/Home/ContinueWatching"));
const Recommended = dynamic(() => import("@/components/sections/Home/Recommended"));
const HomePageList = dynamic(() => import("@/components/sections/Home/List"));

const HomePage: NextPage = () => {
  return (
    <div className="flex flex-col gap-3 md:gap-8">
      <ContinueWatching />
      <Recommended />
      <HomePageList />
    </div>
  );
};

export default HomePage;
