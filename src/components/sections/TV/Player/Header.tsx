import { ArrowLeft, List, Next, Prev, Server } from "@/utils/icons";
import PlayerActionButton from "@/components/ui/button/PlayerActionButton";
import { cn } from "@/utils/helpers";
import { TvShowPlayerProps } from "./Player";
import type { AdjacentEpisode } from "@/lib/tv/adjacentEpisode";

interface TvShowPlayerHeaderProps extends Omit<TvShowPlayerProps, "episodes" | "tv" | "startAt" | "nextEpisode" | "prevEpisode"> {
  selectedSource: string;
  onOpenSource: () => void;
  onOpenEpisode: () => void;
  nextEpisode: AdjacentEpisode | null;
  prevEpisode: AdjacentEpisode | null;
  hidden?: boolean;
}

/**
 * No fullscreen control here on purpose (TV_PLAYER_ROLLBACK_HANDOFF.md): the
 * embedded provider owns fullscreen entirely via its own `allowFullScreen`
 * iframe permission, and the below-stage `TvShowPlayerControls` bar owns the
 * explicit Full screen / Source / Fit-Fill actions — the header only carries
 * navigation and the source sheet opener.
 */
const TvShowPlayerHeader: React.FC<TvShowPlayerHeaderProps> = ({
  id,
  seriesName,
  seasonName,
  episode,
  selectedSource,
  nextEpisode,
  prevEpisode,
  onOpenSource,
  onOpenEpisode,
  hidden,
}) => {
  const sourceQuery = selectedSource ? `?src=${encodeURIComponent(selectedSource)}` : "";

  return (
    <div
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={cn(
        "player-safe-header pointer-events-none absolute top-0 z-40 flex h-24 w-full items-start justify-between gap-2 bg-linear-to-b from-black/80 to-transparent text-white transition-[opacity,transform] duration-300 sm:h-28",
        hidden && "-translate-y-3 opacity-0",
      )}
    >
      {/* One accent (Phase 1, §1.1.3 / §5.2): was `color="warning"` — TV no
          longer gets its own media-type hue. Movie/TV/Anime players all
          render `color="primary"`, which `hero.ts` points at the single
          violet accent. */}
      <PlayerActionButton label="Back" href={`/tv/${id}`} color="primary">
        <ArrowLeft className="size-8 sm:size-10" />
      </PlayerActionButton>
      <div className="absolute left-1/2 hidden -translate-x-1/2 flex-col justify-center text-center sm:flex">
        <p className="text-sm text-white text-shadow-lg sm:text-lg lg:text-xl">{seriesName}</p>
        <p className="text-xs text-gray-200 text-shadow-lg sm:text-sm lg:text-base">
          {seasonName} - {episode.name}
        </p>
      </div>
      <div className="flex items-center gap-1 sm:gap-4">
        <PlayerActionButton
          disabled={!prevEpisode}
          label="Previous Episode"
          tooltip="Previous Episode"
          href={
            prevEpisode
              ? `/tv/${id}/${prevEpisode.season}/${prevEpisode.episode}/player${sourceQuery}`
              : undefined
          }
          color="primary"
        >
          <Prev className="size-8 sm:size-10" />
        </PlayerActionButton>
        <PlayerActionButton
          disabled={!nextEpisode}
          label="Next Episode"
          tooltip="Next Episode"
          href={
            nextEpisode
              ? `/tv/${id}/${nextEpisode.season}/${nextEpisode.episode}/player${sourceQuery}`
              : undefined
          }
          color="primary"
        >
          <Next className="size-8 sm:size-10" />
        </PlayerActionButton>
        <PlayerActionButton
          label="Sources"
          tooltip="Sources"
          onClick={onOpenSource}
          color="primary"
        >
          <Server className="size-7 sm:size-8" />
        </PlayerActionButton>
        <PlayerActionButton
          label="Episodes"
          tooltip="Episodes"
          onClick={onOpenEpisode}
          color="primary"
        >
          <List className="size-7 sm:size-8" />
        </PlayerActionButton>
      </div>
    </div>
  );
};

export default TvShowPlayerHeader;
