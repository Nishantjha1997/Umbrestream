import { tmdbBrowser } from "@/api/tmdb-browser";
import ServiceRetryState from "@/components/ui/feedback/ServiceRetryState";
import useBreakpoints from "@/hooks/useBreakpoints";
import { cn, formatDate, isEmpty } from "@/utils/helpers";
import { PlayOutline } from "@/utils/icons";
import { getImageUrl, getLoadingLabel, movieDurationString } from "@/utils/movies";
import { Card, CardBody, CardFooter, Chip, Image, Spinner } from "@heroui/react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { memo } from "react";
import { Episode } from "tmdb-ts/dist/types/tv-episode";

/**
 * Runtime / episode-number chips. One material tier for everything that sits
 * on top of artwork (§1.1.6) — `border-0` because HeroUI's Chip has no border
 * of its own and glass-control's would read as a stray outline at this size.
 */
const CHIP_CLASS = "glass-control absolute z-20 border-0";

interface TvShowEpisodesSelectionProps {
  id: number;
  seasonNumber: number;
  filters?: {
    searchQuery?: string;
    sortedByName?: boolean;
    layout?: "list" | "grid";
  };
}

interface EpisodeCardProps {
  id: number;
  episode: Episode;
  order?: number;
  withAnimation?: boolean;
  sourceId?: string;
}

const TvShowEpisodesSelection: React.FC<TvShowEpisodesSelectionProps> = ({
  id,
  seasonNumber,
  filters: { searchQuery, sortedByName, layout } = {},
}) => {
  const { data, isPending, isError, refetch } = useQuery({
    queryFn: () => tmdbBrowser.tvShows.season(id, seasonNumber),
    queryKey: ["tv-show-episodes", id, seasonNumber],
  });

  if (isPending) {
    return (
      <div className="flex min-h-[280px] items-center justify-center">
        <Spinner variant="wave" size="lg" label={getLoadingLabel()} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="relative flex min-h-[280px] w-full items-center justify-center p-6">
        <ServiceRetryState
          title="Couldn't load episodes"
          description="There was an issue fetching episodes for this season."
          onRetry={() => void refetch()}
        />
      </div>
    );
  }

  const EPISODES = data.episodes
    .filter((episode) =>
      searchQuery ? episode.name.toLowerCase().includes(searchQuery.toLowerCase()) : true,
    )
    .sort((a, b) => (sortedByName ? a.name.localeCompare(b.name) : 0));

  if (isEmpty(EPISODES)) {
    return (
      <div className="flex min-h-[200px] w-full flex-col items-center justify-center rounded-xl border border-white/10 bg-white/[0.025] p-8 text-center">
        <p className="text-sm text-white/70">No episodes found.</p>
      </div>
    );
  }

  if (layout === "grid") {
    return (
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {EPISODES.map((episode) => (
          <EpisodeGridCard key={episode.id} episode={episode} id={id} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 sm:gap-4">
      {EPISODES.map((episode, index) => (
        <EpisodeListCard key={episode.id} episode={episode} order={index + 1} id={id} />
      ))}
    </div>
  );
};

export const EpisodeListCard: React.FC<EpisodeCardProps> = ({
  episode,
  order = 1,
  id,
  withAnimation = true,
  sourceId,
}) => {
  const imageUrl = getImageUrl(episode.still_path);
  const { mobile } = useBreakpoints();
  const isNotReleased = !episode.air_date || new Date(episode.air_date) > new Date();
  const isOdd = order % 2 !== 0;
  const sourceQuery = sourceId ? `?src=${encodeURIComponent(sourceId)}` : "";
  const href = !isNotReleased
    ? `/tv/${id}/${episode.season_number}/${episode.episode_number}/player${sourceQuery}`
    : undefined;

  return (
    <Card
      isPressable={!isNotReleased}
      as={(isNotReleased ? "div" : Link) as "a"}
      href={href}
      shadow="none"
      className={cn(
        "group motion-preset-blur-right border-white/10 bg-white/[0.025] motion-duration-300 grid grid-cols-[auto_1fr] gap-3 border transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:animate-none motion-reduce:transition-none",
        {
          // Accent hover styling
          "hover:border-white/20 hover:bg-white/[0.05]": !isNotReleased,
          "cursor-not-allowed opacity-50": isNotReleased,
          "motion-preset-slide-left": isOdd && withAnimation,
          "motion-preset-slide-right": !isOdd && withAnimation,
        },
      )}
    >
      <div className="relative">
        <Image
          alt={episode.name}
          src={imageUrl}
          height={120}
          width={mobile ? 180 : 220}
          className="rounded-r-none object-cover"
        />
        {!isNotReleased && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="glass-control z-10 flex size-12 items-center justify-center rounded-full border opacity-0 transition-opacity duration-(--duration-base) ease-(--ease-out-quint) group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
              <PlayOutline className="size-6" />
            </div>
          </div>
        )}
        {/* Both chips sit directly on artwork, so they use the one material
            tier meant for that (glass-control) rather than a bespoke
            bg-black/35 + backdrop-blur-xs pair (§1.1.6). */}
        <Chip size="sm" className={cn(CHIP_CLASS, "top-2 right-2")}>
          {isNotReleased ? "Coming Soon" : movieDurationString(episode.runtime)}
        </Chip>
        <Chip size="sm" className={cn(CHIP_CLASS, "bottom-2 left-2 min-w-9 text-center")}>
          {episode.episode_number}
        </Chip>
      </div>
      <CardBody className="flex space-y-1">
        <p
          title={episode.name}
          className={cn(
            "line-clamp-1 text-xl font-semibold transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:transition-none",
            !isNotReleased && "group-hover:text-foreground",
          )}
        >
          {episode.name}
        </p>
        <p className="text-white/60 line-clamp-1 text-xs">
          {formatDate(episode.air_date, "en-US")}
        </p>
        <p className="text-white/70 line-clamp-2 text-sm" title={episode.overview}>
          {episode.overview}
        </p>
      </CardBody>
    </Card>
  );
};

const EpisodeGridCard: React.FC<EpisodeCardProps> = ({ episode, id }) => {
  const imageUrl = getImageUrl(episode.still_path);
  const isNotReleased = !episode.air_date || new Date(episode.air_date) > new Date();
  const href = !isNotReleased
    ? `/tv/${id}/${episode.season_number}/${episode.episode_number}/player`
    : undefined;

  return (
    <Card
      isPressable={!isNotReleased}
      as={(isNotReleased ? "div" : Link) as "a"}
      href={href}
      shadow="none"
      className={cn(
        "group motion-preset-focus border-white/10 bg-white/[0.025] border transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:animate-none motion-reduce:transition-none",
        {
          "hover:border-white/20 hover:bg-white/[0.05]": !isNotReleased,
          "cursor-not-allowed opacity-50": isNotReleased,
        },
      )}
    >
      <CardBody className="overflow-visible p-0">
        <div className="relative">
          <Image
            alt={episode.name}
            src={imageUrl}
            className="aspect-video w-full rounded-b-none object-cover"
          />
          {!isNotReleased && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="glass-control z-10 flex size-12 items-center justify-center rounded-full border opacity-0 transition-opacity duration-(--duration-base) ease-(--ease-out-quint) group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none">
                <PlayOutline className="size-6" />
              </div>
            </div>
          )}
          <Chip size="sm" className={cn(CHIP_CLASS, "top-2 right-2")}>
            {isNotReleased ? "Coming Soon" : movieDurationString(episode.runtime)}
          </Chip>
          <Chip size="sm" className={cn(CHIP_CLASS, "bottom-2 left-2 min-w-9 text-center")}>
            {episode.episode_number}
          </Chip>
        </div>
      </CardBody>
      <CardFooter className="h-full">
        <div className="flex h-full flex-col gap-2">
          <p
            title={episode.name}
            className={cn(
              "text-lg font-semibold transition-colors duration-(--duration-fast) ease-(--ease-out-quint) motion-reduce:transition-none",
              !isNotReleased && "group-hover:text-foreground",
            )}
          >
            {episode.name}
          </p>
          <p className="text-white/60 line-clamp-1 text-xs">
            {formatDate(episode.air_date, "en-US")}
          </p>
          <p className="text-white/70 text-sm" title={episode.overview}>
            {episode.overview}
          </p>
        </div>
      </CardFooter>
    </Card>
  );
};

export default memo(TvShowEpisodesSelection);
