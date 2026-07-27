"use client";

import { anilistApi } from "@/api/anilist";
import Rating from "@/components/ui/other/Rating";
import { cn, isEmpty } from "@/utils/helpers";
import { Calendar, Clock, List } from "@/utils/icons";
import { movieDurationString } from "@/utils/movies";
import { Button, Chip, Image, Link, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useQuery } from "@tanstack/react-query";

const FORMAT_LABELS: Record<string, string> = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
};

const formatAnimeFormat = (format: string | null): string =>
  format ? (FORMAT_LABELS[format] ?? format) : "Anime";

const HoverAnimeCard: React.FC<{ id: number; fullWidth?: boolean }> = ({ id, fullWidth }) => {
  const { data: anime, isPending } = useQuery({
    queryFn: () => anilistApi.details(id),
    queryKey: ["get-anime-detail-on-hover-poster", id],
  });

  if (isPending) {
    return (
      <div className="h-96 w-80">
        <Spinner size="lg" color="secondary" variant="simple" className="absolute-center" />
      </div>
    );
  }

  if (!anime) return null;

  const title = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";
  const bannerImage =
    anime.bannerImage ??
    anime.coverImage.extraLarge ??
    anime.coverImage.large ??
    anime.coverImage.medium ??
    "";
  const seasonLabel = [
    anime.season ? anime.season.charAt(0) + anime.season.slice(1).toLowerCase() : null,
    anime.seasonYear,
  ]
    .filter(Boolean)
    .join(" ");
  // AniList's `description(asHtml: false)` mostly returns plain text, but
  // occasionally leaves stray tags in — strip them since this renders as
  // plain text, not HTML.
  const description = anime.description?.replace(/<[^>]*>/g, "");

  return (
    <div
      className={cn("w-80", {
        "w-full": fullWidth,
      })}
    >
      <div className="relative">
        <div className="absolute aspect-video h-fit w-full">
          <div className="absolute z-2 h-full w-full bg-linear-to-t from-secondary-background from-1%"></div>
          {!isEmpty(bannerImage) && (
            <Image
              radius="none"
              alt={title}
              className="z-0 aspect-video rounded-t-lg object-cover object-center"
              src={bannerImage}
            />
          )}
        </div>
        <div className="flex flex-col gap-2 p-4 pt-[40%] *:z-10">
          <div className="flex gap-3">
            <Chip
              size="sm"
              color="secondary"
              variant="faded"
              className="md:text-md text-xs"
              classNames={{ content: "font-bold" }}
            >
              {formatAnimeFormat(anime.format)}
            </Chip>
            {anime.isAdult && (
              <Chip size="sm" color="danger" variant="faded">
                18+
              </Chip>
            )}
          </div>
          <h4 className="text-xl font-bold">{title}</h4>
          <div className="md:text-md flex flex-wrap gap-1 text-xs *:z-10">
            {anime.duration && (
              <>
                <div className="flex items-center gap-1">
                  <Clock />
                  <span>{movieDurationString(anime.duration)}</span>
                </div>
                <p>&#8226;</p>
              </>
            )}
            {seasonLabel && (
              <>
                <div className="flex items-center gap-1">
                  <Calendar />
                  <span>{seasonLabel}</span>
                </div>
                <p>&#8226;</p>
              </>
            )}
            {anime.episodes && (
              <>
                <div className="flex items-center gap-1">
                  <List />
                  <span>
                    {anime.episodes} Episode{anime.episodes > 1 ? "s" : ""}
                  </span>
                </div>
                <p>&#8226;</p>
              </>
            )}
            <Rating rate={(anime.averageScore ?? 0) / 10} count={anime.popularity ?? 0} />
          </div>
          {!isEmpty(anime.genres) && (
            <div className="flex flex-wrap gap-2">
              {anime.genres.slice(0, 4).map((genre) => (
                <Chip key={genre} size="sm" variant="flat" radius="full">
                  {genre}
                </Chip>
              ))}
            </div>
          )}
          <div className="flex w-full justify-between gap-2 py-1">
            <Button
              as={Link}
              href={`/anime/${anime.id}/player/1`}
              fullWidth
              color="secondary"
              variant="shadow"
              startContent={<Icon icon="solar:play-circle-bold" fontSize={24} />}
            >
              Watch Now
            </Button>
          </div>
          {description && <p className="text-sm">{description}</p>}
        </div>
      </div>
    </div>
  );
};

export default HoverAnimeCard;
