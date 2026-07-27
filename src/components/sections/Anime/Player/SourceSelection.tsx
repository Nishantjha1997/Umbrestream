import { PlayersProps } from "@/types";
import VaulDrawer from "@/components/ui/overlay/VaulDrawer";
import { HandlerType } from "@/types/component";
import SelectButton from "@/components/ui/input/SelectButton";
import { Ads, Clock, Rocket, Star } from "@/utils/icons";
import { useServerHealth } from "@/hooks/useServerHealth";
import { cn } from "@/utils/helpers";

interface AnimePlayerSourceSelectionProps extends HandlerType {
  players: PlayersProps[];
  selectedSource: number;
  setSelectedSource: (source: number) => void;
}

const AnimePlayerSourceSelection: React.FC<AnimePlayerSourceSelectionProps> = ({
  opened,
  onClose,
  players,
  selectedSource,
  setSelectedSource,
}) => {
  const healthMap = useServerHealth(players, opened);

  return (
    <VaulDrawer
      open={opened}
      onClose={onClose}
      backdrop="blur"
      title="Select Anime Server"
      direction="right"
      hiddenHandler
      withCloseButton
      classNames={{ content: "space-y-0" }}
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="grid grid-cols-2 gap-2 px-1 py-2 text-xs">
          <div className="flex items-center gap-1.5">
            <Star className="text-warning-500" size={14} />
            <span>Recommended</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Rocket className="text-danger-500" size={14} />
            <span>Fast Hosting</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="text-success-500" size={14} />
            <span>Auto Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Ads className="text-primary-500" size={14} />
            <span>Popup Ads</span>
          </div>
        </div>

        <SelectButton
          color="secondary"
          groupType="list"
          value={selectedSource.toString()}
          onChange={(value) => {
            setSelectedSource(Number(value || 0));
            onClose();
          }}
          data={players.map(({ title, recommended, fast, ads, resumable }, index) => {
            const health = healthMap[index] || "checking";
            const healthBadge = {
              online: { label: "Online", cls: "bg-success/20 text-success border-success/30" },
              slow: { label: "Slow", cls: "bg-warning/20 text-warning border-warning/30" },
              offline: { label: "Offline", cls: "bg-danger/20 text-danger border-danger/30" },
              checking: { label: "Testing...", cls: "bg-default/20 text-default-400 border-default/30" },
            }[health];

            return {
              label: title,
              value: index.toString(),
              endContent: (
                <div key={`info-${title}`} className="flex flex-wrap items-center gap-2">
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full border font-medium", healthBadge.cls)}>
                    {healthBadge.label}
                  </span>
                  {recommended && <Star className="text-warning" size={16} />}
                  {fast && <Rocket className="text-danger" size={16} />}
                  {resumable && <Clock className="text-success" size={16} />}
                  {ads && <Ads className="text-primary" size={16} />}
                </div>
              ),
            };
          })}
        />
      </div>
    </VaulDrawer>
  );
};

export default AnimePlayerSourceSelection;
