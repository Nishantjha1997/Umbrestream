import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import { HandlerType } from "@/types/component";
import { Episode } from "tmdb-ts/dist/types/tv-episode";
import { EpisodeListCard } from "../Details/Episodes";

interface TvShowPlayerEpisodeSelectionProps extends HandlerType {
  id: number;
  episodes: Episode[];
  selectedSourceId?: string;
}

const TvShowPlayerEpisodeSelection: React.FC<TvShowPlayerEpisodeSelectionProps> = ({
  opened,
  onClose,
  id,
  episodes,
  selectedSourceId,
}) => {
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
      <div className="grid grid-cols-1 gap-2 p-2 sm:gap-4 sm:p-4">
        {episodes.map((episode, index) => (
          <EpisodeListCard
            id={id}
            key={episode.id}
            episode={episode}
            order={index + 1}
            withAnimation={false}
            sourceId={selectedSourceId}
          />
        ))}
      </div>
    </VaulDrawer>
  );
};

export default TvShowPlayerEpisodeSelection;
