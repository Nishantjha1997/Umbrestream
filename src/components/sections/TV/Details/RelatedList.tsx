import Carousel from "@/components/ui/wrapper/Carousel";
import { TV } from "tmdb-ts/dist/types";
import PosterCard from "@/components/media/PosterCard";
import { fromTvShow } from "@/utils/normalize-media";

interface TvShowRelatedListProps {
  tvs: TV[];
}

const TvShowRelatedList: React.FC<TvShowRelatedListProps> = ({ tvs }) => {
  return (
    <div className="z-3 flex flex-col gap-2">
      <Carousel>
        {tvs.map((tv) => {
          return (
            // flex-none! overrides the shared Carousel module's
            // `.container > * { flex: 0 0 100% }`, which would otherwise
            // ignore the width and leave the card with no intrinsic size.
            <div key={tv.id} className="w-[132px] flex-none! px-1 pt-1 pb-3 sm:w-[146px] md:w-[162px]">
              <PosterCard media={fromTvShow(tv)} variant="rail" />
            </div>
          );
        })}
      </Carousel>
    </div>
  );
};

export default TvShowRelatedList;
