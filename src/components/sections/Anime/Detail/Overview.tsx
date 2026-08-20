"use client";

import { Image, Button } from "@heroui/react";
import { useDocumentTitle } from "@mantine/hooks";
import { useState } from "react";
import { siteConfig } from "@/config/site";
import Rating from "@/components/ui/other/Rating";
import AnimeGenres from "@/components/sections/Anime/Detail/Genres";
import { PlayFilled, Youtube } from "@/utils/icons";
import Link from "next/link";
import { intervalToDuration } from "date-fns";
import { cn } from "@/utils/helpers";
import { AniListFormat, AniListMediaDetail, AniListStatus } from "@/types/anilist";

const FALLBACK_POSTER = "";

/** Past this many characters the synopsis is clamped behind a More/Less toggle. */
const SYNOPSIS_CLAMP_THRESHOLD = 420;

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

/**
 * One metadata line, rendered as a real list so the separators are CSS
 * pseudo-elements rather than flex children. Bullets can therefore never wrap
 * onto a line of their own, and the row degrades to a plain list if CSS
 * (or `::before` content) is unavailable.
 */
const MetaItem: React.FC<React.PropsWithChildren> = ({ children }) => (
  <li className="flex items-center before:mr-2 before:text-default-600 before:content-['•'] first:before:content-none">
    {children}
  </li>
);

interface AnimeOverviewSectionProps {
  anime: AniListMediaDetail;
}

const AnimeOverviewSection: React.FC<AnimeOverviewSectionProps> = ({ anime }) => {
  const [expanded, setExpanded] = useState(false);

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
    anime.coverImage.extraLarge ??
    anime.coverImage.large ??
    anime.coverImage.medium ??
    FALLBACK_POSTER;

  const seasonYearLabel =
    anime.season && anime.seasonYear
      ? `${capitalize(anime.season)} ${anime.seasonYear}`
      : anime.seasonYear
        ? `${anime.seasonYear}`
        : anime.startDate.year
          ? `${anime.startDate.year}`
          : null;

  // Deliberately text-only and icon-free: the metadata line is secondary to the
  // artwork and the title, and icons turn it back into a dense IMDb-style strip.
  const facts: string[] = [];
  if (anime.format) facts.push(FORMAT_LABELS[anime.format]);
  if (seasonYearLabel) facts.push(seasonYearLabel);
  if (anime.episodes != null) {
    facts.push(`${anime.episodes} episode${anime.episodes === 1 ? "" : "s"}`);
  }
  if (anime.duration != null) facts.push(`${anime.duration} min`);
  if (anime.status) facts.push(STATUS_LABELS[anime.status]);

  const synopsis = anime.description ? cleanDescription(anime.description) : "";
  const isLongSynopsis = synopsis.length > SYNOPSIS_CLAMP_THRESHOLD;
  const isMovie = anime.format === "MOVIE";

  // NOTE: a presentational child shouldn't own the document title (§8). Moving
  // this to route metadata means editing `src/app/anime/[id]/page.tsx`, which is
  // owned by another agent, so the call stays here for now.
  useDocumentTitle(`${primaryTitle} | ${siteConfig.name}`);

  return (
    <section id="overview" className="relative z-3 flex flex-col gap-8 pt-[20vh] md:pt-[40vh]">
      <div className="flex flex-col gap-6 md:grid md:grid-cols-[auto_1fr] md:gap-8">
        <Image
          radius="none"
          alt={primaryTitle}
          classNames={{
            wrapper:
              "hidden aspect-2/3 max-h-min w-52 overflow-hidden rounded-(--radius-card) shadow-(--elevation-lift) md:block",
          }}
          className="object-cover object-center"
          src={posterImage}
        />

        <div className="flex flex-col gap-6 md:gap-7">
          <header id="title" className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-[11px] font-semibold tracking-[0.16em] text-default-500 uppercase">
              <span>Anime</span>
              {anime.isAdult && (
                <span className="rounded-full border border-danger-400/40 px-2 py-0.5 text-danger-400">
                  18+
                </span>
              )}
            </div>

            <h1 className="text-3xl font-semibold tracking-tight text-balance md:text-5xl">
              {primaryTitle}
            </h1>

            {altTitles.length > 0 && (
              <p className="text-xs text-default-500 md:text-sm">{altTitles.join(" · ")}</p>
            )}

            <ul className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-default-400 md:text-sm">
              {facts.map((fact) => (
                <MetaItem key={fact}>{fact}</MetaItem>
              ))}
              {anime.averageScore != null && (
                <MetaItem>
                  <Rating rate={anime.averageScore / 10} />
                </MetaItem>
              )}
            </ul>

            {anime.status === "RELEASING" && anime.nextAiringEpisode && (
              <p className="text-xs text-default-500 md:text-sm">
                Episode {anime.nextAiringEpisode.episode} airs{" "}
                {formatTimeUntil(anime.nextAiringEpisode.timeUntilAiring)}
              </p>
            )}
          </header>

          {/* One dominant action. A flat, high-contrast pill rather than
              `variant="shadow"`, which emits a coloured glow (§9). */}
          <div id="action" className="flex w-full flex-wrap items-center gap-3">
            <Button
              as={Link}
              size="lg"
              radius="full"
              href={`/anime/${anime.id}/player/1`}
              className="bg-foreground px-7 font-semibold text-background transition-transform duration-(--duration-fast) ease-(--ease-out-quint) hover:scale-[1.02] active:scale-[0.98] motion-reduce:transition-none motion-reduce:hover:scale-100"
              startContent={<PlayFilled size={15} />}
            >
              {isMovie ? "Play" : "Play Episode 1"}
            </Button>
            {anime.trailer?.site === "youtube" && (
              <Button
                as="a"
                size="lg"
                radius="full"
                variant="bordered"
                href={`https://www.youtube.com/watch?v=${anime.trailer.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="border-default-300/50 font-medium text-foreground transition-colors duration-(--duration-fast) ease-(--ease-out-quint) hover:border-default-400 motion-reduce:transition-none"
                startContent={<Youtube size={18} />}
              >
                Trailer
              </Button>
            )}
          </div>

          <div id="story" className="flex flex-col gap-3">
            <p
              className={cn(
                "max-w-[68ch] text-sm leading-relaxed whitespace-pre-line text-default-500 md:text-base",
                isLongSynopsis && !expanded && "line-clamp-4",
              )}
            >
              {synopsis || "No synopsis available."}
            </p>
            {isLongSynopsis && (
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setExpanded((value) => !value)}
                className="w-fit rounded-full text-xs font-semibold tracking-wide text-default-400 uppercase transition-colors duration-(--duration-fast) ease-(--ease-out-quint) hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-foreground motion-reduce:transition-none"
              >
                {expanded ? "Show less" : "Show more"}
              </button>
            )}
            <AnimeGenres genres={anime.genres} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default AnimeOverviewSection;
