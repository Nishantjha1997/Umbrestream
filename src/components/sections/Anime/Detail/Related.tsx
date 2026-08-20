"use client";

import PosterCard from "@/components/media/PosterCard";
import SectionTitle from "@/components/ui/other/SectionTitle";
import Carousel from "@/components/ui/wrapper/Carousel";
import type { AniListMediaSummary } from "@/types/anilist";
import { isEmpty } from "@/utils/helpers";
import { fromAnime } from "@/utils/normalize-media";

interface AnimeRelatedSectionProps {
  recommendations: AniListMediaSummary[];
}

const AnimeRelatedSection: React.FC<AnimeRelatedSectionProps> = ({ recommendations }) => {
  if (isEmpty(recommendations)) return null;

  return (
    <section id="related" className="z-3 flex flex-col gap-3">
      <SectionTitle size="h5">You May Also Like</SectionTitle>
      <Carousel>
        {recommendations.map((anime, index) => (
          <div
            key={anime.id}
            className="w-[132px] flex-none! px-1 pt-1 pb-3 sm:w-[146px] md:w-[162px]"
          >
            <PosterCard media={fromAnime(anime)} variant="rail" index={index} />
          </div>
        ))}
      </Carousel>
    </section>
  );
};

export default AnimeRelatedSection;
