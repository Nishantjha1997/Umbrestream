import { Movie } from "tmdb-ts/dist/types";
import Carousel from "@/components/ui/wrapper/Carousel";
import PosterCard from "@/components/media/PosterCard";
import { fromMovie } from "@/utils/normalize-media";

const RelatedMovieList: React.FC<{ movies: Movie[] }> = ({ movies }) => {
  return (
    <div className="z-3 flex flex-col gap-2">
      <Carousel>
        {movies.map((movie) => {
          return (
            // flex-none! overrides the shared Carousel module's
            // `.container > * { flex: 0 0 100% }`, which would otherwise
            // ignore the width and leave the card with no intrinsic size.
            <div key={movie.id} className="w-[132px] flex-none! px-1 pt-1 pb-3 sm:w-[146px] md:w-[162px]">
              <PosterCard media={fromMovie(movie)} variant="rail" />
            </div>
          );
        })}
      </Carousel>
    </div>
  );
};

export default RelatedMovieList;
