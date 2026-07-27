"use client";

import React, { forwardRef, memo, useMemo, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Input,
  ScrollShadow,
  Skeleton,
  Tab,
  Tabs,
} from "@heroui/react";
import { useDebouncedValue } from "@mantine/hooks";
import { useQuery } from "@tanstack/react-query";
import { format as formatDate } from "date-fns";
import Link from "next/link";
import { getUserHistories } from "@/actions/histories";
import SectionTitle from "@/components/ui/other/SectionTitle";
import type { AniListMediaDetail } from "@/types/anilist";
import { cn } from "@/utils/helpers";
import { Check, Grid, List, PlayFilled, Search } from "@/utils/icons";

/** Rows/tiles get a focus ring of their own — they're links, not HeroUI controls. */
const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground focus-visible:z-10";

const SURFACE_TRANSITION =
  "transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:transition-none";

interface EpisodeProgress {
  completed: boolean;
  /** 0–100. */
  percent: number;
}

interface AnimeEpisodesSelectionProps {
  anime: AniListMediaDetail;
}

/**
 * Episode picker for an AniList title.
 *
 * Three things drive the shape of this component:
 *
 * 1. AniList frequently reports `episodes: null` for long-running or currently
 *    airing series. The previous implementation silently invented 12 episodes
 *    in that case; instead the aired count is derived from
 *    `nextAiringEpisode`, and if even that is missing the section shows a real
 *    empty state rather than fabricated rows.
 * 2. Counts can reach several hundred, so the list is always bounded: episodes
 *    are paged into ranges and only one range is mounted at a time.
 * 3. AniList exposes no per-episode stills or titles, so repeating the cover
 *    art on every row is noise. Numbering carries the list instead.
 */
const AnimeEpisodesSelection = forwardRef<HTMLElement, AnimeEpisodesSelectionProps>(
  ({ anime }, ref) => {
    const nextAiring = anime.nextAiringEpisode;
    // `nextAiringEpisode.episode` is the *upcoming* one, so everything below it
    // has aired. Used both as a fallback total and to gate unaired episodes.
    const airedThrough = nextAiring ? Math.max(nextAiring.episode - 1, 0) : null;
    const totalEpisodes = anime.episodes ?? airedThrough ?? 0;
    const lastAired = airedThrough != null ? Math.min(airedThrough, totalEpisodes) : totalEpisodes;

    const [search, setSearch] = useState("");
    const [searchQuery] = useDebouncedValue(search, 250);
    const [layout, setLayout] = useState<"list" | "grid">(() =>
      totalEpisodes > 60 ? "grid" : "list",
    );
    const [rangeIndex, setRangeIndex] = useState(0);

    // Bigger seasons get bigger pages, so the range strip never becomes a
    // scrollable wall of twenty pills.
    const rangeSize = totalEpisodes > 600 ? 200 : totalEpisodes > 200 ? 100 : 50;
    const totalRanges = Math.max(1, Math.ceil(totalEpisodes / rangeSize));
    const activeRange = Math.min(rangeIndex, totalRanges - 1);
    const query = searchQuery.trim();

    const visibleEpisodes = useMemo(() => {
      const all = Array.from({ length: totalEpisodes }, (_, index) => index + 1);
      if (query) {
        const digits = query.replace(/\D/g, "");
        if (!digits) return [];
        // Search spans every range — scoping it to the open range meant
        // searching "120" from the 1–50 page silently found nothing.
        return all.filter((episode) => String(episode).includes(digits)).slice(0, 200);
      }
      if (totalRanges === 1) return all;
      const start = activeRange * rangeSize;
      return all.slice(start, start + rangeSize);
    }, [totalEpisodes, query, totalRanges, activeRange, rangeSize]);

    // Watch state comes from the same `histories` table the player writes to.
    // Guests and unwritten titles simply resolve to an empty map.
    const { data: histories, isPending: isProgressPending } = useQuery({
      queryKey: ["anime-episode-history", anime.id],
      queryFn: () => getUserHistories(200),
      staleTime: 1000 * 60 * 5,
      retry: false,
    });

    const { progressByEpisode, resumeEpisode } = useMemo(() => {
      const map = new Map<number, EpisodeProgress>();
      let resume: number | null = null;

      for (const row of histories?.data ?? []) {
        if (row.type !== "anime" || row.media_id !== anime.id || !row.episode) continue;
        const percent =
          row.duration > 0
            ? Math.min(100, Math.round((row.last_position / row.duration) * 100))
            : row.completed
              ? 100
              : 0;
        // Rows arrive newest-first, so the first anime row is the resume point.
        if (resume === null && !row.completed) resume = row.episode;
        if (!map.has(row.episode)) {
          map.set(row.episode, { completed: row.completed || percent >= 95, percent });
        }
      }

      return { progressByEpisode: map, resumeEpisode: resume };
    }, [histories, anime.id]);

    const heading = (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle classNames={{ indicator: "hidden" }}>
          Episodes
          {totalEpisodes > 0 && (
            <span className="ml-2 text-base font-normal text-default-400">{totalEpisodes}</span>
          )}
        </SectionTitle>
        {resumeEpisode != null && resumeEpisode <= lastAired && (
          <Button
            as={Link}
            size="sm"
            radius="full"
            variant="bordered"
            href={`/anime/${anime.id}/player/${resumeEpisode}`}
            className="border-default-300/50 font-medium"
            startContent={<PlayFilled size={12} />}
          >
            Resume episode {resumeEpisode}
          </Button>
        )}
      </div>
    );

    // ── Empty state ──────────────────────────────────────────────────────
    // Extremely common: AniList reports no episode count for long-running or
    // unannounced series. Say so, and still offer a way in.
    if (totalEpisodes === 0) {
      const notYetReleased = anime.status === "NOT_YET_RELEASED";

      return (
        <section ref={ref} id="episodes-section" className="z-3 flex flex-col gap-3">
          {heading}
          <Card
            shadow="none"
            className="border border-default-100 shadow-(--elevation-card)"
            radius="lg"
          >
            <CardBody className="flex flex-col items-center gap-3 px-6 py-12 text-center">
              <p className="text-sm font-medium text-foreground">
                {notYetReleased ? "This title hasn't aired yet" : "No episode list available"}
              </p>
              <p className="max-w-[46ch] text-xs leading-relaxed text-default-500">
                {notYetReleased
                  ? anime.startDate.year
                    ? `AniList has it scheduled for ${anime.startDate.year}. Episodes appear here once it starts airing.`
                    : "Episodes appear here once AniList publishes a schedule."
                  : "AniList doesn't publish an episode count for this title — common for long-running series. You can still start from the first episode."}
              </p>
              {!notYetReleased && (
                <Button
                  as={Link}
                  size="sm"
                  radius="full"
                  href={`/anime/${anime.id}/player/1`}
                  className="mt-1 bg-foreground font-semibold text-background"
                  startContent={<PlayFilled size={12} />}
                >
                  Play episode 1
                </Button>
              )}
            </CardBody>
          </Card>
        </section>
      );
    }

    return (
      <section ref={ref} id="episodes-section" className="z-3 flex flex-col gap-3">
        {heading}

        <Card shadow="none" className="border border-default-100 shadow-(--elevation-card)" radius="lg">
          <CardHeader className="flex flex-col gap-3 p-3 sm:p-4">
            <div className="flex w-full items-center gap-2">
              <Input
                isClearable
                size="sm"
                radius="full"
                inputMode="numeric"
                aria-label="Search episodes by number"
                placeholder="Jump to episode…"
                value={search}
                onValueChange={setSearch}
                startContent={<Search className="text-default-400" />}
                classNames={{ inputWrapper: "bg-default-100/60" }}
              />
              <Tabs
                size="sm"
                radius="full"
                color="default"
                aria-label="Episode layout"
                selectedKey={layout}
                onSelectionChange={(value) => setLayout(value as typeof layout)}
                classNames={{ tabList: "bg-default-100/60" }}
              >
                <Tab key="list" aria-label="List view" title={<List aria-hidden />} />
                <Tab key="grid" aria-label="Grid view" title={<Grid aria-hidden />} />
              </Tabs>
            </div>

            {!query && totalRanges > 1 && (
              <div
                role="group"
                aria-label="Episode range"
                className="flex w-full items-center gap-1.5 overflow-x-auto pb-1"
              >
                {Array.from({ length: totalRanges }, (_, index) => {
                  const start = index * rangeSize + 1;
                  const end = Math.min((index + 1) * rangeSize, totalEpisodes);
                  const isActive = index === activeRange;
                  return (
                    <Button
                      key={index}
                      size="sm"
                      radius="full"
                      variant="light"
                      aria-pressed={isActive}
                      onPress={() => setRangeIndex(index)}
                      className={cn(
                        "h-7 min-w-0 shrink-0 px-3 text-xs font-medium text-default-500",
                        isActive && "bg-foreground text-background",
                      )}
                    >
                      {start}–{end}
                    </Button>
                  );
                })}
              </div>
            )}

            {query && (
              <p aria-live="polite" className="w-full text-xs text-default-500">
                {visibleEpisodes.length === 0
                  ? "No matching episodes"
                  : `${visibleEpisodes.length} matching episode${visibleEpisodes.length === 1 ? "" : "s"}`}
              </p>
            )}
          </CardHeader>

          <CardBody className="px-3 pt-0 pb-3 sm:px-4 sm:pb-4">
            <ScrollShadow className="h-[min(60vh,34rem)] pr-1">
              {visibleEpisodes.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center gap-1 text-center">
                  <p className="text-sm text-default-500">No episode matches that number.</p>
                  <p className="text-xs text-default-400">Try a different number, or clear the search.</p>
                </div>
              ) : layout === "grid" ? (
                <ul className="grid grid-cols-[repeat(auto-fill,minmax(4rem,1fr))] gap-2">
                  {visibleEpisodes.map((episode) => (
                    <li key={episode}>
                      <EpisodeTile
                        animeId={anime.id}
                        episode={episode}
                        isAired={episode <= lastAired}
                        progress={progressByEpisode.get(episode)}
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="flex flex-col gap-1">
                  {visibleEpisodes.map((episode) => (
                    <li key={episode}>
                      <EpisodeRow
                        animeId={anime.id}
                        episode={episode}
                        runtime={anime.duration}
                        isAired={episode <= lastAired}
                        isProgressPending={isProgressPending}
                        progress={progressByEpisode.get(episode)}
                        airsOn={
                          nextAiring && episode === nextAiring.episode ? nextAiring.airingAt : null
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </ScrollShadow>
          </CardBody>
        </Card>
      </section>
    );
  },
);

AnimeEpisodesSelection.displayName = "AnimeEpisodesSelection";

export default memo(AnimeEpisodesSelection);

/**
 * Placeholder matching the section's real layout. Exported so the detail page
 * can pass it to `dynamic(..., { loading })` instead of the whole-page spinner
 * (§8) — that page is owned elsewhere, so wiring it up is left to its owner.
 */
export const AnimeEpisodesSectionSkeleton: React.FC = () => (
  <section className="z-3 flex flex-col gap-3">
    <Skeleton className="h-7 w-40 rounded-full" />
    <Card shadow="none" className="border border-default-100" radius="lg">
      <CardHeader className="p-3 sm:p-4">
        <Skeleton className="h-9 w-full rounded-full" />
      </CardHeader>
      <CardBody className="flex flex-col gap-1 px-3 pt-0 pb-3 sm:px-4 sm:pb-4">
        {Array.from({ length: 8 }, (_, index) => (
          <Skeleton key={index} className="h-14 w-full rounded-(--radius-card)" />
        ))}
      </CardBody>
    </Card>
  </section>
);

interface EpisodeItemProps {
  animeId: number;
  episode: number;
  isAired: boolean;
  progress?: EpisodeProgress;
}

/** Thin progress underline for a partially-watched episode. Decorative — the
 *  same state is always announced as text alongside it. */
const ProgressBar: React.FC<{ percent: number; className?: string }> = ({ percent, className }) => (
  <span
    aria-hidden
    className={cn("block h-[3px] overflow-hidden rounded-full bg-default-200", className)}
  >
    <span className="block h-full rounded-full bg-foreground/70" style={{ width: `${percent}%` }} />
  </span>
);

const EpisodeRow: React.FC<
  EpisodeItemProps & {
    runtime: number | null;
    isProgressPending: boolean;
    airsOn: number | null;
  }
> = ({ animeId, episode, runtime, isAired, isProgressPending, progress, airsOn }) => {
  const isPartial = !!progress && !progress.completed && progress.percent > 0;

  const meta = !isAired
    ? airsOn
      ? `Airs ${formatDate(new Date(airsOn * 1000), "EEE, MMM d")}`
      : "Not aired yet"
    : progress?.completed
      ? "Watched"
      : isPartial
        ? `${progress!.percent}% watched`
        : runtime != null
          ? `${runtime} min`
          : "Ready to play";

  const body = (
    <>
      <span
        className={cn(
          "w-9 shrink-0 text-right text-sm font-semibold tabular-nums text-default-400",
          isAired && SURFACE_TRANSITION,
          isAired && "group-hover:text-foreground",
        )}
      >
        {episode}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate text-sm font-medium text-foreground">Episode {episode}</span>
        <span className="text-xs text-default-500">{meta}</span>
        {isPartial && <ProgressBar percent={progress!.percent} className="w-full max-w-40" />}
      </span>
      <span className="flex w-6 shrink-0 items-center justify-center">
        {isProgressPending && isAired ? (
          <Skeleton className="size-4 rounded-full" />
        ) : progress?.completed ? (
          <Check aria-hidden className="text-sm text-foreground/70" />
        ) : isAired ? (
          <PlayFilled
            aria-hidden
            className={cn(
              "text-xs text-foreground opacity-0",
              SURFACE_TRANSITION,
              "transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100",
            )}
          />
        ) : null}
      </span>
    </>
  );

  if (!isAired) {
    return (
      <div
        aria-disabled
        className="flex items-center gap-3 rounded-(--radius-card) px-3 py-2.5 opacity-45"
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/anime/${animeId}/player/${episode}`}
      aria-label={`Play episode ${episode}${progress?.completed ? " (watched)" : ""}`}
      className={cn(
        "group flex items-center gap-3 rounded-(--radius-card) px-3 py-2.5 hover:bg-default-100",
        SURFACE_TRANSITION,
        FOCUS_RING,
      )}
    >
      {body}
    </Link>
  );
};

const EpisodeTile: React.FC<EpisodeItemProps> = ({ animeId, episode, isAired, progress }) => {
  const isPartial = !!progress && !progress.completed && progress.percent > 0;

  const inner = (
    <>
      <span className="text-sm font-semibold tabular-nums">{episode}</span>
      {progress?.completed && <Check aria-hidden className="text-[10px] text-foreground/70" />}
      {isPartial && (
        <ProgressBar percent={progress!.percent} className="absolute inset-x-2 bottom-1.5" />
      )}
    </>
  );

  if (!isAired) {
    return (
      <div
        aria-disabled
        className="relative flex h-14 flex-col items-center justify-center gap-1 rounded-(--radius-card) border border-dashed border-default-200/60 text-default-400 opacity-45"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/anime/${animeId}/player/${episode}`}
      aria-label={`Play episode ${episode}${progress?.completed ? " (watched)" : ""}`}
      className={cn(
        "relative flex h-14 flex-col items-center justify-center gap-1 rounded-(--radius-card) border text-default-500 hover:bg-default-100 hover:text-foreground",
        progress?.completed
          ? "border-foreground/25 bg-default-100/70 text-foreground"
          : "border-default-200/60",
        SURFACE_TRANSITION,
        FOCUS_RING,
      )}
    >
      {inner}
    </Link>
  );
};
