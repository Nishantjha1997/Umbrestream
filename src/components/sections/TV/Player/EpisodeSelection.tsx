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
}

/**
 * Phone gets `VaulDrawer`'s bottom sheet (unchanged from before Phase 6),
 * desktop gets `PlayerEpisodePanel`'s centred card (`DESKTOP_SPEC.md` §I) —
 * only the active viewport's overlay is mounted. Vaul's modal side effects
 * must not remain active behind the desktop panel.
 */
const TvShowPlayerEpisodeSelection: React.FC<TvShowPlayerEpisodeSelectionProps> = ({
  opened,
  onClose,
  id,
  episodes,
  selectedSourceId,
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
