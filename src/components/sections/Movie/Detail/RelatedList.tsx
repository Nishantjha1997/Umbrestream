import PosterCard from "@/components/media/PosterCard";
import Carousel from "@/components/ui/wrapper/Carousel";
import { fromMovie } from "@/utils/normalize-media";
import { Movie } from "tmdb-ts/dist/types";

const RelatedMovieList: React.FC<{ movies: Movie[] }> = ({ movies }) => {
  return (
    <Carousel>
      {movies.map((movie, index) => (
        // flex-none! overrides the shared Carousel module's
        // `.container > * { flex: 0 0 100% }`, which would otherwise
        // ignore the width and leave the card with no intrinsic size.
        <div
          key={movie.id}
          className="w-[132px] flex-none! px-1 pt-1 pb-3 sm:w-[146px] md:w-[162px]"
        >
          {/* `index` drives PosterCard's capped, reduced-motion-aware stagger. */}
          <PosterCard media={fromMovie(movie)} variant="rail" index={index} />
        </div>
      ))}
    </Carousel>
  );
};

export default RelatedMovieList;
