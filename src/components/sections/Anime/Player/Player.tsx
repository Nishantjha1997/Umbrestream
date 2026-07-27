"use client";

import { ADS_WARNING_STORAGE_KEY, SpacingClasses } from "@/utils/constants";
import { siteConfig } from "@/config/site";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn } from "@/utils/helpers";
import { getAnimePlayers } from "@/utils/players";
import { Card, Skeleton } from "@heroui/react";
import { useDisclosure, useDocumentTitle, useIdle, useLocalStorage } from "@mantine/hooks";
import dynamic from "next/dynamic";
import { parseAsInteger, useQueryState } from "nuqs";
import { useMemo } from "react";
import type { AniListMediaDetail } from "@/types/anilist";
import { usePlayerEvents } from "@/hooks/usePlayerEvents";

import { useServerHealth } from "@/hooks/useServerHealth";
import { useEffect } from "react";

const AdsWarning = dynamic(() => import("@/components/ui/overlay/AdsWarning"));
const AnimePlayerHeader = dynamic(() => import("./Header"));
const AnimePlayerSourceSelection = dynamic(() => import("./SourceSelection"));

interface AnimePlayerProps {
  anime: AniListMediaDetail;
  episode: number;
  startAt?: number;
}

const AnimePlayer: React.FC<AnimePlayerProps> = ({ anime, episode, startAt }) => {
  const [seen] = useLocalStorage<boolean>({
    key: ADS_WARNING_STORAGE_KEY,
    getInitialValueInEffect: false,
  });

  const players = getAnimePlayers(anime.id, episode, startAt);
  const animeTitle = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";
  const idle = useIdle(3000);
  const { mobile } = useBreakpoints();
  const [opened, handlers] = useDisclosure(false);
  const [selectedSource, setSelectedSource] = useQueryState<number>(
    "src",
    parseAsInteger.withDefault(0),
  );

  const healthMap = useServerHealth(players, true);

  // Auto-switch to the first online server if the selected server is detected as offline
  useEffect(() => {
    if (healthMap[selectedSource] === "offline") {
      const firstOnlineIndex = players.findIndex((_, idx) => healthMap[idx] === "online");
      if (firstOnlineIndex !== -1 && firstOnlineIndex !== selectedSource) {
        console.info(`Auto-switching Anime player from offline server #${selectedSource} to online server #${firstOnlineIndex}`);
        setSelectedSource(firstOnlineIndex);
      }
    }
  }, [healthMap, selectedSource, players, setSelectedSource]);

  usePlayerEvents({ saveHistory: true });
  useDocumentTitle(`Play ${animeTitle} - Ep ${episode} | ${siteConfig.name}`);

  const PLAYER = useMemo(() => players[selectedSource] || players[0], [players, selectedSource]);

  return (
    <>
      <AdsWarning />

      <div className={cn("relative", SpacingClasses.reset)}>
        {/* Top hover-sensor zone to capture mouse activity and show the header overlay */}
        <div className="absolute top-0 left-0 right-0 h-20 z-20" />

        <AnimePlayerHeader
          id={anime.id}
          animeTitle={animeTitle}
          episode={episode}
          totalEpisodes={anime.episodes}
          selectedSource={selectedSource}
          onOpenSource={handlers.open}
          hidden={idle && !mobile}
        />
        <Card shadow="md" radius="none" className="relative h-screen">
          <Skeleton className="absolute h-full w-full" />
          <iframe
            allowFullScreen
            key={PLAYER.title}
            src={PLAYER.source}
            className="z-10 h-full w-full border-none"
          />
        </Card>
      </div>

      <AnimePlayerSourceSelection
        opened={opened}
        onClose={handlers.close}
        players={players}
        selectedSource={selectedSource}
        setSelectedSource={setSelectedSource}
      />
    </>
  );
};

AnimePlayer.displayName = "AnimePlayer";

export default AnimePlayer;
