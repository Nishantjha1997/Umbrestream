import { cn } from "@/utils/helpers";
import { ArrowLeft, List, Next, Prev, Server } from "@/utils/icons";
import PlayerActionButton from "@/components/ui/button/PlayerActionButton";

interface AnimePlayerHeaderProps {
  id: number;
  animeTitle: string;
  episode: number;
  totalEpisodes?: number | null;
  hidden?: boolean;
  selectedSource: number;
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

  return (
    <div
      aria-hidden={hidden ? true : undefined}
      className={cn(
        "absolute top-0 z-40 flex h-28 w-full items-start justify-between gap-4",
        "bg-linear-to-b from-black/80 to-transparent p-2 text-white transition-opacity md:p-4",
        { "opacity-0": hidden },
      )}
    >
      <PlayerActionButton label="Back" href={`/anime/${id}`} color="secondary">
        <ArrowLeft size={42} />
      </PlayerActionButton>
      <div className="absolute left-1/2 hidden -translate-x-1/2 flex-col justify-center text-center sm:flex">
        <p className="text-sm text-white text-shadow-lg sm:text-lg lg:text-xl">{animeTitle}</p>
        <p className="text-xs text-secondary text-shadow-lg sm:text-sm lg:text-base">
          Episode {episode}
          {totalEpisodes ? ` of ${totalEpisodes}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-4">
        <PlayerActionButton
          disabled={!hasPrev}
          label="Previous Episode"
          tooltip="Previous Episode"
          href={`/anime/${id}/player/${episode - 1}?src=${selectedSource}`}
          color="secondary"
        >
          <Prev size={42} />
        </PlayerActionButton>
        <PlayerActionButton
          disabled={!hasNext}
          label="Next Episode"
          tooltip="Next Episode"
          href={`/anime/${id}/player/${episode + 1}?src=${selectedSource}`}
          color="secondary"
        >
          <Next size={42} />
        </PlayerActionButton>
        <PlayerActionButton label="Episodes" tooltip="Episodes" onClick={onOpenEpisode} color="secondary">
          <List size={34} />
        </PlayerActionButton>
        <PlayerActionButton label="Sources" tooltip="Sources" onClick={onOpenSource} color="secondary">
          <Server size={34} />
        </PlayerActionButton>
      </div>
    </div>
  );
};

export default AnimePlayerHeader;
