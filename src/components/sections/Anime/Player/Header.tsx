import { cn } from "@/utils/helpers";
import { ArrowLeft, List, Next, Prev, Server } from "@/utils/icons";
import PlayerActionButton from "@/components/ui/button/PlayerActionButton";

interface AnimePlayerHeaderProps {
  id: number;
  animeTitle: string;
  episode: number;
  totalEpisodes?: number | null;
  hidden?: boolean;
  selectedSource: string;
  onOpenSource: () => void;
  onOpenEpisode: () => void;
}

const AnimePlayerHeader: React.FC<AnimePlayerHeaderProps> = ({
  id,
  animeTitle,
  episode,
  totalEpisodes,
  hidden,
  selectedSource,
  onOpenSource,
  onOpenEpisode,
}) => {
  const hasPrev = episode > 1;
  const hasNext = totalEpisodes ? episode < totalEpisodes : true;
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
      <PlayerActionButton label="Back" href={`/anime/${id}`} color="secondary">
        <ArrowLeft className="size-8 sm:size-10" />
      </PlayerActionButton>
      <div className="absolute left-1/2 hidden -translate-x-1/2 flex-col justify-center text-center sm:flex">
        <p className="text-sm text-white text-shadow-lg sm:text-lg lg:text-xl">{animeTitle}</p>
        <p className="text-secondary text-xs text-shadow-lg sm:text-sm lg:text-base">
          Episode {episode}
          {totalEpisodes ? ` of ${totalEpisodes}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-1 sm:gap-4">
        <PlayerActionButton
          disabled={!hasPrev}
          label="Previous Episode"
          tooltip="Previous Episode"
          href={`/anime/${id}/player/${episode - 1}${sourceQuery}`}
          color="secondary"
        >
          <Prev className="size-8 sm:size-10" />
        </PlayerActionButton>
        <PlayerActionButton
          disabled={!hasNext}
          label="Next Episode"
          tooltip="Next Episode"
          href={`/anime/${id}/player/${episode + 1}${sourceQuery}`}
          color="secondary"
        >
          <Next className="size-8 sm:size-10" />
        </PlayerActionButton>
        <PlayerActionButton
          label="Episodes"
          tooltip="Episodes"
          onClick={onOpenEpisode}
          color="secondary"
        >
          <List className="size-7 sm:size-8" />
        </PlayerActionButton>
        <PlayerActionButton
          label="Sources"
          tooltip="Sources"
          onClick={onOpenSource}
          color="secondary"
        >
          <Server className="size-7 sm:size-8" />
        </PlayerActionButton>
      </div>
    </div>
  );
};

export default AnimePlayerHeader;
