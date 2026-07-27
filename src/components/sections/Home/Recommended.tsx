"use client";

import MoviePosterCard from "../Movie/Cards/Poster";
import TvShowPosterCard from "../TV/Cards/Poster";
import AnimePosterCard from "../Anime/Cards/Poster";
import SectionTitle from "@/components/ui/other/SectionTitle";
import Carousel from "@/components/ui/wrapper/Carousel";
import { getPersonalizedRecommendations } from "@/actions/recommendations";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@heroui/react";
import useSupabaseUser from "@/hooks/useSupabaseUser";

const Recommended: React.FC = () => {
  const { data: user } = useSupabaseUser();
  const { data: recommendations, isPending } = useQuery({
    queryKey: ["personalized-recommendations", user?.id],
    queryFn: () => getPersonalizedRecommendations(),
  });

  if (isPending) {
    return (
      <div className="flex w-full flex-col gap-5 py-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-48 rounded-full" />
        </div>
        <Skeleton className="h-[250px] rounded-lg md:h-[300px]" />
      </div>
    );
  }

  if (!recommendations || recommendations.length === 0) return null;

  return (
    <section id="recommendations" className="min-h-[250px] md:min-h-[300px] z-3 flex flex-col gap-2">
      <SectionTitle color="primary">Recommended For You</SectionTitle>
      <Carousel>
        {recommendations.map((item, index) => {
          const key = `${item.type}-${item.media.id || index}`;
          if (item.type === "movie") {
            return (
              <div key={key} className="embla__slide min-w-[160px] max-w-[200px] pr-4">
                <MoviePosterCard movie={item.media} />
              </div>
            );
          } else if (item.type === "tv") {
            return (
              <div key={key} className="embla__slide min-w-[160px] max-w-[200px] pr-4">
                <TvShowPosterCard tv={item.media} />
              </div>
            );
          } else {
            return (
              <div key={key} className="embla__slide min-w-[160px] max-w-[200px] pr-4">
                <AnimePosterCard anime={item.media} />
              </div>
            );
          }
        })}
      </Carousel>
    </section>
  );
};

export default Recommended;
