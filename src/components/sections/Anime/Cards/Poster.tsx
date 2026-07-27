"use client";

import HoverAnimeCard from "@/components/sections/Anime/Cards/Hover";
import Rating from "@/components/ui/other/Rating";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import useBreakpoints from "@/hooks/useBreakpoints";
import useDeviceVibration from "@/hooks/useDeviceVibration";
import { AniListMediaSummary } from "@/types/anilist";
import { Card, CardBody, CardFooter, CardHeader, Chip, Image, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { useDisclosure, useHover } from "@mantine/hooks";
import Link from "next/link";
import { useCallback } from "react";
import { useLongPress } from "use-long-press";

// Same static asset already used app-wide as the TMDB poster fallback (see
// getImageUrl in @/utils/movies) — reused here only as a last-resort literal
// string for visual consistency; AniList cover URLs are used as-is otherwise.
const POSTER_FALLBACK = "https://dancyflix.com/placeholder.png";

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

interface AnimePosterCardProps {
  anime: AniListMediaSummary;
  variant?: "full" | "bordered";
}

const AnimePosterCard: React.FC<AnimePosterCardProps> = ({ anime, variant = "full" }) => {
  const { hovered, ref } = useHover();
  const [opened, handlers] = useDisclosure(false);
  const title = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";
  const posterImage =
    anime.coverImage.extraLarge ?? anime.coverImage.large ?? anime.coverImage.medium ?? POSTER_FALLBACK;
  const { mobile } = useBreakpoints();
  const { startVibration } = useDeviceVibration();

  const callback = useCallback(() => {
    handlers.open();
    setTimeout(() => startVibration([100]), 300);
  }, [handlers, startVibration]);

  const longPress = useLongPress(mobile ? callback : null, {
    cancelOnMovement: true,
    threshold: 300,
  });

  return (
    <>
      <Tooltip
        isDisabled={mobile}
        showArrow
        className="bg-secondary-background p-0"
        shadow="lg"
        delay={1000}
        placement="right-start"
        content={<HoverAnimeCard id={anime.id} />}
      >
        <Link href={`/anime/${anime.id}`} ref={ref} {...longPress()}>
          {variant === "full" && (
            <div className="group motion-preset-focus relative aspect-2/3 overflow-hidden rounded-lg border-[3px] border-transparent text-white transition-colors hover:border-secondary">
              {hovered && (
                <Icon
                  icon="line-md:play-filled"
                  width="64"
                  height="64"
                  className="absolute-center z-20 text-white"
                />
              )}
              {anime.isAdult && (
                <Chip
                  color="danger"
                  size="sm"
                  variant="flat"
                  className="absolute left-2 top-2 z-20"
                >
                  18+
                </Chip>
              )}
              {anime.format && (
                <Chip
                  color="secondary"
                  size="sm"
                  variant="flat"
                  className="absolute right-2 top-2 z-20"
                >
                  {formatAnimeFormat(anime.format)}
                </Chip>
              )}
              <div className="absolute bottom-0 z-2 h-1/2 w-full bg-linear-to-t from-black from-1%"></div>
              <div className="absolute bottom-0 z-3 flex w-full flex-col gap-1 px-4 py-3">
                <h6 className="truncate text-sm font-semibold">{title}</h6>
                <div className="flex justify-between text-xs">
                  <p>{anime.seasonYear ?? "N/A"}</p>
                  <Rating rate={(anime.averageScore ?? 0) / 10} />
                </div>
              </div>
              <Image
                alt={title}
                src={posterImage}
                radius="none"
                className="z-0 aspect-2/3 h-[250px] object-cover object-center transition group-hover:scale-110 md:h-[300px]"
                classNames={{
                  img: "group-hover:opacity-70",
                }}
              />
            </div>
          )}

          {variant === "bordered" && (
            <Card
              isHoverable
              fullWidth
              shadow="md"
              className="group h-full bg-secondary-background"
            >
              <CardHeader className="flex items-center justify-center pb-0">
                <div className="relative size-full">
                  {hovered && (
                    <Icon
                      icon="line-md:play-filled"
                      width="64"
                      height="64"
                      className="absolute-center z-20 text-white"
                    />
                  )}
                  {anime.isAdult && (
                    <Chip
                      color="danger"
                      size="sm"
                      variant="shadow"
                      className="absolute left-2 top-2 z-20"
                    >
                      18+
                    </Chip>
                  )}
                  {anime.format && (
                    <Chip
                      color="secondary"
                      size="sm"
                      variant="shadow"
                      className="absolute right-2 top-2 z-20"
                    >
                      {formatAnimeFormat(anime.format)}
                    </Chip>
                  )}
                  <div className="relative overflow-hidden rounded-large">
                    <Image
                      isBlurred
                      alt={title}
                      className="aspect-2/3 rounded-lg object-cover object-center group-hover:scale-110"
                      src={posterImage}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardBody className="justify-end pb-1">
                <p className="text-md truncate font-bold">{title}</p>
              </CardBody>
              <CardFooter className="justify-between pt-0 text-xs">
                <p>{anime.seasonYear ?? "N/A"}</p>
                <Rating rate={(anime.averageScore ?? 0) / 10} />
              </CardFooter>
            </Card>
          )}
        </Link>
      </Tooltip>

      {mobile && (
        <VaulDrawer
          backdrop="blur"
          open={opened}
          onOpenChange={handlers.toggle}
          title={title}
          hiddenTitle
        >
          <HoverAnimeCard id={anime.id} fullWidth />
        </VaulDrawer>
      )}
    </>
  );
};

export default AnimePosterCard;
