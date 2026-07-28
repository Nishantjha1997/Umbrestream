import PosterCard from "@/components/media/PosterCard";
import Carousel from "@/components/ui/wrapper/Carousel";
import { fromTvShow } from "@/utils/normalize-media";
import { TV } from "tmdb-ts/dist/types";

interface TvShowRelatedListProps {
  tvs: TV[];
}

const TvShowRelatedList: React.FC<TvShowRelatedListProps> = ({ tvs }) => {
  return (
    <Carousel>
      {tvs.map((tv, index) => (
        // flex-none! overrides the shared Carousel module's
        // `.container > * { flex: 0 0 100% }`, which would otherwise
        // ignore the width and leave the card with no intrinsic size.
        <div key={tv.id} className="w-[132px] flex-none! px-1 pt-1 pb-3 sm:w-[146px] md:w-[162px]">
          {/* `index` drives PosterCard's capped, reduced-motion-aware stagger. */}
          <PosterCard media={fromTvShow(tv)} variant="rail" index={index} />
        </div>
      ))}
    </Carousel>
  );
};

export default TvShowRelatedList;
