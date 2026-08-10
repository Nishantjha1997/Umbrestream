import { ArrowLeft, Server } from "@/utils/icons";
import PlayerActionButton from "@/components/ui/button/PlayerActionButton";
import { cn } from "@/utils/helpers";

interface MoviePlayerHeaderProps {
  id: number;
  movieName: string;
  onOpenSource: () => void;
  hidden?: boolean;
}

/**
 * No fullscreen control here on purpose (see `TV/Player/Header.tsx`): the
 * embedded provider owns fullscreen entirely via its own `allowFullScreen`
 * iframe permission. StreamFree chrome fades after idle so provider-owned
 * captions, region, and fullscreen controls remain unobstructed.
 */
const MoviePlayerHeader: React.FC<MoviePlayerHeaderProps> = ({
  id,
  movieName,
  onOpenSource,
  hidden,
}) => {
  return (
    <div
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={cn(
        "player-safe-header pointer-events-none absolute top-0 z-40 flex h-24 w-full items-start justify-between gap-2 bg-linear-to-b from-black/80 to-transparent text-white transition-[opacity,transform] duration-300 sm:h-28",
        hidden && "-translate-y-3 opacity-0",
      )}
    >
      <PlayerActionButton label="Back" href={`/movie/${id}`} color="primary">
        <ArrowLeft className="size-8 sm:size-10" />
      </PlayerActionButton>
      <div className="absolute left-1/2 hidden -translate-x-1/2 flex-col justify-center text-center sm:flex">
        <p className="text-sm text-white text-shadow-lg sm:text-lg lg:text-xl">{movieName}</p>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-4">
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
