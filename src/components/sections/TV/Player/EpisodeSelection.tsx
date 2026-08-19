import PlayerEpisodePanel from "@/components/player/PlayerEpisodePanel";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import { HandlerType } from "@/types/component";
import { useMediaQuery } from "@mantine/hooks";
import { Episode } from "tmdb-ts/dist/types/tv-episode";
import { EpisodeListCard } from "../Details/Episodes";

interface TvShowPlayerEpisodeSelectionProps extends HandlerType {
  id: number;
  episodes: Episode[];
  selectedSourceId?: string;
  inline?: boolean;
  variant?: "sidebar";
}

const TvShowPlayerEpisodeSelection: React.FC<TvShowPlayerEpisodeSelectionProps> = ({
  opened,
  onClose,
  id,
  episodes,
  selectedSourceId,
  inline,
  variant,
}) => {
  const isDesktop = useMediaQuery("(min-width: 768px)", false, {
    getInitialValueInEffect: false,
  });
  const episodeCards = episodes.map((episode, index) => (
    <EpisodeListCard
      id={id}
      key={episode.id}
      episode={episode}
      order={index + 1}
      withAnimation={false}
      sourceId={selectedSourceId}
    />
  ));

  if (variant === "sidebar") {
    return (
      <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.025]">
        <div className="border-b border-white/10 px-4 py-3">
          <p className="text-xs font-semibold tracking-[.12em] text-primary uppercase">Episodes</p>
        </div>
        <div className="flex flex-col gap-2 overflow-y-auto p-3">
          <div className="grid grid-cols-1 gap-2">{episodeCards}</div>
        </div>
      </div>
    );
  }

  if (inline) {
    return (
      <section className="mx-auto mt-5 w-full max-w-[min(100vw,1600px)] rounded-3xl border border-white/10 bg-white/[0.025] p-4 shadow-2xl shadow-black/20 sm:mt-7 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold tracking-[.12em] text-primary uppercase">Episodes</p>
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <div className="max-h-[min(62vh,38rem)] overflow-y-auto pr-1">
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">{episodeCards}</div>
          </div>
        </div>
      </section>
    );
  }

  if (isDesktop) {
    return (
      <PlayerEpisodePanel opened={opened} onClose={onClose} title="Select Episode">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">{episodeCards}</div>
      </PlayerEpisodePanel>
    );
  }

  return (
    <VaulDrawer
      open={opened}
      onClose={onClose}
      backdrop="blur"
      title="Select Episode"
      direction="right"
      hiddenHandler
      withCloseButton
    >
      <div className="grid grid-cols-1 gap-2 p-2 sm:gap-4 sm:p-4">{episodeCards}</div>
    </VaulDrawer>
  );
};

export default TvShowPlayerEpisodeSelection;
