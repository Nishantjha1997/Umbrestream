import { NextPage } from "next";
import dynamic from "next/dynamic";
const Hero = dynamic(() => import("@/components/media/Hero"));
const ContinueWatching = dynamic(() => import("@/components/sections/Home/ContinueWatching"));
const Recommended = dynamic(() => import("@/components/sections/Home/Recommended"));

/**
 * Home opens on the billboard (§3), then the personal sections. <Hero> bleeds
 * past this container's padding itself and removes itself entirely when
 * today's trending has no usable artwork, so nothing here needs to know
 * whether it rendered.
 *
 * The tabbed Movies/TV/Anime browse rows (`Home/List.tsx`, deleted) are gone
 * (Phase 4, §8): `ContentTypeSelection` rendered three tabs but this file only
 * ever parsed `["movie","tv"]`, so selecting Anime silently rendered an empty
 * box. Anime now has its own top-level nav tab (Phase 3, §7), so fixing the
 * parsing would have just made Home a second, redundant place to browse
 * Anime — removing the tabs entirely is the correct fix, not a workaround.
 *
 * This still needs the numbered asymmetric phone sections and the distinct
 * desktop hero/shelf treatment (§8) layered in — that composition work lands
 * next, forked the same way the nav shell was (Phase 2, §6): shared
 * primitives (`PosterCard`, `Shelf`, `EclipseRing`, `ContinueWatching`,
 * `Recommended`), forked composition.
 */
const HomePage: NextPage = () => {
  return (
    <div className="flex flex-col gap-8 md:gap-12">
      <Hero />
      <ContinueWatching />
      <Recommended />
    </div>
  );
};

export default HomePage;
