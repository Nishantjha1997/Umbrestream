"use client";

import { Image, Chip, Button } from "@heroui/react";
import { useDocumentTitle } from "@mantine/hooks";
import { siteConfig } from "@/config/site";
import { FaCirclePlay } from "react-icons/fa6";
import Rating from "@/components/ui/other/Rating";
import SectionTitle from "@/components/ui/other/SectionTitle";
import AnimeGenres from "@/components/sections/Anime/Detail/Genres";
import { Calendar, Clock, List, Youtube } from "@/utils/icons";
import Link from "next/link";
import { intervalToDuration } from "date-fns";
import { AniListFormat, AniListMediaDetail, AniListStatus } from "@/types/anilist";

const FALLBACK_POSTER = "https://dancyflix.com/placeholder.png";

const FORMAT_LABELS: Record<AniListFormat, string> = {
  TV: "TV",
  TV_SHORT: "TV Short",
  MOVIE: "Movie",
  SPECIAL: "Special",
  OVA: "OVA",
  ONA: "ONA",
  MUSIC: "Music",
};

const STATUS_LABELS: Record<AniListStatus, string> = {
  FINISHED: "Finished",
  RELEASING: "Releasing",
  NOT_YET_RELEASED: "Not Yet Released",
  CANCELLED: "Cancelled",
  HIATUS: "On Hiatus",
};

const capitalize = (value: string): string => value.charAt(0) + value.slice(1).toLowerCase();

/** AniList gives `timeUntilAiring` in seconds; renders it as e.g. "in 2d 4h". */
const formatTimeUntil = (seconds: number): string => {
  if (seconds <= 0) return "soon";
  const { days, hours, minutes } = intervalToDuration({ start: 0, end: seconds * 1000 });
  const parts: string[] = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (!days && minutes) parts.push(`${minutes}m`);
  return parts.length > 0 ? `in ${parts.join(" ")}` : "soon";
};

/**
 * AniList's `description` is sanitized by AniList itself (not arbitrary user
 * input) and only ever carries a handful of basic tags (`<br>`, `<i>`,
 * `<b>`). Rather than dangerouslySetInnerHTML-ing it, line breaks are
 * preserved as real newlines and every tag is stripped, so this renders as
 * safe plain text with paragraph structure intact.
 */
const cleanDescription = (html: string): string =>
  html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();

interface AnimeOverviewSectionProps {
  anime: AniListMediaDetail;
}

const AnimeOverviewSection: React.FC<AnimeOverviewSectionProps> = ({ anime }) => {
  const primaryTitle =
    anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";
  const altTitles = Array.from(
    new Set(
      [anime.title.romaji, anime.title.native].filter(
        (t): t is string => Boolean(t) && t !== primaryTitle,
      ),
    ),
  );
  const posterImage =
    anime.coverImage.extraLarge ?? anime.coverImage.large ?? anime.coverImage.medium ?? FALLBACK_POSTER;

  const seasonYearLabel =
    anime.season && anime.seasonYear
      ? `${capitalize(anime.season)} ${anime.seasonYear}`
      : anime.seasonYear
        ? `${anime.seasonYear}`
        : anime.startDate.year
          ? `${anime.startDate.year}`
          : null;

  useDocumentTitle(`${primaryTitle} | ${siteConfig.name}`);

  return (
    <section id="overview" className="relative z-3 flex flex-col gap-8 pt-[20vh] md:pt-[40vh]">
      <div className="md:grid md:grid-cols-[auto_1fr] md:gap-6">
        <Image
          isBlurred
          shadow="md"
          alt={primaryTitle}
          classNames={{
            wrapper: "w-52 max-h-min aspect-2/3 hidden md:block",
          }}
          className="object-cover object-center"
          src={posterImage}
        />

        <div className="flex flex-col gap-8">
          <div id="title" className="flex flex-col gap-1 md:gap-2">
            <div className="flex gap-3">
              <Chip
                color="secondary"
                variant="faded"
                className="md:text-md text-xs"
                classNames={{ content: "font-bold" }}
              >
                Anime
              </Chip>
              {anime.isAdult && (
                <Chip color="danger" variant="faded">
                  18+
                </Chip>
              )}
            </div>
            <h2 className="text-2xl font-black md:text-4xl">{primaryTitle}</h2>
            {altTitles.length > 0 && (
              <p className="text-default-500 text-xs md:text-sm">{altTitles.join(" · ")}</p>
            )}
            <div className="md:text-md flex flex-wrap items-center gap-1 text-xs md:gap-2">
              {anime.format && (
                <>
                  <span>{FORMAT_LABELS[anime.format]}</span>
                  <p>&#8226;</p>
                </>
              )}
              {anime.status && (
                <>
                  <span>{STATUS_LABELS[anime.status]}</span>
                  <p>&#8226;</p>
                </>
              )}
              {anime.episodes != null && (
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
              {anime.duration != null && (
                <>
                  <div className="flex items-center gap-1">
                    <Clock />
                    <span>{anime.duration} min</span>
                  </div>
                  <p>&#8226;</p>
                </>
              )}
              {seasonYearLabel && (
                <>
                  <div className="flex items-center gap-1">
                    <Calendar />
                    <span>{seasonYearLabel}</span>
                  </div>
                  <p>&#8226;</p>
                </>
              )}
              <Rating rate={(anime.averageScore ?? 0) / 10} />
            </div>
            {anime.status === "RELEASING" && anime.nextAiringEpisode && (
              <p className="text-xs text-secondary-500 md:text-sm">
                Episode {anime.nextAiringEpisode.episode} airs{" "}
                {formatTimeUntil(anime.nextAiringEpisode.timeUntilAiring)}
              </p>
            )}
            <AnimeGenres genres={anime.genres} />
          </div>

          <div id="action" className="flex w-full flex-wrap gap-2">
            <Button
              as={Link}
              href={`/anime/${anime.id}/player/1`}
              color="secondary"
              variant="shadow"
              startContent={<FaCirclePlay size={22} />}
            >
              Play Episode 1
            </Button>
            {anime.trailer?.site === "youtube" && (
              <Button
                as="a"
                href={`https://www.youtube.com/watch?v=${anime.trailer.id}`}
                target="_blank"
                rel="noopener noreferrer"
                color="danger"
                variant="shadow"
                startContent={<Youtube size={22} />}
              >
                Trailer
              </Button>
            )}
          </div>

          <div id="story" className="flex flex-col gap-2">
            <SectionTitle color="secondary">Story Line</SectionTitle>
            <p className="whitespace-pre-line text-sm">
              {anime.description ? cleanDescription(anime.description) : "No synopsis available."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimeOverviewSection;
