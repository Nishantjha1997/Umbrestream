import { ArrowLeft, List, Next, Prev, Server } from "@/utils/icons";
import PlayerActionButton from "@/components/ui/button/PlayerActionButton";
import { cn } from "@/utils/helpers";
import type { AudioVariant } from "@/lib/sources/types";
import BookmarkButton from "@/components/ui/button/BookmarkButton";
import type { AniListMediaDetail } from "@/types/anilist";
import { SavedMovieDetails } from "@/types/movie";

interface AnimePlayerHeaderProps {
  anime: AniListMediaDetail;
  episode: number;
  totalEpisodes?: number | null;
  selectedSource: string;
  audioVariant: AudioVariant;
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
  anime,
  episode,
  totalEpisodes,
  selectedSource,
  audioVariant,
  onOpenSource,
  onOpenEpisode,
  hidden,
}) => {
  const hasPrev = episode > 1;
  const hasNext = totalEpisodes ? episode < totalEpisodes : true;
  const sourceParams = new URLSearchParams({ audio: audioVariant });
  if (selectedSource) sourceParams.set("src", selectedSource);
  const sourceQuery = `?${sourceParams.toString()}`;

  const animeTitle = anime.title.english ?? anime.title.romaji ?? anime.title.native ?? "Untitled";

  const savedMovieData: SavedMovieDetails = {
    id: anime.id,
    type: "anime",
    title: animeTitle,
    adult: anime.isAdult || false,
    backdrop_path: anime.bannerImage || anime.coverImage?.extraLarge || "",
    poster_path: anime.coverImage?.extraLarge || anime.coverImage?.large || "",
    release_date: anime.startDate?.year ? `${anime.startDate.year}-${anime.startDate.month || 1}-${anime.startDate.day || 1}` : "",
    vote_average: anime.averageScore ? anime.averageScore / 10 : 0,
    saved_date: new Date().toISOString(),
  };

  return (
    <div
      aria-hidden={hidden || undefined}
      inert={hidden || undefined}
      className={cn(
        "player-safe-header pointer-events-none absolute top-0 z-40 flex h-24 w-full items-start justify-between gap-2 bg-linear-to-b from-black/80 to-transparent text-white transition-[opacity,transform] duration-300 sm:h-28 px-4 py-2",
        hidden && "-translate-y-3 opacity-0",
      )}
    >
      <PlayerActionButton label="Back" href={`/anime/${anime.id}`} color="primary">
        <ArrowLeft className="size-8 sm:size-10" />
      </PlayerActionButton>
      <div className="absolute left-1/2 hidden -translate-x-1/2 flex-col justify-center text-center sm:flex mt-2">
        <div className="flex items-center justify-center gap-2">
          <p className="text-sm text-white text-shadow-lg sm:text-lg lg:text-xl font-bold">{animeTitle}</p>
          <a
            href={`https://anilist.co/anime/${anime.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center rounded bg-blue-600/80 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white hover:bg-blue-500 transition pointer-events-auto"
            title="View on AniList"
          >
            AL
          </a>
          {anime.idMal && (
            <a
              href={`https://myanimelist.net/anime/${anime.idMal}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded bg-indigo-600/80 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white hover:bg-indigo-500 transition pointer-events-auto"
              title="View on MyAnimeList"
            >
              MAL
            </a>
          )}
        </div>
        <div className="flex items-center justify-center gap-2 mt-1">
          <p className="text-primary text-xs text-shadow-lg sm:text-sm lg:text-base">
            Episode {episode} · {audioVariant === "dub" ? "Dub" : "Sub"}
            {totalEpisodes ? ` of ${totalEpisodes}` : ""}
          </p>
          {anime.averageScore && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 rounded-full font-semibold pointer-events-auto">
              ⭐ {(anime.averageScore / 10).toFixed(1)}
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1 sm:gap-4 mt-2 pointer-events-auto">
        <BookmarkButton data={savedMovieData} />
        <PlayerActionButton
          disabled={!hasPrev}
          label="Previous Episode"
          tooltip="Previous Episode"
          href={`/anime/${anime.id}/player/${episode - 1}${sourceQuery}`}
          color="primary"
        >
          <Prev className="size-8 sm:size-10" />
        </PlayerActionButton>
        <PlayerActionButton
          disabled={!hasNext}
          label="Next Episode"
          tooltip="Next Episode"
          href={`/anime/${anime.id}/player/${episode + 1}${sourceQuery}`}
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
