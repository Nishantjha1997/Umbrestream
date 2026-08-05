import { cn } from "@/utils/helpers";
import { ArrowLeft, List, Next, Prev, Server } from "@/utils/icons";
import PlayerActionButton from "@/components/ui/button/PlayerActionButton";
import { TvShowPlayerProps } from "./Player";

interface TvShowPlayerHeaderProps extends Omit<TvShowPlayerProps, "episodes" | "tv" | "startAt"> {
  hidden?: boolean;
  selectedSource: string;
  onOpenSource: () => void;
  onOpenEpisode: () => void;
}

const TvShowPlayerHeader: React.FC<TvShowPlayerHeaderProps> = ({
  id,
  seriesName,
  seasonName,
  episode,
  hidden,
  selectedSource,
  nextEpisodeNumber,
  prevEpisodeNumber,
  onOpenSource,
  onOpenEpisode,
}) => {
  const sourceQuery = selectedSource ? `?src=${encodeURIComponent(selectedSource)}` : "";

  return (
    <div
      aria-hidden={hidden ? true : undefined}
      className={cn(
        "player-safe-header absolute top-0 z-40 flex h-24 w-full items-start justify-between gap-2 sm:h-28",
        "bg-linear-to-b from-black/80 to-transparent text-white transition-opacity",
        { "pointer-events-none opacity-0": hidden },
      )}
    >
      <PlayerActionButton label="Back" href={`/tv/${id}`} color="warning">
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
          disabled={!prevEpisodeNumber}
          label="Previous Episode"
          tooltip="Previous Episode"
          href={`/tv/${id}/${episode.season_number}/${prevEpisodeNumber}/player${sourceQuery}`}
          color="warning"
        >
          <Prev className="size-8 sm:size-10" />
        </PlayerActionButton>
        <PlayerActionButton
          disabled={!nextEpisodeNumber}
          label="Next Episode"
          tooltip="Next Episode"
          href={`/tv/${id}/${episode.season_number}/${nextEpisodeNumber}/player${sourceQuery}`}
          color="warning"
        >
          <Next className="size-8 sm:size-10" />
        </PlayerActionButton>
        <PlayerActionButton
          label="Sources"
          tooltip="Sources"
          onClick={onOpenSource}
          color="warning"
        >
          <Server className="size-7 sm:size-8" />
        </PlayerActionButton>
        <PlayerActionButton
          label="Episodes"
          tooltip="Episodes"
          onClick={onOpenEpisode}
          color="warning"
        >
          <List className="size-7 sm:size-8" />
        </PlayerActionButton>
      </div>
    </div>
  );
};

export default TvShowPlayerHeader;
