import { cn } from "@/utils/helpers";
import { ArrowLeft, Server } from "@/utils/icons";
import PlayerActionButton from "@/components/ui/button/PlayerActionButton";

interface MoviePlayerHeaderProps {
  id: number;
  movieName: string;
  hidden?: boolean;
  onOpenSource: () => void;
}

const MoviePlayerHeader: React.FC<MoviePlayerHeaderProps> = ({
  id,
  movieName,
  hidden,
  onOpenSource,
}) => {
  return (
    <div
      aria-hidden={hidden ? true : undefined}
      className={cn(
        "player-safe-header pointer-events-none absolute top-0 z-40 flex h-24 w-full items-start justify-between gap-2 sm:h-28",
        "bg-linear-to-b from-black/80 to-transparent text-white transition-opacity motion-reduce:transition-none",
        { "pointer-events-none opacity-0": hidden },
      )}
    >
      <PlayerActionButton label="Back" href={`/movie/${id}`} color="primary">
        <ArrowLeft className="size-8 sm:size-10" />
      </PlayerActionButton>
      <div className="absolute left-1/2 hidden -translate-x-1/2 flex-col justify-center text-center sm:flex">
        <p className="text-sm text-white text-shadow-lg sm:text-lg lg:text-xl">{movieName}</p>
      </div>
      <div className="player-auxiliary-controls flex items-center gap-1.5 sm:gap-4">
        <PlayerActionButton
          label="Sources"
          tooltip="Sources"
          onClick={onOpenSource}
          color="primary"
        >
          <Server className="size-7 sm:size-8" />
        </PlayerActionButton>
      </div>
    </div>
  );
};

export default MoviePlayerHeader;
