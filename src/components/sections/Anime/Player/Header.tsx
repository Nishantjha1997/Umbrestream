import { ArrowLeft, List, Next, Prev, Server } from "@/utils/icons";
import PlayerActionButton from "@/components/ui/button/PlayerActionButton";
import { cn } from "@/utils/helpers";

interface AnimePlayerHeaderProps {
  id: number;
  animeTitle: string;
  episode: number;
  totalEpisodes?: number | null;
  selectedSource: string;
  onOpenSource: () => void;
  onOpenEpisode: () => void;
  hidden?: boolean;
}

/**
 * No fullscreen control here on purpose (Phase 6, §10, mirroring TV's
 * `Header.tsx`): the embedded provider owns fullscreen entirely via its own
 * `allowFullScreen` iframe permission, and `PlayerShell` owns the viewport
 * directly — rotating to landscape *is* fullscreen. The shared shell now
 * auto-hides StreamFree chrome after idle so it cannot cover the embedded
 * player's own server, region, caption, or fullscreen controls.
 */
const AnimePlayerHeader: React.FC<AnimePlayerHeaderProps> = ({
  id,
  animeTitle,
  episode,
  totalEpisodes,
  selectedSource,
  onOpenSource,
  onOpenEpisode,
  hidden,
}) => {
  const hasPrev = episode > 1;
  const hasNext = totalEpisodes ? episode < totalEpisodes : true;
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
      {/* One accent (Phase 1, §1.1.3 / §5.2): was `color="secondary"` — Anime no
          longer gets its own media-type hue. Movie/TV/Anime players all render
          `color="primary"`, which `hero.ts` now points at the single violet accent. */}
      <PlayerActionButton label="Back" href={`/anime/${id}`} color="primary">
        <ArrowLeft className="size-8 sm:size-10" />
      </PlayerActionButton>
      <div className="absolute left-1/2 hidden -translate-x-1/2 flex-col justify-center text-center sm:flex">
        <p className="text-sm text-white text-shadow-lg sm:text-lg lg:text-xl">{animeTitle}</p>
        <p className="text-primary text-xs text-shadow-lg sm:text-sm lg:text-base">
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
          color="primary"
        >
          <Prev className="size-8 sm:size-10" />
        </PlayerActionButton>
        <PlayerActionButton
          disabled={!hasNext}
          label="Next Episode"
          tooltip="Next Episode"
          href={`/anime/${id}/player/${episode + 1}${sourceQuery}`}
          color="primary"
        >
          <Next className="size-8 sm:size-10" />
        </PlayerActionButton>
        <PlayerActionButton
          label="Episodes"
          tooltip="Episodes"
          onClick={onOpenEpisode}
          color="primary"
        >
          <List className="size-7 sm:size-8" />
        </PlayerActionButton>
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

export default AnimePlayerHeader;
