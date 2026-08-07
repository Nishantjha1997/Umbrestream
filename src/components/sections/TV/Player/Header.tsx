import { ArrowLeft, List, Next, Prev, Server } from "@/utils/icons";
import PlayerActionButton from "@/components/ui/button/PlayerActionButton";
import { TvShowPlayerProps } from "./Player";

interface TvShowPlayerHeaderProps extends Omit<TvShowPlayerProps, "episodes" | "tv" | "startAt"> {
  selectedSource: string;
  onOpenSource: () => void;
  onOpenEpisode: () => void;
}

/**
 * No fullscreen control here on purpose (TV_PLAYER_ROLLBACK_HANDOFF.md): the
 * embedded provider owns fullscreen entirely via its own `allowFullScreen`
 * iframe permission. Umbra no longer tracks or intercepts fullscreen state
 * for TV.
 */
const TvShowPlayerHeader: React.FC<TvShowPlayerHeaderProps> = ({
  id,
  seriesName,
  seasonName,
  episode,
  selectedSource,
  nextEpisodeNumber,
  prevEpisodeNumber,
  onOpenSource,
  onOpenEpisode,
}) => {
  const sourceQuery = selectedSource ? `?src=${encodeURIComponent(selectedSource)}` : "";

  return (
    <div className="player-safe-header pointer-events-none absolute top-0 z-40 flex h-24 w-full items-start justify-between gap-2 bg-linear-to-b from-black/80 to-transparent text-white sm:h-28">
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
      <div className="player-auxiliary-controls flex items-center gap-1 sm:gap-4">
        <PlayerActionButton
          disabled={!prevEpisodeNumber}
          label="Previous Episode"
          tooltip="Previous Episode"
          href={`/tv/${id}/${episode.season_number}/${prevEpisodeNumber}/player${sourceQuery}`}
          color="primary"
        >
          <Prev className="size-8 sm:size-10" />
        </PlayerActionButton>
        <PlayerActionButton
          disabled={!nextEpisodeNumber}
          label="Next Episode"
          tooltip="Next Episode"
          href={`/tv/${id}/${episode.season_number}/${nextEpisodeNumber}/player${sourceQuery}`}
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
