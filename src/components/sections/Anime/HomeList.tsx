"use client";

import AnimePosterCard from "@/components/sections/Anime/Cards/Poster";
import SectionTitle from "@/components/ui/other/SectionTitle";
import Carousel from "@/components/ui/wrapper/Carousel";
import { AnimeQueryList } from "@/config/anime-lists";
import { Link, Skeleton } from "@heroui/react";
import { useInViewport } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { kebabCase } from "string-ts";

const AnimeHomeList: React.FC<AnimeQueryList> = ({ query, name, param }) => {
  const key = kebabCase(name) + "-anime-list";
  const { ref, inViewport } = useInViewport();
  const { data, isPending } = useQuery({
    queryFn: query,
    queryKey: [key],
    enabled: inViewport,
  });

  return (
    <section id={key} className="min-h-[250px] md:min-h-[300px]" ref={ref}>
      {isPending ? (
        <div className="flex w-full flex-col gap-5">
          <div className="flex grow items-center justify-between">
            <Skeleton className="h-7 w-40 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
          <Skeleton className="h-[250px] rounded-lg md:h-[300px]" />
        </div>
      ) : (
        <div className="z-3 flex flex-col gap-2">
          <div className="flex grow items-center justify-between">
            <SectionTitle color="secondary">{name}</SectionTitle>
            <Link
              size="sm"
              href={`/anime/discover?category=${param}`}
              isBlock
              color="foreground"
              className="rounded-full"
            >
              See All &gt;
            </Link>
          </div>
          <Carousel>
            {data?.media.map((anime) => {
              return (
                <div
                  key={anime.id}
                  className="embla__slide flex min-h-fit max-w-fit items-center px-1 py-2"
                >
                  <AnimePosterCard anime={anime} />
                </div>
              );
            })}
          </Carousel>
        </div>
      )}
    </section>
  );
};

export default AnimeHomeList;
