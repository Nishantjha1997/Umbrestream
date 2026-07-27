import { NextPage } from "next";
import dynamic from "next/dynamic";
const Hero = dynamic(() => import("@/components/media/Hero"));
const ContinueWatching = dynamic(() => import("@/components/sections/Home/ContinueWatching"));
const Recommended = dynamic(() => import("@/components/sections/Home/Recommended"));
const HomePageList = dynamic(() => import("@/components/sections/Home/List"));

/**
 * Home opens on the billboard (§3), then the personal sections, then the
 * tabbed browse rows. <Hero> bleeds past this container's padding itself and
 * removes itself entirely when today's trending has no usable artwork, so
 * nothing here needs to know whether it rendered.
 */
const HomePage: NextPage = () => {
  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <Hero />
      <ContinueWatching />
      <Recommended />
      <HomePageList />
    </div>
  );
};

export default HomePage;
