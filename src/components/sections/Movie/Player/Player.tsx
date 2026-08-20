"use client";

import PlayerShell, {
  type PlayerShellControlsContext,
} from "@/components/player/PlayerShell";
import { siteConfig } from "@/config/site";
import type { SourceRequest } from "@/lib/sources/types";
import { mutateMovieTitle } from "@/utils/movies";
import { useDocumentTitle } from "@mantine/hooks";
import { useMemo } from "react";
import type { MovieDetails } from "tmdb-ts/dist/types/movies";
import MoviePlayerControls from "./MoviePlayerControls";
import MoviePlayerInfo from "./MoviePlayerInfo";
import MoviePlayerHeader from "./Header";

interface MoviePlayerProps {
  movie: MovieDetails;
  startAt?: number;
}

/**
 * Movie playback on the shared `PlayerShell` (Phase 6, §10 — see
 * `Anime/Player/Player.tsx` for the reference layout this mirrors).
 *
 * Layout (web, not fullscreen):
 *   ┌─────────────────────────────────────┐
 *   │  16:9 video player (PlayerShell)    │
 *   ├─────────────────────────────────────┤
 *   │  Controls bar (below, not overlay)  │
 *   │  About-this-movie panel             │
 *   └─────────────────────────────────────┘
 *
 * `inlineLayout` keeps the stage in normal flow and `renderControls` moves
 * Source/Fit/Fill/Fullscreen below the video (instead of overlaying the
 * provider's own controls at the bottom-right of the viewport, which made
 * them unreachable on phones). Movies have no seasons/episodes, so there is
 * no `historyMetadata` and no `renderExtras`.
 */
const MoviePlayer: React.FC<MoviePlayerProps> = ({ movie, startAt }) => {
  const title = mutateMovieTitle(movie);
  useDocumentTitle(`Play ${title} | ${siteConfig.name}`);

  const request = useMemo<SourceRequest>(
    () => ({
      mediaType: "movie",
      tmdbId: movie.id,
      startAt,
      preferredSubtitle: "en",
    }),
    [movie.id, startAt],
  );

  const identity = useMemo(() => ({ mediaId: movie.id, mediaType: "movie" as const }), [movie.id]);

  return (
    <div className="mx-auto flex w-full max-w-[min(100vw,1600px)] flex-col">
      <PlayerShell
        request={request}
        identity={identity}
        inlineLayout
        renderHeader={({ onOpenSource, chromeHidden, isFullscreen }) => (
          <MoviePlayerHeader
            id={movie.id}
            movieName={title}
            onOpenSource={onOpenSource}
            hidden={chromeHidden}
            isFullscreen={isFullscreen}
          />
        )}
        renderControls={(controls: PlayerShellControlsContext) => (
          <MoviePlayerControls {...controls} movie={movie} />
        )}
      />

      <MoviePlayerInfo movie={movie} />
    </div>
  );
};

MoviePlayer.displayName = "MoviePlayer";

export default MoviePlayer;
